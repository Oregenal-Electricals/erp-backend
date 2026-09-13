ALTER TABLE "stock_adjustment_items" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "stock_adjustment_items" ADD COLUMN "binId" TEXT;
ALTER TABLE "stock_adjustment_items" ADD COLUMN "batchId" TEXT;
ALTER TABLE "stock_adjustments" ADD COLUMN "reversedAdjustmentId" TEXT;
