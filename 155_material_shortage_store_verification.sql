-- Task #52: Store must verify (confirm or correct) every MRP-calculated
-- material shortage BEFORE Purchase can act on it. New rows are now born
-- PENDING_STORE_VERIFICATION instead of OPEN; Purchase's existing
-- "open shortages" read path already filters on status = 'OPEN', so an
-- unverified row is invisible to Purchase without any extra filter.
-- Applies uniformly to every material_shortages row regardless of why it
-- was raised (plain BOM-vs-stock mismatch or an IQC reject/fail driven
-- shortfall) - there is no separate origin-specific code path to patch.

ALTER TABLE "material_shortages" ALTER COLUMN "status" SET DEFAULT 'PENDING_STORE_VERIFICATION';

-- Existing OPEN rows predate this gate and were already visible to
-- Purchase, so they are left as-is (grandfathered as already-verified);
-- only rows created from here on start out gated.

ALTER TABLE "material_shortages" ADD COLUMN "systemCalculatedQty" DOUBLE PRECISION;
ALTER TABLE "material_shortages" ADD COLUMN "verifiedQty" DOUBLE PRECISION;
ALTER TABLE "material_shortages" ADD COLUMN "verificationReason" TEXT;
ALTER TABLE "material_shortages" ADD COLUMN "verifiedById" TEXT;
ALTER TABLE "material_shortages" ADD COLUMN "verifiedAt" TIMESTAMP(3);
