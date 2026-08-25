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

ALTER TABLE "ProjectStagePartnerAssignment" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "ProjectStagePartnerAssignment" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "ProjectStagePartnerAssignment" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;
ALTER TABLE "ProjectStagePartnerAssignment" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "ProjectStagePartnerAssignment" ADD COLUMN IF NOT EXISTS "paymentProofName" TEXT;

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

-- Explicit, stable order for ProjectStage. The createdAt compatibility adjustment keeps
-- legacy readers deterministic until every reader is switched to the explicit position.
ALTER TABLE "ProjectStage"
ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;

WITH stage_text AS (
  SELECT
    cp."id" AS "projectId",
    btrim(item.stage_name) AS "name",
    item.ordinality::INTEGER AS "position",
    row_number() OVER (
      PARTITION BY cp."id", btrim(item.stage_name)
      ORDER BY item.ordinality
    ) AS occurrence
  FROM "ClientProject" cp
  CROSS JOIN LATERAL unnest(string_to_array(COALESCE(cp."stages", ''), E'\n'))
    WITH ORDINALITY AS item(stage_name, ordinality)
  WHERE btrim(item.stage_name) <> ''
), stage_rows AS (
  SELECT
    ps."id",
    ps."projectId",
    ps."name",
    row_number() OVER (
      PARTITION BY ps."projectId", ps."name"
      ORDER BY ps."createdAt", ps."id"
    ) AS occurrence
  FROM "ProjectStage" ps
)
UPDATE "ProjectStage" ps
SET "position" = st."position"
FROM stage_rows sr
JOIN stage_text st
  ON st."projectId" = sr."projectId"
 AND st."name" = sr."name"
 AND st.occurrence = sr.occurrence
WHERE ps."id" = sr."id"
  AND ps."position" <= 0;

WITH current_max AS (
  SELECT "projectId", COALESCE(MAX(NULLIF("position", 0)), 0) AS max_position
  FROM "ProjectStage"
  GROUP BY "projectId"
), missing AS (
  SELECT
    ps."id",
    cm.max_position + row_number() OVER (
      PARTITION BY ps."projectId"
      ORDER BY ps."createdAt", ps."id"
    )::INTEGER AS new_position
  FROM "ProjectStage" ps
  JOIN current_max cm ON cm."projectId" = ps."projectId"
  WHERE ps."position" <= 0
)
UPDATE "ProjectStage" ps
SET "position" = missing.new_position
FROM missing
WHERE ps."id" = missing."id";

WITH bases AS (
  SELECT "projectId", MIN("createdAt") AS base_created_at
  FROM "ProjectStage"
  GROUP BY "projectId"
)
UPDATE "ProjectStage" ps
SET "createdAt" = bases.base_created_at + ((ps."position" - 1) * INTERVAL '1 millisecond')
FROM bases
WHERE bases."projectId" = ps."projectId";

CREATE INDEX IF NOT EXISTS "ProjectStage_projectId_position_idx"
ON "ProjectStage"("projectId", "position");

CREATE OR REPLACE FUNCTION cyberweel_set_project_stage_position()
RETURNS trigger AS $$
DECLARE
  next_position INTEGER;
  latest_created TIMESTAMP(3);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW."projectId"));

  IF NEW."position" IS NULL OR NEW."position" <= 0 THEN
    SELECT COALESCE(MAX("position"), 0) + 1
      INTO next_position
      FROM "ProjectStage"
     WHERE "projectId" = NEW."projectId";
    NEW."position" := next_position;
  END IF;

  SELECT MAX("createdAt")
    INTO latest_created
    FROM "ProjectStage"
   WHERE "projectId" = NEW."projectId";

  IF latest_created IS NOT NULL AND NEW."createdAt" <= latest_created THEN
    NEW."createdAt" := latest_created + INTERVAL '1 millisecond';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ProjectStage_assign_position" ON "ProjectStage";
CREATE TRIGGER "ProjectStage_assign_position"
BEFORE INSERT ON "ProjectStage"
FOR EACH ROW
EXECUTE FUNCTION cyberweel_set_project_stage_position();
