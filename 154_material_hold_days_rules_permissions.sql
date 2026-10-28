-- 154_material_hold_days_rules_permissions.sql
-- Material Hold-Days Rules is configuration governance (who decides how
-- many days of "no guarantee" liability a material/vendor combination
-- gets) - granted to Admin/Super Admin only, same restriction pattern
-- as other admin-only grants in this file series (e.g.
-- 035_gate006007_admin_permission.sql).
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_HOLD_DAYS_RULE_VIEW', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), r."companyId", r.id, 'STORE_HOLD_DAYS_RULE_MANAGE', true, now()
FROM roles r WHERE r.name IN ('SUPER_ADMIN', 'CORPORATE_ADMIN')
ON CONFLICT DO NOTHING;
