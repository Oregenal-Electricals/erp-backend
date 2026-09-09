INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'PRODUCT_SELLING_PRICE_VIEW', true, false, now(), now(), 'selling-price-migration', 'selling-price-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PRODUCTION_HEAD', 'FINANCE_MANAGER')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'PRODUCT_SELLING_PRICE_MANAGE', true, false, now(), now(), 'selling-price-migration', 'selling-price-migration'
FROM roles r
WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'FINANCE_MANAGER')
ON CONFLICT DO NOTHING;
