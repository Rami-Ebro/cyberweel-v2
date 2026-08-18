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

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function firstStageSuggestion(financialPlan: string | null) {
  const line = financialPlan?.split(/\r?\n/).map((item) => item.trim()).find(Boolean) || "";
  if (!line) return null;
  const normalized = normalizeDigits(line);
  const amountMatch = normalized.match(/(?:\$\s*([\d.,]+)|([\d.,]+)\s*(?:USD|\$|دولار))/i);
  const amount = Number((amountMatch?.[1] || amountMatch?.[2] || "").replace(/,/g, ""));
  const name = normalized
    .replace(/^المرحلة\s+(?:الأولى|الاولى|الأول|الاول|1)\s*[:：\-–—]?\s*/i, "")
    .replace(/(?:\$\s*[\d.,]+|[\d.,]+\s*(?:USD|\$|دولار)).*$/i, "")
    .replace(/[.،,:：\-–—\s]+$/g, "")
    .trim();
  if (!name || !Number.isFinite(amount) || amount <= 0) return null;
  return { name, amount };
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
      financialPlan: true,
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
      firstStageSuggestion: project.projectStages.length ? null : firstStageSuggestion(project.financialPlan),
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
      const sendPaymentRequest = body?.sendPaymentRequest === true;
      if (!projectId || !name || !Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99 || dueAt === undefined) {
        return NextResponse.json({ error: "اسم المرحلة والمبلغ الصحيح مطلوبان" }, { status: 400 });
      }

      const project = await db.clientProject.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, currency: true, clientId: true, projectStages: { select: { id: true }, take: 1 } },
      });
      if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
      if (sendPaymentRequest && project.projectStages.length) {
        return NextResponse.json({ error: "مطالبة المرحلة الأولى أُنشئت مسبقًا" }, { status: 409 });
      }

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
        let invoiceNumber: string | null = null;

        if (sendPaymentRequest) {
          const year = new Date().getUTCFullYear();
          const sequence = await tx.invoiceSequence.upsert({
            where: { year },
            create: { year, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          });
          invoiceNumber = `CW-${year}-${String(sequence.lastNumber).padStart(4, "0")}`;
          await tx.clientInvoice.create({
            data: {
              projectId: project.id,
              number: invoiceNumber,
              type: "STANDARD",
              amount,
              currency: project.currency,
              status: "DUE",
              dueAt,
            },
          });
          await tx.clientNotification.create({
            data: {
              clientId: project.clientId,
              title: "مطالبة دفع للمرحلة الأولى",
              body: `${project.title} — ${name} — ${amount} ${project.currency}${invoiceNumber ? ` — ${invoiceNumber}` : ""}`,
              section: "invoices",
            },
          });
        }

        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: sendPaymentRequest ? "PROJECT_FIRST_STAGE_PAYMENT_REQUESTED" : "PROJECT_EXECUTION_STAGE_CREATED",
          category: "NORMAL",
          entityType: "PROJECT_STAGE",
          entityId: stage.id,
          entityLabel: `${project.title} — ${name}`,
          after: {
            amount: String(amount),
            currency: project.currency,
            dueAt: dueAt?.toISOString() || null,
            rewardId: reward?.id || null,
            invoiceNumber,
          },
        });
        return { stage, invoiceNumber };
      });

      return NextResponse.json({ stage: stagePayload(created.stage), invoiceNumber: created.invoiceNumber }, { status: 201 });
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
