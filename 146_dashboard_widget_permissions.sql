-- 146_dashboard_widget_permissions.sql
BEGIN;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('PRODUCTION_DASHBOARD_VIEW'),('QUALITY_DASHBOARD_VIEW'),('INVENTORY_DASHBOARD_VIEW'),('SALES_ORDER_VIEW'),('PURCHASE_ORDER_VIEW'),('CUSTOMER_PO_VIEW')) AS p(perm)
WHERE r.name='PLANT_MANAGER' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('PRODUCTION_DASHBOARD_VIEW')) AS p(perm)
WHERE r.name='STAGE_SUPERVISOR' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('EMPLOYEE_VIEW')) AS p(perm)
WHERE r.name='HR' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('FINANCIAL_REPORT_VIEW')) AS p(perm)
WHERE r.name='ACCOUNTS' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('BOM_VIEW')) AS p(perm)
WHERE r.name='RND' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
COMMIT;
