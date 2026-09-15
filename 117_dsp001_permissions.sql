INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'SALES_ORDER_RELEASE_DISPATCH', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE')
ON CONFLICT DO NOTHING;
