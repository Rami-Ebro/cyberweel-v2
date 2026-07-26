import { db } from "@/lib/db";
import { createPartnerSession, normalizeEmail, normalizePhone, partnerSessionCookieOptions, verifyPassword, PARTNER_SESSION_COOKIE } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const remember = body?.remember === true;
  const isEmail = identifier.includes("@");
  const email = isEmail ? normalizeEmail(identifier) : "";
  const phone = isEmail ? "" : normalizePhone(identifier);

  const user = await db.user.findFirst({
    where: isEmail ? { email } : { phone },
    include: { partner: true },
  });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  if (user.role === "PARTNER") {
    if (!user.partner || user.partner.status !== "ACTIVE") {
      return NextResponse.json({ error: user.partner?.status === "SUSPENDED" ? "الحساب معلّق" : "الحساب بانتظار موافقة الإدارة" }, { status: 403 });
    }
  }

  const redirectTo = user.role === "ADMIN"
    ? "/admin/partners"
    : user.role === "CLIENT"
      ? "/client/dashboard"
      : "/partner/dashboard";

  const response = NextResponse.json({ ok: true, role: user.role, redirectTo });
  response.cookies.set(PARTNER_SESSION_COOKIE, createPartnerSession(user.id, remember), partnerSessionCookieOptions(remember));
  return response;
}