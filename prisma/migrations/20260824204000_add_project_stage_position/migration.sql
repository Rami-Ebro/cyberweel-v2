-- Stable execution order for project stages.
-- The explicit position is the canonical order. createdAt is nudged only as a compatibility
-- bridge for legacy readers that still sort by creation time.

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

-- Keep legacy createdAt readers deterministic without changing the real creation day.
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
