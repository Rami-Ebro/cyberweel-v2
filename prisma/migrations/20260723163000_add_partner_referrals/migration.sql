-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTNER', 'CLIENT');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "referralNumber" SERIAL NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerReferral" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'NEW',
    "sourcePath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_referralNumber_key" ON "Partner"("referralNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "PartnerReferral_partnerId_idx" ON "PartnerReferral"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerReferral_partnerId_status_idx" ON "PartnerReferral"("partnerId", "status");

-- CreateIndex
CREATE INDEX "PartnerReferral_createdAt_idx" ON "PartnerReferral"("createdAt");

-- AddForeignKey
ALTER TABLE "Partner"
ADD CONSTRAINT "Partner_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerReferral"
ADD CONSTRAINT "PartnerReferral_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "Partner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
