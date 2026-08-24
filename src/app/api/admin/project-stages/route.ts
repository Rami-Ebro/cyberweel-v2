import { NextRequest, NextResponse } from "next/server";
import type { ProjectStagePaymentStatus, ProjectStageStatus } from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { syncStageReward } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const stageStatuses = new Set<ProjectStageStatus>(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

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

function stageNames(value: string | null) {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function amountFromFinancialLine(value: string) {
  const line = normalizeDigits(value).trim();
  const explicit = line.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة))/i);
  const bareLeading = line.match(/^([0-9][0-9.,]*)(?:\s|$)/);
  const raw = explicit?.[1] || explicit?.[2] || bareLeading?.[1] || "0";
  const amount = Number(raw.replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function stageAmounts(value: string | null) {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(amountFromFinancialLine)
    .filter((amount): amount is number => amount !== null);
}

function projectStageDrafts(stagesValue: string | null, financialPlanValue: string | null, currency: string) {
  const names = stageNames(stagesValue);
  if (!names.length) {
    return {
      stages: [] as Array<{ name: string; amount: number; currency: string }>,
      error: "أدخل مراحل المشروع أولًا، مرحلة واحدة في كل سطر.",
    };
  }

  const amounts = stageAmounts(financialPlanValue);
  if (amounts.length !== names.length) {
    return {
      stages: [] as Array<{ name: string; amount: number; currency: string }>,
      error: `عدد مبالغ الخطة المالية (${amounts.length}) يجب أن يساوي عدد مراحل المشروع (${names.length}). اكتب مبلغًا واحدًا لكل مرحلة في سطر مستقل، مثل 500 أو 500 USD.`,
    };
  }

  return {
    stages: names.map((name, index) => ({ name: name.slice(0, 160), amount: amounts[index], currency })),
    error: null as string | null,
  };
}

function firstStageSuggestion(financialPlan: string | null, stagesValue?: string | null) {
  const drafts = projectStageDrafts(stagesValue || null, financialPlan, "USD");
  if (!drafts.error && drafts.stages.length) return { name: drafts.stages[0].name, amount: drafts.stages[0].amount };

  const line = financialPlan?.split(/\r?\n/).map((item) => item.trim()).find(Boolean) || "";
  if (!line) return null;
  const normalized = normalizeDigits(line);
  const amount = amountFromFinancialLine(normalized);
  const name = normalized
    .replace(/^المرحلة\s+(?:الأولى|الاولى|الأول|الاول|1)\s*[:：\-–—]?\s*/i, "")
    .replace(/^(?:\$\s*)?[\d.,]+(?:\s*(?:USD|\$|دولار))?\s*/i, "")
    .replace(/[.،,:：\-–—\s]+$/g, "")
    .trim();
  if (!name || amount === null) return null;
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

function invoicePayload(invoice: {
  id: string;
  number: string;
  amount: { toString(): string };
  currency: string;
  status: string;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}) {
  return { ...invoice, amount: invoice.amount.toString() };
}

function closeBlockers(
  stages: Array<{ status: ProjectStageStatus; paymentStatus: ProjectStagePaymentStatus; approvedAt: Date | null }>,
  invoices: Array<{ status: string }>,
) {
  const blockers: string[] = [];
  if (!stages.length) blockers.push("لا توجد مراحل تنفيذ للمشروع.");
  if (stages.some((stage) => stage.status === "CANCELLED")) blockers.push("توجد مرحلة ملغاة تحتاج معالجة قبل الإغلاق.");
  if (stages.some((stage) => stage.status !== "COMPLETED")) blockers.push("لم تكتمل جميع مراحل المشروع بعد.");
  if (stages.some((stage) => stage.paymentStatus !== "PAID")) blockers.push("توجد مرحلة لم تُدفع فاتورتها بعد.");
  if (stages.some((stage) => !stage.approvedAt)) blockers.push("توجد مرحلة لم تعتمدها الإدارة بعد التسليم.");
  if (invoices.length < stages.length) blockers.push("لم تصدر فاتورة لكل مرحلة من مراحل المشروع.");
  if (invoices.some((invoice) => invoice.status !== "PAID")) blockers.push("توجد فاتورة مشروع غير مدفوعة.");
  return blockers;
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
      progress: true,
      financialPlan: true,
      stages: true,
      client: { select: { id: true, name: true, email: true } },
      referral: { select: { ambassadorId: true } },
      ambassadorRewardRate: true,
      projectStages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      invoices: {
        where: { type: "STANDARD" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, number: true, amount: true, currency: true, status: true, dueAt: true, paidAt: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({
    projects: projects.map((project) => {
      const blockers = closeBlockers(project.projectStages, project.invoices);
      return {
        id: project.id,
        title: project.title,
        currency: project.currency,
        status: project.status,
        progress: project.progress,
        financialPlan: project.financialPlan,
        stages: project.stages,
        client: project.client,
        referral: project.referral,
        ambassadorRewardRate: project.ambassadorRewardRate?.toString() || null,
        projectStages: project.projectStages.map((stage, index) => ({
          ...stagePayload(stage),
          invoice: project.invoices[index] ? invoicePayload(project.invoices[index]) : null,
        })),
        closeReadiness: { ready: blockers.length === 0, blockers },
        firstStageSuggestion: project.projectStages.length ? null : firstStageSuggestion(project.financialPlan, project.stages),
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireProjectsAdmin(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "sync_from_project") {
      const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
      if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });

      const project = await db.clientProject.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          currency: true,
          stages: true,
          financialPlan: true,
          projectStages: { orderBy: { createdAt: "asc" }, select: { id: true }, take: 1 },
        },
      });
      if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
      if (project.projectStages.length) return NextResponse.json({ ok: true, created: 0, skipped: true });

      const parsed = projectStageDrafts(project.stages, project.financialPlan, project.currency);
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

      const createdStages = await db.$transaction(async (tx) => {
        const existing = await tx.projectStage.findFirst({ where: { projectId }, select: { id: true } });
        if (existing) return [];

        const created: Array<ReturnType<typeof stagePayload>> = [];
        const stageIds: string[] = [];
        for (const input of parsed.stages) {
          const stage = await tx.projectStage.create({
            data: { projectId, name: input.name, amount: input.amount, currency: input.currency },
          });
          stageIds.push(stage.id);
          await syncStageReward(tx, stage.id);
          created.push(stagePayload(stage));
        }

        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "PROJECT_STAGES_SYNCED_FROM_PROJECT",
          category: "POSITIVE",
          entityType: "CLIENT_PROJECT",
          entityId: project.id,
          entityLabel: project.title,
          after: { stageCount: stageIds.length, stageIds },
        });
        return created;
      });

      return NextResponse.json({ ok: true, created: createdStages.length, stages: createdStages });
    }

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
          data: { projectId, name, amount, currency: project.currency, startsAt: dueAt },
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
            data: { projectId: project.id, number: invoiceNumber, type: "STANDARD", amount, currency: project.currency, status: "DUE", dueAt },
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
          after: { amount: String(amount), currency: project.currency, dueAt: dueAt?.toISOString() || null, rewardId: reward?.id || null, invoiceNumber },
        });
        return { stage, invoiceNumber };
      });

      return NextResponse.json({ stage: stagePayload(created.stage), invoiceNumber: created.invoiceNumber }, { status: 201 });
    }

    if (action === "start_stage") {
      const stageId = typeof body?.stageId === "string" ? body.stageId.trim() : "";
      const existing = await db.projectStage.findUnique({
        where: { id: stageId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              currency: true,
              clientId: true,
              status: true,
              projectStages: {
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                select: { id: true, status: true, paymentStatus: true, approvedAt: true },
              },
              invoices: {
                where: { type: "STANDARD" },
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                select: { id: true, number: true, status: true },
              },
            },
          },
        },
      });
      if (!existing) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
      if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
        return NextResponse.json({ error: "لا يمكن بدء مرحلة مكتملة أو ملغاة" }, { status: 409 });
      }

      const stageIndex = existing.project.projectStages.findIndex((stage) => stage.id === existing.id);
      if (stageIndex < 0) return NextResponse.json({ error: "تعذر تحديد ترتيب المرحلة" }, { status: 409 });
      const previousStages = existing.project.projectStages.slice(0, stageIndex);
      if (previousStages.some((stage) => stage.status !== "COMPLETED" || stage.paymentStatus !== "PAID" || !stage.approvedAt)) {
        return NextResponse.json({ error: "لا يمكن بدء هذه المرحلة قبل إكمال ودفع واعتماد المرحلة السابقة." }, { status: 409 });
      }

      const linkedInvoice = existing.project.invoices[stageIndex] || null;
      if (linkedInvoice?.status === "CANCELLED") {
        return NextResponse.json({ error: "فاتورة هذه المرحلة ملغاة. عالج الفاتورة أولًا قبل متابعة التنفيذ." }, { status: 409 });
      }

      const dueAt = existing.startsAt || new Date();
      const result = await db.$transaction(async (tx) => {
        let invoice = linkedInvoice;
        if (!invoice) {
          const year = new Date().getUTCFullYear();
          const sequence = await tx.invoiceSequence.upsert({
            where: { year },
            create: { year, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          });
          const number = `CW-${year}-${String(sequence.lastNumber).padStart(4, "0")}`;
          invoice = await tx.clientInvoice.create({
            data: {
              projectId: existing.projectId,
              number,
              type: "STANDARD",
              amount: existing.amount,
              currency: existing.currency,
              status: "DUE",
              dueAt,
            },
            select: { id: true, number: true, status: true },
          });
          await tx.clientNotification.create({
            data: {
              clientId: existing.project.clientId,
              title: "بدأت مرحلة جديدة وصدرت فاتورتها",
              body: `${existing.project.title} — ${existing.name} — ${Number(existing.amount)} ${existing.currency} — ${number}`,
              section: "invoices",
            },
          });
        }

        const stage = await tx.projectStage.update({
          where: { id: existing.id },
          data: { status: "IN_PROGRESS", startsAt: dueAt },
        });
        if (existing.project.status === "PLANNING") {
          await tx.clientProject.update({ where: { id: existing.projectId }, data: { status: "IN_PROGRESS" } });
          await tx.partnerProject.updateMany({ where: { clientProjectId: existing.projectId }, data: { status: "IN_PROGRESS" } });
        }
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: linkedInvoice ? "PROJECT_STAGE_STARTED" : "PROJECT_STAGE_STARTED_AND_INVOICED",
          category: "NORMAL",
          entityType: "PROJECT_STAGE",
          entityId: existing.id,
          entityLabel: `${existing.project.title} — ${existing.name}`,
          before: { status: existing.status },
          after: { status: "IN_PROGRESS", invoiceId: invoice.id, invoiceNumber: invoice.number, invoiceStatus: invoice.status },
        });
        return { stage, invoice };
      });

      return NextResponse.json({ stage: stagePayload(result.stage), invoice: result.invoice });
    }

    if (action === "update") {
      const stageId = typeof body?.stageId === "string" ? body.stageId.trim() : "";
      const existing = await db.projectStage.findUnique({
        where: { id: stageId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              projectStages: {
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                select: { id: true },
              },
              invoices: {
                where: { type: "STANDARD" },
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                select: { id: true, status: true },
              },
            },
          },
        },
      });
      if (!existing) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });

      const status = stageStatuses.has(body?.status as ProjectStageStatus) ? body.status as ProjectStageStatus : existing.status;
      const amount = body?.amount === undefined ? Number(existing.amount) : Number(body.amount);
      const dueAt = body?.dueAt === undefined ? existing.startsAt : dateValue(body.dueAt);
      const approved = body?.approved === true && status === "COMPLETED";
      const stageIndex = existing.project.projectStages.findIndex((stage) => stage.id === existing.id);
      const linkedInvoice = stageIndex >= 0 ? existing.project.invoices[stageIndex] || null : null;

      if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99 || dueAt === undefined) {
        return NextResponse.json({ error: "بيانات المرحلة غير صالحة" }, { status: 400 });
      }
      if (approved && status !== "COMPLETED") {
        return NextResponse.json({ error: "لا يمكن اعتماد مرحلة غير مكتملة" }, { status: 409 });
      }
      if (approved && existing.paymentStatus !== "PAID") {
        return NextResponse.json({ error: "لا يمكن اعتماد تسليم المرحلة قبل تسجيل دفع فاتورتها." }, { status: 409 });
      }
      if (linkedInvoice?.status === "PAID" && amount !== Number(existing.amount)) {
        return NextResponse.json({ error: "لا يمكن تغيير مبلغ مرحلة بعد دفع فاتورتها." }, { status: 409 });
      }

      const updated = await db.$transaction(async (tx) => {
        const stage = await tx.projectStage.update({
          where: { id: stageId },
          data: {
            name: typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : existing.name,
            amount,
            status,
            startsAt: dueAt,
            completedAt: status === "COMPLETED" ? existing.completedAt || new Date() : null,
            approvedAt: approved ? existing.approvedAt || new Date() : null,
            approvedById: approved ? access.userId : null,
          },
        });

        let syncedInvoiceId: string | null = null;
        if (linkedInvoice && linkedInvoice.status !== "PAID" && linkedInvoice.status !== "CANCELLED") {
          await tx.clientInvoice.update({ where: { id: linkedInvoice.id }, data: { amount, dueAt } });
          syncedInvoiceId = linkedInvoice.id;
        }

        const allStages = await tx.projectStage.findMany({
          where: { projectId: existing.projectId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { status: true, paymentStatus: true, approvedAt: true },
        });
        const allInvoices = await tx.clientInvoice.findMany({
          where: { projectId: existing.projectId, type: "STANDARD" },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { status: true },
        });
        const completedStages = allStages.filter((item) => item.status === "COMPLETED").length;
        const projectProgress = allStages.length ? Math.min(100, Math.round((completedStages / allStages.length) * 100)) : 0;
        const blockers = closeBlockers(allStages, allInvoices);
        const preserveExceptionalStatus = ["ON_HOLD", "CANCELLED", "COMPLETED"].includes(existing.project.status);
        const projectStatus = preserveExceptionalStatus
          ? existing.project.status
          : blockers.length === 0
            ? "REVIEW"
            : allStages.some((item) => ["IN_PROGRESS", "COMPLETED"].includes(item.status))
              ? "IN_PROGRESS"
              : "PLANNING";

        await tx.clientProject.update({ where: { id: existing.projectId }, data: { progress: projectProgress, status: projectStatus } });
        await tx.partnerProject.updateMany({
          where: { clientProjectId: existing.projectId },
          data: { progress: projectProgress, status: projectStatus === "PLANNING" ? "ASSIGNED" : projectStatus },
        });

        const reward = await syncStageReward(tx, stage.id);
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "PROJECT_EXECUTION_STAGE_UPDATED",
          category: status === "CANCELLED" ? "SENSITIVE" : status === "COMPLETED" && approved ? "POSITIVE" : "NORMAL",
          entityType: "PROJECT_STAGE",
          entityId: stage.id,
          entityLabel: `${existing.project.title} — ${stage.name}`,
          before: { status: existing.status, paymentStatus: existing.paymentStatus, amount: existing.amount.toString(), dueAt: existing.startsAt?.toISOString() || null, projectProgress: existing.project.progress },
          after: { status, paymentStatus: existing.paymentStatus, amount: String(amount), dueAt: dueAt?.toISOString() || null, approved, rewardStatus: reward?.status || null, syncedInvoiceId, projectProgress, projectStatus },
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
