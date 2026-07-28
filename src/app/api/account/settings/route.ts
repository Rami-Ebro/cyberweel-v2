import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PARTNER_SESSION_COOKIE,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  readPartnerSession,
  verifyPassword,
} from "@/lib/partner-auth";

async function currentUser(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, passwordHash: true },
  });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  return NextResponse.json({
    account: {
      id: user.id,
      name: user.name,
      email: user.email.includes(".cyberweel.local") ? "" : user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const emailInput = typeof body?.email === "string" ? body.email.trim() : "";
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (name.length < 2) return NextResponse.json({ error: "الاسم يجب أن يكون حرفين على الأقل" }, { status: 400 });

  let email = user.email;
  if (emailInput) {
    email = normalizeEmail(emailInput);
    if (!email.includes("@")) return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    const duplicate = await db.user.findFirst({ where: { email, NOT: { id: user.id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقًا" }, { status: 409 });
  }

  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  if (phoneInput && (phone ?? "").replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "رقم واتساب غير صالح. أضف رمز الدولة" }, { status: 400 });
  }
  if (phone) {
    const duplicate = await db.user.findFirst({ where: { phone, NOT: { id: user.id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "رقم واتساب مستخدم مسبقًا" }, { status: 409 });
  }

  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    if (!user.passwordHash || !currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      phone,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json({
    account: {
      ...updated,
      email: updated.email.includes(".cyberweel.local") ? "" : updated.email,
    },
  });
}
