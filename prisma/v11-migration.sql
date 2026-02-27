-- V11 Migration: Contracts, Inspections, Asset enhancements
-- Run this in Supabase/Neon SQL editor

-- Add new fields to Asset
ALTER TABLE "Asset" 
  ADD COLUMN IF NOT EXISTS "elevatorIdNo" TEXT,
  ADD COLUMN IF NOT EXISTS "brand" TEXT,
  ADD COLUMN IF NOT EXISTS "speed" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "driveType" TEXT,
  ADD COLUMN IF NOT EXISTS "lastRevisionYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "nextInspectionAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inspectionLabel" TEXT;

-- Add new fields to MaintenancePlan
ALTER TABLE "MaintenancePlan"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "planType" TEXT NOT NULL DEFAULT 'PERIODIC',
  ADD COLUMN IF NOT EXISTS "periodDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "contractId" TEXT,
  ADD COLUMN IF NOT EXISTS "technicianId" TEXT;

-- Contract status enum
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Inspection enums
DO $$ BEGIN
  CREATE TYPE "InspectionResult" AS ENUM ('UYGUNSUZLUK_YOK', 'HAFIF_KUSURLU', 'KUSURLU', 'GUVENSIZ');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionLabel" AS ENUM ('YESIL', 'MAVI', 'SARI', 'KIRMIZI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Contract table
CREATE TABLE IF NOT EXISTS "Contract" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "contractNumber" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "autoRenew" BOOLEAN NOT NULL DEFAULT true,
  "monthlyFee" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "technicianName" TEXT,
  "technicianCert" TEXT,
  "hasEncryptionDevice" BOOLEAN NOT NULL DEFAULT false,
  "encryptionNote" TEXT,
  "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- ContractAsset junction table
CREATE TABLE IF NOT EXISTS "ContractAsset" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractAsset_contractId_assetId_key" UNIQUE ("contractId", "assetId")
);

-- Inspection table
CREATE TABLE IF NOT EXISTS "Inspection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "inspectionDate" TIMESTAMP(3) NOT NULL,
  "nextDueDate" TIMESTAMP(3) NOT NULL,
  "inspectionBody" TEXT,
  "inspectorName" TEXT,
  "result" "InspectionResult" NOT NULL DEFAULT 'UYGUNSUZLUK_YOK',
  "label" "InspectionLabel" NOT NULL DEFAULT 'YESIL',
  "deficiencies" TEXT,
  "reportUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Contract" ADD CONSTRAINT IF NOT EXISTS "Contract_organizationId_fkey" 
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT IF NOT EXISTS "Contract_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContractAsset" ADD CONSTRAINT IF NOT EXISTS "ContractAsset_contractId_fkey" 
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractAsset" ADD CONSTRAINT IF NOT EXISTS "ContractAsset_assetId_fkey" 
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inspection" ADD CONSTRAINT IF NOT EXISTS "Inspection_organizationId_fkey" 
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT IF NOT EXISTS "Inspection_assetId_fkey" 
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenancePlan" ADD CONSTRAINT IF NOT EXISTS "MaintenancePlan_contractId_fkey" 
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Contract_organizationId_idx" ON "Contract"("organizationId");
CREATE INDEX IF NOT EXISTS "Contract_customerId_idx" ON "Contract"("customerId");
CREATE INDEX IF NOT EXISTS "Inspection_organizationId_idx" ON "Inspection"("organizationId");
CREATE INDEX IF NOT EXISTS "Inspection_assetId_idx" ON "Inspection"("assetId");
