-- 144_role_sidebar_matrix.sql
BEGIN;
UPDATE ui_control_elements SET is_active = false, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND (module IN ('xyzzy', 'dddd') OR key LIKE 'sidebar.custom.%');
UPDATE ui_control_elements SET parent_key = NULL, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key IN ('sidebar.sales', 'sidebar.purchase') AND element_type = 'SIDEBAR_SECTION';
UPDATE ui_control_elements SET default_visible = false, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key IN ('sidebar.gate','sidebar.changeRequests','sidebar.import','sidebar.inventory','sidebar.production','sidebar.sales','sidebar.quality','sidebar.hr','sidebar.finance','sidebar.industry4','sidebar.analytics','sidebar.purchase','sidebar.settings');
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.gate'), 'ROLE', 'STORE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.gate' AND o.role_name = 'STORE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.gate'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.gate' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.gate'), 'ROLE', 'GATE_INCHARGE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.gate' AND o.role_name = 'GATE_INCHARGE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.gate'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.gate' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.changeRequests'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.changeRequests' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.changeRequests'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.changeRequests' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.import'), 'ROLE', 'PURCHASE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.import' AND o.role_name = 'PURCHASE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.import'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.import' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.inventory'), 'ROLE', 'RND', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.inventory' AND o.role_name = 'RND' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.inventory'), 'ROLE', 'STORE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.inventory' AND o.role_name = 'STORE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.inventory'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.inventory' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.inventory'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.inventory' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.production'), 'ROLE', 'STAGE_SUPERVISOR', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.production' AND o.role_name = 'STAGE_SUPERVISOR' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.production'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.production' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.production'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.production' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.sales'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.sales' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'IQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'IQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'IPQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'IPQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'OQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'OQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.hr'), 'ROLE', 'HR', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.hr' AND o.role_name = 'HR' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.hr'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.hr' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.finance'), 'ROLE', 'ACCOUNTS', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.finance' AND o.role_name = 'ACCOUNTS' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.finance'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.finance' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.industry4'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.industry4' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.industry4'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.industry4' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.analytics'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.analytics' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.analytics'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.analytics' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.analytics'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.analytics' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.analytics'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.analytics' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.purchase'), 'ROLE', 'PURCHASE', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.purchase' AND o.role_name = 'PURCHASE' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.purchase'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.purchase' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.purchase'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.purchase' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.settings'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.settings' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
COMMIT;
