ALTER TABLE "work_orders" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "work_orders" ADD COLUMN "closedById" TEXT;
ALTER TABLE "production_cost_sheets" ADD COLUMN "reworkCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "production_cost_sheets" ADD COLUMN "scrapRecovery" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "production_cost_sheets" ADD COLUMN "grossActualCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "production_cost_sheets" ADD COLUMN "netActualCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "production_cost_sheets" ADD COLUMN "finalGoodFgQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "production_cost_sheets" ADD COLUMN "closureBlockers" TEXT;
