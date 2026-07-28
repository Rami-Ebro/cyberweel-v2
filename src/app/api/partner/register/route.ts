import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

function internalPhoneEmail(phone: string) {
  return `phone.${phone.replace(/\D/g, "")}@accounts.cyberweel.local`;
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const rateLimit = await consumeRateLimit(request, {
    action: "partner-register",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const isEmail = identifier.includes("@");
  const email = isEmail ? normalizeEmail(identifier) : "";
  const phone = isEmail ? "" : normalizePhone(identifier);

  if (
    name.length < 2 ||
    name.length > 120 ||
    identifier.length > 254 ||
    password.length < 10 ||
    password.length > 256 ||
    (isEmail ? !email.includes("@") : phone.replace(/\D/g, "").length < 8)
  ) {
    return NextResponse.json({ error: "تحقق من الاسم ووسيلة التواصل، واستخدم كلمة مرور من 10 أحرف على الأقل" }, { status: 400 });
  }

  const exists = await db.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: { id: true },
  });
  if (exists) return NextResponse.json({ error: "البريد أو رقم واتساب مستخدم مسبقًا" }, { status: 409 });

  const status = process.env.VERCEL_ENV === "preview" ? "ACTIVE" : "PENDING";

  await db.user.create({
    data: {
      name,
      email: email || internalPhoneEmail(phone),
      phone: phone || null,
      passwordHash: hashPassword(password),
      role: "PARTNER",
      partner: { create: { status } },
    },
  });

  return NextResponse.json({ ok: true, status }, { status: 201 });
}
