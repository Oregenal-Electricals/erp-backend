ALTER TABLE "material_issue_overrides" ADD COLUMN "itemCode" TEXT;
ALTER TABLE "material_issue_overrides" ADD COLUMN "itemName" TEXT;
ALTER TABLE "material_issue_overrides" ADD COLUMN "requestedQty" DOUBLE PRECISION;
ALTER TABLE "material_issue_overrides" ADD COLUMN "approvedQty" DOUBLE PRECISION;
ALTER TABLE "material_issue_overrides" ADD COLUMN "usedQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "material_issue_overrides" SET "itemCode" = 'UNKNOWN', "itemName" = 'Unknown (pre-STORE-012 override)', "requestedQty" = 0 WHERE "itemCode" IS NULL;
ALTER TABLE "material_issue_overrides" ALTER COLUMN "itemCode" SET NOT NULL;
ALTER TABLE "material_issue_overrides" ALTER COLUMN "itemName" SET NOT NULL;
ALTER TABLE "material_issue_overrides" ALTER COLUMN "requestedQty" SET NOT NULL;
