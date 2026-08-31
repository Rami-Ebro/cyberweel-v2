import { NextRequest, NextResponse } from "next/server";
import { accountAccessSelect, hasUnifiedAccountAccess } from "@/lib/account-access";
import { MAX_ACCOUNT_PASSWORD_LENGTH, requireCurrentPasswordForSensitiveAccountChange } from "@/lib/account-security";
import { db } from "@/lib/db";
import {
  PARTNER_SESSION_COOKIE,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  readPartnerSession,
} from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

async function currentUser(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      ...accountAccessSelect,
    },
  });

  return hasUnifiedAccountAccess(user) ? user : null;
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
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const emailInput = typeof body?.email === "string" ? body.email.trim() : "";
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (name.length < 2 || name.length > 160) {
    return NextResponse.json({ error: "الاسم يجب أن يكون بين حرفين و160 حرفًا" }, { status: 400 });
  }

  let email = user.email;
  if (emailInput) {
    email = normalizeEmail(emailInput);
    if (!email.includes("@") || email.length > 254) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }
  }

  if (phoneInput.length > 80) {
    return NextResponse.json({ error: "رقم واتساب غير صالح" }, { status: 400 });
  }
  const phone = phoneInput ? normalizePhone(phoneInput) : null;
  if (phoneInput && (phone ?? "").replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "رقم واتساب غير صالح. أضف رمز الدولة" }, { status: 400 });
  }

  if (newPassword && (newPassword.length < 8 || newPassword.length > MAX_ACCOUNT_PASSWORD_LENGTH)) {
    return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون بين 8 و256 حرفًا" }, { status: 400 });
  }

  const emailChanged = email !== user.email;
  const phoneChanged = phone !== user.phone;
  const sensitiveChange = emailChanged || phoneChanged || Boolean(newPassword);

  if (sensitiveChange) {
    const reauthResponse = await requireCurrentPasswordForSensitiveAccountChange({
      request,
      userId: user.id,
      passwordHash: user.passwordHash,
      currentPassword,
    });
    if (reauthResponse) return reauthResponse;
  }

  if (emailChanged) {
    const duplicate = await db.user.findFirst({ where: { email, NOT: { id: user.id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقًا" }, { status: 409 });
  }

  if (phoneChanged && phone) {
    const duplicate = await db.user.findFirst({ where: { phone, NOT: { id: user.id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "رقم واتساب مستخدم مسبقًا" }, { status: 409 });
  }

  try {
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
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الإعدادات، وقد تكون بيانات الدخول مستخدمة مسبقًا" }, { status: 409 });
  }
}
