-- Allow a client project to be assigned to multiple distinct partners.
-- Existing assignments and their data remain unchanged.
DROP INDEX IF EXISTS "PartnerProject_clientProjectId_key";

CREATE INDEX "PartnerProject_clientProjectId_idx"
  ON "PartnerProject"("clientProjectId");

CREATE UNIQUE INDEX "PartnerProject_partnerId_clientProjectId_key"
  ON "PartnerProject"("partnerId", "clientProjectId");
