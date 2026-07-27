ALTER TABLE "ClientProject"
ADD COLUMN "agreementDetails" TEXT,
ADD COLUMN "financialPlan" TEXT,
ADD COLUMN "stages" TEXT,
ADD COLUMN "links" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "notes" TEXT;
