CREATE TABLE IF NOT EXISTS product_families (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"  TEXT NOT NULL REFERENCES companies(id),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy"  TEXT,
  "updatedBy"  TEXT,
  CONSTRAINT uq_product_families_company_code UNIQUE ("companyId", code)
);

CREATE INDEX IF NOT EXISTS idx_product_families_company ON product_families("companyId");

ALTER TABLE products ADD COLUMN IF NOT EXISTS "familyId" TEXT REFERENCES product_families(id);
CREATE INDEX IF NOT EXISTS idx_products_family ON products("familyId");
