-- 174_vendor_return_window_days.sql
--
-- IQC-rejected material being returned to a vendor has always used one
-- hardcoded global window (VENDOR_PICKUP_DAYS = 21 in
-- iqc-escalation.service.ts) before the company can treat it as eligible
-- for scrap. Real vendor terms vary (14 days, 30 days, etc.), so this
-- column lets each vendor carry its own window; NULL keeps using the
-- 21-day company default.
BEGIN;

ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER;

COMMIT;
