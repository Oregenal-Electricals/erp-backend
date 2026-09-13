INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid()::text, r."companyId", r.id, p.permission, true, now()
FROM roles r
CROSS JOIN (VALUES ('ADDITIONAL_MATERIAL_APPROVE')) AS p(permission)
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid()::text, r."companyId", r.id, p.permission, true, now()
FROM roles r
CROSS JOIN (VALUES ('ADDITIONAL_MATERIAL_REQUEST')) AS p(permission)
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD', 'SUPERVISOR', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;
