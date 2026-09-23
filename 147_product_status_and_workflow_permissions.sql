-- 147: Product.status/approvedBy/approvedAt columns for the new BOM/Product approval workflow, plus permission grants.
BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE products ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- Every existing product predates this feature - treat it as already approved
-- so nothing already in production silently becomes unusable overnight.
UPDATE products SET status = 'APPROVED' WHERE status = 'DRAFT';

COMMIT;
