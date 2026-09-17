INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_RESERVATION_VIEW'), ('DISPATCH_RESERVATION_CREATE'), ('DISPATCH_RESERVATION_RELEASE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_AVAILABILITY_VIEW'
ON CONFLICT DO NOTHING;
