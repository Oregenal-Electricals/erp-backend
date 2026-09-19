INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_DASHBOARD_VIEW'), ('DISPATCH_RECONCILIATION_VIEW'), ('DISPATCH_RECONCILIATION_RUN'), ('DISPATCH_TRACE_VIEW')) AS p(perm)
WHERE rp.permission = 'GATE_DISPATCH_OUT_VIEW'
ON CONFLICT DO NOTHING;
