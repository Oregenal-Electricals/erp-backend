-- 172_ui_control_shortage_verification_nav.sql
--
-- Task #52's Store shortage-verification queue (backend endpoints already
-- live: GET /customer-po/shortages/pending-verification, POST
-- /customer-po/shortages/:id/verify) had no sidebar entry, so Store had no
-- way to reach the screen. Inserts the nav row directly for already-seeded
-- databases (this environment has no psql/AWS access to re-run
-- seed-ui-control.ts against production - same reasoning as the other
-- self-healing/direct-insert migrations in this file set). The seed file
-- itself is also updated so a fresh database gets this row too.
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, is_active, is_test_data)
VALUES (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.inventory.shortageVerification', 'SIDEBAR_ITEM', 'Inventory', '/inventory/shortage-verification', 'Shortage Verification', NULL, 'sidebar.inventory', 9, true, now(), now(), true, false)
ON CONFLICT (company_id, key) DO NOTHING;
