INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, p.permission, true, now()
FROM roles r
CROSS JOIN (VALUES ('STORE_LOCATION_TRANSFER_VIEW'), ('STORE_LOCATION_TRANSFER_EXECUTE')) AS p(permission)
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'STORE_MANAGER', 'SUPERVISOR')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_LOCATION_TRANSFER_VIEW', true, now()
FROM roles r
WHERE r.name = 'VIEWER'
ON CONFLICT DO NOTHING;
