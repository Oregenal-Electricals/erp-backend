-- A Customer PO line can be for a Raw Material sold directly (trading/
-- resale), not only a finished/semi-finished Product - so a mapping must
-- be able to point at either. product_id becomes nullable and a parallel
-- raw_material_id/pending_raw_material_id pair is added, mirroring
-- product_id/pending_product_id. A CHECK constraint enforces that every
-- row points at exactly one of the two targets, never both or neither.

ALTER TABLE "customer_item_mappings" ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "customer_item_mappings" ADD COLUMN "raw_material_id" TEXT;
ALTER TABLE "customer_item_mappings" ADD COLUMN "pending_raw_material_id" TEXT;

ALTER TABLE "customer_item_mappings"
  ADD CONSTRAINT "customer_item_mappings_raw_material_id_fkey"
  FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every existing row already has product_id set (it was NOT NULL until
-- the statement above) and raw_material_id NULL, so this passes
-- immediately for all current data with no backfill needed.
ALTER TABLE "customer_item_mappings"
  ADD CONSTRAINT "customer_item_mappings_target_check"
  CHECK (("product_id" IS NOT NULL) <> ("raw_material_id" IS NOT NULL));
