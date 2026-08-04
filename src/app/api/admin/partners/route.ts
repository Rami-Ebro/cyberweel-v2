import { db } from "@/lib/db";
import { canAdmin, currentAdminAccess } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";
import { sendClientInvitation } from "@/lib/client-invitation";

export async function GET(request: NextRequest) {
  const canView = await Promise.all([
    canAdmin(request, "overview"),
    canAdmin(request, "partners"),
    canAdmin(request, "referrals"),
    canAdmin(request, "projects"),
  ]);
  if (!canView.some(Boolean)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const [partners, referrals, applications, overviewStats] = await Promise.all([
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
          include: {
            partner: { include: { user: { select: { name: true, email: true } } } },
            ambassador: { include: { user: { select: { name: true, email: true } } } },
          },
        })
      : [],
    canView[1] ? db.collaborationApplication.findMany({ where: { type: "PARTNER" }, orderBy: { createdAt: "desc" }, include: { decidedBy: { select: { name: true, email: true } } } }) : [],
    canView[0]
      ? Promise.all([
          db.user.count({ where: { role: "CLIENT" } }),
          db.clientProject.count(),
          db.clientInvoice.count(),
          db.partnerReferral.count(),
          db.partner.count(),
          db.ambassador.count(),
        ])
      : Promise.resolve([0, 0, 0, 0, 0, 0]),
  ]);

  const stats = {
    clients: overviewStats[0],
    projects: overviewStats[1],
    invoices: overviewStats[2],
    referrals: overviewStats[3],
    partners: overviewStats[4],
    ambassadors: overviewStats[5],
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
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    if (!["ACCEPTED", "REJECTED"].includes(status)) return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    if (status === "REJECTED" && !notes) return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
    const application = await db.collaborationApplication.findUnique({ where: { id } });
    if (!application || application.type !== "PARTNER") return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (application.status !== "PENDING") return NextResponse.json({ error: "ALREADY_DECIDED" }, { status: 409 });
    if (status === "ACCEPTED") {
      const password = typeof body?.password === "string" ? body.password : "";
      if (password.length < 10) return NextResponse.json({ error: "كلمة مرور مؤقتة من 10 أحرف مطلوبة" }, { status: 400 });
      const existingEmail = await db.user.findUnique({
        where: { email: normalizeEmail(application.email) },
        select: { id: true },
      });
      if (existingEmail) return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
      if (application.phone) {
        const existingPhone = await db.user.findFirst({
          where: { phone: application.phone },
          select: { id: true },
        });
        if (existingPhone) return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 409 });
      }
      let user: { id: string; email: string };
      try {
        user = await db.$transaction(async (tx) => {
        const claimed = await tx.collaborationApplication.updateMany({ where: { id, status: "PENDING" }, data: { status: "ACCEPTED", reviewState: "ACCEPTED", decisionNotes: notes || null, decidedAt: new Date(), decidedById: access.userId } });
        if (claimed.count !== 1) throw new Error("ALREADY_DECIDED");
        const created = await tx.user.create({ data: { name: application.name, email: normalizeEmail(application.email), phone: application.phone, passwordHash: hashPassword(password), role: "PARTNER", partner: { create: { applicationId: application.id, status: "ACTIVE", specialty: application.specialty, decisionNotes: notes || null, decidedAt: new Date() } } } });
        await tx.adminNotification.create({ data: { title: "تم إنشاء حساب شريك التنفيذ", body: `${application.name} — ${application.email}`, href: "/admin/partners?section=partners", kind: "PARTNER_ACCEPTED" } });
        return created;
        });
      } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_DECIDED") return NextResponse.json({ error: "ALREADY_DECIDED" }, { status: 409 });
        throw error;
      }
      const invitation = await sendClientInvitation(user.id, user.email, request.nextUrl.origin).catch((error) => {
        console.error("[partner-acceptance] Invitation failed after account creation", error);
        return { sent: false, error: "EMAIL_SEND_FAILED" };
      });
      return NextResponse.json({ ok: true, invitationSent: invitation.sent, inviteError: invitation.error });
    } else {
      const rejected = await db.collaborationApplication.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", reviewState: "REJECTED", decisionNotes: notes, decidedAt: new Date(), decidedById: access.userId } });
      if (rejected.count !== 1) return NextResponse.json({ error: "ALREADY_DECIDED" }, { status: 409 });
      await db.adminNotification.create({ data: { title: "تم رفض طلب شريك التنفيذ", body: `${application.name} — ${notes}`, href: "/admin/partners?section=partners", kind: "PARTNER_REJECTED" } });
      return NextResponse.json({ ok: true });
    }
  }

  if (body?.entity === "project") {
    if (!(await canAdmin(request, "projects"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });

    const projectStatus = typeof body?.projectStatus === "string" ? body.projectStatus : "ASSIGNED";
    if (!["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"].includes(projectStatus)) {
      return NextResponse.json({ error: "حالة المشروع غير صالحة" }, { status: 400 });
    }

    const progress = body?.progress === undefined ? 0 : Number(body.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "نسبة التقدم يجب أن تكون بين 0 و100" }, { status: 400 });
    }

    const feeAmount = body?.feeAmount === undefined || body?.feeAmount === null || body?.feeAmount === ""
      ? null
      : String(body.feeAmount).trim();
    if (feeAmount && !/^\d{1,10}(\.\d{1,2})?$/.test(feeAmount)) {
      return NextResponse.json({ error: "قيمة المستحقات غير صالحة" }, { status: 400 });
    }

    const feeCurrency = typeof body?.feeCurrency === "string" ? body.feeCurrency.trim().toUpperCase() : "USD";
    if (!/^[A-Z]{3}$/.test(feeCurrency)) {
      return NextResponse.json({ error: "رمز العملة غير صالح" }, { status: 400 });
    }

    const paymentStatuses = ["PENDING", "APPROVED", "PAID", "CANCELLED"] as const;
    const paymentStatusValue = typeof body?.paymentStatus === "string" ? body.paymentStatus : "PENDING";
    if (!paymentStatuses.includes(paymentStatusValue as (typeof paymentStatuses)[number])) {
      return NextResponse.json({ error: "حالة المستحقات غير صالحة" }, { status: 400 });
    }
    const paymentStatus = paymentStatusValue as (typeof paymentStatuses)[number];

    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: "موعد التسليم غير صالح" }, { status: 400 });
    }

    const project = await db.partnerProject.create({
      data: {
        partnerId: id,
        title,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        tasks: Array.isArray(body.tasks) ? body.tasks.filter((x: unknown): x is string => typeof x === "string").map((x: string) => x.trim()).filter(Boolean) : [],
        deliverables: Array.isArray(body.deliverables) ? body.deliverables.filter((x: unknown): x is string => typeof x === "string").map((x: string) => x.trim()).filter(Boolean) : [],
        files: Array.isArray(body.files) ? body.files.filter((x: unknown): x is string => typeof x === "string") : [],
        updates: Array.isArray(body.updates) ? body.updates.filter((x: unknown): x is string => typeof x === "string").map((x: string) => x.trim()).filter(Boolean) : [],
        status: projectStatus,
        progress,
        feeAmount,
        feeCurrency,
        paymentStatus,
        paidAt: paymentStatus === "PAID" ? new Date() : null,
        dueAt,
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  }

  if (entity === "referral") {
    if (!(await canAdmin(request, "referrals"))) return NextResponse.json({ error: "لا تملك هذه الصلاحية" }, { status: 403 });
    if (!["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE", "NOT_INTERESTED"].includes(status)) {
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
