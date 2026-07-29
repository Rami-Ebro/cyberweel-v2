-- Add execution-partner project progress and project dues without changing existing records.
CREATE TYPE "ProjectPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

ALTER TABLE "PartnerProject"
  ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "feeAmount" DECIMAL(12,2),
  ADD COLUMN "feeCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "paymentStatus" "ProjectPaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paidAt" TIMESTAMP(3);

ALTER TABLE "PartnerProject"
  ADD CONSTRAINT "PartnerProject_progress_check"
  CHECK ("progress" >= 0 AND "progress" <= 100);
