ALTER TABLE "grn_items" ADD COLUMN "heldQty" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "grn_item_discrepancies" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "discrepancyNumber" TEXT NOT NULL,
  "grnItemId" TEXT NOT NULL,
  "grnId" TEXT NOT NULL,
  "gateInwardEntryId" TEXT,
  "poId" TEXT,
  "poItemId" TEXT,
  "supplierName" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "expectedSpecification" TEXT,
  "expectedBatch" TEXT,
  "physicalItemCode" TEXT,
  "physicalItemName" TEXT,
  "physicalSpecification" TEXT,
  "physicalBatch" TEXT,
  "affectedQty" DOUBLE PRECISION NOT NULL,
  "problemType" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "damageType" TEXT,
  "reason" TEXT,
  "evidence" JSONB,
  "holdBinId" TEXT,
  "segregatedById" TEXT,
  "segregatedAt" TIMESTAMP(3),
  "purchaseStatus" TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
  "purchaseNotifiedAt" TIMESTAMP(3),
  "qcStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  "qcInspectionId" TEXT,
  "resolution" TEXT,
  "resolutionApprovalRequestId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "raisedById" TEXT NOT NULL,
  "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "grn_item_discrepancies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "grn_item_discrepancies_companyId_grnItemId_idx" ON "grn_item_discrepancies"("companyId", "grnItemId");
CREATE INDEX "grn_item_discrepancies_companyId_status_idx" ON "grn_item_discrepancies"("companyId", "status");
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "grn_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "grn_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_holdBinId_fkey" FOREIGN KEY ("holdBinId") REFERENCES "warehouse_bins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grn_item_discrepancies" ADD CONSTRAINT "grn_item_discrepancies_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
