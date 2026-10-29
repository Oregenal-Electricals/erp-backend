-- 170_cpo_so_sidebar_tab_split.sql
--
-- Role-based tab visibility split under the existing "Sales" sidebar
-- section (sidebar.sales), same ui_control_elements/ui_control_overrides
-- mechanism already used for the Dispatch module's per-role tab
-- visibility (see 143_dispatch_sidebar.sql) - no new permission
-- mechanism invented here.
--
-- Today "sidebar.sales" (and whatever items already sit under it) is
-- visible to SALES, PLANT_MANAGER and ADMIN (see 144_role_sidebar_matrix
-- .sql). This migration ensures a "Customer PO" item and a "Sales Order"
-- item both exist under it, defaults them to hidden, then grants:
--   - SALES          -> "Customer PO" tab only
--   - PLANT_MANAGER  -> "Sales Order" tab only
--   - ADMIN          -> "Sales Order" tab only
-- so a role sees exactly one of the two, never both, never merged.
-- (SUPER_ADMIN bypasses ui_control entirely, same as every other module -
-- not changed here.)
--
-- Written idempotently throughout (WHERE NOT EXISTS / ADD COLUMN IF NOT
-- EXISTS style guards) since these sidebar items may already have been
-- created directly from the live /settings/ui-control admin screen
-- rather than from a committed migration - safe to run either way.
BEGIN;

INSERT INTO ui_control_elements (
  id, company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data
)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.sales.customerPo', 'SIDEBAR_ITEM', 'SALES', '/customer-po', 'Customer PO', 'clipboard-list', 'sidebar.sales', 1, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key = 'sidebar.sales.customerPo');

INSERT INTO ui_control_elements (
  id, company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data
)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.sales.salesOrder', 'SIDEBAR_ITEM', 'SALES', '/sales/sales-orders', 'Sales Order', 'shopping-cart', 'sidebar.sales', 2, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key = 'sidebar.sales.salesOrder');

-- Both tabs default to hidden (own role grants below decide who sees
-- which) even if either element already existed with a different
-- default from the live admin screen - this migration's whole point is
-- to stop them being shown together by default.
UPDATE ui_control_elements SET default_visible = false, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key IN ('sidebar.sales.customerPo', 'sidebar.sales.salesOrder');

INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales.customerPo'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales.customerPo' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

-- SALES never sees "Sales Order" - only "Customer PO".
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales.salesOrder'), 'ROLE', 'SALES', false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales.salesOrder' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales.salesOrder'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales.salesOrder' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales.salesOrder'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales.salesOrder' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

COMMIT;
