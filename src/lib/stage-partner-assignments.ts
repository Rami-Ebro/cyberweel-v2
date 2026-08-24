import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type StagePartnerAssignmentStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

export type StagePartnerPaymentStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

export type StagePartnerAssignmentRow = {
  id: string;
  projectStageId: string;
  partnerId: string;
  tasks: string[];
  deliverables: string[];
  status: StagePartnerAssignmentStatus;
  progress: number;
  feeAmount: Prisma.Decimal | string | number | null;
  feeCurrency: string;
  paymentStatus: StagePartnerPaymentStatus;
  paidAt: Date | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  projectTitle: string;
  projectDescription: string | null;
  projectStatus: string;
  projectProgress: number;
  stageName: string;
  stageStatus: string;
  stagePaymentStatus: string;
  stageAmount: Prisma.Decimal | string | number;
  stageCurrency: string;
  partnerName: string | null;
  partnerEmail: string;
};

export type SerializedStagePartnerAssignment = Omit<StagePartnerAssignmentRow, "feeAmount" | "stageAmount"> & {
  feeAmount: string | null;
  stageAmount: string;
};

export function serializeStagePartnerAssignment(row: StagePartnerAssignmentRow): SerializedStagePartnerAssignment {
  return {
    ...row,
    feeAmount: row.feeAmount == null ? null : String(row.feeAmount),
    stageAmount: String(row.stageAmount),
  };
}

export async function listStagePartnerAssignments(options: { projectId?: string; partnerId?: string } = {}) {
  const filters: Prisma.Sql[] = [];
  if (options.projectId) filters.push(Prisma.sql`ps."projectId" = ${options.projectId}`);
  if (options.partnerId) filters.push(Prisma.sql`a."partnerId" = ${options.partnerId}`);
  const where = filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;

  return db.$queryRaw<StagePartnerAssignmentRow[]>(Prisma.sql`
    SELECT
      a."id",
      a."projectStageId",
      a."partnerId",
      a."tasks",
      a."deliverables",
      a."status",
      a."progress",
      a."feeAmount",
      a."feeCurrency",
      a."paymentStatus",
      a."paidAt",
      a."dueAt",
      a."createdAt",
      a."updatedAt",
      ps."projectId",
      cp."title" AS "projectTitle",
      cp."description" AS "projectDescription",
      cp."status"::text AS "projectStatus",
      cp."progress" AS "projectProgress",
      ps."name" AS "stageName",
      ps."status"::text AS "stageStatus",
      ps."paymentStatus"::text AS "stagePaymentStatus",
      ps."amount" AS "stageAmount",
      ps."currency" AS "stageCurrency",
      u."name" AS "partnerName",
      u."email" AS "partnerEmail"
    FROM "ProjectStagePartnerAssignment" a
    INNER JOIN "ProjectStage" ps ON ps."id" = a."projectStageId"
    INNER JOIN "ClientProject" cp ON cp."id" = ps."projectId"
    INNER JOIN "Partner" p ON p."id" = a."partnerId"
    INNER JOIN "User" u ON u."id" = p."userId"
    ${where}
    ORDER BY cp."createdAt" DESC, ps."createdAt" ASC, a."createdAt" ASC
  `);
}

export async function getStagePartnerAssignment(id: string, partnerId?: string) {
  const rows = await db.$queryRaw<StagePartnerAssignmentRow[]>(Prisma.sql`
    SELECT
      a."id",
      a."projectStageId",
      a."partnerId",
      a."tasks",
      a."deliverables",
      a."status",
      a."progress",
      a."feeAmount",
      a."feeCurrency",
      a."paymentStatus",
      a."paidAt",
      a."dueAt",
      a."createdAt",
      a."updatedAt",
      ps."projectId",
      cp."title" AS "projectTitle",
      cp."description" AS "projectDescription",
      cp."status"::text AS "projectStatus",
      cp."progress" AS "projectProgress",
      ps."name" AS "stageName",
      ps."status"::text AS "stageStatus",
      ps."paymentStatus"::text AS "stagePaymentStatus",
      ps."amount" AS "stageAmount",
      ps."currency" AS "stageCurrency",
      u."name" AS "partnerName",
      u."email" AS "partnerEmail"
    FROM "ProjectStagePartnerAssignment" a
    INNER JOIN "ProjectStage" ps ON ps."id" = a."projectStageId"
    INNER JOIN "ClientProject" cp ON cp."id" = ps."projectId"
    INNER JOIN "Partner" p ON p."id" = a."partnerId"
    INNER JOIN "User" u ON u."id" = p."userId"
    WHERE a."id" = ${id}
      ${partnerId ? Prisma.sql`AND a."partnerId" = ${partnerId}` : Prisma.empty}
    LIMIT 1
  `);
  return rows[0] || null;
}

export async function upsertStagePartnerAssignment(input: {
  projectStageId: string;
  partnerId: string;
  tasks: string[];
  deliverables: string[];
  feeAmount: number | null;
  feeCurrency: string;
  dueAt: Date | null;
  paymentStatus?: StagePartnerPaymentStatus;
}) {
  const id = randomUUID();
  const paymentStatus = input.paymentStatus || "PENDING";
  const rows = await db.$queryRaw<StagePartnerAssignmentRow[]>(Prisma.sql`
    INSERT INTO "ProjectStagePartnerAssignment" (
      "id", "projectStageId", "partnerId", "tasks", "deliverables",
      "feeAmount", "feeCurrency", "paymentStatus", "dueAt", "updatedAt"
    ) VALUES (
      ${id}, ${input.projectStageId}, ${input.partnerId}, ${input.tasks}, ${input.deliverables},
      ${input.feeAmount}, ${input.feeCurrency}, ${paymentStatus}::"ProjectPaymentStatus", ${input.dueAt}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("partnerId", "projectStageId") DO UPDATE SET
      "tasks" = EXCLUDED."tasks",
      "deliverables" = EXCLUDED."deliverables",
      "feeAmount" = EXCLUDED."feeAmount",
      "feeCurrency" = EXCLUDED."feeCurrency",
      "paymentStatus" = EXCLUDED."paymentStatus",
      "paidAt" = CASE WHEN EXCLUDED."paymentStatus" = 'PAID'::"ProjectPaymentStatus" THEN COALESCE("ProjectStagePartnerAssignment"."paidAt", CURRENT_TIMESTAMP) ELSE NULL END,
      "dueAt" = EXCLUDED."dueAt",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING
      "id", "projectStageId", "partnerId", "tasks", "deliverables", "status", "progress",
      "feeAmount", "feeCurrency", "paymentStatus", "paidAt", "dueAt", "createdAt", "updatedAt",
      ''::text AS "projectId", ''::text AS "projectTitle", NULL::text AS "projectDescription",
      ''::text AS "projectStatus", 0::integer AS "projectProgress", ''::text AS "stageName",
      ''::text AS "stageStatus", ''::text AS "stagePaymentStatus", 0::numeric AS "stageAmount",
      ''::text AS "stageCurrency", NULL::text AS "partnerName", ''::text AS "partnerEmail"
  `);
  const assignmentId = rows[0]?.id || id;
  return getStagePartnerAssignment(assignmentId);
}

export async function updateStagePartnerProgress(input: {
  assignmentId: string;
  partnerId: string;
  progress: number;
}) {
  const status: StagePartnerAssignmentStatus = input.progress >= 100 ? "REVIEW" : input.progress > 0 ? "IN_PROGRESS" : "ASSIGNED";
  await db.$executeRaw(Prisma.sql`
    UPDATE "ProjectStagePartnerAssignment"
    SET "progress" = ${input.progress}, "status" = ${status}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.assignmentId} AND "partnerId" = ${input.partnerId}
  `);
  return getStagePartnerAssignment(input.assignmentId, input.partnerId);
}

export async function deleteStagePartnerAssignment(id: string) {
  return db.$executeRaw(Prisma.sql`DELETE FROM "ProjectStagePartnerAssignment" WHERE "id" = ${id}`);
}

export async function stageExecutionProgressByStageIds(stageIds: string[]) {
  if (!stageIds.length) return new Map<string, number>();
  const rows = await db.$queryRaw<Array<{ projectStageId: string; progress: number }>>(Prisma.sql`
    SELECT "projectStageId", ROUND(AVG("progress"))::integer AS "progress"
    FROM "ProjectStagePartnerAssignment"
    WHERE "projectStageId" IN (${Prisma.join(stageIds)}) AND "status" <> 'CANCELLED'
    GROUP BY "projectStageId"
  `);
  return new Map(rows.map((row) => [row.projectStageId, Number(row.progress || 0)]));
}
