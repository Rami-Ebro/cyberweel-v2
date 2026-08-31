import { MAX_ACCOUNT_PASSWORD_LENGTH, requireCurrentPasswordForSensitiveAccountChange } from "@/lib/account-security";
import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { clientAccessWhere } from "@/lib/user-identity";

async function currentClient(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findFirst({
    where: clientAccessWhere(session.userId),
    select: { id: true, name: true, email: true, passwordHash: true, createdAt: true },
  });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const client = await currentClient(request);
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : undefined;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (name !== undefined && name.length > 160) {
    return NextResponse.json({ error: "الاسم طويل جدًا" }, { status: 400 });
  }
  if (email && (!email.includes("@") || email.length > 254)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
  }
  if (newPassword && (newPassword.length < 8 || newPassword.length > MAX_ACCOUNT_PASSWORD_LENGTH)) {
    return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون بين 8 و256 حرفًا" }, { status: 400 });
  }

  const emailChanged = Boolean(email && email !== client.email);
  if (emailChanged || newPassword) {
    const reauthResponse = await requireCurrentPasswordForSensitiveAccountChange({
      request,
      userId: client.id,
      passwordHash: client.passwordHash,
      currentPassword,
    });
    if (reauthResponse) return reauthResponse;
  }

  try {
    const updated = await db.user.update({
      where: { id: client.id },
      data: {
        ...(name !== undefined ? { name: name || null } : {}),
        ...(email ? { email } : {}),
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json({ client: updated });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الحساب، وقد يكون البريد مستخدمًا" }, { status: 409 });
  }
}
