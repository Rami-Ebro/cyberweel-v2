import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_PERMISSIONS, currentAdminAccess } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";

async function requireOwner(request: NextRequest) {
  const access = await currentAdminAccess(request);
  return access?.isOwner ? access : null;
}

function validPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => typeof item === "string" && ADMIN_PERMISSIONS.includes(item as (typeof ADMIN_PERMISSIONS)[number]),
  ) as string[];
}

export async function GET(request: NextRequest) {
  const owner = await requireOwner(request);
  if (!owner) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const members = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      adminProfile: { select: { isOwner: true, isActive: true, permissions: true, lastLoginAt: true } },
    },
  });

  return NextResponse.json({ members, permissions: ADMIN_PERMISSIONS, currentUserId: owner.userId });
}

export async function POST(request: NextRequest) {
  if (!(await requireOwner(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const permissions = validPermissions(body?.permissions);

  if (name.length < 2 || !identifier || password.length < 8) {
    return NextResponse.json({ error: "الاسم وبيانات الدخول وكلمة مرور من 8 أحرف مطلوبة" }, { status: 400 });
  }

  const isEmail = identifier.includes("@");
  const email = isEmail ? normalizeEmail(identifier) : `${normalizePhone(identifier).replace("+", "")}@phone.cyberweel.local`;
  const phone = isEmail ? null : normalizePhone(identifier);
  if (!isEmail && phone.length < 8) return NextResponse.json({ error: "رقم واتساب غير صالح" }, { status: 400 });

  const exists = await db.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "البريد أو رقم واتساب مستخدم مسبقًا" }, { status: 409 });

  const member = await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      adminProfile: { create: { isOwner: false, isActive: true, permissions } },
    },
    select: { id: true, name: true, email: true, phone: true, adminProfile: true },
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const owner = await requireOwner(request);
  if (!owner) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId || userId === owner.userId) return NextResponse.json({ error: "لا يمكن تعديل حساب المالك الرئيسي هنا" }, { status: 400 });

  const target = await db.user.findFirst({
    where: { id: userId, role: "ADMIN" },
    select: { id: true, adminProfile: { select: { isOwner: true } } },
  });
  if (!target) return NextResponse.json({ error: "حساب الإدارة غير موجود" }, { status: 404 });
  if (target.adminProfile?.isOwner) {
    return NextResponse.json({ error: "لا يمكن تعديل حساب مالك آخر" }, { status: 400 });
  }

  const permissions = Array.isArray(body?.permissions) ? validPermissions(body.permissions) : undefined;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : undefined;
  const password = typeof body?.password === "string" ? body.password : "";

  if (password && password.length < 8) return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...(password ? { passwordHash: hashPassword(password) } : {}),
      adminProfile: {
        upsert: {
          create: { permissions: permissions || [], isActive: isActive ?? true },
          update: {
            ...(permissions ? { permissions } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
        },
      },
    },
    select: { id: true, name: true, email: true, phone: true, adminProfile: true },
  });

  return NextResponse.json({ member: updated });
}
