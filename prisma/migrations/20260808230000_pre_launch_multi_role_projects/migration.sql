-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing clients
UPDATE "User" SET "clientEnabled" = true WHERE "role" = 'CLIENT';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_name_idx" ON "User"("name");

-- AlterTable
ALTER TABLE "PartnerProject" ADD COLUMN IF NOT EXISTS "clientProjectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerProject_clientProjectId_key" ON "PartnerProject"("clientProjectId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerProject_clientProjectId_fkey'
  ) THEN
    ALTER TABLE "PartnerProject"
      ADD CONSTRAINT "PartnerProject_clientProjectId_fkey"
      FOREIGN KEY ("clientProjectId") REFERENCES "ClientProject"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
