import { MAX_ACCOUNT_PASSWORD_LENGTH, requireCurrentPasswordForSensitiveAccountChange } from "@/lib/account-security";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { AdminUserProfileError, validatedAdminUserProfile } from "@/lib/admin-user-profile";
import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, normalizePhone, PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

async function currentAdmin(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findFirst({
    where: { id: session.userId, role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      createdAt: true,
      adminProfile: { select: { isOwner: true } },
    },
  });
}

export async function GET(request: NextRequest) {
  const [admin, access] = await Promise.all([currentAdmin(request), currentAdminAccess(request)]);
  if (!admin || !access) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  return NextResponse.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      createdAt: admin.createdAt,
      isOwner: access.isOwner,
      permissions: access.permissions,
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const [admin, access] = await Promise.all([currentAdmin(request), currentAdminAccess(request)]);
  if (!admin || !access) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const requestedEmail = typeof body?.email === "string" ? normalizeEmail(body.email) : admin.email;
  const requestedPhone = typeof body?.phone === "string" ? normalizePhone(body.phone) || null : admin.phone;

  if (newPassword && (newPassword.length < 8 || newPassword.length > MAX_ACCOUNT_PASSWORD_LENGTH)) {
    return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون بين 8 و256 حرفًا" }, { status: 400 });
  }

  const identityChanged = requestedEmail !== admin.email || requestedPhone !== admin.phone;
  if (identityChanged || newPassword) {
    const reauthResponse = await requireCurrentPasswordForSensitiveAccountChange({
      request,
      userId: admin.id,
      passwordHash: admin.passwordHash,
      currentPassword,
    });
    if (reauthResponse) return reauthResponse;
  }

  try {
    const profile = await validatedAdminUserProfile({
      userId: admin.id,
      name: body?.name ?? admin.name,
      email: requestedEmail,
      phone: requestedPhone,
    });
    const updated = await db.user.update({
      where: { id: admin.id },
      data: {
        ...profile,
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        adminProfile: { select: { isOwner: true } },
      },
    });
    return NextResponse.json({
      admin: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        createdAt: updated.createdAt,
        isOwner: access.isOwner,
        permissions: access.permissions,
      },
    });
  } catch (error) {
    if (error instanceof AdminUserProfileError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "تعذر حفظ بيانات الحساب" }, { status: 409 });
  }
}
