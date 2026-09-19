INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('GATE_DISPATCH_OUT_VIEW'), ('GATE_DISPATCH_OUT_CONFIRM')) AS p(perm)
WHERE rp.permission = 'DISPATCH_CONFIRM_VIEW'
ON CONFLICT DO NOTHING;
