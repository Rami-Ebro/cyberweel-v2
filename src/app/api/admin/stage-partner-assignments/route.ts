import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { writeAdminAudit } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import {
  deleteStagePartnerAssignment,
  listStagePartnerAssignments,
  serializeStagePartnerAssignment,
  upsertStagePartnerAssignment,
  type StagePartnerPaymentStatus,
} from "@/lib/stage-partner-assignments";

async function requireAccess(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects") || access.permissions.includes("partners"))) {
    return null;
  }
  return access;
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 100);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
  }
  return [];
}

function optionalDate(value: unknown) {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  if (!(await requireAccess(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const projectId = request.nextUrl.searchParams.get("projectId")?.trim() || "";
  if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });

  const [project, partners, assignments] = await Promise.all([
    db.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        status: true,
        currency: true,
        projectStages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            status: true,
            paymentStatus: true,
            amount: true,
            currency: true,
            startsAt: true,
          },
        },
      },
    }),
    db.partner.findMany({
      where: { status: "ACTIVE", user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
    listStagePartnerAssignments({ projectId }),
  ]);

  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const serialized = assignments.map(serializeStagePartnerAssignment);
  return NextResponse.json({
    project: {
      ...project,
      projectStages: project.projectStages.map((stage) => ({
        ...stage,
        amount: stage.amount.toString(),
        assignments: serialized.filter((assignment) => assignment.projectStageId === stage.id),
      })),
    },
    partners: partners.map((partner) => ({
      id: partner.id,
      name: partner.user.name || partner.user.email,
      email: partner.user.email,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireAccess(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "upsert";

  if (action === "delete") {
    const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId.trim() : "";
    if (!assignmentId) return NextResponse.json({ error: "الإسناد مطلوب" }, { status: 400 });
    const existing = (await listStagePartnerAssignments()).find((assignment) => assignment.id === assignmentId);
    if (!existing) return NextResponse.json({ error: "الإسناد غير موجود" }, { status: 404 });
    if (["COMPLETED", "CANCELLED"].includes(existing.stageStatus)) {
      return NextResponse.json({ error: "لا يمكن حذف إسناد من مرحلة مغلقة أو ملغاة" }, { status: 409 });
    }
    if (existing.progress > 0 || existing.paymentStatus === "PAID") {
      return NextResponse.json({ error: "لا يمكن حذف إسناد بدأ تنفيذه أو تم دفع مستحقه" }, { status: 409 });
    }
    await deleteStagePartnerAssignment(assignmentId);
    await writeAdminAudit(db, {
      actorId: access.userId,
      action: "STAGE_PARTNER_ASSIGNMENT_REMOVED",
      category: "SENSITIVE",
      entityType: "PROJECT_STAGE",
      entityId: existing.projectStageId,
      entityLabel: `${existing.projectTitle} — ${existing.stageName}`,
      before: { assignmentId, partnerId: existing.partnerId, partnerEmail: existing.partnerEmail },
    });
    return NextResponse.json({ ok: true });
  }

  const projectStageId = typeof body?.projectStageId === "string" ? body.projectStageId.trim() : "";
  const partnerId = typeof body?.partnerId === "string" ? body.partnerId.trim() : "";
  if (!projectStageId || !partnerId) {
    return NextResponse.json({ error: "اختر المرحلة وشريك التنفيذ" }, { status: 400 });
  }

  const [stage, partner] = await Promise.all([
    db.projectStage.findUnique({
      where: { id: projectStageId },
      select: { id: true, name: true, status: true, project: { select: { id: true, title: true, status: true, currency: true } } },
    }),
    db.partner.findFirst({
      where: { id: partnerId, status: "ACTIVE", user: { isActive: true } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);
  if (!stage) return NextResponse.json({ error: "مرحلة المشروع غير موجودة" }, { status: 404 });
  if (!partner) return NextResponse.json({ error: "شريك التنفيذ غير موجود أو غير فعال" }, { status: 404 });
  if (["COMPLETED", "CANCELLED"].includes(stage.status)) {
    return NextResponse.json({ error: "لا يمكن إسناد شريك إلى مرحلة مكتملة أو ملغاة" }, { status: 409 });
  }
  if (stage.project.status === "COMPLETED" || stage.project.status === "CANCELLED") {
    return NextResponse.json({ error: "المشروع مغلق ولا يقبل إسنادات جديدة" }, { status: 409 });
  }

  const tasks = stringList(body?.tasks);
  const deliverables = stringList(body?.deliverables);
  if (!tasks.length) return NextResponse.json({ error: "اكتب مهمة واحدة على الأقل للشريك" }, { status: 400 });
  if (!deliverables.length) return NextResponse.json({ error: "حدد تسليمًا واحدًا على الأقل" }, { status: 400 });

  const rawFee = body?.feeAmount;
  const feeAmount = rawFee == null || rawFee === "" ? null : Number(rawFee);
  if (feeAmount != null && (!Number.isFinite(feeAmount) || feeAmount < 0 || feeAmount > 9_999_999_999.99)) {
    return NextResponse.json({ error: "قيمة مستحق الشريك غير صالحة" }, { status: 400 });
  }
  const feeCurrency = typeof body?.feeCurrency === "string" ? body.feeCurrency.trim().toUpperCase() : stage.project.currency;
  if (!/^[A-Z]{3}$/.test(feeCurrency)) return NextResponse.json({ error: "عملة المستحق غير صالحة" }, { status: 400 });
  const dueAt = optionalDate(body?.dueAt);
  if (dueAt === undefined) return NextResponse.json({ error: "موعد التسليم الداخلي غير صالح" }, { status: 400 });

  const allowedPaymentStatuses = new Set<StagePartnerPaymentStatus>(["PENDING", "APPROVED", "PAID", "CANCELLED"]);
  const paymentStatus = typeof body?.paymentStatus === "string" && allowedPaymentStatuses.has(body.paymentStatus as StagePartnerPaymentStatus)
    ? body.paymentStatus as StagePartnerPaymentStatus
    : "PENDING";

  const before = (await listStagePartnerAssignments({ projectId: stage.project.id })).find(
    (assignment) => assignment.projectStageId === projectStageId && assignment.partnerId === partnerId,
  );

  const saved = await upsertStagePartnerAssignment({
    projectStageId,
    partnerId,
    tasks,
    deliverables,
    feeAmount,
    feeCurrency,
    dueAt,
    paymentStatus,
  });
  if (!saved) return NextResponse.json({ error: "تعذر حفظ إسناد المرحلة" }, { status: 500 });

  await writeAdminAudit(db, {
    actorId: access.userId,
    action: before ? "STAGE_PARTNER_ASSIGNMENT_UPDATED" : "STAGE_PARTNER_ASSIGNED",
    category: before ? "NORMAL" : "POSITIVE",
    entityType: "PROJECT_STAGE",
    entityId: projectStageId,
    entityLabel: `${stage.project.title} — ${stage.name}`,
    before: before ? {
      partnerId: before.partnerId,
      tasks: before.tasks,
      deliverables: before.deliverables,
      feeAmount: before.feeAmount == null ? null : String(before.feeAmount),
      feeCurrency: before.feeCurrency,
      dueAt: before.dueAt?.toISOString() || null,
    } : undefined,
    after: {
      assignmentId: saved.id,
      partnerId,
      partnerEmail: partner.user.email,
      tasks,
      deliverables,
      feeAmount,
      feeCurrency,
      dueAt: dueAt?.toISOString() || null,
      paymentStatus,
    },
  });

  return NextResponse.json({ assignment: serializeStagePartnerAssignment(saved) }, { status: before ? 200 : 201 });
}
