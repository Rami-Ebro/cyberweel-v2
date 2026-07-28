import { db } from "@/lib/db";
import { fingerprint, hashPassword } from "@/lib/partner-auth";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const rateLimit = await consumeRateLimit(request, {
    action: "password-reset-submit",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (token.length < 32 || token.length > 256 || password.length < 10 || password.length > 256) {
    return NextResponse.json({ error: "الرابط غير صالح أو كلمة المرور قصيرة" }, { status: 400 });
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: fingerprint(token) },
    include: { user: { select: { id: true, role: true } } },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt <= new Date() ||
    resetToken.user.role !== "PARTNER"
  ) {
    return NextResponse.json({ error: "الرابط منتهي أو تم استخدامه مسبقًا" }, { status: 400 });
  }

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashPassword(password) },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
