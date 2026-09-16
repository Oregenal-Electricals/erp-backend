ALTER TABLE "dispatch_plan_items" ADD COLUMN "saleType" TEXT;
ALTER TABLE "dispatch_plan_items" ADD COLUMN "requiredStageId" TEXT;
ALTER TABLE "dispatch_plan_items" ADD CONSTRAINT "dispatch_plan_items_requiredStageId_fkey" FOREIGN KEY ("requiredStageId") REFERENCES "routing_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_plan_items" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "dispatch_plan_items" ADD COLUMN "sourcePlantId" TEXT;
ALTER TABLE "dispatch_plan_items" ADD COLUMN "availableSnapshot" DOUBLE PRECISION;
ALTER TABLE "dispatch_plan_items" ADD COLUMN "snapshotCheckedAt" TIMESTAMP(3);
ALTER TABLE "dispatch_plan_items" ADD COLUMN "lineStatus" TEXT NOT NULL DEFAULT 'READY_FOR_RESERVATION';
