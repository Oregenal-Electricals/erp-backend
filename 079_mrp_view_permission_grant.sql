INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'MRP_VIEW', true, false, now(), now(), 'mrp-view-fix', 'mrp-view-fix'
FROM roles r
WHERE r.name IN ('CORPORATE_ADMIN', 'PLANNING_MANAGER', 'PLANT_HEAD', 'PRODUCTION_HEAD', 'UNIT_HEAD')
ON CONFLICT DO NOTHING;
