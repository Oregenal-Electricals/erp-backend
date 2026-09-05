INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'store001-migration', 'store001-migration'
FROM roles r
CROSS JOIN (VALUES ('STORE_RECEIVING_VIEW'), ('STORE_RECEIVING_CREATE'), ('STORE_RECEIVING_DETAIL_VIEW')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;
