-- 145_quality_item_filtering.sql
BEGIN;
UPDATE ui_control_elements SET default_visible = false, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1' AND key IN ('sidebar.quality.dashboard','sidebar.quality.iqc','sidebar.quality.iqcTemplates','sidebar.quality.ipqc','sidebar.quality.oqc','sidebar.quality.ncr','sidebar.quality.capa','sidebar.quality.rca','sidebar.quality.supplier','sidebar.quality.reports');
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqc'), 'ROLE', 'IQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqc' AND o.role_name = 'IQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqc'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqc' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqc'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqc' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqc'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqc' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqcTemplates'), 'ROLE', 'IQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqcTemplates' AND o.role_name = 'IQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqcTemplates'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqcTemplates' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqcTemplates'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqcTemplates' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.iqcTemplates'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.iqcTemplates' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ipqc'), 'ROLE', 'IPQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ipqc' AND o.role_name = 'IPQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ipqc'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ipqc' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ipqc'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ipqc' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ipqc'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ipqc' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.oqc'), 'ROLE', 'OQC', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.oqc' AND o.role_name = 'OQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.oqc'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.oqc' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.oqc'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.oqc' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.oqc'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.oqc' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.dashboard'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.dashboard' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.dashboard'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.dashboard' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.dashboard'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.dashboard' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ncr'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ncr' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ncr'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ncr' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.ncr'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.ncr' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.capa'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.capa' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.capa'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.capa' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.capa'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.capa' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.rca'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.rca' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.rca'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.rca' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.rca'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.rca' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.supplier'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.supplier' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.supplier'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.supplier' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.supplier'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.supplier' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.reports'), 'ROLE', 'QUALITY_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.reports' AND o.role_name = 'QUALITY_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.reports'), 'ROLE', 'PLANT_MANAGER', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.reports' AND o.role_name = 'PLANT_MANAGER' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.quality.reports'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.quality.reports' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, custom_page, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='sidebar.dashboard'), 'ROLE', 'IQC', true, '/quality/iqc-dashboard', now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'sidebar.dashboard' AND o.role_name = 'IQC' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);
COMMIT;
