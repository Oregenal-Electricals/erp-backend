DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, "companyId" FROM roles WHERE name IN ('PURCHASE_MANAGER', 'SUPER_ADMIN') AND "isActive" = true LOOP
    INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
    VALUES (gen_random_uuid()::text, r."companyId", r.id, 'GATE_INWARD_RESOLVE_HOLD', CURRENT_TIMESTAMP)
    ON CONFLICT ("roleId", permission) DO NOTHING;
  END LOOP;
END $$;
