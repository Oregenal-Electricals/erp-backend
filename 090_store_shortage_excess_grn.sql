ALTER TABLE "store_shortages" ALTER COLUMN "storeReceivingItemId" DROP NOT NULL;
ALTER TABLE "store_shortages" ADD COLUMN "grnItemId" TEXT;
ALTER TABLE "store_shortages" ADD COLUMN "discrepancyType" TEXT NOT NULL DEFAULT 'SHORT';
ALTER TABLE "store_shortages" ADD COLUMN "excessQty" DOUBLE PRECISION;
ALTER TABLE "store_shortages" ADD COLUMN "approvedExcessQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "store_shortages_grnItemId_key" ON "store_shortages"("grnItemId");
ALTER TABLE "store_shortages" ADD CONSTRAINT "store_shortages_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "grn_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
