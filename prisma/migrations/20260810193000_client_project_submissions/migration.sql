-- CreateTable
CREATE TABLE "ClientSubmission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "note" TEXT,
    "links" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSubmission_pkey" PRIMARY KEY ("id")
);

-- AlterTable: existing project files remain administration files.
ALTER TABLE "ClientFile"
  ADD COLUMN "submissionId" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ADMIN';

-- CreateIndex
CREATE INDEX "ClientSubmission_projectId_createdAt_idx" ON "ClientSubmission"("projectId", "createdAt");
CREATE INDEX "ClientSubmission_status_idx" ON "ClientSubmission"("status");
CREATE INDEX "ClientFile_submissionId_idx" ON "ClientFile"("submissionId");
CREATE INDEX "ClientFile_source_idx" ON "ClientFile"("source");

-- AddForeignKey
ALTER TABLE "ClientSubmission"
  ADD CONSTRAINT "ClientSubmission_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientFile"
  ADD CONSTRAINT "ClientFile_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "ClientSubmission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
