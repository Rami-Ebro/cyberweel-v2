import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPartnerSession, PARTNER_SESSION_COOKIE } from "@/lib/partner-auth";
import { POST as createProject } from "@/app/api/admin/projects/route";
import { POST as mutateStageAssignment } from "@/app/api/admin/stage-partner-assignments/route";
import { POST as mutateProjectStage } from "@/app/api/admin/project-stages/route";
import { POST as mutateProjectExecution } from "@/app/api/admin/project-execution/route";
import { GET as getPartnerDashboard, PATCH as updatePartnerDashboard } from "@/app/api/partner/dashboard/route";
import { GET as getClientDashboard } from "@/app/api/client/dashboard/route";

export const dynamic = "force-dynamic";

const previewBranch = "feat/stage-partner-assignment-workflow";
const origin = "https://stage-partner-payout-self-test.local";
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
    admin: `payout-selftest-admin-${suffix}@cyberweel.test`,
    client: `payout-selftest-client-${suffix}@cyberweel.test`,
    partner: `payout-selftest-partner-${suffix}@cyberweel.test`,
  };
  const projectTitle = `Partner payout self-test ${suffix}`;
  const checks: Check[] = [];
  let projectId: string | null = null;

  try {
    const fixture = await db.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: { email: emails.admin, name: "Payout Self Test Admin", role: "ADMIN", isActive: true },
      });
      await tx.adminProfile.create({ data: { userId: admin.id, isOwner: true, isActive: true, permissions: [] } });
      const client = await tx.user.create({
        data: { email: emails.client, name: "Payout Self Test Client", role: "CLIENT", clientEnabled: true, isActive: true },
      });
      const partnerUser = await tx.user.create({
        data: { email: emails.partner, name: "Payout Self Test Partner", role: "PARTNER", isActive: true },
      });
      const partner = await tx.partner.create({
        data: { userId: partnerUser.id, status: "ACTIVE", profileCompletedAt: new Date() },
      });
      return { admin, client, partnerUser, partner };
    });

    const adminToken = createPartnerSession(fixture.admin.id);
    const clientToken = createPartnerSession(fixture.client.id);
    const partnerToken = createPartnerSession(fixture.partnerUser.id);

    const projectResponse = await createProject(requestFor("/api/admin/projects", adminToken, {
      method: "POST",
      body: {
        clientId: fixture.client.id,
        title: projectTitle,
        agreementDetails: "Preview payout lifecycle test",
        stages: "تنفيذ واختبار المرحلة",
        financialPlan: "500",
        currency: "USD",
        links: [],
        notes: "temporary payout self-test",
      },
    }));
    const projectPayload = await json(projectResponse);
    projectId = typeof (projectPayload.project as { id?: unknown } | undefined)?.id === "string"
      ? (projectPayload.project as { id: string }).id
      : null;
    checks.push({ name: "project_created", ok: projectResponse.status === 201 && Boolean(projectId), detail: `status=${projectResponse.status}` });
    if (!projectId) throw new Error(`Project creation failed: ${JSON.stringify(projectPayload)}`);

    const stage = await db.projectStage.findFirst({ where: { projectId }, orderBy: { createdAt: "asc" } });
    if (!stage) throw new Error("Structured stage missing");

    const assignmentResponse = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: {
        action: "upsert",
        projectStageId: stage.id,
        partnerId: fixture.partner.id,
        tasks: ["تنفيذ المهمة"],
        deliverables: ["نسخة جاهزة للمراجعة"],
        feeAmount: 120,
        feeCurrency: "USD",
      },
    }));
    const assignmentPayload = await json(assignmentResponse);
    const assignmentId = typeof (assignmentPayload.assignment as { id?: unknown } | undefined)?.id === "string"
      ? (assignmentPayload.assignment as { id: string }).id
      : null;
    checks.push({ name: "assignment_expected", ok: assignmentResponse.status === 201 && Boolean(assignmentId) && (assignmentPayload.assignment as { paymentStatus?: unknown })?.paymentStatus === "PENDING", detail: `status=${assignmentResponse.status}` });
    if (!assignmentId) throw new Error(`Assignment creation failed: ${JSON.stringify(assignmentPayload)}`);

    const earlyPayment = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: { action: "record_payment", assignmentId, paymentMethod: "Test Pay", paymentReference: "EARLY", paidAt: new Date().toISOString() },
    }));
    checks.push({ name: "payment_blocked_before_approval", ok: earlyPayment.status === 409, detail: `status=${earlyPayment.status}` });

    const startResponse = await mutateProjectStage(requestFor("/api/admin/project-stages", adminToken, {
      method: "POST",
      body: { action: "start_stage", stageId: stage.id },
    }));
    checks.push({ name: "stage_started", ok: startResponse.status === 200, detail: `status=${startResponse.status}` });

    const reviewResponse = await updatePartnerDashboard(requestFor("/api/partner/dashboard", partnerToken, {
      method: "PATCH",
      body: { action: "progress", projectId: assignmentId, progress: 100 },
    }));
    const reviewPayload = await json(reviewResponse);
    checks.push({
      name: "partner_100_goes_to_review",
      ok: reviewResponse.status === 200 && (reviewPayload.project as { status?: unknown })?.status === "REVIEW" && (reviewPayload.project as { paymentStatus?: unknown })?.paymentStatus === "PENDING",
      detail: `status=${reviewResponse.status}`,
    });

    const approveResponse = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: { action: "approve_delivery", assignmentId },
    }));
    const approvePayload = await json(approveResponse);
    checks.push({
      name: "admin_approval_makes_fee_due",
      ok: approveResponse.status === 200 && (approvePayload.assignment as { status?: unknown })?.status === "COMPLETED" && (approvePayload.assignment as { paymentStatus?: unknown })?.paymentStatus === "APPROVED",
      detail: `status=${approveResponse.status}`,
    });

    const missingPaymentMetadata = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: { action: "record_payment", assignmentId, paymentMethod: "", paymentReference: "", paidAt: "" },
    }));
    checks.push({ name: "payment_requires_metadata", ok: missingPaymentMetadata.status === 400, detail: `status=${missingPaymentMetadata.status}` });

    const invoice = await db.clientInvoice.findFirst({ where: { projectId }, orderBy: { createdAt: "asc" } });
    if (!invoice) throw new Error("Stage invoice missing after start");
    const paidAt = new Date();
    await db.$transaction([
      db.clientInvoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt } }),
      db.projectStage.update({ where: { id: stage.id }, data: { paymentStatus: "PAID", paidAt } }),
    ]);

    const completeStageResponse = await mutateProjectStage(requestFor("/api/admin/project-stages", adminToken, {
      method: "POST",
      body: { action: "update", stageId: stage.id, status: "COMPLETED", approved: true },
    }));
    checks.push({ name: "client_stage_completed_and_approved", ok: completeStageResponse.status === 200, detail: `status=${completeStageResponse.status}` });

    const beforeCloseAssignment = await db.projectStagePartnerAssignment.findUnique({ where: { id: assignmentId } });
    const closeResponse = await mutateProjectExecution(requestFor("/api/admin/project-execution", adminToken, {
      method: "POST",
      body: { action: "close", projectId },
    }));
    const closedProject = await db.clientProject.findUnique({ where: { id: projectId }, select: { status: true, progress: true } });
    const afterCloseAssignment = await db.projectStagePartnerAssignment.findUnique({ where: { id: assignmentId } });
    checks.push({
      name: "client_project_closes_while_partner_unpaid",
      ok: closeResponse.status === 200 && closedProject?.status === "COMPLETED" && closedProject.progress === 100 && beforeCloseAssignment?.paymentStatus === "APPROVED" && afterCloseAssignment?.paymentStatus === "APPROVED",
      detail: `close=${closeResponse.status}, project=${closedProject?.status}, partnerPayment=${afterCloseAssignment?.paymentStatus}`,
    });

    const finalPaymentResponse = await mutateStageAssignment(requestFor("/api/admin/stage-partner-assignments", adminToken, {
      method: "POST",
      body: {
        action: "record_payment",
        assignmentId,
        paymentMethod: "شام كاش",
        paymentReference: `SELFTEST-${suffix}`,
        paidAt: paidAt.toISOString(),
      },
    }));
    const finalPaymentPayload = await json(finalPaymentResponse);
    checks.push({
      name: "approved_fee_can_be_paid_after_project_close",
      ok: finalPaymentResponse.status === 200 && (finalPaymentPayload.assignment as { paymentStatus?: unknown })?.paymentStatus === "PAID" && (finalPaymentPayload.assignment as { paymentMethod?: unknown })?.paymentMethod === "شام كاش",
      detail: `status=${finalPaymentResponse.status}`,
    });

    const partnerDashboardResponse = await getPartnerDashboard(requestFor("/api/partner/dashboard", partnerToken));
    const partnerDashboardPayload = await json(partnerDashboardResponse);
    const partnerProjects = (partnerDashboardPayload.projects as Array<Record<string, unknown>> | undefined) || [];
    const partnerCard = partnerProjects.find((item) => item.id === assignmentId);
    const dues = ((partnerDashboardPayload.stats as { duesByCurrency?: Array<Record<string, unknown>> } | undefined)?.duesByCurrency || []).find((item) => item.currency === "USD");
    checks.push({
      name: "partner_dashboard_payment_sync",
      ok: partnerDashboardResponse.status === 200 && partnerCard?.paymentStatus === "PAID" && partnerCard?.paymentReference === `SELFTEST-${suffix}` && dues?.paid === "120.00" && dues?.due === "0.00",
      detail: `status=${partnerDashboardResponse.status}, paid=${String(dues?.paid)}`,
    });

    const clientDashboardResponse = await getClientDashboard(requestFor("/api/client/dashboard", clientToken));
    const clientDashboardPayload = await json(clientDashboardResponse);
    const clientProjects = (clientDashboardPayload.projects as Array<{ id?: string; projectStages?: Array<Record<string, unknown>> }> | undefined) || [];
    const clientProject = clientProjects.find((item) => item.id === projectId);
    const clientStage = clientProject?.projectStages?.find((item) => item.id === stage.id);
    const forbiddenKeys = ["partnerId", "partnerName", "partnerEmail", "tasks", "deliverables", "feeAmount", "feeCurrency", "paymentMethod", "paymentReference", "paymentProofUrl"];
    const leaked = clientStage ? forbiddenKeys.some((key) => key in clientStage) : true;
    checks.push({ name: "client_dashboard_hides_partner_financials", ok: clientDashboardResponse.status === 200 && !leaked, detail: `status=${clientDashboardResponse.status}, leaked=${leaked}` });

    const passed = checks.every((check) => check.ok);
    return NextResponse.json({ passed, checks }, { status: passed ? 200 : 500 });
  } catch (error) {
    checks.push({ name: "unexpected_error", ok: false, detail: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ passed: false, checks }, { status: 500 });
  } finally {
    try {
      await db.adminNotification.deleteMany({ where: { OR: [{ body: { contains: projectTitle } }, { kind: "PARTNER_STAGE_REVIEW", body: { contains: "Payout Self Test Partner" } }] } });
      const users = await db.user.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
      const userIds = users.map((user) => user.id);
      if (projectId) {
        await db.clientProject.deleteMany({ where: { id: projectId } });
      }
      if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
    } catch (cleanupError) {
      console.error("[stage-partner-payout-self-test] cleanup failed", cleanupError);
    }
  }
}
