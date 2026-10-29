-- 173_production_entry_manpower_allotted.sql
--
-- PROD-007's manpowerQty column has always meant "manpower actually used
-- for this entry" - it defaults from the Plant Head's approved
-- ManpowerAllocation.count only when the supervisor leaves it blank
-- (see production-entry.service.ts create()). If the supervisor enters
-- their own number (e.g. 2 people pulled to another line this hour),
-- that override silently replaces the allotted figure on the entry -
-- there was no column to keep the allotted number alongside it, so the
-- allotted-vs-used gap that efficiency costing depends on could never be
-- read back off a single entry.
--
-- This column is a snapshot of the approved ManpowerAllocation.count at
-- entry time, stored unconditionally (independent of what manpowerQty
-- ends up being), so manpowerQty keeps meaning "used" and this means
-- "allotted" - same snapshot-at-entry-time pattern already used for
-- productivityRateSnapshot/labourRateSnapshot/targetQty on this table.
BEGIN;

ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "manpowerAllotted" INTEGER;

COMMIT;
