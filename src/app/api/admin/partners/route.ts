import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function authorized(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  return Boolean(process.env.PARTNER_ADMIN_KEY && key === process.env.PARTNER_ADMIN_KEY);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const partners = await db.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, _count: { select: { referrals: true } } },
  });
  return NextResponse.json({ partners });
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  if (!id || !["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const partner = await db.partner.update({ where: { id }, data: { status } });
  return NextResponse.json({ partner });
}
