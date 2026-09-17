INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_PACK_VIEW'), ('DISPATCH_PACK_CREATE'), ('DISPATCH_PACK_CONFIRM'), ('DISPATCH_PACK_REVERSE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_VERIFY_VIEW'
ON CONFLICT DO NOTHING;
