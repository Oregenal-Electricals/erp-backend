-- TASK-060: split OQC into PRE_PACK and POST_PACK inspection stages.
--
-- OqcInspection previously bundled the full-product check (visual/
-- dimensional/functional) together with the packing check (packaging/
-- labelling) into one single gate, released once. The business wants
-- these as two distinct, sequential stages: PRE_PACK (full-product,
-- before the item goes into its shipping pack/carton) and POST_PACK
-- (packaging/labelling/carton-marking, done after it's packed). Both
-- must be RELEASED with result PASS before FG stock is credited - see
-- OqcService.release() / StockLedgerService.receiveFromOqc().
--
-- Existing rows predate the split and already went through the old
-- single-gate process - where RELEASED, they already credited FG stock
-- via the pre-existing stock_ledger entry referencing that oqcId, so
-- nothing re-evaluates them against the new two-stage gate. No second,
-- synthetic row is created for them: that would fabricate a POST_PACK
-- inspection event that never actually happened as a separate check.
-- They're backfilled to PRE_PACK (the default below) purely for
-- display/reporting, since visual/dimensional/functional was the
-- primary check they recorded.
ALTER TABLE "oqc_inspections" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'PRE_PACK';

-- Replaces the old app-level "one OQC per FG Receipt" rule
-- (OqcService.create()) with "one OQC per FG Receipt per stage" at the
-- database level. fgReceiptId stays nullable (unchanged); Postgres
-- treats each NULL as distinct, matching the pre-existing app-level
-- behaviour where that case never arose (OqcService.create() already
-- requires fgReceiptId).
CREATE UNIQUE INDEX "oqc_inspections_companyId_fgReceiptId_stage_key" ON "oqc_inspections"("companyId", "fgReceiptId", "stage");

CREATE INDEX "oqc_inspections_companyId_stage_idx" ON "oqc_inspections"("companyId", "stage");
