INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'PRODUCTION_TARGET_VIEW', true, false, now(), now(), 'target-migration', 'target-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD', 'PLANNING_MANAGER', 'SUPERVISOR')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'PRODUCTION_TARGET_MANAGE', true, false, now(), now(), 'target-migration', 'target-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD', 'PLANNING_MANAGER')
ON CONFLICT DO NOTHING;
