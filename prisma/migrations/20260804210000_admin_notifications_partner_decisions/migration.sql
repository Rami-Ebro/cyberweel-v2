ALTER TABLE "CollaborationApplication"
ADD COLUMN IF NOT EXISTS "reviewState" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN IF NOT EXISTS "decidedById" TEXT;

CREATE INDEX IF NOT EXISTS "CollaborationApplication_decidedById_idx"
ON "CollaborationApplication"("decidedById");

ALTER TABLE "CollaborationApplication"
ADD CONSTRAINT "CollaborationApplication_decidedById_fkey"
FOREIGN KEY ("decidedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AdminNotification" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "href" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNotification_readAt_createdAt_idx" ON "AdminNotification"("readAt", "createdAt");
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "applicationId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Partner_applicationId_key" ON "Partner"("applicationId");
ALTER TABLE "Partner"
ADD CONSTRAINT "Partner_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "CollaborationApplication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
