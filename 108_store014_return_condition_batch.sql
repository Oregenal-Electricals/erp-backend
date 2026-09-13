ALTER TABLE "production_material_returns" ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'GOOD';
ALTER TABLE "production_material_returns" ADD COLUMN "originalIssueItemId" TEXT;
ALTER TABLE "production_material_returns" ADD COLUMN "batchId" TEXT;
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_originalIssueItemId_fkey" FOREIGN KEY ("originalIssueItemId") REFERENCES "production_issue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_material_returns" ADD CONSTRAINT "production_material_returns_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
