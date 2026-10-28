INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'material-shortage-verify-migration', 'material-shortage-verify-migration'
FROM roles r
CROSS JOIN (VALUES ('MATERIAL_SHORTAGE_VIEW'), ('MATERIAL_SHORTAGE_VERIFY')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'STORE')
ON CONFLICT DO NOTHING;
