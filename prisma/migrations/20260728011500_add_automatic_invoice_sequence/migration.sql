CREATE TABLE "InvoiceSequence" (
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("year")
);

INSERT INTO "InvoiceSequence" ("year", "lastNumber", "updatedAt")
SELECT
  CAST(SUBSTRING("number" FROM 4 FOR 4) AS INTEGER),
  MAX(CAST(SUBSTRING("number" FROM 9) AS INTEGER)),
  CURRENT_TIMESTAMP
FROM "ClientInvoice"
WHERE "number" ~ '^CW-[0-9]{4}-[0-9]+$'
GROUP BY CAST(SUBSTRING("number" FROM 4 FOR 4) AS INTEGER)
ON CONFLICT ("year") DO UPDATE
SET
  "lastNumber" = GREATEST("InvoiceSequence"."lastNumber", EXCLUDED."lastNumber"),
  "updatedAt" = CURRENT_TIMESTAMP;
