import { db } from "@/lib/db";
import { createPartnerSession, normalizeEmail, partnerSessionCookieOptions, verifyPassword, PARTNER_SESSION_COOKIE } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await db.user.findUnique({ where: { email }, include: { partner: true } });
  if (!user?.passwordHash || user.role !== "PARTNER" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  if (!user.partner || user.partner.status !== "ACTIVE") {
    return NextResponse.json({ error: user.partner?.status === "SUSPENDED" ? "الحساب معلّق" : "الحساب بانتظار موافقة الإدارة" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PARTNER_SESSION_COOKIE, createPartnerSession(user.id), partnerSessionCookieOptions);
  return response;
}
