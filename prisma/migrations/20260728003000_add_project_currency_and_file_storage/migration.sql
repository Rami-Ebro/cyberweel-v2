ALTER TABLE "ClientProject"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE "ClientFile"
ADD COLUMN "storageProvider" TEXT;
