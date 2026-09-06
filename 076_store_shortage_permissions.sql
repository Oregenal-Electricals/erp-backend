INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'store003-migration', 'store003-migration'
FROM roles r
CROSS JOIN (VALUES ('STORE_SHORTAGE_VIEW'), ('STORE_SHORTAGE_CREATE'), ('STORE_SHORTAGE_CORRECT')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'store003-migration', 'store003-migration'
FROM roles r
CROSS JOIN (VALUES ('PURCHASE_SHORTAGE_VIEW'), ('PURCHASE_SHORTAGE_REVIEW'), ('PURCHASE_SHORTAGE_RESOLVE'), ('PURCHASE_SHORT_CLOSE_APPROVE')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'PURCHASE_MANAGER')
ON CONFLICT DO NOTHING;
