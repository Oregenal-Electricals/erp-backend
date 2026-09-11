ALTER TABLE "iqc_items" ADD COLUMN "putAwayQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "stock_putaway_items" ADD COLUMN "iqcItemId" TEXT;
ALTER TABLE "stock_putaway_items" ADD CONSTRAINT "stock_putaway_items_iqcItemId_fkey" FOREIGN KEY ("iqcItemId") REFERENCES "iqc_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
