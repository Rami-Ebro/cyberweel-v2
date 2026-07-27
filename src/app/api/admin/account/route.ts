import { db } from "@/lib/db";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail, PARTNER_SESSION_COOKIE, readPartnerSession, verifyPassword } from "@/lib/partner-auth";
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
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : undefined;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    if (!admin.passwordHash || !verifyPassword(currentPassword, admin.passwordHash)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
  }

  try {
    const updated = await db.user.update({
      where: { id: admin.id },
      data: {
        ...(name !== undefined ? { name: name || null } : {}),
        ...(email ? { email } : {}),
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        adminProfile: { select: { isOwner: true } },
      },
    });
    return NextResponse.json({
      admin: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        createdAt: updated.createdAt,
        isOwner: access.isOwner,
        permissions: access.permissions,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ بيانات الحساب، وقد يكون البريد مستخدمًا" }, { status: 409 });
  }
}
