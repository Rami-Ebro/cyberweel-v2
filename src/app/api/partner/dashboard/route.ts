import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import {
  getStagePartnerAssignment,
  listStagePartnerAssignments,
  serializeStagePartnerAssignment,
  updateStagePartnerProgress,
  type SerializedStagePartnerAssignment,
} from "@/lib/stage-partner-assignments";
import { NextRequest, NextResponse } from "next/server";

const PROJECT_STATUSES = ["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"] as const;

type StageSubmissionSummary = {
  id: string;
  assignmentId: string;
  version: number;
  status: string;
  reviewNote: string | null;
  fileNames: string[];
  createdAt: Date;
  reviewedAt: Date | null;
};

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
      partner: { select: { id: true, status: true, createdAt: true } },
    },
  });

  if (!user || !user.isActive || !user.partner || user.partner.status !== "ACTIVE") return null;
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

function serializeLegacyProject<T extends { feeAmount: { toString(): string } | null }>(project: T) {
  return {
    ...project,
    feeAmount: project.feeAmount?.toString() ?? null,
    approvedAt: null,
    paymentMethod: null,
    paymentReference: null,
    paymentProofAvailable: false,
    paymentProofPath: null,
  };
}

function submissionMessage(submission: StageSubmissionSummary) {
  if (submission.status === "CHANGES_REQUESTED") {
    return `النسخة ${submission.version}: طلبت الإدارة تعديلًا${submission.reviewNote ? ` — ${submission.reviewNote}` : ""}`;
  }
  if (submission.status === "APPROVED") return `النسخة ${submission.version}: اعتمدتها الإدارة`;
  return `النسخة ${submission.version}: بانتظار مراجعة الإدارة`;
}

function stageCard(row: SerializedStagePartnerAssignment, submissions: StageSubmissionSummary[] = [], origin = "") {
  const closedStatus = row.stageStatus === "COMPLETED"
    ? "COMPLETED"
    : row.stageStatus === "CANCELLED"
      ? "CANCELLED"
      : row.status;
  return {
    id: row.id,
    clientProjectId: row.projectId,
    projectStageId: row.projectStageId,
    title: row.projectTitle,
    description: `المرحلة: ${row.stageName}${row.projectDescription ? ` — ${row.projectDescription}` : ""}`,
    status: closedStatus,
    progress: row.stageStatus === "COMPLETED" ? 100 : row.progress,
    tasks: row.tasks,
    deliverables: row.deliverables,
    files: submissions.flatMap((submission) => submission.fileNames.map((name, index) => {
      const displayName = `النسخة-${submission.version}-${name}`;
      return `${origin}/api/partner/stage-assignments/${encodeURIComponent(row.id)}/submissions/${encodeURIComponent(submission.id)}/files/${encodeURIComponent(displayName)}?index=${index}`;
    })),
    updates: submissions.map((submission) => `${(submission.reviewedAt || submission.createdAt).toISOString()} — ${submissionMessage(submission)}`),
    feeAmount: row.feeAmount,
    feeCurrency: row.feeCurrency,
    paymentStatus: row.paymentStatus,
    approvedAt: row.approvedAt,
    paidAt: row.paidAt,
    paymentMethod: row.paymentMethod,
    paymentReference: row.paymentReference,
    paymentProofAvailable: Boolean(row.paymentProofUrl),
    paymentProofPath: row.paymentProofUrl ? `/api/partner/stage-assignments/${row.id}/payment-proof` : null,
    dueAt: row.dueAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function submissionsForAssignments(assignmentIds: string[]) {
  if (!assignmentIds.length) return new Map<string, StageSubmissionSummary[]>();
  const rows = await db.projectStagePartnerSubmission.findMany({
    where: { assignmentId: { in: assignmentIds } },
    orderBy: [{ assignmentId: "asc" }, { version: "asc" }],
    select: {
      id: true,
      assignmentId: true,
      version: true,
      status: true,
      reviewNote: true,
      fileNames: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
  const grouped = new Map<string, StageSubmissionSummary[]>();
  for (const row of rows) {
    const list = grouped.get(row.assignmentId) || [];
    list.push(row);
    grouped.set(row.assignmentId, list);
  }
  return grouped;
}

export async function GET(request: NextRequest) {
  const user = await dashboardPartner(request);
  if (!user) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });

  const [stageRows, legacyAssignments] = await Promise.all([
    listStagePartnerAssignments({ partnerId: user.partner!.id }),
    db.partnerProject.findMany({
      where: { partnerId: user.partner!.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const serializedStageRows = stageRows.map(serializeStagePartnerAssignment);
  const submissionsByAssignment = await submissionsForAssignments(serializedStageRows.map((row) => row.id));
  const stageProjectIds = new Set(serializedStageRows.map((row) => row.projectId));
  const stageProjects = serializedStageRows.map((row) => stageCard(row, submissionsByAssignment.get(row.id) || [], request.nextUrl.origin));
  const legacyProjects = legacyAssignments
    .filter((assignment) => !assignment.clientProjectId || !stageProjectIds.has(assignment.clientProjectId))
    .map(serializeLegacyProject);
  const projects = [...stageProjects, ...legacyProjects];
  const activeProjects = projects.filter((project) => project.status !== "COMPLETED" && project.status !== "CANCELLED");
  const dues = new Map<string, { currency: string; total: number; expected: number; due: number; paid: number }>();

  for (const project of projects) {
    if (!project.feeAmount || project.paymentStatus === "CANCELLED") continue;
    const amount = Number(project.feeAmount);
    if (!Number.isFinite(amount)) continue;
    const currency = project.feeCurrency.toUpperCase();
    const current = dues.get(currency) || { currency, total: 0, expected: 0, due: 0, paid: 0 };
    current.total += amount;
    if (project.paymentStatus === "PAID") current.paid += amount;
    else if (project.paymentStatus === "APPROVED") current.due += amount;
    else current.expected += amount;
    dues.set(currency, current);
  }

  const projectGroups = new Map<string, Array<{ status: string }>>();
  for (const project of projects) {
    const key = "clientProjectId" in project && typeof project.clientProjectId === "string" && project.clientProjectId ? project.clientProjectId : project.id;
    const group = projectGroups.get(key) || [];
    group.push({ status: project.status });
    projectGroups.set(key, group);
  }
  const activeProjectCount = Array.from(projectGroups.values()).filter((group) => group.some((item) => !["COMPLETED", "CANCELLED"].includes(item.status))).length;
  const completedProjectCount = Array.from(projectGroups.values()).filter((group) => group.length > 0 && group.every((item) => item.status === "COMPLETED")).length;
  const averageProgress = activeProjects.length ? Math.round(activeProjects.reduce((total, project) => total + project.progress, 0) / activeProjects.length) : 0;

  return NextResponse.json({
    partner: { name: user.name || "شريك تنفيذ CyberWeel", email: user.email, joinedAt: user.partner!.createdAt },
    isAdminPreview: user.isAdminPreview,
    stats: {
      activeProjects: activeProjectCount,
      completedProjects: completedProjectCount,
      averageProgress,
      duesByCurrency: Array.from(dues.values()).map((item) => ({
        currency: item.currency,
        total: item.total.toFixed(2),
        expected: item.expected.toFixed(2),
        due: item.due.toFixed(2),
        paid: item.paid.toFixed(2),
        outstanding: (item.expected + item.due).toFixed(2),
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
  if (!projectId || body?.action !== "progress") return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });

  const progress = Number(body?.progress);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return NextResponse.json({ error: "نسبة التقدم يجب أن تكون بين 0 و100" }, { status: 400 });

  const stageAssignment = await getStagePartnerAssignment(projectId, user.partner!.id);
  if (stageAssignment) {
    if (stageAssignment.stageStatus === "NOT_STARTED") return NextResponse.json({ error: "لا يمكن بدء التنفيذ قبل أن تبدأ الإدارة هذه المرحلة" }, { status: 409 });
    if (["COMPLETED", "CANCELLED"].includes(stageAssignment.stageStatus)) return NextResponse.json({ error: "لا يمكن تعديل مرحلة مكتملة أو ملغاة" }, { status: 409 });
    if (stageAssignment.status === "REVIEW") return NextResponse.json({ error: "لديك تسليم بانتظار مراجعة الإدارة. لا يمكن تغيير التقدم حتى يصدر قرار المراجعة" }, { status: 409 });
    if (stageAssignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(stageAssignment.paymentStatus)) return NextResponse.json({ error: "اعتمدت الإدارة هذا التسليم، لذلك لم يعد تقدم الإسناد قابلًا للتعديل" }, { status: 409 });
    if (progress === 100) {
      return NextResponse.json({
        error: "لا يتم إكمال المرحلة برفع النسبة إلى 100٪ يدويًا. عند اكتمال العمل أرسل «تسليم المرحلة» بملاحظة أو رابط أو ملف ليصل إلى مراجعة الإدارة.",
      }, { status: 409 });
    }

    const updated = await updateStagePartnerProgress({ assignmentId: projectId, partnerId: user.partner!.id, progress });
    if (!updated) return NextResponse.json({ error: "الإسناد غير موجود" }, { status: 404 });
    const submissions = (await submissionsForAssignments([projectId])).get(projectId) || [];
    return NextResponse.json({ project: stageCard(serializeStagePartnerAssignment(updated), submissions, request.nextUrl.origin) });
  }

  const project = await db.partnerProject.findFirst({ where: { id: projectId, partnerId: user.partner!.id }, select: { id: true, status: true } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  if (project.status === "COMPLETED") return NextResponse.json({ error: "لا يمكن تعديل مشروع مكتمل" }, { status: 409 });

  const updated = await db.partnerProject.update({ where: { id: project.id }, data: { progress } });
  return NextResponse.json({ project: serializeLegacyProject(updated) });
}
