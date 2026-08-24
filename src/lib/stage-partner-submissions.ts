import type { ProjectStagePartnerSubmission } from "@prisma/client";
import { db } from "@/lib/db";

export type StagePartnerSubmissionStatus = "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";

export type SerializedStagePartnerSubmission = {
  id: string;
  assignmentId: string;
  version: number;
  note: string | null;
  links: string[];
  files: Array<{ name: string; type: string | null; path: string }>;
  status: StagePartnerSubmissionStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class StagePartnerSubmissionError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
    this.name = "StagePartnerSubmissionError";
  }
}

export function serializeStagePartnerSubmission(row: ProjectStagePartnerSubmission): SerializedStagePartnerSubmission {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    version: row.version,
    note: row.note,
    links: row.links,
    files: row.fileUrls.map((_, index) => ({
      name: row.fileNames[index] || `ملف ${index + 1}`,
      type: row.fileTypes[index] || null,
      path: `/api/partner/stage-assignments/${row.assignmentId}/submissions/${row.id}/file?index=${index}`,
    })),
    status: row.status as StagePartnerSubmissionStatus,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listStagePartnerSubmissions(assignmentIds: string[]) {
  if (!assignmentIds.length) return [];
  return db.projectStagePartnerSubmission.findMany({
    where: { assignmentId: { in: assignmentIds } },
    orderBy: [{ assignmentId: "asc" }, { version: "asc" }],
  });
}

export async function getStagePartnerSubmission(submissionId: string, assignmentId?: string) {
  return db.projectStagePartnerSubmission.findFirst({
    where: { id: submissionId, ...(assignmentId ? { assignmentId } : {}) },
  });
}

export async function createStagePartnerSubmission(input: {
  assignmentId: string;
  note: string | null;
  links: string[];
  fileUrls: string[];
  fileNames: string[];
  fileTypes: string[];
}) {
  return db.$transaction(async (tx) => {
    const assignment = await tx.projectStagePartnerAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        submissions: { orderBy: { version: "desc" }, take: 1 },
        projectStage: { select: { status: true, project: { select: { status: true } } } },
      },
    });
    if (!assignment) throw new StagePartnerSubmissionError("إسناد المرحلة غير موجود", 404);
    if (assignment.paymentStatus !== "PENDING" || assignment.status === "COMPLETED") {
      throw new StagePartnerSubmissionError("اعتمدت الإدارة هذا التسليم بالفعل، ولا يمكن إرسال نسخة جديدة");
    }
    if (["COMPLETED", "CANCELLED"].includes(assignment.projectStage.status) || assignment.projectStage.project.status === "COMPLETED" || assignment.projectStage.project.status === "CANCELLED") {
      throw new StagePartnerSubmissionError("المرحلة أو المشروع مغلق ولا يقبل تسليمات جديدة");
    }
    if (assignment.projectStage.status === "NOT_STARTED") {
      throw new StagePartnerSubmissionError("لا يمكن إرسال التسليم قبل أن تبدأ الإدارة هذه المرحلة");
    }

    const latest = assignment.submissions[0] || null;
    if (latest?.status === "SUBMITTED") {
      throw new StagePartnerSubmissionError("لديك نسخة بانتظار مراجعة الإدارة. انتظر قرار المراجعة قبل إرسال نسخة جديدة");
    }

    const version = (latest?.version || 0) + 1;
    const submission = await tx.projectStagePartnerSubmission.create({
      data: {
        assignmentId: input.assignmentId,
        version,
        note: input.note,
        links: input.links,
        fileUrls: input.fileUrls,
        fileNames: input.fileNames,
        fileTypes: input.fileTypes,
        status: "SUBMITTED",
      },
    });

    await tx.projectStagePartnerAssignment.update({
      where: { id: input.assignmentId },
      data: { status: "REVIEW", progress: 100 },
    });

    return submission;
  });
}

export async function reviewStagePartnerSubmission(input: {
  assignmentId: string;
  submissionId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  reviewNote?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const assignment = await tx.projectStagePartnerAssignment.findUnique({
      where: { id: input.assignmentId },
      include: { submissions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!assignment) throw new StagePartnerSubmissionError("إسناد المرحلة غير موجود", 404);
    const latest = assignment.submissions[0] || null;
    if (!latest || latest.id !== input.submissionId || latest.status !== "SUBMITTED") {
      throw new StagePartnerSubmissionError("هذه ليست نسخة التسليم الحالية بانتظار المراجعة. حدّث الصفحة وراجع أحدث نسخة");
    }
    if (assignment.status !== "REVIEW" || assignment.progress !== 100 || assignment.paymentStatus !== "PENDING") {
      throw new StagePartnerSubmissionError("حالة الإسناد لا تسمح بمراجعة هذا التسليم حاليًا");
    }

    const now = new Date();
    if (input.decision === "APPROVED") {
      const submission = await tx.projectStagePartnerSubmission.update({
        where: { id: latest.id },
        data: { status: "APPROVED", reviewNote: input.reviewNote || null, reviewedAt: now },
      });
      const updatedAssignment = await tx.projectStagePartnerAssignment.update({
        where: { id: input.assignmentId },
        data: {
          status: "COMPLETED",
          progress: 100,
          paymentStatus: "APPROVED",
          approvedAt: assignment.approvedAt || now,
        },
      });
      return { submission, assignment: updatedAssignment };
    }

    const reviewNote = input.reviewNote?.trim() || "";
    if (!reviewNote) throw new StagePartnerSubmissionError("اكتب ملاحظة التعديل المطلوبة للشريك", 400);
    const submission = await tx.projectStagePartnerSubmission.update({
      where: { id: latest.id },
      data: { status: "CHANGES_REQUESTED", reviewNote, reviewedAt: now },
    });
    const updatedAssignment = await tx.projectStagePartnerAssignment.update({
      where: { id: input.assignmentId },
      data: { status: "IN_PROGRESS", progress: 99 },
    });
    return { submission, assignment: updatedAssignment };
  });
}
