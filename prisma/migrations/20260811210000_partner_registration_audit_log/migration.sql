ALTER TABLE "CollaborationApplication"
  ADD COLUMN IF NOT EXISTS "countryRegion" TEXT,
  ADD COLUMN IF NOT EXISTS "partnerType" TEXT,
  ADD COLUMN IF NOT EXISTS "workAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "supportServices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER,
  ADD COLUMN IF NOT EXISTS "availabilityType" TEXT,
  ADD COLUMN IF NOT EXISTS "weeklyHours" INTEGER,
  ADD COLUMN IF NOT EXISTS "cooperationTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "shortBio" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "otherPaymentMethod" TEXT;

ALTER TABLE "Partner"
  ADD COLUMN IF NOT EXISTS "countryRegion" TEXT,
  ADD COLUMN IF NOT EXISTS "partnerType" TEXT,
  ADD COLUMN IF NOT EXISTS "workAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "supportServices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER,
  ADD COLUMN IF NOT EXISTS "availabilityType" TEXT,
  ADD COLUMN IF NOT EXISTS "weeklyHours" INTEGER,
  ADD COLUMN IF NOT EXISTS "cooperationTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "shortBio" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "otherPaymentMethod" TEXT;

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "entityLabel" TEXT,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_entityType_entityId_createdAt_idx" ON "AdminAuditLog"("entityType", "entityId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AdminAuditLog"
    ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
