ALTER TABLE "grn_items" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "iqc_items" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "stock_putaway_items" ADD COLUMN "stockBatchId" TEXT;
ALTER TABLE "stock_putaway_items" ADD CONSTRAINT "stock_putaway_items_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "raw_materials" ADD COLUMN "preferredWarehouseId" TEXT;
ALTER TABLE "raw_materials" ADD COLUMN "preferredRackId" TEXT;
ALTER TABLE "raw_materials" ADD COLUMN "preferredBinId" TEXT;
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_preferredWarehouseId_fkey" FOREIGN KEY ("preferredWarehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_preferredRackId_fkey" FOREIGN KEY ("preferredRackId") REFERENCES "warehouse_racks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_preferredBinId_fkey" FOREIGN KEY ("preferredBinId") REFERENCES "warehouse_bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
