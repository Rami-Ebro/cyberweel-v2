import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { stageExecutionProgressByStageIds } from "@/lib/stage-partner-assignments";
import { NextRequest, NextResponse } from "next/server";

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function plannedAmounts(financialPlan: string | null) {
  return (financialPlan || "")
    .split(/\r?\n/)
    .map((line) => normalizeDigits(line))
    .map((line) => {
      const match = line.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة)|^([0-9][0-9.,]*)(?:\s|$))/i);
      return Number((match?.[1] || match?.[2] || match?.[3] || "0").replace(/,/g, ""));
    })
    .filter((amount) => Number.isFinite(amount) && amount > 0);
}

function plannedStageNames(financialPlan: string | null) {
  return (financialPlan || "")
    .split(/\r?\n/)
    .map((line) => normalizeDigits(line).trim())
    .filter(Boolean)
    .map((line) =>
      line
        .replace(/^\s*المرحلة\s+(?:الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|\d+)\s*[:：.\-–—]?\s*/i, "")
        .replace(/(?:\$\s*[0-9][0-9.,]*|[0-9][0-9.,]*\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة)).*$/i, "")
        .replace(/[\s،,:：.\-–—]+$/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function legacyPlannedTotal(financialPlan: string | null) {
  return plannedAmounts(financialPlan).reduce((sum, amount) => sum + amount, 0);
}

function legacyPlannedStageCount(financialPlan: string | null) {
  return plannedAmounts(financialPlan).length;
}

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
          submissions: {
            where: { status: { not: "UPLOADING" } },
            orderBy: { createdAt: "desc" },
            include: { files: { orderBy: { createdAt: "asc" } } },
          },
          invoices: { orderBy: { createdAt: "desc" } },
          messages: { orderBy: { createdAt: "desc" }, take: 10 },
          projectStages: { orderBy: { createdAt: "asc" } },
        },
      },
      clientMessages: { orderBy: { createdAt: "desc" }, take: 30 },
      clientNotifications: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!client) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 403 });

  const stageIds = client.clientProjects.flatMap((project) => project.projectStages.map((stage) => stage.id));
  const executionProgress = await stageExecutionProgressByStageIds(stageIds);

  const invoices = client.clientProjects.flatMap((project) =>
    project.invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount), projectTitle: project.title })),
  );
  const files = client.clientProjects.flatMap((project) =>
    project.files.filter((file) => file.source !== "CLIENT").map((file) => ({
      ...file,
      url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
      projectTitle: project.title,
    })),
  );
  const unreadMessages = client.clientMessages.filter((message) => message.fromAdmin && !message.readAt).length;
  const notifications = client.clientNotifications;
  const submissions = client.clientProjects.flatMap((project) =>
    project.submissions.map((submission) => ({
      ...submission,
      projectTitle: project.title,
      files: submission.files.map((file) => ({
        ...file,
        url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
      })),
    })),
  );

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
    projects: client.clientProjects.map((project) => {
      const plannedNames = plannedStageNames(project.financialPlan);
      const completedCount = project.projectStages.filter((stage) => stage.status === "COMPLETED").length;
      const nextPlannedStageName = project.projectStages[completedCount]?.name || plannedNames[completedCount] || null;
      const structuredTotal = project.projectStages.reduce((sum, stage) => sum + Number(stage.amount), 0);
      const plannedTotal = structuredTotal > 0 ? structuredTotal : legacyPlannedTotal(project.financialPlan);
      const plannedStageCount = project.projectStages.length || legacyPlannedStageCount(project.financialPlan);

      return {
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
        projectStages: project.projectStages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          amount: Number(stage.amount),
          currency: stage.currency,
          status: stage.status,
          paymentStatus: stage.paymentStatus,
          dueAt: stage.startsAt,
          completedAt: stage.completedAt,
          paidAt: stage.paidAt,
          executionProgress: stage.status === "COMPLETED" ? 100 : executionProgress.get(stage.id) || 0,
          projectProgress: project.progress,
          projectStatus: project.status,
          plannedTotal,
          plannedStageCount,
          nextPlannedStageName,
        })),
        files: project.files.map((file) => ({
          ...file,
          url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
        })),
        submissions: project.submissions.map((submission) => ({
          ...submission,
          files: submission.files.map((file) => ({
            ...file,
            url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
          })),
        })),
        invoices: project.invoices.map((invoice) => ({ ...invoice, amount: Number(invoice.amount) })),
      };
    }),
    files,
    submissions,
    invoices,
    payments: invoices.filter((invoice) => invoice.status === "PAID" || invoice.paidAt),
    messages: client.clientMessages,
    notifications,
  });
}
