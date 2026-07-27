ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ClientProject" ADD COLUMN "referralId" TEXT;

CREATE UNIQUE INDEX "ClientProject_referralId_key" ON "ClientProject"("referralId");

ALTER TABLE "ClientProject"
ADD CONSTRAINT "ClientProject_referralId_fkey"
FOREIGN KEY ("referralId") REFERENCES "PartnerReferral"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
