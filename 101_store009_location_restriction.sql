ALTER TABLE "raw_materials" ADD COLUMN "restrictedWarehouseId" TEXT;
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_restrictedWarehouseId_fkey" FOREIGN KEY ("restrictedWarehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
