-- 179_sidebar_delivery_confirmation_nav.sql
--
-- Delivery Confirmation (delivery-confirmation.service.ts / the
-- /sales/delivery frontend page) already exists and already does the
-- thing Sales asked for: confirming a dispatch's POD marks its Sales
-- Order COMPLETED, and once every SO under a Customer PO is COMPLETED
-- the CPO itself is rolled to COMPLETED too. But the live, DB-driven
-- Sidebar (src/components/layout/Sidebar.jsx, reading ui_control_elements)
-- has never had a nav entry for it - only a dead Sidebar.legacy.jsx (not
-- imported anywhere; AppLayout.jsx imports ./Sidebar, not ./Sidebar.legacy)
-- ever referenced '/sales/delivery'. So nobody could reach the screen that
-- actually completes an SO/CPO, which is why "Release" looked like a dead
-- end with nothing after it.
--
-- Adds the nav row under the existing "Sales" section (sidebar.sales),
-- visible to the same roles that already see that section (SALES,
-- PLANT_MANAGER, ADMIN - see 144_role_sidebar_matrix.sql), and grants
-- DELIVERY_CONFIRMATION_VIEW to those same three roles so the nav item
-- (and the page's own guard) actually work rather than 403ing - this
-- permission is already seeded as part of the broader SALES_VIEW bundle
-- (prisma/seed_granular_permissions.ts) for a fresh setup, but this grants
-- it directly and idempotently in case that seed never ran against this
-- environment (the same class of gap this whole migration-file-set keeps
-- finding).
BEGIN;

INSERT INTO ui_control_elements (
  id, company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data
)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.sales.deliveryConfirmation', 'SIDEBAR_ITEM', 'SALES', '/sales/delivery', 'Delivery Confirmations', 'truck', 'sidebar.sales', 9, true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key = 'sidebar.sales.deliveryConfirmation');

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'DELIVERY_CONFIRMATION_VIEW', true, false, now(), now(), 'delivery-confirmation-nav-migration', 'delivery-confirmation-nav-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'SALES', 'PLANT_MANAGER')
ON CONFLICT DO NOTHING;

COMMIT;
