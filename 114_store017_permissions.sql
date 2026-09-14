INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_RTV_PREPARE', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_RTV_CANCEL', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'STORE_MANAGER')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'PURCHASE_RTV_AUTHORIZE', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PURCHASE_MANAGER')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'GATE_RTV_OUT_CONFIRM', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'GAURD')
ON CONFLICT DO NOTHING;
