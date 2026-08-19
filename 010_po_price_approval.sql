ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS "referenceRate" DOUBLE PRECISION;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "priceApprovalReason" TEXT;
