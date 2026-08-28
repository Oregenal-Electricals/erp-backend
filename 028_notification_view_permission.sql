-- NOTIFICATION_VIEW gates read access to /notifications, which is
-- already filtered to WHERE userId = req.user.id in the service - so
-- granting this broadly does not expose other users' notifications,
-- it just lets each role actually see the notifications already
-- targeted at them (e.g. Store Manager seeing the GATE-002 receiving
-- reference alert). Excludes VIEWER, which is intentionally read-only
-- reporting access rather than an operational role.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, "companyId" FROM roles WHERE "isActive" = true AND name != 'VIEWER' LOOP
    INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
    VALUES (gen_random_uuid()::text, r."companyId", r.id, 'NOTIFICATION_VIEW', CURRENT_TIMESTAMP)
    ON CONFLICT ("roleId", permission) DO NOTHING;
  END LOOP;
END $$;
