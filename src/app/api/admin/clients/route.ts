import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";

function parseIdentifier(identifier: string) {
  const isEmail = identifier.includes("@");
  const phone = isEmail ? null : normalizePhone(identifier);
  const email = isEmail ? normalizeEmail(identifier) : `${(phone || "").replace("+", "")}@phone.cyberweel.local`;
  return { email, phone };
}

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const [clients, referrals] = await Promise.all([
    db.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, isActive: true, createdAt: true,
        clientProjects: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true, progress: true, referralId: true },
        },
      },
    }),
    db.partnerReferral.findMany({
      where: { status: "CONVERTED", clientProject: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);
  return NextResponse.json({ clients, referrals });
}

export async function POST(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const referralId = typeof body?.referralId === "string" ? body.referralId : "";
  const projectTitle = typeof body?.projectTitle === "string" ? body.projectTitle.trim() : "";

  if (name.length < 2 || !identifier || password.length < 8) {
    return NextResponse.json({ error: "الاسم وبيانات الدخول وكلمة مرور من 8 أحرف مطلوبة" }, { status: 400 });
  }
  if (referralId && !projectTitle) return NextResponse.json({ error: "اسم المشروع مطلوب عند ربط إحالة" }, { status: 400 });

  const { email, phone } = parseIdentifier(identifier);
  if (!identifier.includes("@") && (!phone || phone.length < 8)) return NextResponse.json({ error: "رقم واتساب غير صالح" }, { status: 400 });

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true, role: true },
  });
  if (existing && existing.role !== "CLIENT") return NextResponse.json({ error: "بيانات الدخول مرتبطة بحساب من نوع آخر" }, { status: 409 });

  try {
    const result = await db.$transaction(async (tx) => {
      if (referralId) {
        const referral = await tx.partnerReferral.findFirst({
          where: { id: referralId, status: "CONVERTED", clientProject: null },
          select: { id: true },
        });
        if (!referral) throw new Error("REFERRAL_UNAVAILABLE");
      }

      const client = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { name, passwordHash: hashPassword(password), isActive: true },
            select: { id: true, name: true, email: true, phone: true, isActive: true },
          })
        : await tx.user.create({
            data: { name, email, phone, passwordHash: hashPassword(password), role: "CLIENT", isActive: true },
            select: { id: true, name: true, email: true, phone: true, isActive: true },
          });

      const project = referralId
        ? await tx.clientProject.create({
            data: { clientId: client.id, referralId, title: projectTitle },
            select: { id: true, title: true, status: true, progress: true, referralId: true },
          })
        : null;
      return { client, project };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "REFERRAL_UNAVAILABLE") {
      return NextResponse.json({ error: "الإحالة غير متاحة أو مرتبطة بمشروع مسبقًا" }, { status: 409 });
    }
    return NextResponse.json({ error: "تعذر إنشاء حساب العميل، وقد تكون بيانات الدخول مستخدمة" }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : undefined;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!userId) return NextResponse.json({ error: "حساب العميل مطلوب" }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });

  const client = await db.user.findFirst({ where: { id: userId, role: "CLIENT" }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "حساب العميل غير موجود" }, { status: 404 });

  const updated = await db.user.update({
    where: { id: client.id },
    data: { ...(isActive !== undefined ? { isActive } : {}), ...(password ? { passwordHash: hashPassword(password) } : {}) },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });
  return NextResponse.json({ client: updated });
}
