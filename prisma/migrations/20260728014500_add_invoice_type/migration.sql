CREATE TYPE "ClientInvoiceType" AS ENUM ('STANDARD', 'RETURN');

ALTER TABLE "ClientInvoice"
ADD COLUMN "type" "ClientInvoiceType" NOT NULL DEFAULT 'STANDARD';

CREATE INDEX "ClientInvoice_type_idx" ON "ClientInvoice"("type");
