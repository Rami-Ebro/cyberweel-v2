import { NextRequest, NextResponse } from "next/server";
import type { ClientInvoiceStatus } from "@prisma/client";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const invoiceStatuses = new Set<ClientInvoiceStatus>([
  "DRAFT",
  "DUE",
  "OVERDUE",
  "CANCELLED",
]);

function parseCurrency(value: unknown) {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "invoices"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة الفواتير" }, { status: 403 });
  }

  const year = new Date().getUTCFullYear();
  const [clients, invoices, sequence] = await Promise.all([
    db.user.findMany({
      where: { role: "CLIENT" },
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
  if (!(await canAdmin(request, "invoices"))) {
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
        select: { id: true, title: true, currency: true, clientId: true },
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
      const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
      const paidAt = body?.paidAt ? new Date(body.paidAt) : new Date();
      const invoice = await db.clientInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          number: true,
          amount: true,
          currency: true,
          project: { select: { clientId: true } },
        },
      });
      if (!invoice || Number.isNaN(paidAt.getTime())) {
        return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
      }

      const updated = await db.clientInvoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt },
      });
      await db.clientNotification.create({
        data: {
          clientId: invoice.project.clientId,
          title: "تم تسجيل دفعة",
          body: `${invoice.number} — ${Number(invoice.amount)} ${invoice.currency}`,
          section: "payments",
        },
      });

      return NextResponse.json({ invoice: { ...updated, amount: Number(updated.amount) } });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("[admin-invoices] Failed to save invoice operation", error);
    return NextResponse.json({ error: "تعذر حفظ عملية الفوترة" }, { status: 409 });
  }
}
