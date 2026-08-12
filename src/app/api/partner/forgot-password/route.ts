import { db } from "@/lib/db";
import { fingerprint, normalizeEmail } from "@/lib/partner-auth";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const GENERIC_MESSAGE = "إذا كان البريد مسجلًا، فستصلك رسالة إعادة تعيين كلمة المرور";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا" }, { status: 400 });
  }

  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit(request, {
      action: "password-reset-ip",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    }),
    consumeRateLimit(request, {
      action: "password-reset-email",
      subject: email,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
  ]);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);
  if (!emailLimit.allowed) return rateLimitResponse(emailLimit);

  const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true, preferredLanguage: true } });
  if (!user || !["PARTNER", "CLIENT"].includes(user.role)) {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }

  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: fingerprint(token), expiresAt },
  });

  const resetUrl = `${request.nextUrl.origin}/partner/reset-password?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "CyberWeel <noreply@cyberweel.com>";

  if (apiKey) {
    const emailCopy = user.preferredLanguage === "en"
      ? {
          subject: "Reset Your CyberWeel Password",
          html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Reset your password</h2><p>Use the link below to create a new password. The link is valid for 30 minutes and can be used once.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p></div>`,
        }
      : {
          subject: "إعادة تعيين كلمة مرور CyberWeel",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>إعادة تعيين كلمة المرور</h2><p>اضغط على الرابط التالي لإنشاء كلمة مرور جديدة. الرابط صالح لمدة 30 دقيقة ويُستخدم مرة واحدة فقط.</p><p><a href="${resetUrl}">إعادة تعيين كلمة المرور</a></p><p>إذا لم تطلب ذلك، تجاهل الرسالة.</p></div>`,
        };
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: emailCopy.subject,
        html: emailCopy.html,
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    message: GENERIC_MESSAGE,
    ...(process.env.VERCEL_ENV === "preview" ? { resetUrl } : {}),
  });
}
