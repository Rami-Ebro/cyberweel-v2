-- Prevent the upload callback and completion endpoint from linking the same client-submission Blob twice.
-- Scope is intentionally limited to client submission Blobs so other ClientFile URL reuse is unaffected.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "url"
      FROM "ClientFile"
      WHERE "storageProvider" = 'VERCEL_BLOB'
        AND "source" = 'CLIENT'
        AND "kind" = 'CLIENT_SUBMISSION'
      GROUP BY "url"
      HAVING COUNT(DISTINCT ("projectId", "submissionId")) > 1
    ) AS conflicts
  ) THEN
    RAISE EXCEPTION 'CLIENT_SUBMISSION_BLOB_CROSSLINK_EXISTS';
  END IF;
END;
$$;

-- Same-owner duplicates are safe to collapse. Preserve the largest verified/stored size on the kept row.
WITH grouped AS (
  SELECT "url", MIN("id") AS keep_id, MAX("size") AS max_size
  FROM "ClientFile"
  WHERE "storageProvider" = 'VERCEL_BLOB'
    AND "source" = 'CLIENT'
    AND "kind" = 'CLIENT_SUBMISSION'
  GROUP BY "url"
  HAVING COUNT(*) > 1
)
UPDATE "ClientFile" AS kept
SET "size" = grouped.max_size
FROM grouped
WHERE kept."id" = grouped.keep_id
  AND grouped.max_size IS NOT NULL
  AND kept."size" IS DISTINCT FROM grouped.max_size;

WITH grouped AS (
  SELECT "url", MIN("id") AS keep_id
  FROM "ClientFile"
  WHERE "storageProvider" = 'VERCEL_BLOB'
    AND "source" = 'CLIENT'
    AND "kind" = 'CLIENT_SUBMISSION'
  GROUP BY "url"
  HAVING COUNT(*) > 1
)
DELETE FROM "ClientFile" AS duplicate
USING grouped
WHERE duplicate."url" = grouped."url"
  AND duplicate."id" <> grouped.keep_id
  AND duplicate."storageProvider" = 'VERCEL_BLOB'
  AND duplicate."source" = 'CLIENT'
  AND duplicate."kind" = 'CLIENT_SUBMISSION';

CREATE UNIQUE INDEX IF NOT EXISTS "ClientFile_client_submission_blob_url_key"
ON "ClientFile" ("url")
WHERE "storageProvider" = 'VERCEL_BLOB'
  AND "source" = 'CLIENT'
  AND "kind" = 'CLIENT_SUBMISSION';
