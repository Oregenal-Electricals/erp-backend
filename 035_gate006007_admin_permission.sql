-- GATE-006/007 explicitly widens who can decide a mismatch to
-- "purchase, admin, superadmin" - GATE_INWARD_RESOLVE_HOLD is shared
-- across GATE-003 through GATE-007's resolution actions, so this
-- also gives Corporate Admin access to GATE-003/004/005's resolution
-- routes too. That's a reasonable widening, not a narrowing: Corporate
-- Admin sits above Purchase Manager in authority.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, "companyId" FROM roles WHERE name = 'CORPORATE_ADMIN' AND "isActive" = true LOOP
    INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
    VALUES (gen_random_uuid()::text, r."companyId", r.id, 'GATE_INWARD_RESOLVE_HOLD', CURRENT_TIMESTAMP)
    ON CONFLICT ("roleId", permission) DO NOTHING;
  END LOOP;
END $$;
