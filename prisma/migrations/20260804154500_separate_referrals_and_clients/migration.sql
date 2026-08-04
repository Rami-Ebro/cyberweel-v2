ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "company" TEXT,
ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'ar',
ADD COLUMN IF NOT EXISTS "clientSource" TEXT,
ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

DROP INDEX IF EXISTS "User_phone_key";

ALTER TABLE "PartnerReferral"
ADD COLUMN IF NOT EXISTS "company" TEXT,
ADD COLUMN IF NOT EXISTS "convertedClientId" TEXT,
ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);

ALTER TABLE "PartnerReferral"
ADD CONSTRAINT "PartnerReferral_convertedClientId_fkey"
FOREIGN KEY ("convertedClientId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PartnerReferral_convertedClientId_idx"
ON "PartnerReferral"("convertedClientId");
