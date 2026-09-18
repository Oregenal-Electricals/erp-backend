INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_DOCUMENT_VIEW'), ('DISPATCH_DOCUMENT_REFRESH')) AS p(perm)
WHERE rp.permission = 'DISPATCH_PACK_VIEW'
ON CONFLICT DO NOTHING;
