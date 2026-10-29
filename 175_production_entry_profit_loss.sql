-- 175_production_entry_profit_loss.sql
--
-- PROD-007 already computes, per entry, everything efficiency costing
-- needs (targetQty, productivityRateSnapshot, labourRateSnapshot,
-- actualLabourCost) but never turned it into the one number management
-- actually wants to see at a glance: did this hour make or lose money
-- on labour, and by how much. This column stores that figure -
-- (standard labour cost of what was actually produced) minus (actual
-- labour cost incurred) - a classic labour efficiency variance.
-- Positive = favorable (profit), negative = unfavorable (loss).
--
-- This is cost/profitability data - it must only ever reach Super
-- Admin/Admin/Management/Accounts, same restriction as the cost sheet
-- (see PRODUCTION_COST_SHEET_VIEW). It is deliberately not surfaced on
-- the general Production Recording screen every supervisor uses.
BEGIN;

ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "profitLossAmount" DOUBLE PRECISION;

COMMIT;
