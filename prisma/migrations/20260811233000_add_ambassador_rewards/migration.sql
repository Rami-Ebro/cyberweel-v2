CREATE TYPE "ProjectStageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectStagePaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "AmbassadorRewardStatus" AS ENUM ('EXPECTED', 'EARNED', 'PAID', 'CANCELLED');
ALTER TYPE "ClientProjectStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "ClientProject"
  ADD COLUMN "ambassadorRewardRate" DECIMAL(5,2),
  ADD COLUMN "ambassadorQualifiedAt" TIMESTAMP(3);

CREATE TABLE "AmbassadorRewardLevel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minSuccessfulReferrals" INTEGER NOT NULL,
  "rate" DECIMAL(5,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbassadorRewardLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectStage" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "ProjectStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "paymentStatus" "ProjectStagePaymentStatus" NOT NULL DEFAULT 'PENDING',
  "startsAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmbassadorReward" (
  "id" TEXT NOT NULL,
  "ambassadorId" TEXT NOT NULL,
  "referralId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "projectStageId" TEXT NOT NULL,
  "rate" DECIMAL(5,2) NOT NULL,
  "baseAmount" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "AmbassadorRewardStatus" NOT NULL DEFAULT 'EXPECTED',
  "earnedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelReason" TEXT,
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmbassadorReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbassadorRewardLevel_minSuccessfulReferrals_key" ON "AmbassadorRewardLevel"("minSuccessfulReferrals");
CREATE INDEX "AmbassadorRewardLevel_isActive_minSuccessfulReferrals_idx" ON "AmbassadorRewardLevel"("isActive", "minSuccessfulReferrals");
CREATE INDEX "ProjectStage_projectId_status_idx" ON "ProjectStage"("projectId", "status");
CREATE INDEX "ProjectStage_paymentStatus_idx" ON "ProjectStage"("paymentStatus");
CREATE UNIQUE INDEX "AmbassadorReward_ambassadorId_projectStageId_key" ON "AmbassadorReward"("ambassadorId", "projectStageId");
CREATE INDEX "AmbassadorReward_ambassadorId_status_idx" ON "AmbassadorReward"("ambassadorId", "status");
CREATE INDEX "AmbassadorReward_projectId_idx" ON "AmbassadorReward"("projectId");
CREATE INDEX "AmbassadorReward_referralId_idx" ON "AmbassadorReward"("referralId");
CREATE INDEX "AmbassadorReward_clientId_idx" ON "AmbassadorReward"("clientId");
CREATE INDEX "AmbassadorReward_status_createdAt_idx" ON "AmbassadorReward"("status", "createdAt");

ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AmbassadorReward" ADD CONSTRAINT "AmbassadorReward_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbassadorReward" ADD CONSTRAINT "AmbassadorReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "PartnerReferral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbassadorReward" ADD CONSTRAINT "AmbassadorReward_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbassadorReward" ADD CONSTRAINT "AmbassadorReward_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmbassadorReward" ADD CONSTRAINT "AmbassadorReward_projectStageId_fkey" FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "AmbassadorRewardLevel" ("id", "name", "minSuccessfulReferrals", "rate", "sortOrder", "updatedAt") VALUES
  ('default-ambassador-level-1', 'منطلق', 1, 10.00, 1, CURRENT_TIMESTAMP),
  ('default-ambassador-level-2', 'نشط', 2, 15.00, 2, CURRENT_TIMESTAMP),
  ('default-ambassador-level-3', 'نخبة', 5, 20.00, 3, CURRENT_TIMESTAMP);
