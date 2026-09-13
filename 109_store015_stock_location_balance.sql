CREATE TABLE "stock_location_balances" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "binId" TEXT NOT NULL,
  "batchId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "stock_location_balances_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "stock_location_balances" ADD CONSTRAINT "stock_location_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_location_balances" ADD CONSTRAINT "stock_location_balances_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_location_balances" ADD CONSTRAINT "stock_location_balances_binId_fkey" FOREIGN KEY ("binId") REFERENCES "warehouse_bins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_location_balances" ADD CONSTRAINT "stock_location_balances_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "stock_location_balances_unique" ON "stock_location_balances"("companyId", "itemCode", "binId", "batchId", "status");
CREATE INDEX "stock_location_balances_companyId_warehouseId_itemCode_idx" ON "stock_location_balances"("companyId", "warehouseId", "itemCode");
