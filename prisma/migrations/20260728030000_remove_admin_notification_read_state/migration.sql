DROP INDEX IF EXISTS "ClientNotification_clientId_adminReadAt_idx";

ALTER TABLE "ClientNotification" DROP COLUMN IF EXISTS "adminReadAt";
