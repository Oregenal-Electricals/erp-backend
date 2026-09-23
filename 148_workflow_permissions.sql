-- 148_workflow_permissions.sql
BEGIN;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('WORKFLOW_VIEW'),('WORKFLOW_MANAGE'),('WORKFLOW_ACT')) AS p(perm)
WHERE r.name='ADMIN' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('WORKFLOW_VIEW'),('WORKFLOW_SUBMIT')) AS p(perm)
WHERE r.name='RND' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('WORKFLOW_VIEW'),('WORKFLOW_ACT')) AS p(perm)
WHERE r.name='QUALITY_MANAGER' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('WORKFLOW_VIEW'),('WORKFLOW_ACT')) AS p(perm)
WHERE r.name='PLANT_MANAGER' AND r."companyId"='83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
COMMIT;
