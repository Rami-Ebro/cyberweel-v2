import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/partner-auth";
import { consumeRateLimit, rateLimitResponse } from "@/lib/request-security";

export const MAX_ACCOUNT_PASSWORD_LENGTH = 256;

export async function requireCurrentPasswordForSensitiveAccountChange(input: {
  request: NextRequest;
  userId: string;
  passwordHash: string | null;
  currentPassword: string;
}) {
  if (
    input.currentPassword.length <= MAX_ACCOUNT_PASSWORD_LENGTH &&
    input.passwordHash &&
    input.currentPassword &&
    verifyPassword(input.currentPassword, input.passwordHash)
  ) {
    return null;
  }

  const limit = await consumeRateLimit(input.request, {
    action: "account-reauth-failure-v1",
    subject: input.userId,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return rateLimitResponse(limit, "محاولات تحقق كثيرة. حاول مجددًا لاحقًا.");
  }

  return NextResponse.json(
    { error: "أدخل كلمة المرور الحالية الصحيحة لتغيير البريد أو الهاتف أو كلمة المرور." },
    { status: 400 },
  );
}
