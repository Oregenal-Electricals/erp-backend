-- 160_debit_note_permissions.sql
-- DEBIT_NOTE_VIEW/DEBIT_NOTE_MANAGE for the new vendor Debit Note
-- feature (IQC-055), scoped to the live company per the current
-- 15-role structure (see 141_org_roles_setup.sql / 148_workflow_permissions.sql)
-- rather than the old pre-restructuring role names.
BEGIN;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, p.perm, true, now()
FROM roles r, (VALUES ('DEBIT_NOTE_VIEW'),('DEBIT_NOTE_MANAGE')) AS p(perm)
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS') AND r."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', r.id, 'DEBIT_NOTE_VIEW', true, now()
FROM roles r
WHERE r.name = 'PURCHASE' AND r."companyId" = '83eda866-ba63-472c-902f-561f05b6b1c1'
ON CONFLICT DO NOTHING;
COMMIT;
