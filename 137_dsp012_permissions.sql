INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_CONFIRM_VIEW'), ('DISPATCH_CONFIRM_CREATE'), ('DISPATCH_CONFIRM_REVERSE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_LOADING_VIEW'
ON CONFLICT DO NOTHING;
