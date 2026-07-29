import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { formatPartnerReferralCode } from "@/lib/partner-referral";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

async function currentAmbassador(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      ambassador: {
        select: {
          id: true,
          referralNumber: true,
          status: true,
          phone: true,
          country: true,
          contactMethod: true,
          payoutMethod: true,
          payoutDetails: true,
          profileCompletedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (
    !user?.isActive ||
    user.role !== "AMBASSADOR" ||
    !user.ambassador ||
    user.ambassador.status !== "ACTIVE"
  ) {
    return null;
  }
  return user;
}

function serializeReferral<T extends { commissionAmount: { toString(): string } | null }>(referral: T) {
  return {
    ...referral,
    commissionAmount: referral.commissionAmount?.toString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  const user = await currentAmbassador(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN", redirectTo: "/login" }, { status: 401 });
  if (!user.ambassador!.profileCompletedAt) {
    return NextResponse.json({ error: "PROFILE_REQUIRED", redirectTo: "/complete-profile" }, { status: 428 });
  }

  const rawReferrals = await db.partnerReferral.findMany({
    where: { ambassadorId: user.ambassador!.id },
    orderBy: { createdAt: "desc" },
  });
  const referrals = rawReferrals.map(serializeReferral);
  const summaries = new Map<string, {
    currency: string;
    pending: number;
    approved: number;
    paid: number;
    cancelled: number;
  }>();

  for (const referral of referrals) {
    if (!referral.commissionAmount) continue;
    const amount = Number(referral.commissionAmount);
    if (!Number.isFinite(amount)) continue;
    const currency = referral.commissionCurrency.toUpperCase();
    const summary = summaries.get(currency) || { currency, pending: 0, approved: 0, paid: 0, cancelled: 0 };
    if (referral.commissionStatus === "PENDING") summary.pending += amount;
    if (referral.commissionStatus === "APPROVED") summary.approved += amount;
    if (referral.commissionStatus === "PAID") summary.paid += amount;
    if (referral.commissionStatus === "CANCELLED") summary.cancelled += amount;
    summaries.set(currency, summary);
  }

  const code = formatPartnerReferralCode(user.ambassador!.referralNumber).replace("CW-", "CWA-");
  return NextResponse.json({
    ambassador: {
      name: user.name || user.email,
      email: user.email,
      code,
      referralUrl: `${request.nextUrl.origin}/?ref=${code}`,
      joinedAt: user.ambassador!.createdAt,
      phone: user.ambassador!.phone,
      country: user.ambassador!.country,
      contactMethod: user.ambassador!.contactMethod,
      payoutMethod: user.ambassador!.payoutMethod,
      payoutDetails: user.ambassador!.payoutDetails,
    },
    stats: {
      referrals: referrals.length,
      converted: referrals.filter((item) => item.status === "CONVERTED").length,
      qualified: referrals.filter((item) => item.status === "QUALIFIED").length,
      commissionsByCurrency: Array.from(summaries.values()).map((item) => ({
        currency: item.currency,
        pending: item.pending.toFixed(2),
        approved: item.approved.toFixed(2),
        paid: item.paid.toFixed(2),
        cancelled: item.cancelled.toFixed(2),
      })),
    },
    referrals,
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const user = await currentAmbassador(request);
  if (!user) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });
  if (!user.ambassador!.profileCompletedAt) {
    return NextResponse.json({ error: "أكمل ملفك أولًا" }, { status: 428 });
  }

  const limit = await consumeRateLimit(request, {
    action: "ambassador-direct-referral",
    subject: user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const contactMethod = typeof body?.contactMethod === "string" ? body.contactMethod.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (
    !name ||
    name.length > 120 ||
    email.length > 254 ||
    phone.length > 40 ||
    contactMethod.length > 80 ||
    !notes ||
    notes.length > 2000 ||
    (!email && !phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return NextResponse.json({ error: "أدخل اسم العميل ووسيلة تواصل وتفاصيل الإحالة" }, { status: 400 });
  }

  const referral = await db.partnerReferral.create({
    data: {
      ambassadorId: user.ambassador!.id,
      name,
      email: email || null,
      phone: phone || null,
      contactMethod: contactMethod || null,
      notes,
      source: "إضافة مباشرة من السفير",
      sourcePath: "/ambassador/dashboard",
    },
  });

  return NextResponse.json({ referral: serializeReferral(referral) }, { status: 201 });
}
