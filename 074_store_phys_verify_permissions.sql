INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'store002-migration', 'store002-migration'
FROM roles r
CROSS JOIN (VALUES ('STORE_PHYSICAL_VERIFY_VIEW'), ('STORE_PHYSICAL_VERIFY'), ('STORE_PHYSICAL_VERIFY_CORRECT'), ('STORE_DISCREPANCY_VIEW')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;
