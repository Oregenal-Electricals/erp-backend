CREATE TABLE "production_material_returns" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "returnNumber" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "qty" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL DEFAULT 'EXCESS_UNUSED',
  "remarks" TEXT,
  "returnedById" TEXT NOT NULL,
  "returnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "production_material_returns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "production_material_returns_companyId_workOrderId_idx" ON "production_material_returns"("companyId", "workOrderId");
CREATE INDEX "production_material_returns_companyId_itemCode_idx" ON "production_material_returns"("companyId", "itemCode");
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
