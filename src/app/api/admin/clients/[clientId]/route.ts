import { db } from "@/lib/db";
import { canAdmin, currentAdminAccess } from "@/lib/admin-permissions";
import { rewardRateForNewProject, syncStageReward } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import type { ClientProjectStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ clientId: string }> };

async function allowedClient(request: NextRequest, clientId: string) {
  if (!(await canAdmin(request, "clients"))) return null;
  return db.user.findFirst({
    where: { id: clientId, OR: [{ role: "CLIENT" }, { clientEnabled: true }] },
    select: { id: true },
  });
}

async function notify(clientId: string, title: string, body: string | null, section: string) {
  return db.clientNotification.create({ data: { clientId, title, body, section } });
}

function normalizeProjectLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseLinks(value: unknown) {
  const rawLinks = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : typeof value === "string"
      ? value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      : [];
  const parsed = rawLinks.map((original) => ({ original, normalized: normalizeProjectLink(original) }));
  return {
    links: [...new Set(parsed.flatMap((item) => item.normalized ? [item.normalized] : []))],
    invalid: parsed.filter((item) => !item.normalized).map((item) => item.original),
  };
}

function parseCurrency(value: unknown) {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

function parseProjectStatus(value: unknown): ClientProjectStatus {
  const allowed = ["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"] as const;
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as ClientProjectStatus)
    : "PLANNING";
}

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function stageNames(value: unknown) {
  return typeof value === "string"
    ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 30)
    : [];
}

function stageAmounts(value: unknown) {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => normalizeDigits(line))
    .map((line) => {
      const match = line.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة))/i);
      return Number((match?.[1] || match?.[2] || "0").replace(/,/g, ""));
    })
    .filter((amount) => Number.isFinite(amount) && amount > 0);
}

function projectStageDrafts(stagesValue: unknown, financialPlanValue: unknown, currency: string) {
  const names = stageNames(stagesValue);
  if (!names.length) return { stages: [] as Array<{ name: string; amount: number; currency: string }>, error: null as string | null };
  const amounts = stageAmounts(financialPlanValue);
  if (amounts.length !== names.length) {
    return {
      stages: [] as Array<{ name: string; amount: number; currency: string }>,
      error: `عدد مبالغ الخطة المالية (${amounts.length}) يجب أن يساوي عدد مراحل المشروع (${names.length}). اكتب مبلغًا واحدًا لكل مرحلة في سطر مستقل.`,
    };
  }
  return {
    stages: names.map((name, index) => ({ name: name.slice(0, 160), amount: amounts[index], currency })),
    error: null as string | null,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  if (!(await allowedClient(request, clientId))) {
    return NextResponse.json({ error: "غير مصرح أو العميل غير موجود" }, { status: 403 });
  }

  const year = new Date().getUTCFullYear();
  const [client, invoiceSequence] = await Promise.all([
    db.user.findUnique({
      where: { id: clientId },
      select: {
        id: true, name: true, email: true, phone: true, company: true, preferredLanguage: true, clientSource: true, internalNotes: true, isActive: true, createdAt: true,
        convertedReferrals: {
          where: { clientProject: null },
          orderBy: { convertedAt: "desc" },
          select: { id: true, name: true, email: true, source: true, convertedAt: true },
        },
        clientProjects: {
          orderBy: { updatedAt: "desc" },
          include: {
            files: { orderBy: { createdAt: "desc" } },
            submissions: {
              where: { status: { not: "UPLOADING" } },
              orderBy: { createdAt: "desc" },
              include: { files: { orderBy: { createdAt: "asc" } } },
            },
            invoices: { orderBy: { createdAt: "desc" } },
          },
        },
        clientMessages: { orderBy: { createdAt: "desc" }, take: 100 },
        clientNotifications: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    }),
    db.invoiceSequence.findUnique({ where: { year }, select: { lastNumber: true } }),
  ]);

  if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  return NextResponse.json({
    client: {
      ...client,
      clientProjects: client.clientProjects.map((project) => ({
        ...project,
        invoices: project.invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount) })),
      })),
    },
    nextInvoiceNumber: `CW-${year}-${String((invoiceSequence?.lastNumber || 0) + 1).padStart(4, "0")}`,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  if (!(await allowedClient(request, clientId))) {
    return NextResponse.json({ error: "غير مصرح أو العميل غير موجود" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "project") {
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const referralId = typeof body?.referralId === "string" ? body.referralId : "";
      if (title.length < 2) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });
      const progress = Number(body?.progress);
      const parsedLinks = parseLinks(body.links);
      if (parsedLinks.invalid.length) {
        return NextResponse.json({ error: `الرابط غير صالح: ${parsedLinks.invalid[0]}. اكتب اسم النطاق مثل example.com أو رابطًا كاملًا.` }, { status: 400 });
      }
      const currency = parseCurrency(body.currency);
      const parsedStages = projectStageDrafts(body.stages, body.financialPlan, currency);
      if (parsedStages.error) return NextResponse.json({ error: parsedStages.error }, { status: 400 });

      const referral = referralId
        ? await db.partnerReferral.findFirst({
          where: { id: referralId, convertedClientId: clientId, status: "CONVERTED", clientProject: null },
          select: { id: true, ambassadorId: true },
        })
        : null;
      if (referralId && !referral) {
        return NextResponse.json({ error: "الإحالة غير متاحة أو مرتبطة بمشروع مسبقًا" }, { status: 409 });
      }
      const admin = await currentAdminAccess(request);
      const project = await db.$transaction(async (tx) => {
        const rewardSnapshot = referral?.ambassadorId
          ? await rewardRateForNewProject(tx, referral.ambassadorId)
          : null;
        const created = await tx.clientProject.create({ data: {
          clientId,
          referralId: referralId || null,
          title,
          description: body.description?.trim() || null,
          agreementDetails: body.agreementDetails?.trim() || null,
          financialPlan: body.financialPlan?.trim() || null,
          currency,
          stages: body.stages?.trim() || null,
          links: parsedLinks.links,
          notes: body.notes?.trim() || null,
          status: parseProjectStatus(body.status),
          progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          ambassadorRewardRate: rewardSnapshot?.rate,
          ambassadorQualifiedAt: rewardSnapshot?.qualifiedAt,
        } });

        const createdStages = [];
        for (const stageInput of parsedStages.stages) {
          const stage = await tx.projectStage.create({
            data: {
              projectId: created.id,
              name: stageInput.name,
              amount: stageInput.amount,
              currency: stageInput.currency,
            },
          });
          createdStages.push(stage.id);
          if (rewardSnapshot) await syncStageReward(tx, stage.id);
        }

        if (parsedStages.stages.length) {
          await writeAdminAudit(tx, {
            actorId: admin?.userId,
            action: "PROJECT_STAGES_CREATED_FROM_PROJECT",
            category: "POSITIVE",
            entityType: "CLIENT_PROJECT",
            entityId: created.id,
            entityLabel: created.title,
            after: { stageCount: parsedStages.stages.length, stageIds: createdStages },
          });
        }

        if (rewardSnapshot) {
          await writeAdminAudit(tx, {
            actorId: admin?.userId,
            action: "AMBASSADOR_REWARD_RATE_LOCKED",
            category: "POSITIVE",
            entityType: "CLIENT_PROJECT",
            entityId: created.id,
            entityLabel: created.title,
            after: {
              ambassadorId: referral?.ambassadorId,
              referralId,
              referralPosition: rewardSnapshot.referralPosition,
              level: rewardSnapshot.levelName,
              rate: rewardSnapshot.rate.toString(),
            },
          });
        }
        return created;
      });
      await notify(clientId, "تمت إضافة مشروع جديد", title, "projects");
      return NextResponse.json({ project }, { status: 201 });
    }

    if (action === "file") {
      const projectId = typeof body?.projectId === "string" ? body.projectId : "";
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      const project = await db.clientProject.findFirst({ where: { id: projectId, clientId }, select: { id: true, title: true, currency: true } });
      if (!project || !name || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "المشروع واسم الملف ورابط صحيح مطلوبة" }, { status: 400 });
      const file = await db.clientFile.create({ data: { projectId, name, url, kind: body.kind?.trim() || null } });
      await notify(clientId, "ملف أو تسليم جديد", `${name} — ${project.title}`, "files");
      return NextResponse.json({ file }, { status: 201 });
    }

    if (action === "invoice") {
      const projectId = typeof body?.projectId === "string" ? body.projectId : "";
      const amount = Number(body?.amount);
      const invoiceType = body?.type === "RETURN" ? "RETURN" : "STANDARD";
      const project = await db.clientProject.findFirst({ where: { id: projectId, clientId }, select: { id: true, title: true, currency: true } });
      if (!project || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });

      const year = new Date().getUTCFullYear();
      const invoice = await db.$transaction(async (transaction) => {
        const sequence = await transaction.invoiceSequence.upsert({
          where: { year },
          create: { year, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });
        const number = `CW-${year}-${String(sequence.lastNumber).padStart(4, "0")}`;

        return transaction.clientInvoice.create({
          data: {
            projectId,
            number,
            type: invoiceType,
            amount,
            currency: parseCurrency(body.currency || project.currency),
            status: body.status || "DUE",
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
          },
        });
      });
      await notify(clientId, invoice.type === "RETURN" ? "صدر مرتجع جديد" : "صدرت فاتورة جديدة", `${invoice.number} — ${amount} ${invoice.currency}`, "invoices");
      return NextResponse.json({ invoice: { ...invoice, amount: Number(invoice.amount) } }, { status: 201 });
    }

    if (action === "payment") {
      const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
      const paidAt = body?.paidAt ? new Date(body.paidAt) : new Date();
      if (Number.isNaN(paidAt.getTime())) return NextResponse.json({ error: "تاريخ الدفع غير صالح" }, { status: 400 });

      const invoice = await db.clientInvoice.findFirst({
        where: { id: invoiceId, project: { clientId } },
        select: { id: true, projectId: true, number: true, amount: true, currency: true, createdAt: true },
      });
      if (!invoice) return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 400 });

      const admin = await currentAdminAccess(request);
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.clientInvoice.update({
          where: { id: invoice.id },
          data: { status: "PAID", paidAt },
        });

        const linkedStage = await tx.projectStage.findFirst({
          where: {
            projectId: invoice.projectId,
            amount: invoice.amount,
            currency: invoice.currency,
            paymentStatus: "PENDING",
            status: { not: "CANCELLED" },
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, paymentStatus: true, paidAt: true },
        });

        let rewardStatus: string | null = null;
        if (linkedStage) {
          await tx.projectStage.update({
            where: { id: linkedStage.id },
            data: { paymentStatus: "PAID", paidAt: linkedStage.paidAt || paidAt },
          });
          const reward = await syncStageReward(tx, linkedStage.id);
          rewardStatus = reward?.status || null;
        }

        await tx.clientNotification.create({
          data: {
            clientId,
            title: "تم تسجيل دفعة",
            body: `${invoice.number} — ${Number(invoice.amount)} ${invoice.currency}`,
            section: "payments",
          },
        });

        await writeAdminAudit(tx, {
          actorId: admin?.userId,
          action: "CLIENT_INVOICE_PAYMENT_RECORDED",
          category: "POSITIVE",
          entityType: "CLIENT_INVOICE",
          entityId: invoice.id,
          entityLabel: invoice.number,
          after: {
            amount: invoice.amount.toString(),
            currency: invoice.currency,
            paidAt: paidAt.toISOString(),
            linkedStageId: linkedStage?.id || null,
            linkedStagePaymentStatus: linkedStage ? "PAID" : null,
            rewardStatus,
          },
        });

        return { updatedInvoice, linkedStageId: linkedStage?.id || null, rewardStatus };
      });

      return NextResponse.json({
        invoice: { ...result.updatedInvoice, amount: Number(result.updatedInvoice.amount) },
        linkedStageId: result.linkedStageId,
        rewardStatus: result.rewardStatus,
      });
    }

    if (action === "message") {
      const messageBody = typeof body?.body === "string" ? body.body.trim() : "";
      const projectId = typeof body?.projectId === "string" && body.projectId ? body.projectId : null;
      if (messageBody.length < 2 || messageBody.length > 5000) return NextResponse.json({ error: "نص الرسالة غير صالح" }, { status: 400 });
      if (projectId && !(await db.clientProject.findFirst({ where: { id: projectId, clientId }, select: { id: true } }))) {
        return NextResponse.json({ error: "المشروع المحدد غير متاح" }, { status: 400 });
      }
      const message = await db.clientMessage.create({
        data: { clientId, projectId, subject: body.subject?.trim() || null, body: messageBody, fromAdmin: true },
      });
      await notify(clientId, body.subject?.trim() || "رسالة جديدة من فريق CyberWeel", messageBody.slice(0, 180), "messages");
      return NextResponse.json({ message }, { status: 201 });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ العملية، تحقق من البيانات وعدم تكرار الرقم" }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  if (!(await allowedClient(request, clientId))) {
    return NextResponse.json({ error: "غير مصرح أو العميل غير موجود" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "project") {
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const project = await db.clientProject.findFirst({ where: { id: projectId, clientId }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    const progress = Number(body.progress);
    const parsedLinks = body.links !== undefined ? parseLinks(body.links) : null;
    if (parsedLinks?.invalid.length) {
      return NextResponse.json({ error: `الرابط غير صالح: ${parsedLinks.invalid[0]}. اكتب اسم النطاق مثل example.com أو رابطًا كاملًا.` }, { status: 400 });
    }
    const admin = await currentAdminAccess(request);
    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.clientProject.update({ where: { id: project.id }, data: {
        ...(body.title?.trim() ? { title: body.title.trim() } : {}),
        ...(typeof body.description === "string" ? { description: body.description.trim() || null } : {}),
        ...(typeof body.agreementDetails === "string" ? { agreementDetails: body.agreementDetails.trim() || null } : {}),
        ...(typeof body.financialPlan === "string" ? { financialPlan: body.financialPlan.trim() || null } : {}),
        ...(body.currency !== undefined ? { currency: parseCurrency(body.currency) } : {}),
        ...(typeof body.stages === "string" ? { stages: body.stages.trim() || null } : {}),
        ...(parsedLinks ? { links: parsedLinks.links } : {}),
        ...(typeof body.notes === "string" ? { notes: body.notes.trim() || null } : {}),
        ...(body.status ? { status: parseProjectStatus(body.status) } : {}),
        ...(Number.isFinite(progress) ? { progress: Math.max(0, Math.min(100, progress)) } : {}),
        ...(body.dueAt !== undefined ? { dueAt: body.dueAt ? new Date(body.dueAt) : null } : {}),
      } });
      if (saved.status === "CANCELLED") {
        const futureStages = await tx.projectStage.findMany({ where: { projectId: saved.id, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } }, select: { id: true } });
        for (const stage of futureStages) {
          await tx.projectStage.update({ where: { id: stage.id }, data: { status: "CANCELLED", paymentStatus: "CANCELLED" } });
          await syncStageReward(tx, stage.id);
        }
        await writeAdminAudit(tx, { actorId: admin?.userId, action: "PROJECT_CANCELLED", category: "SENSITIVE", entityType: "CLIENT_PROJECT", entityId: saved.id, entityLabel: saved.title, after: { cancelledFutureStages: futureStages.length } });
      }
      return saved;
    });
    await notify(clientId, "تم تحديث المشروع", `${updated.title} — الإنجاز ${updated.progress}%`, "projects");
    return NextResponse.json({ project: updated });
  }

  if (action === "submission") {
    const submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";
    const allowedStatuses = ["RECEIVED", "REVIEWED", "APPROVED", "NEEDS_MORE_INFO", "ARCHIVED"];
    const submissionStatus = typeof body?.status === "string" ? body.status : "";
    if (!allowedStatuses.includes(submissionStatus)) return NextResponse.json({ error: "حالة المراجعة غير صالحة" }, { status: 400 });
    const submission = await db.clientSubmission.findFirst({
      where: { id: submissionId, project: { clientId }, status: { not: "UPLOADING" } },
      include: { project: { select: { title: true } } },
    });
    if (!submission) return NextResponse.json({ error: "الإرسال غير موجود" }, { status: 404 });
    const updated = await db.clientSubmission.update({ where: { id: submission.id }, data: { status: submissionStatus } });
    if (submissionStatus === "APPROVED" || submissionStatus === "NEEDS_MORE_INFO") {
      await notify(
        clientId,
        submissionStatus === "APPROVED" ? "تم اعتماد المواد المرسلة" : "نحتاج استكمال مواد المشروع",
        submission.project.title,
        "files",
      );
    }
    return NextResponse.json({ submission: updated });
  }

  return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
}
