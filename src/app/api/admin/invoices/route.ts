import { NextRequest, NextResponse } from "next/server";
import type { ClientInvoiceStatus } from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { writeAdminAudit } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { clientAccessWhere } from "@/lib/user-identity";
import { syncStageReward } from "@/lib/ambassador-rewards";

const invoiceStatuses = new Set<ClientInvoiceStatus>([
  "DRAFT",
  "DUE",
  "OVERDUE",
  "CANCELLED",
]);

async function requireInvoicesAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("invoices"))) return null;
  return access;
}

function parseCurrency(value: unknown) {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: NextRequest) {
  if (!(await requireInvoicesAdmin(request))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة الفواتير" }, { status: 403 });
  }

  const year = new Date().getUTCFullYear();
  const [clients, invoices, sequence] = await Promise.all([
    db.user.findMany({
      where: clientAccessWhere(),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        clientProjects: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            agreementDetails: true,
            financialPlan: true,
            currency: true,
            stages: true,
            status: true,
            progress: true,
            dueAt: true,
          },
        },
      },
    }),
    db.clientInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    db.invoiceSequence.findUnique({ where: { year }, select: { lastNumber: true } }),
  ]);

  return NextResponse.json({
    clients,
    invoices: invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount) })),
    nextInvoiceNumber: `CW-${year}-${String((sequence?.lastNumber || 0) + 1).padStart(4, "0")}`,
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireInvoicesAdmin(request);
  if (!access) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة الفواتير" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "invoice") {
      const projectId = typeof body?.projectId === "string" ? body.projectId : "";
      const amount = Number(body?.amount);
      const type = body?.type === "RETURN" ? "RETURN" : "STANDARD";
      const requestedStatus = typeof body?.status === "string" ? body.status : "DUE";
      const status = invoiceStatuses.has(requestedStatus as ClientInvoiceStatus)
        ? (requestedStatus as ClientInvoiceStatus)
        : "DUE";
      const dueAt = body?.dueAt ? new Date(body.dueAt) : null;

      const project = await db.clientProject.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          currency: true,
          clientId: true,
          projectStages: { select: { id: true }, take: 1 },
        },
      });
      if (
        !project ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 9_999_999_999.99 ||
        (dueAt && Number.isNaN(dueAt.getTime()))
      ) {
        return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
      }

      if (type === "STANDARD" && project.projectStages.length) {
        return NextResponse.json({ error: "فاتورة المشروع المرحلية تُصدر من «خطة التنفيذ» عند بدء المرحلة، حتى تبقى الفاتورة مرتبطة بالمرحلة الصحيحة." }, { status: 409 });
      }

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
            projectId: project.id,
            number,
            type,
            amount,
            currency: parseCurrency(body?.currency || project.currency),
            status,
            dueAt,
          },
        });
      });

      await db.clientNotification.create({
        data: {
          clientId: project.clientId,
          title: type === "RETURN" ? "صدر مرتجع جديد" : "صدرت فاتورة جديدة",
          body: `${invoice.number} — ${amount} ${invoice.currency}`,
          section: "invoices",
        },
      });

      return NextResponse.json(
        { invoice: { ...invoice, amount: Number(invoice.amount) } },
        { status: 201 },
      );
    }

    if (action === "payment") {
      const invoiceId = safeText(body?.invoiceId, 160);
      const paymentMethod = safeText(body?.paymentMethod, 120);
      const paymentReference = safeText(body?.paymentReference, 180);
      const paidAt = body?.paidAt ? new Date(String(body.paidAt)) : null;

      if (!invoiceId || !paymentMethod || !paymentReference || !paidAt || Number.isNaN(paidAt.getTime())) {
        return NextResponse.json({ error: "وسيلة الدفع ومرجع العملية وتاريخ الدفع مطلوبة" }, { status: 400 });
      }
      if (paidAt.getTime() > Date.now() + 5 * 60 * 1000) {
        return NextResponse.json({ error: "تاريخ الدفع لا يمكن أن يكون في المستقبل" }, { status: 400 });
      }

      const invoice = await db.clientInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          number: true,
          type: true,
          status: true,
          paidAt: true,
          amount: true,
          currency: true,
          projectId: true,
          project: { select: { clientId: true } },
        },
      });
      if (!invoice) {
        return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
      }
      if (invoice.status === "PAID") {
        return NextResponse.json({ error: "الفاتورة مدفوعة مسبقًا ولا يمكن تسجيل دفعة ثانية" }, { status: 409 });
      }
      if (invoice.status === "CANCELLED") {
        return NextResponse.json({ error: "لا يمكن تسجيل دفع لفاتورة ملغاة" }, { status: 409 });
      }

      const result = await db.$transaction(async (tx) => {
        const claimed = await tx.clientInvoice.updateMany({
          where: {
            id: invoice.id,
            status: { in: ["DRAFT", "DUE", "OVERDUE"] },
          },
          data: { status: "PAID", paidAt },
        });
        if (claimed.count !== 1) throw new Error("INVOICE_ALREADY_PAID");

        const updated = await tx.clientInvoice.findUnique({ where: { id: invoice.id } });
        if (!updated) throw new Error("INVOICE_NOT_FOUND");

        let stageId: string | null = null;
        if (invoice.type === "STANDARD") {
          const [standardInvoices, projectStages] = await Promise.all([
            tx.clientInvoice.findMany({
              where: { projectId: invoice.projectId, type: "STANDARD" },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              select: { id: true },
            }),
            tx.projectStage.findMany({
              where: { projectId: invoice.projectId },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              select: { id: true },
            }),
          ]);
          const invoiceIndex = standardInvoices.findIndex((item) => item.id === invoice.id);
          const stage = invoiceIndex >= 0 ? projectStages[invoiceIndex] : null;
          if (stage) {
            stageId = stage.id;
            await tx.projectStage.update({
              where: { id: stage.id },
              data: { paymentStatus: "PAID", paidAt },
            });
            await syncStageReward(tx, stage.id);
          }
        }

        await tx.clientNotification.create({
          data: {
            clientId: invoice.project.clientId,
            title: "تم تسجيل دفعة",
            body: `${invoice.number} — ${Number(invoice.amount)} ${invoice.currency}`,
            section: "invoices",
          },
        });

        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "CLIENT_INVOICE_PAID",
          category: "SENSITIVE",
          entityType: "CLIENT_INVOICE",
          entityId: invoice.id,
          entityLabel: invoice.number,
          before: {
            status: invoice.status,
            paidAt: invoice.paidAt?.toISOString() || null,
          },
          after: {
            status: "PAID",
            paidAt: paidAt.toISOString(),
            paymentMethod,
            paymentReference,
            amount: invoice.amount.toString(),
            currency: invoice.currency,
            stageId,
          },
        });

        return { updated, stageId };
      });

      return NextResponse.json({
        invoice: { ...result.updated, amount: Number(result.updated.amount) },
        stageSynced: Boolean(result.stageId),
        stageId: result.stageId,
      });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVOICE_ALREADY_PAID") {
      return NextResponse.json({ error: "الفاتورة مدفوعة مسبقًا ولا يمكن تسجيل دفعة ثانية" }, { status: 409 });
    }
    console.error("[admin-invoices] Failed to save invoice operation", error);
    return NextResponse.json({ error: "تعذر حفظ عملية الفوترة" }, { status: 409 });
  }
}
