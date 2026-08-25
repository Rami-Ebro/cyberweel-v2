-- Versioned internal delivery submissions for stage-scoped partner assignments.
-- Submission data stays internal to CyberWeel and is never linked to the client workspace automatically.

CREATE TABLE "ProjectStagePartnerSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "note" TEXT,
    "links" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fileUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fileNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fileTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStagePartnerSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectStagePartnerSubmission_assignmentId_version_key"
ON "ProjectStagePartnerSubmission"("assignmentId", "version");

CREATE INDEX "ProjectStagePartnerSubmission_assignmentId_createdAt_idx"
ON "ProjectStagePartnerSubmission"("assignmentId", "createdAt");

CREATE INDEX "ProjectStagePartnerSubmission_status_idx"
ON "ProjectStagePartnerSubmission"("status");

ALTER TABLE "ProjectStagePartnerSubmission"
ADD CONSTRAINT "ProjectStagePartnerSubmission_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "ProjectStagePartnerAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectStagePartnerSubmission"
ADD CONSTRAINT "ProjectStagePartnerSubmission_status_check"
CHECK ("status" IN ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED'));

ALTER TABLE "ProjectStagePartnerSubmission"
ADD CONSTRAINT "ProjectStagePartnerSubmission_version_check"
CHECK ("version" > 0);
