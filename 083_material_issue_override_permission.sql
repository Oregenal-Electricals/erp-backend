INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'MATERIAL_ISSUE_OVERRIDE_APPROVE', true, false, now(), now(), 'override-migration', 'override-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD')
ON CONFLICT DO NOTHING;
