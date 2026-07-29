import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";

export async function GET(request: NextRequest) {
  const canView = await Promise.all([
    canAdmin(request, "overview"),
    canAdmin(request, "partners"),
    canAdmin(request, "referrals"),
    canAdmin(request, "projects"),
  ]);
  if (!canView.some(Boolean)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const [partners, referrals, users, applications] = await Promise.all([
    canView[1]
      ? db.partner.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true, phone: true, isActive: true } }, assignments: { orderBy: { createdAt: "desc" } }, _count: { select: { referrals: true } } },
        })
      : [],
    canView[2] || canView[3] || canView[0]
      ? db.partnerReferral.findMany({
          orderBy: { createdAt: "desc" },
          take: 250,
          include: { partner: { include: { user: { select: { name: true, email: true } } } } },
        })
      : [],
    canView[0] ? db.user.count() : 0,
    canView[1] ? db.collaborationApplication.findMany({ where: { type: "PARTNER" }, orderBy: { createdAt: "desc" } }) : [],
  ]);

  const stats = {
    users,
    partners: partners.length,
    activePartners: partners.filter((item) => item.status === "ACTIVE").length,
    pendingPartners: partners.filter((item) => item.status === "PENDING").length,
    referrals: referrals.length,
    newReferrals: referrals.filter((item) => item.status === "NEW").length,
    qualifiedReferrals: referrals.filter((item) => item.status === "QUALIFIED").length,
    projects: referrals.filter((item) => item.status === "CONVERTED").length,
  };

  return NextResponse.json({
    partners,
    applications,
    referrals,
    stats,
    access: { overview: canView[0], partners: canView[1], referrals: canView[2], projects: canView[3] },
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  const entity = body?.entity === "referral" ? "referral" : "partner";

  if (!id) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });

  if (body?.entity === "application") {
    if (!(await canAdmin(request, "partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    if (!["ACCEPTED", "REJECTED"].includes(status) || !notes) return NextResponse.json({ error: "ملاحظة القرار مطلوبة" }, { status: 400 });
    const application = await db.collaborationApplication.findUnique({ where: { id } });
    if (!application || application.type !== "PARTNER") return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (status === "ACCEPTED") {
      const password = typeof body?.password === "string" ? body.password : "";
      if (password.length < 10) return NextResponse.json({ error: "كلمة مرور مؤقتة من 10 أحرف مطلوبة" }, { status: 400 });
      await db.$transaction(async (tx) => {
        await tx.user.create({ data: { name: application.name, email: normalizeEmail(application.email), phone: application.phone, passwordHash: hashPassword(password), role: "PARTNER", partner: { create: { status: "ACTIVE", specialty: application.specialty, decisionNotes: notes, decidedAt: new Date() } } } });
        await tx.collaborationApplication.update({ where: { id }, data: { status: "ACCEPTED", decisionNotes: notes, decidedAt: new Date() } });
      });
    } else await db.collaborationApplication.update({ where: { id }, data: { status: "REJECTED", decisionNotes: notes, decidedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (body?.entity === "project") {
    if (!(await canAdmin(request, "projects"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });
    const project = await db.partnerProject.create({ data: { partnerId: id, title, description: typeof body.description === "string" ? body.description : null, tasks: Array.isArray(body.tasks) ? body.tasks.filter((x: unknown): x is string => typeof x === "string") : [], deliverables: Array.isArray(body.deliverables) ? body.deliverables.filter((x: unknown): x is string => typeof x === "string") : [], files: Array.isArray(body.files) ? body.files.filter((x: unknown): x is string => typeof x === "string") : [], updates: Array.isArray(body.updates) ? body.updates.filter((x: unknown): x is string => typeof x === "string") : [], dueAt: body.dueAt ? new Date(body.dueAt) : null } });
    return NextResponse.json({ project }, { status: 201 });
  }

  if (entity === "referral") {
    const permission = status === "CONVERTED" ? "projects" : "referrals";
    if (!(await canAdmin(request, permission))) return NextResponse.json({ error: "لا تملك هذه الصلاحية" }, { status: 403 });
    if (!["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "حالة الإحالة غير صالحة" }, { status: 400 });
    }
    const referral = await db.partnerReferral.update({ where: { id }, data: { status } });
    return NextResponse.json({ referral });
  }

  if (!(await canAdmin(request, "partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
  if (!["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "حالة الشريك غير صالحة" }, { status: 400 });
  }
  const partner = await db.partner.update({ where: { id }, data: { status } });
  return NextResponse.json({ partner });
}
