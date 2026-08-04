import { db } from "@/lib/db";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const REFERRAL_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE", "NOT_INTERESTED", "CONVERTED"] as const;
const DECISIONS = ["PENDING_REVIEW", "ACCEPTED", "REJECTED", "CONVERTED_TO_CLIENT", "CANCELLED"] as const;
const COMMISSION_STATUSES = ["VERIFYING", "ON_HOLD", "NOT_ELIGIBLE", "DUE", "PAID"] as const;
const COMMISSION_TYPES = ["FIXED", "PERCENTAGE"] as const;

function hasReferralAccess(access: Awaited<ReturnType<typeof currentAdminAccess>>) {
  return Boolean(access && (access.isOwner || access.permissions.includes("referrals")));
}

function decimalInput(value: unknown, maxIntegerDigits = 10) {
  if (value === null || value === "" || value === undefined) return null;
  const normalized = String(value).trim();
  return new RegExp(`^\\d{1,${maxIntegerDigits}}(?:\\.\\d{1,2})?$`).test(normalized) ? normalized : undefined;
}

function netPaidAmount(invoices: Array<{ amount: unknown; type: string }>) {
  return Math.max(0, invoices.reduce((sum, invoice) => {
    const amount = Number(invoice.amount);
    return sum + (invoice.type === "RETURN" ? -amount : amount);
  }, 0));
}

function referralPayload(referral: ReferralResult) {
  const paidAmount = netPaidAmount(referral.clientProject?.invoices || []);
  const project = referral.clientProject
    ? {
        id: referral.clientProject.id,
        title: referral.clientProject.title,
        currency: referral.clientProject.currency,
        paidAmount,
        hasPaidInvoice: paidAmount > 0,
      }
    : null;
  return {
    ...referral,
    commissionAmount: referral.commissionAmount?.toString() || null,
    commissionRate: referral.commissionRate?.toString() || null,
    commissionBaseAmount: referral.commissionBaseAmount?.toString() || null,
    clientProject: project,
  };
}

const referralInclude = {
  ambassador: { include: { user: { select: { name: true, email: true } } } },
  partner: { include: { user: { select: { name: true, email: true } } } },
  updatedBy: { select: { name: true, email: true } },
  clientProject: {
    select: {
      id: true,
      title: true,
      currency: true,
      invoices: {
        where: { status: "PAID" as const },
        select: { amount: true, type: true },
      },
    },
  },
} satisfies Prisma.PartnerReferralInclude;

type ReferralResult = Prisma.PartnerReferralGetPayload<{ include: typeof referralInclude }>;

export async function GET(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!hasReferralAccess(access)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const query = request.nextUrl.searchParams;
  const status = query.get("status");
  const ambassadorId = query.get("ambassadorId");
  const search = query.get("search");
  const from = query.get("from");
  const to = query.get("to");
  const contactMethod = query.get("contactMethod");
  const source = query.get("source");

  const [referrals, ambassadors] = await Promise.all([
    db.partnerReferral.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(ambassadorId ? { ambassadorId } : {}),
        ...(contactMethod ? { contactMethod: { contains: contactMethod, mode: "insensitive" } } : {}),
        ...(source ? { source: { contains: source, mode: "insensitive" } } : {}),
        ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) } } : {}),
        ...(search ? { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: referralInclude,
    }),
    db.ambassador.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({ referrals: referrals.map(referralPayload), ambassadors });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await currentAdminAccess(request);
  if (!hasReferralAccess(access) || !access) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.id || !REFERRAL_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  if (!DECISIONS.includes(body.adminDecision)) {
    return NextResponse.json({ error: "INVALID_DECISION" }, { status: 400 });
  }
  if (!COMMISSION_STATUSES.includes(body.commissionStatus)) {
    return NextResponse.json({ error: "INVALID_COMMISSION_STATUS" }, { status: 400 });
  }

  const referral = await db.partnerReferral.findUnique({
    where: { id: body.id },
    include: referralInclude,
  });
  if (!referral) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const commissionType = COMMISSION_TYPES.includes(body.commissionType) ? body.commissionType : null;
  const fixedAmount = decimalInput(body.commissionAmount);
  const commissionRate = decimalInput(body.commissionRate, 3);
  if (fixedAmount === undefined || commissionRate === undefined || (commissionRate && Number(commissionRate) > 100)) {
    return NextResponse.json({ error: "INVALID_COMMISSION" }, { status: 400 });
  }

  const isApproved = ["ACCEPTED", "CONVERTED_TO_CLIENT"].includes(body.adminDecision) || body.status === "CONVERTED";
  const hasCommissionData = Boolean(commissionType || fixedAmount || commissionRate || ["DUE", "PAID"].includes(body.commissionStatus));
  if (hasCommissionData && !isApproved) {
    return NextResponse.json({ error: "REFERRAL_NOT_APPROVED" }, { status: 409 });
  }

  if (["REJECTED", "CANCELLED"].includes(body.adminDecision) && ["DUE", "PAID"].includes(body.commissionStatus)) {
    return NextResponse.json({ error: "CONFLICTING_STATUSES" }, { status: 409 });
  }

  const paidAmount = netPaidAmount(referral.clientProject?.invoices || []);
  if (["DUE", "PAID"].includes(body.commissionStatus) && paidAmount <= 0) {
    return NextResponse.json({ error: "FINANCIAL_CONDITION_NOT_MET" }, { status: 409 });
  }

  let amount: string | null = null;
  let rate: string | null = null;
  let baseAmount: string | null = null;
  if (commissionType === "FIXED") {
    if (!fixedAmount || Number(fixedAmount) <= 0) return NextResponse.json({ error: "COMMISSION_AMOUNT_REQUIRED" }, { status: 400 });
    amount = fixedAmount;
  } else if (commissionType === "PERCENTAGE") {
    if (!commissionRate || Number(commissionRate) <= 0) return NextResponse.json({ error: "COMMISSION_RATE_REQUIRED" }, { status: 400 });
    if (paidAmount <= 0) return NextResponse.json({ error: "FINANCIAL_CONDITION_NOT_MET" }, { status: 409 });
    rate = commissionRate;
    baseAmount = paidAmount.toFixed(2);
    amount = (paidAmount * Number(commissionRate) / 100).toFixed(2);
  }

  if (body.commissionStatus === "PAID" && (!amount || Number(amount) <= 0)) {
    return NextResponse.json({ error: "COMMISSION_AMOUNT_REQUIRED" }, { status: 409 });
  }
  if (body.commissionStatus === "PAID" && referral.commissionStatus !== "DUE") {
    return NextResponse.json({ error: "COMMISSION_NOT_DUE" }, { status: 409 });
  }

  const projectCurrency = referral.clientProject?.currency || referral.commissionCurrency || "USD";
  const requestedCurrency = typeof body.commissionCurrency === "string" ? body.commissionCurrency.trim().toUpperCase() : projectCurrency;
  if (!/^[A-Z]{3}$/.test(requestedCurrency)) return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });

  const updated = await db.partnerReferral.update({
    where: { id: referral.id },
    data: {
      status: body.adminDecision === "CONVERTED_TO_CLIENT" ? "CONVERTED" : body.status,
      adminDecision: body.adminDecision,
      adminNotes: typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 5000) || null : null,
      commissionType,
      commissionAmount: amount,
      commissionRate: rate,
      commissionBaseAmount: baseAmount,
      commissionCurrency: amount ? requestedCurrency : projectCurrency,
      commissionStatus: body.commissionStatus,
      updatedById: access.userId,
    },
    include: referralInclude,
  });

  return NextResponse.json({ referral: referralPayload(updated) });
}
