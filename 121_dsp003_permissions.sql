INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", 'DISPATCH_AVAILABILITY_VIEW', true, now()
FROM role_permissions rp
WHERE rp.permission = 'DISPATCH_VIEW'
ON CONFLICT DO NOTHING;
