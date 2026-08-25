-- Stage-scoped execution assignments for CyberWeel partners.
-- This intentionally keeps the existing PartnerProject table for legacy records while
-- moving new execution work to the project-stage level.

CREATE TABLE "ProjectStagePartnerAssignment" (
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
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentProofUrl" TEXT,
    "paymentProofName" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStagePartnerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectStagePartnerAssignment_partnerId_projectStageId_key"
ON "ProjectStagePartnerAssignment"("partnerId", "projectStageId");

CREATE INDEX "ProjectStagePartnerAssignment_projectStageId_idx"
ON "ProjectStagePartnerAssignment"("projectStageId");

CREATE INDEX "ProjectStagePartnerAssignment_partnerId_status_idx"
ON "ProjectStagePartnerAssignment"("partnerId", "status");

CREATE INDEX "ProjectStagePartnerAssignment_paymentStatus_idx"
ON "ProjectStagePartnerAssignment"("paymentStatus");

ALTER TABLE "ProjectStagePartnerAssignment"
ADD CONSTRAINT "ProjectStagePartnerAssignment_projectStageId_fkey"
FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectStagePartnerAssignment"
ADD CONSTRAINT "ProjectStagePartnerAssignment_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectStagePartnerAssignment"
ADD CONSTRAINT "ProjectStagePartnerAssignment_progress_check"
CHECK ("progress" >= 0 AND "progress" <= 100);

ALTER TABLE "ProjectStagePartnerAssignment"
ADD CONSTRAINT "ProjectStagePartnerAssignment_status_check"
CHECK ("status" IN ('ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));
