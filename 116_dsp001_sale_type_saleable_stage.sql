ALTER TABLE "routing_stages" ADD COLUMN "isSaleable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sales_order_items" ADD COLUMN "saleType" TEXT NOT NULL DEFAULT 'FG';
ALTER TABLE "sales_order_items" ADD COLUMN "requiredStageId" TEXT;
ALTER TABLE "sales_order_items" ADD COLUMN "releasedForDispatch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sales_order_items" ADD COLUMN "releasedAt" TIMESTAMP(3);
ALTER TABLE "sales_order_items" ADD COLUMN "releasedBy" TEXT;
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_requiredStageId_fkey" FOREIGN KEY ("requiredStageId") REFERENCES "routing_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sales_order_items_requiredStageId_idx" ON "sales_order_items"("requiredStageId");
