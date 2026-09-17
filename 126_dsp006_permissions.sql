INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_PICK_VIEW'), ('DISPATCH_PICK_CREATE'), ('DISPATCH_PICK_CONFIRM'), ('DISPATCH_PICK_REVERSE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_RESERVATION_VIEW'
ON CONFLICT DO NOTHING;
