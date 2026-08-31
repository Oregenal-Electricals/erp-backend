INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid()::text, rp."companyId", rp."roleId", 'WORK_ORDER_RELEASE', true, false, now(), now(), 'system', 'system'
FROM role_permissions rp
WHERE rp.permission = 'PRODUCTION_EDIT'
  AND rp."isActive" = true
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 WHERE rp2."companyId" = rp."companyId" AND rp2."roleId" = rp."roleId" AND rp2.permission = 'WORK_ORDER_RELEASE'
  );
