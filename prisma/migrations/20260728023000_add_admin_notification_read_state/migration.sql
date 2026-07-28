ALTER TABLE "ClientNotification" ADD COLUMN "adminReadAt" TIMESTAMP(3);

UPDATE "ClientNotification"
SET "adminReadAt" = "readAt";

CREATE INDEX "ClientNotification_clientId_adminReadAt_idx"
ON "ClientNotification"("clientId", "adminReadAt");
