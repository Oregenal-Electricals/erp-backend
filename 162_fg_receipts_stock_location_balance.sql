-- TASK-057: integrate FG receipts into the consolidated stock_location_balances
-- table so RM and FG show up together in the same bin-level location view
-- (StockBalance already unified RM/FG at the item+warehouse level via
-- StockLedgerService - this closes the remaining gap at the bin level).
--
-- FG has no put-away/bin-assignment step of its own yet, so a receipt is
-- recorded here with "binId IS NULL" (accounted for at the warehouse
-- level, not yet binned) rather than inventing a fake bin. Make binId
-- nullable to allow that.

ALTER TABLE "stock_location_balances" ALTER COLUMN "binId" DROP NOT NULL;

-- The existing @@unique([companyId, itemCode, binId, batchId, status]) does
-- not protect bin-less rows: Postgres treats every NULL binId as distinct,
-- so two concurrent inserts for the same item/batch/status with no bin
-- could otherwise both succeed and double-count. This partial unique index
-- enforces the same "one row per combination" invariant specifically for
-- the binId IS NULL case, which is exactly what
-- StockLocationBalanceService.adjustQty()'s existing
-- find-then-create-or-update retry loop relies on to behave correctly.
CREATE UNIQUE INDEX IF NOT EXISTS "stock_location_balances_no_bin_unique"
  ON "stock_location_balances" ("companyId", "itemCode", "batchId", "status")
  WHERE "binId" IS NULL;
