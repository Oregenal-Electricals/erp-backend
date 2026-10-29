-- 171_cpo_conversion_error.sql
--
-- CPO -> SO conversion is fully automatic (create()/update() call
-- autoAcknowledge() - see 169/170 and customer-po.service.ts). When it
-- fails (most commonly: a line has no customer item mapping yet), the
-- CPO is deliberately left RECEIVED rather than failing the save, and
-- the only record of *why* was a server log line - invisible to Sales.
--
-- This column gives autoAcknowledge() somewhere to persist that reason
-- so the frontend can show it directly on the stuck CPO instead of a
-- human needing server access to find out why conversion never
-- happened. Cleared on the next successful conversion (automatic or
-- the manual retry action).
BEGIN;

ALTER TABLE "customer_pos" ADD COLUMN IF NOT EXISTS "conversionError" TEXT;

COMMIT;
