-- 167_dsp015_dispatch_tracking_permissions.sql
-- Grants the new DISPATCH_TRACKING_* permissions to every role that
-- already holds GATE_DISPATCH_OUT_VIEW (the Dispatch-role roster), the
-- same anchor permission 139/140 used for the prior DSP-013/DSP-014
-- permission grants.
BEGIN;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", perm, true, now()
FROM role_permissions rp, (VALUES ('DISPATCH_TRACKING_VIEW'), ('DISPATCH_TRACKING_CREATE'), ('DISPATCH_TRACKING_EDIT')) AS p(perm)
WHERE rp.permission = 'GATE_DISPATCH_OUT_VIEW'
ON CONFLICT DO NOTHING;

COMMIT;
