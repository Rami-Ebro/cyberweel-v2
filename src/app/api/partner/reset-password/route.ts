import { db } from "@/lib/db";
import { fingerprint, hashPassword } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (token.length < 32 || password.length < 8) {
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
