-- Preview-only idempotent schema addition for stage-scoped execution assignments.
-- Production uses the reviewed Prisma migration instead.

CREATE TABLE IF NOT EXISTS "ProjectStagePartnerAssignment" (
    "id" TEXT NOT NULL,
    "projectStageId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "tasks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "deliverables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "feeAmount" DECIMAL(12,2),
    "feeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "ProjectPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectStagePartnerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectStagePartnerAssignment_partnerId_projectStageId_key"
ON "ProjectStagePartnerAssignment"("partnerId", "projectStageId");

CREATE INDEX IF NOT EXISTS "ProjectStagePartnerAssignment_projectStageId_idx"
ON "ProjectStagePartnerAssignment"("projectStageId");

CREATE INDEX IF NOT EXISTS "ProjectStagePartnerAssignment_partnerId_status_idx"
ON "ProjectStagePartnerAssignment"("partnerId", "status");

CREATE INDEX IF NOT EXISTS "ProjectStagePartnerAssignment_paymentStatus_idx"
ON "ProjectStagePartnerAssignment"("paymentStatus");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectStagePartnerAssignment_projectStageId_fkey') THEN
    ALTER TABLE "ProjectStagePartnerAssignment"
      ADD CONSTRAINT "ProjectStagePartnerAssignment_projectStageId_fkey"
      FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectStagePartnerAssignment_partnerId_fkey') THEN
    ALTER TABLE "ProjectStagePartnerAssignment"
      ADD CONSTRAINT "ProjectStagePartnerAssignment_partnerId_fkey"
      FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectStagePartnerAssignment_progress_check') THEN
    ALTER TABLE "ProjectStagePartnerAssignment"
      ADD CONSTRAINT "ProjectStagePartnerAssignment_progress_check"
      CHECK ("progress" >= 0 AND "progress" <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectStagePartnerAssignment_status_check') THEN
    ALTER TABLE "ProjectStagePartnerAssignment"
      ADD CONSTRAINT "ProjectStagePartnerAssignment_status_check"
      CHECK ("status" IN ('ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));
  END IF;
END $$;
