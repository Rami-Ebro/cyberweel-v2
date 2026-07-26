CREATE TYPE "ClientProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD');
CREATE TYPE "ClientInvoiceStatus" AS ENUM ('DRAFT', 'DUE', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TABLE "ClientProject" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ClientProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientFile" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "kind" TEXT,
  "size" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientInvoice" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "ClientInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientMessage" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "projectId" TEXT,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientInvoice_number_key" ON "ClientInvoice"("number");
CREATE INDEX "ClientProject_clientId_idx" ON "ClientProject"("clientId");
CREATE INDEX "ClientProject_clientId_status_idx" ON "ClientProject"("clientId", "status");
CREATE INDEX "ClientFile_projectId_idx" ON "ClientFile"("projectId");
CREATE INDEX "ClientInvoice_projectId_idx" ON "ClientInvoice"("projectId");
CREATE INDEX "ClientInvoice_status_idx" ON "ClientInvoice"("status");
CREATE INDEX "ClientMessage_clientId_idx" ON "ClientMessage"("clientId");
CREATE INDEX "ClientMessage_clientId_readAt_idx" ON "ClientMessage"("clientId", "readAt");
CREATE INDEX "ClientMessage_projectId_idx" ON "ClientMessage"("projectId");

ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientInvoice" ADD CONSTRAINT "ClientInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientMessage" ADD CONSTRAINT "ClientMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientMessage" ADD CONSTRAINT "ClientMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;