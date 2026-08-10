import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const client = await db.user.findFirst({
    where: {
      id: session.userId,
      isActive: true,
      OR: [{ role: "CLIENT" }, { clientEnabled: true }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      clientProjects: {
        orderBy: { updatedAt: "desc" },
        include: {
          files: { orderBy: { createdAt: "desc" } },
          invoices: { orderBy: { createdAt: "desc" } },
          messages: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
      clientMessages: { orderBy: { createdAt: "desc" }, take: 30 },
      clientNotifications: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!client) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 403 });

  const invoices = client.clientProjects.flatMap((project) =>
    project.invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount), projectTitle: project.title })),
  );
  const files = client.clientProjects.flatMap((project) =>
    project.files.map((file) => ({
      ...file,
      url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
      projectTitle: project.title,
    })),
  );
  const unreadMessages = client.clientMessages.filter((message) => message.fromAdmin && !message.readAt).length;
  const notifications = client.clientNotifications;

  return NextResponse.json({
    client: { id: client.id, name: client.name, email: client.email, createdAt: client.createdAt },
    stats: {
      projects: client.clientProjects.length,
      activeProjects: client.clientProjects.filter((project) => !["COMPLETED", "ON_HOLD"].includes(project.status)).length,
      files: files.length,
      dueInvoices: invoices.filter((invoice) => ["DUE", "OVERDUE"].includes(invoice.status)).length,
      unreadMessages,
      unreadNotifications: notifications.filter((notification) => !notification.readAt).length,
    },
    projects: client.clientProjects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      agreementDetails: project.agreementDetails,
      financialPlan: project.financialPlan,
      currency: project.currency,
      stages: project.stages,
      links: project.links,
      status: project.status,
      progress: project.progress,
      startsAt: project.startsAt,
      dueAt: project.dueAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      files: project.files.map((file) => ({
        ...file,
        url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
      })),
      invoices: project.invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount) })),
    })),
    files,
    invoices,
    payments: invoices.filter((invoice) => invoice.status === "PAID" || invoice.paidAt),
    messages: client.clientMessages,
    notifications,
  });
}
