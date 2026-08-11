import { db } from "@/lib/db";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { hashPassword, PARTNER_SESSION_COOKIE, readPartnerSession, verifyPassword } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";
import { AdminUserProfileError, validatedAdminUserProfile } from "@/lib/admin-user-profile";

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
  const [admin, access] = await Promise.all([currentAdmin(request), currentAdminAccess(request)]);
  if (!admin || !access) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    if (!admin.passwordHash || !verifyPassword(currentPassword, admin.passwordHash)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
  }

  try {
    const profile = await validatedAdminUserProfile({ userId: admin.id, name: body?.name ?? admin.name, email: body?.email ?? admin.email, phone: body?.phone ?? admin.phone });
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
