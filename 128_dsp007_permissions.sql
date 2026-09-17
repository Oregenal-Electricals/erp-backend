INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_VERIFY_VIEW'), ('DISPATCH_VERIFY_CONFIRM'), ('DISPATCH_VERIFY_REVERSE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_PICK_VIEW'
ON CONFLICT DO NOTHING;
