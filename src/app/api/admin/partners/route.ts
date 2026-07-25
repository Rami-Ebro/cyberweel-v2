import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

async function authorized(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (process.env.PARTNER_ADMIN_KEY && key === process.env.PARTNER_ADMIN_KEY) return true;

  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return false;

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const [partners, referrals, users] = await Promise.all([
    db.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, _count: { select: { referrals: true } } },
    }),
    db.partnerReferral.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { partner: { include: { user: { select: { name: true, email: true } } } } },
    }),
    db.user.count(),
  ]);

  const stats = {
    users,
    partners: partners.length,
    activePartners: partners.filter((item) => item.status === "ACTIVE").length,
    pendingPartners: partners.filter((item) => item.status === "PENDING").length,
    referrals: referrals.length,
    newReferrals: referrals.filter((item) => item.status === "NEW").length,
  };

  return NextResponse.json({ partners, referrals, stats });
}

export async function PATCH(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  if (!id || !["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const partner = await db.partner.update({ where: { id }, data: { status } });
  return NextResponse.json({ partner });
}
