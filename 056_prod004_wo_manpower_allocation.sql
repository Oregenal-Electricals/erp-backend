ALTER TABLE "manpower_assignments" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "manpower_assignments" ADD COLUMN "plannedTargetQty" DOUBLE PRECISION;
ALTER TABLE "manpower_assignments" ADD COLUMN "estimatedLabourCost" DOUBLE PRECISION;
ALTER TABLE "manpower_assignments" ADD COLUMN "productivityRateSnapshot" DOUBLE PRECISION;
ALTER TABLE "manpower_assignments" ADD COLUMN "labourRateSnapshot" DOUBLE PRECISION;
ALTER TABLE "manpower_assignments" ADD COLUMN "submittedAt" TIMESTAMP(3);
