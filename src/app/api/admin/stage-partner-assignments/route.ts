import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { writeAdminAudit } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import {
  deleteStagePartnerAssignment,
  getStagePartnerAssignment,
  listStagePartnerAssignments,
  recordStagePartnerPayment,
  serializeStagePartnerAssignment,
  upsertStagePartnerAssignment,
} from "@/lib/stage-partner-assignments";
import {
  listStagePartnerSubmissions,
  reviewStagePartnerSubmission,
  serializeStagePartnerSubmission,
  StagePartnerSubmissionError,
} from "@/lib/stage-partner-submissions";

async function requireAccess(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects") || access.permissions.includes("partners"))) return null;
  return access;
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 100);
  }
  if (typeof value === "string") return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
  return [];
}

function optionalDate(value: unknown) {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function safeText(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validProofUrl(value: string, assignmentId: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com") && url.pathname.includes(assignmentId);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAccess(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const projectId = request.nextUrl.searchParams.get("projectId")?.trim() || "";
  if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });

  const [project, partners, assignments] = await Promise.all([
    db.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        status: true,
        currency: true,
        projectStages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true, name: true, status: true, paymentStatus: true, amount: true, currency: true, startsAt: true },
        },
      },
    }),
    db.partner.findMany({
      where: { status: "ACTIVE", user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
    listStagePartnerAssignments({ projectId }),
  ]);

  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const serializedAssignments = assignments.map(serializeStagePartnerAssignment);
  const submissions = await listStagePartnerSubmissions(serializedAssignments.map((item) => item.id));
  const submissionsByAssignment = new Map<string, ReturnType<typeof serializeStagePartnerSubmission>[]>();
  for (const submission of submissions) {
    const list = submissionsByAssignment.get(submission.assignmentId) || [];
    list.push(serializeStagePartnerSubmission(submission));
    submissionsByAssignment.set(submission.assignmentId, list);
  }
  const assignmentsWithSubmissions = serializedAssignments.map((assignment) => ({
    ...assignment,
    submissions: submissionsByAssignment.get(assignment.id) || [],
  }));

  return NextResponse.json({
    project: {
      ...project,
      projectStages: project.projectStages.map((stage) => ({
        ...stage,
        amount: stage.amount.toString(),
        assignments: assignmentsWithSubmissions.filter((assignment) => assignment.projectStageId === stage.id),
      })),
    },
    partners: partners.map((partner) => ({ id: partner.id, name: partner.user.name || partner.user.email, email: partner.user.email })),
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireAccess(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "upsert";

  if (action === "delete") {
    const assignmentId = safeText(body?.assignmentId);
    if (!assignmentId) return NextResponse.json({ error: "الإسناد مطلوب" }, { status: 400 });
    const existing = await getStagePartnerAssignment(assignmentId);
    if (!existing) return NextResponse.json({ error: "الإسناد غير موجود" }, { status: 404 });
    if (["COMPLETED", "CANCELLED"].includes(existing.stageStatus)) return NextResponse.json({ error: "لا يمكن حذف إسناد من مرحلة مغلقة أو ملغاة" }, { status: 409 });
    if (existing.progress > 0 || existing.status !== "ASSIGNED" || existing.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "لا يمكن حذف الإسناد بعد بدء التنفيذ أو إرسال تسليم" }, { status: 409 });
    }
    await deleteStagePartnerAssignment(assignmentId);
    await writeAdminAudit(db, {
      actorId: access.userId,
      action: "STAGE_PARTNER_ASSIGNMENT_REMOVED",
      category: "SENSITIVE",
      entityType: "PROJECT_STAGE_PARTNER_ASSIGNMENT",
      entityId: assignmentId,
      entityLabel: `${existing.projectTitle} — ${existing.stageName}`,
      before: { projectStageId: existing.projectStageId, partnerId: existing.partnerId, partnerEmail: existing.partnerEmail },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_delivery" || action === "request_changes") {
    const assignmentId = safeText(body?.assignmentId);
    const submissionId = safeText(body?.submissionId);
    const reviewNote = safeText(body?.reviewNote, 2000) || null;
    if (!assignmentId || !submissionId) return NextResponse.json({ error: "حدد إسناد الشريك ونسخة التسليم التي ستتم مراجعتها" }, { status: 400 });
    if (action === "request_changes" && !reviewNote) return NextResponse.json({ error: "اكتب بوضوح ما المطلوب تعديله قبل إعادة التسليم" }, { status: 400 });

    const existing = await getStagePartnerAssignment(assignmentId);
    if (!existing) return NextResponse.json({ error: "الإسناد غير موجود" }, { status: 404 });
    if (existing.status !== "REVIEW" || existing.progress !== 100 || existing.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "لا توجد نسخة تسليم حالية بانتظار المراجعة لهذا الإسناد" }, { status: 409 });
    }
    if (action === "approve_delivery" && (existing.feeAmount == null || Number(existing.feeAmount) <= 0)) {
      return NextResponse.json({ error: "حدد مستحق الشريك لهذه المرحلة قبل اعتماد التسليم" }, { status: 409 });
    }
    if (existing.stageStatus === "CANCELLED" || existing.projectStatus === "CANCELLED") {
      return NextResponse.json({ error: "لا يمكن مراجعة تسليم مرتبط بمرحلة أو مشروع ملغى" }, { status: 409 });
    }

    try {
      const result = await reviewStagePartnerSubmission({
        assignmentId,
        submissionId,
        decision: action === "approve_delivery" ? "APPROVED" : "CHANGES_REQUESTED",
        reviewNote,
      });
      const refreshed = await getStagePartnerAssignment(assignmentId);
      if (!refreshed) return NextResponse.json({ error: "تعذر إعادة تحميل الإسناد بعد المراجعة" }, { status: 500 });

      await writeAdminAudit(db, {
        actorId: access.userId,
        action: action === "approve_delivery" ? "STAGE_PARTNER_DELIVERY_APPROVED" : "STAGE_PARTNER_DELIVERY_CHANGES_REQUESTED",
        category: action === "approve_delivery" ? "POSITIVE" : "NORMAL",
        entityType: "PROJECT_STAGE_PARTNER_ASSIGNMENT",
        entityId: assignmentId,
        entityLabel: `${existing.projectTitle} — ${existing.stageName} — ${existing.partnerName || existing.partnerEmail}`,
        before: { status: existing.status, progress: existing.progress, paymentStatus: existing.paymentStatus, submissionId },
        after: {
          status: refreshed.status,
          progress: refreshed.progress,
          paymentStatus: refreshed.paymentStatus,
          approvedAt: refreshed.approvedAt?.toISOString() || null,
          submissionStatus: result.submission.status,
          reviewNote: result.submission.reviewNote,
        },
      });

      return NextResponse.json({
        assignment: serializeStagePartnerAssignment(refreshed),
        submission: serializeStagePartnerSubmission(result.submission),
      });
    } catch (error) {
      if (error instanceof StagePartnerSubmissionError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  }

  if (action === "record_payment") {
    const assignmentId = safeText(body?.assignmentId);
    const paymentMethod = safeText(body?.paymentMethod, 80);
    const paymentReference = safeText(body?.paymentReference, 160);
    const paidAt = optionalDate(body?.paidAt);
    const paymentProofUrl = safeText(body?.paymentProofUrl, 700) || null;
    const paymentProofName = safeText(body?.paymentProofName, 180) || null;

    if (!assignmentId) return NextResponse.json({ error: "الإسناد مطلوب" }, { status: 400 });
    if (!paymentMethod) return NextResponse.json({ error: "طريقة الدفع مطلوبة" }, { status: 400 });
    if (!paymentReference) return NextResponse.json({ error: "مرجع عملية الدفع مطلوب" }, { status: 400 });
    if (!paidAt || paidAt === undefined || paidAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) return NextResponse.json({ error: "تاريخ الدفع مطلوب وصحيح" }, { status: 400 });
    if (paymentProofUrl && !validProofUrl(paymentProofUrl, assignmentId)) return NextResponse.json({ error: "مرفق إثبات الدفع غير صالح" }, { status: 400 });

    const existing = await getStagePartnerAssignment(assignmentId);
    if (!existing) return NextResponse.json({ error: "الإسناد غير موجود" }, { status: 404 });
    if (existing.status !== "COMPLETED" || existing.paymentStatus !== "APPROVED") {
      return NextResponse.json({ error: "لا يمكن تسجيل الدفع قبل اعتماد تسليم الشريك واستحقاق المبلغ" }, { status: 409 });
    }

    const paid = await recordStagePartnerPayment({ assignmentId, paidAt, paymentMethod, paymentReference, paymentProofUrl, paymentProofName });
    if (!paid) return NextResponse.json({ error: "تعذر تسجيل الدفع. حدّث الصفحة وتحقق من حالة المستحق" }, { status: 409 });

    await writeAdminAudit(db, {
      actorId: access.userId,
      action: "STAGE_PARTNER_PAYMENT_RECORDED",
      category: "SENSITIVE",
      entityType: "PROJECT_STAGE_PARTNER_ASSIGNMENT",
      entityId: assignmentId,
      entityLabel: `${existing.projectTitle} — ${existing.stageName} — ${existing.partnerName || existing.partnerEmail}`,
      before: { paymentStatus: existing.paymentStatus, paidAt: existing.paidAt?.toISOString() || null },
      after: {
        paymentStatus: paid.paymentStatus,
        feeAmount: paid.feeAmount == null ? null : String(paid.feeAmount),
        feeCurrency: paid.feeCurrency,
        paidAt: paid.paidAt?.toISOString() || null,
        paymentMethod: paid.paymentMethod,
        paymentReference: paid.paymentReference,
        paymentProofName: paid.paymentProofName,
        hasPaymentProof: Boolean(paid.paymentProofUrl),
      },
    });
    return NextResponse.json({ assignment: serializeStagePartnerAssignment(paid) });
  }

  const projectStageId = safeText(body?.projectStageId);
  const partnerId = safeText(body?.partnerId);
  if (!projectStageId || !partnerId) return NextResponse.json({ error: "اختر المرحلة وشريك التنفيذ" }, { status: 400 });

  const [stage, partner] = await Promise.all([
    db.projectStage.findUnique({
      where: { id: projectStageId },
      select: { id: true, name: true, status: true, project: { select: { id: true, title: true, status: true, currency: true } } },
    }),
    db.partner.findFirst({
      where: { id: partnerId, status: "ACTIVE", user: { isActive: true } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);
  if (!stage) return NextResponse.json({ error: "مرحلة المشروع غير موجودة" }, { status: 404 });
  if (!partner) return NextResponse.json({ error: "شريك التنفيذ غير موجود أو غير فعال" }, { status: 404 });
  if (["COMPLETED", "CANCELLED"].includes(stage.status)) return NextResponse.json({ error: "لا يمكن إسناد شريك إلى مرحلة مكتملة أو ملغاة" }, { status: 409 });
  if (["COMPLETED", "CANCELLED"].includes(stage.project.status)) return NextResponse.json({ error: "المشروع مغلق ولا يقبل إسنادات جديدة" }, { status: 409 });

  const tasks = stringList(body?.tasks);
  const deliverables = stringList(body?.deliverables);
  if (!tasks.length) return NextResponse.json({ error: "اكتب مهمة واحدة على الأقل للشريك" }, { status: 400 });
  if (!deliverables.length) return NextResponse.json({ error: "حدد تسليمًا واحدًا على الأقل" }, { status: 400 });

  const rawFee = body?.feeAmount;
  const feeAmount = rawFee == null || rawFee === "" ? null : Number(rawFee);
  if (feeAmount == null || !Number.isFinite(feeAmount) || feeAmount <= 0 || feeAmount > 9_999_999_999.99) return NextResponse.json({ error: "حدد مستحقًا صحيحًا أكبر من صفر لشريك التنفيذ" }, { status: 400 });
  const feeCurrency = typeof body?.feeCurrency === "string" ? body.feeCurrency.trim().toUpperCase() : stage.project.currency;
  if (!/^[A-Z]{3}$/.test(feeCurrency)) return NextResponse.json({ error: "عملة المستحق غير صالحة" }, { status: 400 });
  const dueAt = optionalDate(body?.dueAt);
  if (dueAt === undefined) return NextResponse.json({ error: "موعد التسليم الداخلي غير صالح" }, { status: 400 });

  const before = (await listStagePartnerAssignments({ projectId: stage.project.id })).find((assignment) => assignment.projectStageId === projectStageId && assignment.partnerId === partnerId);
  if (before && (before.progress > 0 || before.status !== "ASSIGNED" || before.paymentStatus !== "PENDING")) {
    return NextResponse.json({ error: "بدأ تنفيذ هذا الإسناد بالفعل. لا يمكن تغيير المهام أو المستحق بعد بدء العمل" }, { status: 409 });
  }

  const saved = await upsertStagePartnerAssignment({ projectStageId, partnerId, tasks, deliverables, feeAmount, feeCurrency, dueAt });
  if (!saved) return NextResponse.json({ error: "تعذر حفظ إسناد المرحلة" }, { status: 500 });

  await writeAdminAudit(db, {
    actorId: access.userId,
    action: before ? "STAGE_PARTNER_ASSIGNMENT_UPDATED" : "STAGE_PARTNER_ASSIGNED",
    category: before ? "NORMAL" : "POSITIVE",
    entityType: "PROJECT_STAGE_PARTNER_ASSIGNMENT",
    entityId: saved.id,
    entityLabel: `${stage.project.title} — ${stage.name}`,
    before: before ? {
      projectStageId,
      partnerId: before.partnerId,
      tasks: before.tasks,
      deliverables: before.deliverables,
      feeAmount: before.feeAmount == null ? null : String(before.feeAmount),
      feeCurrency: before.feeCurrency,
      dueAt: before.dueAt?.toISOString() || null,
    } : undefined,
    after: { projectStageId, partnerId, partnerEmail: partner.user.email, tasks, deliverables, feeAmount, feeCurrency, dueAt: dueAt?.toISOString() || null, paymentStatus: saved.paymentStatus },
  });

  return NextResponse.json({ assignment: serializeStagePartnerAssignment(saved) }, { status: before ? 200 : 201 });
}
