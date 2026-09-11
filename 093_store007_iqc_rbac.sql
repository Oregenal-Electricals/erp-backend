INSERT INTO role_permissions ("id", "companyId", "roleId", "permission", "updatedAt")
SELECT gen_random_uuid()::text, r."companyId", r.id, p.permission, now()
FROM roles r
CROSS JOIN (VALUES ('STORE_IQC_HANDOVER'), ('STORE_IQC_CANCEL')) AS p(permission)
WHERE r.name IN ('STORE_MANAGER', 'PLANT_HEAD', 'UNIT_HEAD')
ON CONFLICT ("roleId", "permission") DO NOTHING;

INSERT INTO role_permissions ("id", "companyId", "roleId", "permission", "updatedAt")
SELECT gen_random_uuid()::text, r."companyId", r.id, 'QC_IQC_RECEIVE', now()
FROM roles r
WHERE r.name IN ('QC_MANAGER', 'PLANT_HEAD', 'UNIT_HEAD')
ON CONFLICT ("roleId", "permission") DO NOTHING;
