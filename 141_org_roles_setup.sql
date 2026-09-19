-- 141_org_roles_setup.sql
BEGIN;
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'ADMIN', 'Admin', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='ADMIN');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'RND', 'R&D', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='RND');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'PURCHASE', 'Purchase', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='PURCHASE');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'SALES', 'Sales', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='SALES');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'STORE', 'Store', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='STORE');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'PLANT_MANAGER', 'Plant Manager', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='PLANT_MANAGER');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'STAGE_SUPERVISOR', 'Stage Supervisor', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='STAGE_SUPERVISOR');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'QUALITY_MANAGER', 'Quality Manager', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='QUALITY_MANAGER');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'IQC', 'IQC', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='IQC');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'IPQC', 'IPQC', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='IPQC');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'OQC', 'OQC', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='OQC');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'HR', 'HR', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='HR');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'ACCOUNTS', 'Accounts', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='ACCOUNTS');
INSERT INTO roles (id, "companyId", name, label, description, "isSystemRole", "isProtected", "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'GATE_INCHARGE', 'Gate Incharge', 'Created for 15-role org structure', false, false, true, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1' AND name='GATE_INCHARGE');
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='ADMIN' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'CORPORATE_ADMIN' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'ADMIN', "updatedAt" = now() WHERE role = 'CORPORATE_ADMIN' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='PURCHASE' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'PURCHASE_MANAGER' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'PURCHASE', "updatedAt" = now() WHERE role = 'PURCHASE_MANAGER' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='STORE' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'STORE_MANAGER' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'STORE', "updatedAt" = now() WHERE role = 'STORE_MANAGER' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='PLANT_MANAGER' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'PLANT_HEAD' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'PLANT_MANAGER', "updatedAt" = now() WHERE role = 'PLANT_HEAD' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='STAGE_SUPERVISOR' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'SUPERVISOR' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'STAGE_SUPERVISOR', "updatedAt" = now() WHERE role = 'SUPERVISOR' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='QUALITY_MANAGER' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'QC_MANAGER' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'QUALITY_MANAGER', "updatedAt" = now() WHERE role = 'QC_MANAGER' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='HR' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'HR_MANAGER' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'HR', "updatedAt" = now() WHERE role = 'HR_MANAGER' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='ACCOUNTS' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'FINANCE_MANAGER' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'ACCOUNTS', "updatedAt" = now() WHERE role = 'FINANCE_MANAGER' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", (SELECT id FROM roles WHERE name='GATE_INCHARGE' AND "companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'), rp.permission, true, now()
FROM role_permissions rp JOIN roles r ON r.id = rp."roleId"
WHERE r.name = 'GAURD' AND rp."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
UPDATE users SET role = 'GATE_INCHARGE', "updatedAt" = now() WHERE role = 'GAURD' AND "companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1';
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_DASHBOARD_VIEW'),('SALES_VIEW'),('SALES_CREATE'),('SALES_APPROVE'),('SALES_EDIT'),('DISPATCH_PLAN_VIEW'),('DISPATCH_VIEW'),('DISPATCH_SOURCE_VIEW'),('DISPATCH_AVAILABILITY_VIEW'),('DISPATCH_RESERVATION_VIEW'),('DISPATCH_RESERVATION_CREATE'),('DISPATCH_RESERVATION_RELEASE'),('DISPATCH_PICK_VIEW'),('DISPATCH_PICK_CREATE'),('DISPATCH_PICK_CONFIRM'),('DISPATCH_PICK_REVERSE'),('DISPATCH_VERIFY_VIEW'),('DISPATCH_VERIFY_CONFIRM'),('DISPATCH_VERIFY_REVERSE'),('DISPATCH_PACK_VIEW'),('DISPATCH_PACK_CREATE'),('DISPATCH_PACK_CONFIRM'),('DISPATCH_PACK_REVERSE'),('DISPATCH_DOCUMENT_VIEW'),('DISPATCH_DOCUMENT_REFRESH'),('DISPATCH_TRANSPORT_VIEW'),('DISPATCH_TRANSPORT_ASSIGN'),('DISPATCH_TRANSPORT_REASSIGN'),('DISPATCH_TRANSPORT_CANCEL'),('DISPATCH_LOADING_VIEW'),('DISPATCH_LOADING_START'),('DISPATCH_LOADING_CONFIRM'),('DISPATCH_LOADING_UNLOAD'),('DISPATCH_LOADING_COMPLETE'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_CONFIRM_CREATE'),('DISPATCH_CONFIRM_REVERSE'),('GATE_DISPATCH_OUT_VIEW'),('GATE_DISPATCH_OUT_CONFIRM'),('GATE_DISPATCH_OUT_VIEW'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='ADMIN' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_DASHBOARD_VIEW'),('SALES_VIEW'),('SALES_CREATE'),('SALES_APPROVE'),('SALES_EDIT'),('DISPATCH_PLAN_VIEW'),('DISPATCH_VIEW'),('DISPATCH_SOURCE_VIEW'),('DISPATCH_AVAILABILITY_VIEW'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='SALES' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_DASHBOARD_VIEW'),('DISPATCH_RESERVATION_VIEW'),('DISPATCH_RESERVATION_CREATE'),('DISPATCH_RESERVATION_RELEASE'),('DISPATCH_PICK_VIEW'),('DISPATCH_PICK_CREATE'),('DISPATCH_PICK_CONFIRM'),('DISPATCH_PICK_REVERSE'),('DISPATCH_VERIFY_VIEW'),('DISPATCH_VERIFY_CONFIRM'),('DISPATCH_VERIFY_REVERSE'),('DISPATCH_PACK_VIEW'),('DISPATCH_PACK_CREATE'),('DISPATCH_PACK_CONFIRM'),('DISPATCH_PACK_REVERSE'),('DISPATCH_DOCUMENT_VIEW'),('DISPATCH_DOCUMENT_REFRESH'),('DISPATCH_TRANSPORT_VIEW'),('DISPATCH_TRANSPORT_ASSIGN'),('DISPATCH_TRANSPORT_REASSIGN'),('DISPATCH_TRANSPORT_CANCEL'),('DISPATCH_LOADING_VIEW'),('DISPATCH_LOADING_START'),('DISPATCH_LOADING_CONFIRM'),('DISPATCH_LOADING_UNLOAD'),('DISPATCH_LOADING_COMPLETE'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_CONFIRM_CREATE'),('DISPATCH_CONFIRM_REVERSE'),('GATE_DISPATCH_OUT_VIEW'),('GATE_DISPATCH_OUT_CONFIRM'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='STORE' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_DASHBOARD_VIEW'),('SALES_VIEW'),('SALES_CREATE'),('SALES_APPROVE'),('SALES_EDIT'),('DISPATCH_PLAN_VIEW'),('DISPATCH_VIEW'),('DISPATCH_SOURCE_VIEW'),('DISPATCH_AVAILABILITY_VIEW'),('DISPATCH_RESERVATION_VIEW'),('DISPATCH_RESERVATION_CREATE'),('DISPATCH_RESERVATION_RELEASE'),('DISPATCH_PICK_VIEW'),('DISPATCH_PICK_CREATE'),('DISPATCH_PICK_CONFIRM'),('DISPATCH_PICK_REVERSE'),('DISPATCH_VERIFY_VIEW'),('DISPATCH_VERIFY_CONFIRM'),('DISPATCH_VERIFY_REVERSE'),('DISPATCH_PACK_VIEW'),('DISPATCH_PACK_CREATE'),('DISPATCH_PACK_CONFIRM'),('DISPATCH_PACK_REVERSE'),('DISPATCH_DOCUMENT_VIEW'),('DISPATCH_DOCUMENT_REFRESH'),('DISPATCH_TRANSPORT_VIEW'),('DISPATCH_TRANSPORT_ASSIGN'),('DISPATCH_TRANSPORT_REASSIGN'),('DISPATCH_TRANSPORT_CANCEL'),('DISPATCH_LOADING_VIEW'),('DISPATCH_LOADING_START'),('DISPATCH_LOADING_CONFIRM'),('DISPATCH_LOADING_UNLOAD'),('DISPATCH_LOADING_COMPLETE'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_CONFIRM_CREATE'),('DISPATCH_CONFIRM_REVERSE'),('GATE_DISPATCH_OUT_VIEW'),('GATE_DISPATCH_OUT_CONFIRM'),('GATE_DISPATCH_OUT_VIEW'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='PLANT_MANAGER' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('GATE_DISPATCH_OUT_VIEW'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='GATE_INCHARGE' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_DASHBOARD_VIEW'),('SALES_VIEW'),('SALES_CREATE'),('SALES_APPROVE'),('SALES_EDIT'),('DISPATCH_PLAN_VIEW'),('DISPATCH_VIEW'),('DISPATCH_SOURCE_VIEW'),('DISPATCH_AVAILABILITY_VIEW'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='ACCOUNTS' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_RESERVATION_VIEW'),('DISPATCH_RESERVATION_CREATE'),('DISPATCH_RESERVATION_RELEASE'),('DISPATCH_PICK_VIEW'),('DISPATCH_PICK_CREATE'),('DISPATCH_PICK_CONFIRM'),('DISPATCH_PICK_REVERSE'),('DISPATCH_VERIFY_VIEW'),('DISPATCH_VERIFY_CONFIRM'),('DISPATCH_VERIFY_REVERSE'),('DISPATCH_PACK_VIEW'),('DISPATCH_PACK_CREATE'),('DISPATCH_PACK_CONFIRM'),('DISPATCH_PACK_REVERSE'),('DISPATCH_DOCUMENT_VIEW'),('DISPATCH_DOCUMENT_REFRESH'),('DISPATCH_TRANSPORT_VIEW'),('DISPATCH_TRANSPORT_ASSIGN'),('DISPATCH_TRANSPORT_REASSIGN'),('DISPATCH_TRANSPORT_CANCEL'),('DISPATCH_LOADING_VIEW'),('DISPATCH_LOADING_START'),('DISPATCH_LOADING_CONFIRM'),('DISPATCH_LOADING_UNLOAD'),('DISPATCH_LOADING_COMPLETE'),('DISPATCH_CONFIRM_VIEW'),('DISPATCH_CONFIRM_CREATE'),('DISPATCH_CONFIRM_REVERSE'),('GATE_DISPATCH_OUT_VIEW'),('GATE_DISPATCH_OUT_CONFIRM'),('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='OQC' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='QUALITY_MANAGER' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='IQC' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DISPATCH_TRACE_VIEW'),('DISPATCH_RECONCILIATION_VIEW')) AS p(perm)
WHERE r.name='IPQC' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
COMMIT;
