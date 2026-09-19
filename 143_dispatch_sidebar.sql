-- 143_dispatch_sidebar.sql
BEGIN;
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.section', 'SIDEBAR_SECTION', 'dispatch', NULL, 'Dispatch', 'truck', NULL, 15, true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.section');
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.dashboard', 'SIDEBAR_ITEM', 'dispatch', '/dispatch/dashboard', 'Dashboard', 'layout-dashboard', 'dispatch.section', 1, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard');
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.orders', 'SIDEBAR_ITEM', 'dispatch', '/sales/dispatch-planning', 'Dispatch Orders', 'truck', 'dispatch.section', 2, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.orders');
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.pickingLoading', 'SIDEBAR_ITEM', 'dispatch', '/dispatch/picking-loading', 'Picking & Loading', 'package-check', 'dispatch.section', 3, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.pickingLoading');
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.gateOutStatus', 'SIDEBAR_ITEM', 'dispatch', '/dispatch/gate-out-status', 'Gate-Out Status', 'log-in', 'dispatch.section', 4, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.gateOutStatus');
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.trace', 'SIDEBAR_ITEM', 'dispatch', '/dispatch/trace', 'Trace Dispatch', 'file-text', 'dispatch.section', 5, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace');
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.dashboard' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.orders'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.orders' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.pickingLoading'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.pickingLoading' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.gateOutStatus'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.gateOutStatus' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.dashboard' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.orders'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.orders' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard'), 'ROLE', 'STORE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.dashboard' AND o.role_name = 'STORE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.pickingLoading'), 'ROLE', 'STORE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.pickingLoading' AND o.role_name = 'STORE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'STORE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'STORE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.dashboard' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.orders'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.orders' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.pickingLoading'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.pickingLoading' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.gateOutStatus'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.gateOutStatus' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.gateOutStatus'), 'ROLE', 'GATE_INCHARGE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.gateOutStatus' AND o.role_name = 'GATE_INCHARGE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'GATE_INCHARGE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'GATE_INCHARGE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.dashboard'), 'ROLE', 'ACCOUNTS', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.dashboard' AND o.role_name = 'ACCOUNTS' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.orders'), 'ROLE', 'ACCOUNTS', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.orders' AND o.role_name = 'ACCOUNTS' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'ACCOUNTS', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'ACCOUNTS' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.pickingLoading'), 'ROLE', 'OQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.pickingLoading' AND o.role_name = 'OQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'OQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'OQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'IQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'IQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trace'), 'ROLE', 'IPQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trace' AND o.role_name = 'IPQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
COMMIT;
