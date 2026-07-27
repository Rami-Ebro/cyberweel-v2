CREATE TABLE "ClientNotification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "section" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientNotification_clientId_readAt_idx"
ON "ClientNotification"("clientId", "readAt");

CREATE INDEX "ClientNotification_clientId_createdAt_idx"
ON "ClientNotification"("clientId", "createdAt");

ALTER TABLE "ClientNotification"
ADD CONSTRAINT "ClientNotification_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
