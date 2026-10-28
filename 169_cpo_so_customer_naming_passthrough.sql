-- 169_cpo_so_customer_naming_passthrough.sql
--
-- Naming display rule across CPO -> SO -> (future) Sales Invoice:
--   - CustomerPo/CustomerPoItem keep the customer's own item wording
--     exactly as entered (unchanged by this migration - already true).
--   - SalesOrderItem.itemCode/itemName already carry OUR internal
--     Product code/name, resolved via the customer item mapping at SO
--     creation time (already true - see sales-orders.service.ts
--     createFromCpo()).
--   - What was missing: nowhere on the SO line was the customer's own
--     original wording preserved for a later Sales Invoice step to print
--     (so the customer recognizes their own item naming on the bill).
--     These two nullable columns close that gap - populated once, at SO
--     line creation, immutable afterward like every other field on an
--     already-created line (rule: approved historical documents must
--     never silently change).
BEGIN;

ALTER TABLE "sales_order_items" ADD COLUMN IF NOT EXISTS "customerItemCode" TEXT;
ALTER TABLE "sales_order_items" ADD COLUMN IF NOT EXISTS "customerItemName" TEXT;

COMMIT;
