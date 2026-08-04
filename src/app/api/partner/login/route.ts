import { db } from "@/lib/db";
import {
  createPartnerSession,
  normalizeEmail,
  normalizePhone,
  partnerSessionCookieOptions,
  verifyPassword,
  PARTNER_SESSION_COOKIE,
} from "@/lib/partner-auth";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const body = await request.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const remember = body?.remember === true;
  if (!identifier || identifier.length > 254 || !password || password.length > 256) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const normalizedIdentifier = identifier.includes("@")
    ? normalizeEmail(identifier)
    : normalizePhone(identifier);

  const ipLimit = await consumeRateLimit(request, {
    action: "login-ip-v2",
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  const isEmail = identifier.includes("@");
  const email = isEmail ? normalizedIdentifier : "";
  const phone = isEmail ? "" : normalizedIdentifier;

  const matchingUsers = await db.user.findMany({
    where: isEmail ? { email } : { phone },
    include: { partner: true, ambassador: true, adminProfile: true },
    take: 2,
  });
  if (!isEmail && matchingUsers.length > 1) {
    return NextResponse.json({ error: "هذا الهاتف مرتبط بأكثر من حساب. استخدم البريد الإلكتروني للدخول." }, { status: 409 });
  }
  const user = matchingUsers[0];

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    const credentialLimit = await consumeRateLimit(request, {
      action: "login-credential-failure-v2",
      subject: normalizedIdentifier,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!credentialLimit.allowed) return rateLimitResponse(credentialLimit);
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "الحساب معلّق. تواصل مع الإدارة." }, { status: 403 });
  }

  if (user.role === "PARTNER") {
    if (!user.partner || user.partner.status !== "ACTIVE") {
      return NextResponse.json({ error: user.partner?.status === "SUSPENDED" ? "الحساب معلّق" : "الحساب بانتظار موافقة الإدارة" }, { status: 403 });
    }
  }

  if (user.role === "AMBASSADOR" && (!user.ambassador || user.ambassador.status !== "ACTIVE")) {
    return NextResponse.json({ error: user.ambassador?.status === "SUSPENDED" ? "الحساب معلّق" : "الحساب بانتظار موافقة الإدارة" }, { status: 403 });
  }

  if (user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive) {
    return NextResponse.json({ error: "الحساب الإداري موقوف" }, { status: 403 });
  }

  if (user.role === "ADMIN" && user.adminProfile) {
    await db.adminProfile.update({ where: { userId: user.id }, data: { lastLoginAt: new Date() } });
  }

  const needsProfile = (user.role === "PARTNER" && !user.partner?.profileCompletedAt)
    || (user.role === "AMBASSADOR" && !user.ambassador?.profileCompletedAt);
  const redirectTo = needsProfile
    ? "/complete-profile"
    : user.role === "ADMIN"
      ? "/admin/partners"
      : user.role === "CLIENT"
        ? "/client/dashboard"
        : user.role === "AMBASSADOR"
          ? "/ambassador/dashboard"
          : "/partner/dashboard";

  const response = NextResponse.json({ ok: true, role: user.role, redirectTo });
  response.cookies.set(
    PARTNER_SESSION_COOKIE,
    createPartnerSession(user.id, remember),
    partnerSessionCookieOptions(remember),
  );
  return response;
}
