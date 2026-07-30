import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const PROJECT_STATUSES = ["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"] as const;

async function currentPartner(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      partner: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (
    !user ||
    !user.isActive ||
    user.role !== "PARTNER" ||
    !user.partner ||
    user.partner.status !== "ACTIVE"
  ) {
    return null;
  }

  return user;
}

async function dashboardPartner(request: NextRequest) {
  const previewId = request.nextUrl.searchParams.get("adminPreview");
  if (previewId) {
    if (!(await canAdmin(request, "partners"))) return null;
    const partner = await db.partner.findUnique({
      where: { id: previewId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
    });
    if (!partner) return null;
    return {
      ...partner.user,
      partner: { id: partner.id, status: partner.status, createdAt: partner.createdAt },
      isAdminPreview: true,
    };
  }
  const user = await currentPartner(request);
  return user ? { ...user, isAdminPreview: false } : null;
}

function serializeProject<T extends {
  feeAmount: { toString(): string } | null;
}>(project: T) {
  return {
    ...project,
    feeAmount: project.feeAmount?.toString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  const user = await dashboardPartner(request);
  if (!user) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });

  const assignments = await db.partnerProject.findMany({
    where: { partnerId: user.partner!.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const projects = assignments.map(serializeProject);
  const activeProjects = projects.filter((project) => project.status !== "COMPLETED");
  const dues = new Map<string, { currency: string; outstanding: number; paid: number }>();

  for (const project of projects) {
    if (!project.feeAmount) continue;
    const amount = Number(project.feeAmount);
    if (!Number.isFinite(amount)) continue;
    const currency = project.feeCurrency.toUpperCase();
    const current = dues.get(currency) || { currency, outstanding: 0, paid: 0 };
    if (project.paymentStatus === "PAID") current.paid += amount;
    else if (project.paymentStatus !== "CANCELLED") current.outstanding += amount;
    dues.set(currency, current);
  }

  const averageProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length)
    : 0;

  return NextResponse.json({
    partner: {
      name: user.name || "شريك تنفيذ CyberWeel",
      email: user.email,
      joinedAt: user.partner!.createdAt,
    },
    isAdminPreview: user.isAdminPreview,
    stats: {
      activeProjects: activeProjects.length,
      completedProjects: projects.filter((project) => project.status === "COMPLETED").length,
      averageProgress,
      duesByCurrency: Array.from(dues.values()).map((item) => ({
        ...item,
        outstanding: item.outstanding.toFixed(2),
        paid: item.paid.toFixed(2),
      })),
    },
    projects,
    allowedStatuses: PROJECT_STATUSES,
  });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const user = await currentPartner(request);
  if (!user) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!projectId || body?.action !== "progress") {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const project = await db.partnerProject.findFirst({
    where: { id: projectId, partnerId: user.partner!.id },
    select: { id: true, status: true },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  if (project.status === "COMPLETED") {
    return NextResponse.json({ error: "لا يمكن تعديل مشروع مكتمل" }, { status: 409 });
  }

  const progress = Number(body?.progress);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    return NextResponse.json({ error: "نسبة التقدم يجب أن تكون بين 0 و100" }, { status: 400 });
  }

  const updated = await db.partnerProject.update({
    where: { id: project.id },
    data: { progress },
  });
  return NextResponse.json({ project: serializeProject(updated) });
}
