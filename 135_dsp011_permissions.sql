INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_LOADING_VIEW'), ('DISPATCH_LOADING_START'), ('DISPATCH_LOADING_CONFIRM'), ('DISPATCH_LOADING_UNLOAD'), ('DISPATCH_LOADING_COMPLETE')) AS p(perm)
WHERE rp.permission = 'DISPATCH_TRANSPORT_VIEW'
ON CONFLICT DO NOTHING;
