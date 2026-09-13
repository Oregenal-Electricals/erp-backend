INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_STOCK_ADJUST_REVERSE', true, now()
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD')
ON CONFLICT DO NOTHING;
