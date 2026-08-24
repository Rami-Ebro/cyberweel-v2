import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPartnerSession, PARTNER_SESSION_COOKIE } from "@/lib/partner-auth";
import { POST as createProject } from "@/app/api/admin/projects/route";
import {
  GET as getStageAssignments,
  POST as mutateStageAssignment,
} from "@/app/api/admin/stage-partner-assignments/route";
import { POST as mutateProjectStage } from "@/app/api/admin/project-stages/route";
import {
  GET as getPartnerDashboard,
  PATCH as updatePartnerDashboard,
} from "@/app/api/partner/dashboard/route";
import { GET as getClientDashboard } from "@/app/api/client/dashboard/route";

export const dynamic = "force-dynamic";

const previewBranch = "feat/stage-partner-assignment-workflow";
const origin = "https://stage-partner-self-test.local";

type Check = { name: string; ok: boolean; detail?: string };

function previewOnly() {
  return process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === previewBranch;
}

function requestFor(path: string, token: string, init: { method?: string; body?: unknown } = {}) {
  const headers = new Headers({
    cookie: `${PARTNER_SESSION_COOKIE}=${token}`,
    origin,
  });
  if (init.body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(`${origin}${path}`, {
    method: init.method || "GET",
    headers,
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

async function json(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

export async function GET() {
  if (!previewOnly()) return new NextResponse(null, { status: 404 });

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emails = {
    admin: `selftest-admin-${suffix}@cyberweel.test`,
    client: `selftest-client-${suffix}@cyberweel.test`,
    partner: `selftest-partner-${suffix}@cyberweel.test`,
    ambassador: `selftest-ambassador-${suffix}@cyberweel.test`,
  };
  const checks: Check[] = [];
  let projectId: string | null = null;

  try {
    const fixture = await db.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: { email: emails.admin, name: "Stage Partner Self Test Admin", role: "ADMIN", isActive: true },
      });
      await tx.adminProfile.create({
        data: { userId: admin.id, isOwner: true, isActive: true, permissions: [] },
      });

      const client = await tx.user.create({
        data: { email: emails.client, name: "Stage Partner Self Test Client", role: "CLIENT", clientEnabled: true, isActive: true },
      });
      const partnerUser = await tx.user.create({
        data: { email: emails.partner, name: "Stage Partner Self Test Partner", role: "PARTNER", isActive: true },
      });
      const partner = await tx.partner.create({
        data: { userId: partnerUser.id, status: "ACTIVE", profileCompletedAt: new Date() },
      });
      const ambassadorUser = await tx.user.create({
        data: { email: emails.ambassador, name: "Stage Partner Self Test Ambassador", role: "AMBASSADOR", isActive: true },
      });
      const ambassador = await tx.ambassador.create({
        data: { userId: ambassadorUser.id, status: "ACTIVE", profileCompletedAt: new Date() },
      });
      const referral = await tx.partnerReferral.create({
        data: {
          ambassadorId: ambassador.id,
          name: "Stage Partner Self Test Referral",
          email: emails.client,
          status: "CONVERTED",
          adminDecision: "CONVERTED_TO_CLIENT",
          convertedClientId: client.id,
          convertedAt: new Date(),
          source: "SELF_TEST",
        },
      });
      return { admin, client, partnerUser, partner, ambassadorUser, ambassador, referral };
    });

    const adminToken = createPartnerSession(fixture.admin.id);
    const partnerToken = createPartnerSession(fixture.partnerUser.id);
    const clientToken = createPartnerSession(fixture.client.id);

    const projectResponse = await createProject(requestFor("/api/admin/projects", adminToken, {
      method: "POST",
      body: {
        clientId: fixture.client.id,
        title: `Stage partner workflow ${suffix}`,
        agreementDetails: "Preview self-test scope",
        stages: "التحليل والتصميم\nالتنفيذ والاختبار",
        financialPlan: "100\n200",
        currency: "USD",
        links: [],
        notes: "Preview self-test only",
      },
    }));
    const projectPayload = await json(projectResponse);
    projectId = typeof (projectPayload.project as { id?: unknown } | undefined)?.id === "string"
      ? (projectPayload.project as { id: string }).id
      : null;
    checks.push({ name: "canonical_project_creation", ok: projectResponse.status === 201 && Boolean(projectId), detail: `status=${projectResponse.status}` });
    if (!projectId) throw new Error(`Canonical project creation failed: ${JSON.stringify(projectPayload)}`);

    const project = await db.clientProject.findUnique({
      where: { id: projectId },
      include: {
        projectStages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        ambassadorRewards: true,
        partnerAssignments: true,
      },
    });
    if (!project) throw new Error("Created project not found");
    checks.push({
      name: "single_source_structured_stages",
      ok: project.projectStages.length === 2 && project.financialPlan === "100\n200" && project.stages === "التحليل والتصميم\nالتنفيذ والاختبار",
      detail: `stages=${project.projectStages.length}`,
    });
    checks.push({
      name: "ambassador_sync",
      ok: project.ambassadorRewards.length === 2 && project.ambassadorRewards.every((reward) => reward.status === "EXPECTED"),
      detail: `rewards=${project.ambassadorRewards.length}`,
    });
    checks.push({
      name: "no_project_level_partner_assignment",
      ok: project.partnerAssignments.length === 0,
      detail: `legacyAssignments=${project.partnerAssignments.length}`,
    });

    const firstStage = project.projectStages[0];
    const assignmentResponse = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: {
        action: "upsert",
        projectStageId: firstStage.id,
        partnerId: fixture.partner.id,
        tasks: ["مراجعة المتطلبات", "تنفيذ المهمة الأولى"],
        deliverables: ["نسخة أولية", "ملاحظات التنفيذ"],
        feeAmount: 40,
        feeCurrency: "USD",
        paymentStatus: "PENDING",
      },
    }));
    const assignmentPayload = await json(assignmentResponse);
    const assignmentId = typeof (assignmentPayload.assignment as { id?: unknown } | undefined)?.id === "string"
      ? (assignmentPayload.assignment as { id: string }).id
      : null;
    checks.push({ name: "stage_partner_assignment", ok: assignmentResponse.status === 201 && Boolean(assignmentId), detail: `status=${assignmentResponse.status}` });
    if (!assignmentId) throw new Error(`Stage assignment failed: ${JSON.stringify(assignmentPayload)}`);

    const adminAssignmentsResponse = await getStageAssignments(requestFor(`/api/admin/stage-partner-assignments?projectId=${projectId}`, adminToken));
    const adminAssignmentsPayload = await json(adminAssignmentsResponse);
    const adminStages = (adminAssignmentsPayload.project as { projectStages?: Array<{ assignments?: unknown[] }> } | undefined)?.projectStages || [];
    checks.push({
      name: "admin_dashboard_sync",
      ok: adminAssignmentsResponse.status === 200 && adminStages.some((stage) => (stage.assignments || []).length === 1),
      detail: `status=${adminAssignmentsResponse.status}`,
    });

    const partnerBeforeStartResponse = await updatePartnerDashboard(requestFor("/api/partner/dashboard", partnerToken, {
      method: "PATCH",
      body: { action: "progress", projectId: assignmentId, progress: 25 },
    }));
    checks.push({
      name: "partner_cannot_start_before_admin",
      ok: partnerBeforeStartResponse.status === 409,
      detail: `status=${partnerBeforeStartResponse.status}`,
    });

    const partnerDashboardResponse = await getPartnerDashboard(requestFor("/api/partner/dashboard", partnerToken));
    const partnerDashboardPayload = await json(partnerDashboardResponse);
    const partnerProjects = (partnerDashboardPayload.projects as Array<Record<string, unknown>> | undefined) || [];
    const partnerCard = partnerProjects.find((item) => item.id === assignmentId);
    checks.push({
      name: "partner_dashboard_sync",
      ok: partnerDashboardResponse.status === 200 && Array.isArray(partnerCard?.tasks) && (partnerCard?.tasks as string[]).includes("مراجعة المتطلبات"),
      detail: `cards=${partnerProjects.length}`,
    });

    const startResponse = await mutateProjectStage(requestFor("/api/admin/project-stages", adminToken, {
      method: "POST",
      body: { action: "start_stage", stageId: firstStage.id },
    }));
    checks.push({ name: "admin_starts_stage", ok: startResponse.status === 200, detail: `status=${startResponse.status}` });

    const partnerProgressResponse = await updatePartnerDashboard(requestFor("/api/partner/dashboard", partnerToken, {
      method: "PATCH",
      body: { action: "progress", projectId: assignmentId, progress: 50 },
    }));
    const partnerProgressPayload = await json(partnerProgressResponse);
    const partnerProgressProject = partnerProgressPayload.project as { progress?: unknown; status?: unknown } | undefined;
    checks.push({
      name: "partner_progress_update",
      ok: partnerProgressResponse.status === 200 && partnerProgressProject?.progress === 50 && partnerProgressProject?.status === "IN_PROGRESS",
      detail: `status=${partnerProgressResponse.status}`,
    });

    const clientDashboardResponse = await getClientDashboard(requestFor("/api/client/dashboard", clientToken));
    const clientDashboardPayload = await json(clientDashboardResponse);
    const clientProjects = (clientDashboardPayload.projects as Array<{ id?: string; progress?: number; projectStages?: Array<Record<string, unknown>> }> | undefined) || [];
    const clientProject = clientProjects.find((item) => item.id === projectId);
    const clientStage = clientProject?.projectStages?.find((item) => item.id === firstStage.id);
    const clientLeaksPartnerData = clientStage ? ["partnerId", "partnerName", "partnerEmail", "tasks", "deliverables", "feeAmount"].some((key) => key in clientStage) : true;
    checks.push({
      name: "client_dashboard_sync_without_internal_data",
      ok: clientDashboardResponse.status === 200 && clientStage?.executionProgress === 50 && !clientLeaksPartnerData,
      detail: `executionProgress=${String(clientStage?.executionProgress)}`,
    });

    const partnerReviewResponse = await updatePartnerDashboard(requestFor("/api/partner/dashboard", partnerToken, {
      method: "PATCH",
      body: { action: "progress", projectId: assignmentId, progress: 100 },
    }));
    const partnerReviewPayload = await json(partnerReviewResponse);
    const partnerReviewProject = partnerReviewPayload.project as { progress?: unknown; status?: unknown } | undefined;
    const unchangedStage = await db.projectStage.findUnique({ where: { id: firstStage.id }, select: { status: true } });
    const unchangedProject = await db.clientProject.findUnique({ where: { id: projectId }, select: { progress: true, status: true } });
    checks.push({
      name: "partner_100_requests_review_not_completion",
      ok: partnerReviewResponse.status === 200 && partnerReviewProject?.status === "REVIEW" && unchangedStage?.status === "IN_PROGRESS" && unchangedProject?.progress === 0,
      detail: `partnerStatus=${String(partnerReviewProject?.status)}, stageStatus=${String(unchangedStage?.status)}, projectProgress=${String(unchangedProject?.progress)}`,
    });

    const deleteAfterWorkResponse = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: { action: "delete", assignmentId },
    }));
    checks.push({
      name: "started_assignment_cannot_be_deleted",
      ok: deleteAfterWorkResponse.status === 409,
      detail: `status=${deleteAfterWorkResponse.status}`,
    });

    const passed = checks.every((check) => check.ok);
    return NextResponse.json({ passed, checks }, { status: passed ? 200 : 500 });
  } catch (error) {
    checks.push({ name: "unexpected_error", ok: false, detail: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ passed: false, checks }, { status: 500 });
  } finally {
    try {
      const users = await db.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
      const userIds = users.map((user) => user.id);
      const projects = userIds.length
        ? await db.clientProject.findMany({ where: { clientId: { in: userIds } }, select: { id: true } })
        : [];
      const projectIds = projects.map((project) => project.id);
      if (projectIds.length) {
        await db.ambassadorReward.deleteMany({ where: { projectId: { in: projectIds } } });
        await db.clientProject.deleteMany({ where: { id: { in: projectIds } } });
      }
      if (userIds.length) {
        await db.partnerReferral.deleteMany({ where: { OR: [{ convertedClientId: { in: userIds } }, { email: { in: Object.values(emails) } }] } });
        await db.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (cleanupError) {
      console.error("[stage-partner-self-test] Cleanup failed", cleanupError);
    }
  }
}
