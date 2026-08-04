-- Preserve free-form decisions as notes before converting the field to a controlled enum.
CREATE TYPE "ReferralDecision" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'CONVERTED_TO_CLIENT', 'CANCELLED');
CREATE TYPE "CommissionType" AS ENUM ('FIXED', 'PERCENTAGE');

ALTER TABLE "PartnerReferral"
ADD COLUMN "adminNotes" TEXT,
ADD COLUMN "commissionType" "CommissionType",
ADD COLUMN "commissionRate" DECIMAL(5,2),
ADD COLUMN "commissionBaseAmount" DECIMAL(12,2),
ADD COLUMN "updatedById" TEXT;

UPDATE "PartnerReferral"
SET "adminNotes" = "adminDecision"
WHERE "adminDecision" IS NOT NULL AND BTRIM("adminDecision") <> '';

ALTER TABLE "PartnerReferral"
ALTER COLUMN "adminDecision" TYPE "ReferralDecision"
USING (
  CASE
    WHEN "adminDecision" IS NULL OR BTRIM("adminDecision") = '' THEN NULL
    WHEN UPPER("adminDecision") IN ('ACCEPTED', 'مقبولة') THEN 'ACCEPTED'
    WHEN UPPER("adminDecision") IN ('REJECTED', 'مرفوضة') THEN 'REJECTED'
    WHEN UPPER("adminDecision") IN ('CONVERTED_TO_CLIENT', 'تحولت إلى عميل') THEN 'CONVERTED_TO_CLIENT'
    WHEN UPPER("adminDecision") IN ('CANCELLED', 'ملغاة') THEN 'CANCELLED'
    ELSE 'PENDING_REVIEW'
  END
)::"ReferralDecision";

ALTER TYPE "ReferralStatus" RENAME TO "ReferralStatus_old";
CREATE TYPE "ReferralStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'AWAITING_RESPONSE', 'NOT_INTERESTED', 'CONVERTED');
ALTER TABLE "PartnerReferral" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PartnerReferral"
ALTER COLUMN "status" TYPE "ReferralStatus"
USING (
  CASE "status"::text
    WHEN 'QUALIFIED' THEN 'INTERESTED'
    WHEN 'REJECTED' THEN 'NOT_INTERESTED'
    ELSE "status"::text
  END
)::"ReferralStatus";
DROP TYPE "ReferralStatus_old";
ALTER TABLE "PartnerReferral" ALTER COLUMN "status" SET DEFAULT 'NEW';

ALTER TYPE "CommissionStatus" RENAME TO "CommissionStatus_old";
CREATE TYPE "CommissionStatus" AS ENUM ('VERIFYING', 'ON_HOLD', 'NOT_ELIGIBLE', 'DUE', 'PAID');
ALTER TABLE "PartnerReferral" ALTER COLUMN "commissionStatus" DROP DEFAULT;
ALTER TABLE "PartnerReferral"
ALTER COLUMN "commissionStatus" TYPE "CommissionStatus"
USING (
  CASE "commissionStatus"::text
    WHEN 'PENDING' THEN 'VERIFYING'
    WHEN 'APPROVED' THEN 'DUE'
    WHEN 'CANCELLED' THEN 'NOT_ELIGIBLE'
    ELSE "commissionStatus"::text
  END
)::"CommissionStatus";
DROP TYPE "CommissionStatus_old";
ALTER TABLE "PartnerReferral" ALTER COLUMN "commissionStatus" SET DEFAULT 'VERIFYING';

CREATE INDEX "PartnerReferral_updatedById_idx" ON "PartnerReferral"("updatedById");
ALTER TABLE "PartnerReferral"
ADD CONSTRAINT "PartnerReferral_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
