CREATE TABLE "store_shortages" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "discrepancyNumber" TEXT NOT NULL,
  "storeReceivingItemId" TEXT NOT NULL,
  "gateInwardEntryId" TEXT NOT NULL,
  "poId" TEXT,
  "poItemId" TEXT,
  "supplierName" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "expectedQty" DOUBLE PRECISION NOT NULL,
  "actualQty" DOUBLE PRECISION NOT NULL,
  "shortQty" DOUBLE PRECISION NOT NULL,
  "shortageType" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SHORT_DETECTED',
  "purchaseNotifiedAt" TIMESTAMP(3),
  "purchaseReviewStatus" TEXT,
  "laterReceivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "approvedShortClosureQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
  CONSTRAINT "store_shortages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_shortages_storeReceivingItemId_key" ON "store_shortages"("storeReceivingItemId");
CREATE INDEX "store_shortages_companyId_idx" ON "store_shortages"("companyId");
CREATE INDEX "store_shortages_companyId_status_idx" ON "store_shortages"("companyId", "status");
ALTER TABLE "store_shortages" ADD CONSTRAINT "store_shortages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_shortages" ADD CONSTRAINT "store_shortages_storeReceivingItemId_fkey" FOREIGN KEY ("storeReceivingItemId") REFERENCES "store_receiving_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_shortages" ADD CONSTRAINT "store_shortages_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_shortages" ADD CONSTRAINT "store_shortages_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
