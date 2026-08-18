import { NextRequest, NextResponse } from "next/server";
import type { ProjectStagePaymentStatus, ProjectStageStatus } from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { syncStageReward } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const stageStatuses = new Set<ProjectStageStatus>(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const paymentStatuses = new Set<ProjectStagePaymentStatus>(["PENDING", "PAID", "CANCELLED"]);

async function requireProjectsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects"))) return null;
  return access;
}

function dateValue(value: unknown) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function stagePayload(stage: {
  id: string;
  projectId: string;
  name: string;
  amount: { toString(): string };
  currency: string;
  status: ProjectStageStatus;
  paymentStatus: ProjectStagePaymentStatus;
  startsAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return { ...stage, amount: stage.amount.toString() };
}

export async function GET(request: NextRequest) {
  if (!(await requireProjectsAdmin(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
  const projects = await db.clientProject.findMany({
    where: projectId ? { id: projectId } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      currency: true,
      status: true,
      client: { select: { id: true, name: true, email: true } },
      referral: { select: { ambassadorId: true } },
      ambassadorRewardRate: true,
      projectStages: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({
    projects: projects.map((project) => ({
      ...project,
      ambassadorRewardRate: project.ambassadorRewardRate?.toString() || null,
      projectStages: project.projectStages.map(stagePayload),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireProjectsAdmin(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "create") {
      const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 160) : "";
      const amount = Number(body?.amount);
      const dueAt = dateValue(body?.dueAt);
      if (!projectId || !name || !Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99 || dueAt === undefined) {
        return NextResponse.json({ error: "اسم المرحلة والمبلغ الصحيح مطلوبان" }, { status: 400 });
      }

      const project = await db.clientProject.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, currency: true },
      });
      if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

      const created = await db.$transaction(async (tx) => {
        const stage = await tx.projectStage.create({
          data: {
            projectId,
            name,
            amount,
            currency: project.currency,
            startsAt: dueAt,
          },
        });
        const reward = await syncStageReward(tx, stage.id);
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "PROJECT_EXECUTION_STAGE_CREATED",
          category: "NORMAL",
          entityType: "PROJECT_STAGE",
          entityId: stage.id,
          entityLabel: `${project.title} — ${name}`,
          after: { amount: String(amount), currency: project.currency, dueAt: dueAt?.toISOString() || null, rewardId: reward?.id || null },
        });
        return stage;
      });

      return NextResponse.json({ stage: stagePayload(created) }, { status: 201 });
    }

    if (action === "update") {
      const stageId = typeof body?.stageId === "string" ? body.stageId.trim() : "";
      const existing = await db.projectStage.findUnique({
        where: { id: stageId },
        include: { project: { select: { title: true } } },
      });
      if (!existing) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });

      const status = stageStatuses.has(body?.status as ProjectStageStatus) ? body.status as ProjectStageStatus : existing.status;
      const paymentStatus = paymentStatuses.has(body?.paymentStatus as ProjectStagePaymentStatus) ? body.paymentStatus as ProjectStagePaymentStatus : existing.paymentStatus;
      const amount = body?.amount === undefined ? Number(existing.amount) : Number(body.amount);
      const dueAt = body?.dueAt === undefined ? existing.startsAt : dateValue(body.dueAt);
      const approved = body?.approved === true;

      if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99 || dueAt === undefined) {
        return NextResponse.json({ error: "بيانات المرحلة غير صالحة" }, { status: 400 });
      }
      if (approved && status !== "COMPLETED") {
        return NextResponse.json({ error: "لا يمكن اعتماد مرحلة غير مكتملة" }, { status: 409 });
      }

      const updated = await db.$transaction(async (tx) => {
        const stage = await tx.projectStage.update({
          where: { id: stageId },
          data: {
            name: typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : existing.name,
            amount,
            status,
            paymentStatus,
            startsAt: dueAt,
            completedAt: status === "COMPLETED" ? existing.completedAt || new Date() : null,
            paidAt: paymentStatus === "PAID" ? existing.paidAt || new Date() : null,
            approvedAt: approved ? existing.approvedAt || new Date() : null,
            approvedById: approved ? access.userId : null,
          },
        });
        const reward = await syncStageReward(tx, stage.id);
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "PROJECT_EXECUTION_STAGE_UPDATED",
          category: status === "CANCELLED" || paymentStatus === "CANCELLED" ? "SENSITIVE" : status === "COMPLETED" && approved ? "POSITIVE" : "NORMAL",
          entityType: "PROJECT_STAGE",
          entityId: stage.id,
          entityLabel: `${existing.project.title} — ${stage.name}`,
          before: { status: existing.status, paymentStatus: existing.paymentStatus, amount: existing.amount.toString() },
          after: { status, paymentStatus, amount: String(amount), approved, rewardStatus: reward?.status || null },
        });
        return stage;
      });

      return NextResponse.json({ stage: stagePayload(updated) });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("[project-stages] operation failed", error);
    return NextResponse.json({ error: "تعذر حفظ المرحلة" }, { status: 500 });
  }
}
