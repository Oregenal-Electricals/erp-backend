ALTER TABLE "iqc_items" ADD COLUMN "holdQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "iqc_items" ADD COLUMN "holdReason" TEXT;

CREATE TABLE "hold_stock" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "holdNumber" TEXT NOT NULL,
  "iqcId" TEXT,
  "grnId" TEXT,
  "warehouseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'HELD',
  "totalHoldQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "hold_stock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hold_stock_companyId_holdNumber_key" ON "hold_stock"("companyId", "holdNumber");

CREATE TABLE "hold_stock_items" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "holdStockId" TEXT NOT NULL,
  "iqcItemId" TEXT,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "holdQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "holdReason" TEXT,
  "reinspectionStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "reinspectedPassQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reinspectedFailQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reinspectedAt" TIMESTAMP(3),
  "reinspectedBy" TEXT,
  "reinspectionNotes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "hold_stock_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "hold_stock" ADD CONSTRAINT "hold_stock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hold_stock" ADD CONSTRAINT "hold_stock_iqcId_fkey" FOREIGN KEY ("iqcId") REFERENCES "iqc_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hold_stock" ADD CONSTRAINT "hold_stock_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "grn_headers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hold_stock" ADD CONSTRAINT "hold_stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hold_stock_items" ADD CONSTRAINT "hold_stock_items_holdStockId_fkey" FOREIGN KEY ("holdStockId") REFERENCES "hold_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
