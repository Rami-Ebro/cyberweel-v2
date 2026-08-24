import { NextRequest, NextResponse } from "next/server";
import type { ClientProjectStatus } from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { writeAdminAudit } from "@/lib/admin-audit";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const editableProjectStatuses = new Set<ClientProjectStatus>([
  "PLANNING",
  "IN_PROGRESS",
  "REVIEW",
  "ON_HOLD",
  "CANCELLED",
]);

async function requireProjectsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects"))) return null;
  return access;
}

function executionProgress(stages: Array<{ status: string }>) {
  if (!stages.length) return 0;
  const completed = stages.filter((stage) => stage.status === "COMPLETED").length;
  return Math.min(100, Math.round((completed / stages.length) * 100));
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireProjectsAdmin(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const action = body?.action === "close" ? "close" : "status";
  if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });

  const existing = await db.clientProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      title: true,
      status: true,
      progress: true,
      projectStages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, name: true, status: true, paymentStatus: true, approvedAt: true },
      },
      invoices: {
        where: { type: "STANDARD" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, number: true, status: true },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  if (action === "close") {
    const blockers: string[] = [];
    if (!existing.projectStages.length) blockers.push("لا يمكن إغلاق مشروع بلا مراحل تنفيذ.");
    if (existing.projectStages.some((stage) => stage.status === "CANCELLED")) blockers.push("توجد مرحلة ملغاة ويجب معالجة وضعها قبل الإغلاق.");
    if (existing.projectStages.some((stage) => stage.status !== "COMPLETED")) blockers.push("يجب إكمال جميع مراحل المشروع قبل الإغلاق.");
    if (existing.projectStages.some((stage) => stage.paymentStatus !== "PAID")) blockers.push("يجب تسجيل دفع جميع فواتير المراحل قبل الإغلاق.");
    if (existing.projectStages.some((stage) => !stage.approvedAt)) blockers.push("يجب اعتماد جميع المراحل بعد التسليم قبل الإغلاق.");
    if (existing.invoices.length < existing.projectStages.length) blockers.push("لم تصدر فاتورة لكل مرحلة من مراحل المشروع.");
    if (existing.invoices.some((invoice) => invoice.status !== "PAID")) blockers.push("توجد فاتورة مشروع غير مدفوعة.");

    if (blockers.length) {
      return NextResponse.json({ ready: false, error: blockers[0], blockers }, { status: 409 });
    }

    const project = await db.$transaction(async (tx) => {
      const updated = await tx.clientProject.update({
        where: { id: projectId },
        data: { status: "COMPLETED", progress: 100 },
        select: { id: true, status: true, progress: true },
      });
      await tx.partnerProject.updateMany({
        where: { clientProjectId: projectId },
        data: { status: "COMPLETED", progress: 100 },
      });
      await tx.clientNotification.create({
        data: {
          clientId: existing.clientId,
          title: "تم إغلاق المشروع بنجاح",
          body: `${existing.title} — اكتملت جميع المراحل والتسويات المطلوبة للمشروع.`,
          section: "projects",
        },
      });
      await writeAdminAudit(tx, {
        actorId: access.userId,
        action: "PROJECT_CLOSED",
        category: "POSITIVE",
        entityType: "CLIENT_PROJECT",
        entityId: projectId,
        entityLabel: existing.title,
        before: { status: existing.status, progress: existing.progress },
        after: { status: "COMPLETED", progress: 100, stageCount: existing.projectStages.length, invoiceCount: existing.invoices.length },
      });
      return updated;
    });

    return NextResponse.json({ ready: true, project });
  }

  const status = editableProjectStatuses.has(body?.status as ClientProjectStatus)
    ? body.status as ClientProjectStatus
    : null;
  if (!status) {
    if (body?.status === "COMPLETED") {
      return NextResponse.json({ error: "لا يتم إكمال المشروع يدويًا. استخدم «إغلاق المشروع» بعد تحقق شروط الإغلاق." }, { status: 409 });
    }
    return NextResponse.json({ error: "حالة المشروع غير صالحة" }, { status: 400 });
  }

  const progress = executionProgress(existing.projectStages);
  const effectiveStatus: ClientProjectStatus = status === "PLANNING" && progress > 0 ? "IN_PROGRESS" : status;

  const updated = await db.$transaction(async (tx) => {
    const project = await tx.clientProject.update({
      where: { id: projectId },
      data: { status: effectiveStatus, progress },
      select: { id: true, status: true, progress: true },
    });
    await tx.partnerProject.updateMany({
      where: { clientProjectId: projectId },
      data: {
        status: effectiveStatus === "PLANNING" ? "ASSIGNED" : effectiveStatus,
        progress,
      },
    });
    await writeAdminAudit(tx, {
      actorId: access.userId,
      action: "PROJECT_OPERATIONAL_STATUS_UPDATED",
      category: effectiveStatus === "CANCELLED" ? "SENSITIVE" : "NORMAL",
      entityType: "CLIENT_PROJECT",
      entityId: projectId,
      entityLabel: existing.title,
      before: { status: existing.status, progress: existing.progress },
      after: { status: effectiveStatus, progress, progressSource: "PROJECT_STAGES" },
    });
    return project;
  });

  return NextResponse.json({ project: updated });
}
