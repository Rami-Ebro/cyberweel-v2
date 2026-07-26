import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

function internalPhoneEmail(phone: string) {
  return `phone.${phone.replace(/\D/g, "")}@accounts.cyberweel.local`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const isEmail = identifier.includes("@");
  const email = isEmail ? normalizeEmail(identifier) : "";
  const phone = isEmail ? "" : normalizePhone(identifier);

  if (
    name.length < 2 ||
    password.length < 8 ||
    (isEmail ? !email.includes("@") : phone.replace(/\D/g, "").length < 8)
  ) {
    return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا أو رقم واتساب مع رمز الدولة" }, { status: 400 });
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