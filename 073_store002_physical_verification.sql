ALTER TABLE "store_receiving_items" ADD COLUMN "actualUom" TEXT;
ALTER TABLE "store_receiving_items" ADD COLUMN "result" TEXT;
ALTER TABLE "store_receiving_items" ADD COLUMN "differenceQty" DOUBLE PRECISION;
ALTER TABLE "store_receiving_items" ADD COLUMN "shortQty" DOUBLE PRECISION;
ALTER TABLE "store_receiving_items" ADD COLUMN "excessQty" DOUBLE PRECISION;
ALTER TABLE "store_receiving_items" ADD COLUMN "damagedQty" DOUBLE PRECISION;
ALTER TABLE "store_receiving_items" ADD COLUMN "materialMismatch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "store_receiving_items" ADD COLUMN "verifiedById" TEXT;
ALTER TABLE "store_receiving_items" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "store_receiving_items" ADD CONSTRAINT "store_receiving_items_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "store_receiving_item_batches" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "storeReceivingItemId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "lotNumber" TEXT,
  "mfgDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "quantity" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "store_receiving_item_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "store_receiving_item_batches_companyId_storeReceivingItemI_idx" ON "store_receiving_item_batches"("companyId", "storeReceivingItemId");
ALTER TABLE "store_receiving_item_batches" ADD CONSTRAINT "store_receiving_item_batches_storeReceivingItemId_fkey" FOREIGN KEY ("storeReceivingItemId") REFERENCES "store_receiving_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
