INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_TRANSPORT_VIEW'), ('DISPATCH_TRANSPORT_ASSIGN'), ('DISPATCH_TRANSPORT_REASSIGN'), ('DISPATCH_TRANSPORT_CANCEL')) AS p(perm)
WHERE rp.permission = 'DISPATCH_DOCUMENT_VIEW'
ON CONFLICT DO NOTHING;
