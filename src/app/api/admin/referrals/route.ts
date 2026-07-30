import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "referrals"))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
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
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        partner: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
    db.ambassador.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);
  return NextResponse.json({ referrals, ambassadors });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  if (!(await canAdmin(request, "referrals"))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id || !["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"].includes(body.status)) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const amount = body.commissionAmount === null || body.commissionAmount === ""
    ? null
    : String(body.commissionAmount).trim();
  if (amount && !/^\d{1,10}(\.\d{1,2})?$/.test(amount)) {
    return NextResponse.json({ error: "INVALID_COMMISSION" }, { status: 400 });
  }
  const currency = typeof body.commissionCurrency === "string"
    ? body.commissionCurrency.trim().toUpperCase()
    : "USD";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (!["PENDING", "APPROVED", "PAID", "CANCELLED"].includes(body.commissionStatus)) {
    return NextResponse.json({ error: "INVALID_COMMISSION_STATUS" }, { status: 400 });
  }

  const referral = await db.partnerReferral.update({
    where: { id: body.id },
    data: {
      status: body.status,
      adminDecision: typeof body.adminDecision === "string" ? body.adminDecision.trim() || null : undefined,
      commissionAmount: amount,
      commissionCurrency: currency,
      commissionStatus: body.commissionStatus,
    },
  });
  return NextResponse.json({ referral });
}
