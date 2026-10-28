-- 153_material_hold_days_rules.sql
-- Store aging / "no guarantee past N days" liability threshold.
-- There is no global, fixed hold-days limit anywhere in the system
-- (Product.shelfLifeDays is a generic per-item shelf-life field, not
-- per-vendor and not wired to any Store aging logic; HoldStock is an
-- unrelated QC-disposition module with no days/aging field). This adds
-- a dedicated, user-maintained rule per RawMaterial, optionally scoped
-- further to one Vendor - e.g. Material X from Vendor A can carry a
-- 14-day limit while the same Material X from Vendor B carries 30.
-- A row with "vendorId" NULL is that material's own default, used
-- whenever no vendor-specific row exists; the final fallback (when
-- not even a material-level default is configured) is the
-- 'store_default_hold_days' SystemSetting row seeded at the bottom of
-- this file, so Store aging never silently skips the check.
CREATE TABLE "material_hold_days_rules" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "rawMaterialId" TEXT NOT NULL,
  "vendorId" TEXT,
  "holdDays" INTEGER NOT NULL,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "material_hold_days_rules_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "material_hold_days_rules"
  ADD CONSTRAINT "material_hold_days_rules_holdDays_positive_check"
  CHECK ("holdDays" > 0);

ALTER TABLE "material_hold_days_rules"
  ADD CONSTRAINT "material_hold_days_rules_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "material_hold_days_rules"
  ADD CONSTRAINT "material_hold_days_rules_rawMaterialId_fkey"
  FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "material_hold_days_rules"
  ADD CONSTRAINT "material_hold_days_rules_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One rule per (material, vendor) combination - mirrors schema.prisma's
-- @@unique([companyId, rawMaterialId, vendorId]). Postgres still allows
-- more than one row where "vendorId" IS NULL under a plain unique
-- index (NULL is never equal to NULL), which is exactly the
-- material-level-default case the next, partial, index exists to cover.
CREATE UNIQUE INDEX "material_hold_days_rules_companyId_rawMaterialId_vendorId_key"
  ON "material_hold_days_rules"("companyId", "rawMaterialId", "vendorId");

-- At most one material-level default (vendorId IS NULL) per material.
-- Prisma's schema language has no partial-unique-index syntax without
-- the extendedIndexes preview feature (not enabled in this project),
-- so this is hand-written rather than represented in schema.prisma;
-- MaterialHoldDaysService.create() also re-checks this before every
-- insert so a violation surfaces as a clean 409, not a raw DB error.
CREATE UNIQUE INDEX "material_hold_days_rules_material_default_key"
  ON "material_hold_days_rules"("companyId", "rawMaterialId")
  WHERE "vendorId" IS NULL;

CREATE INDEX "material_hold_days_rules_companyId_rawMaterialId_idx"
  ON "material_hold_days_rules"("companyId", "rawMaterialId");

CREATE INDEX "material_hold_days_rules_companyId_vendorId_idx"
  ON "material_hold_days_rules"("companyId", "vendorId");

-- Company-wide fallback hold-days limit, used by
-- MaterialHoldDaysService whenever neither a material+vendor rule nor
-- a material-level default rule is configured for a given batch.
-- Seeded once here (same pattern as 053_prod001_settings_seed.sql);
-- an Admin/Super Admin can change the value at any time via
-- PUT /material-hold-days/default.
INSERT INTO system_settings (id, key, value, description, category, "createdBy", "updatedBy", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'store_default_hold_days', '30', 'Company-wide fallback Store hold-days limit, used when no material- or material+vendor-specific rule is configured in Material Hold-Days Rules.', 'STORE', 'system', 'system', now())
ON CONFLICT (key) DO NOTHING;
