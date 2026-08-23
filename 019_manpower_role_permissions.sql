-- Manpower permissions were previously seeded only to SUPER_ADMIN.
-- Grant them to the roles that actually operate the manpower chain,
-- plus the new MANPOWER_ASSIGN permission for individual employee
-- assignment (Phase 1 of the manpower reconciliation module).
DO $$
DECLARE
  r RECORD;
  p TEXT;
  perms TEXT[];
BEGIN
  -- HR sends today's headcount to Plant Head
  FOR r IN SELECT id FROM roles WHERE name = 'HR_MANAGER' AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['MANPOWER_VIEW', 'MANPOWER_ALLOCATE', 'MANPOWER_QUERY'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      SELECT gen_random_uuid()::text, r2."companyId", r.id, p, CURRENT_TIMESTAMP FROM roles r2 WHERE r2.id = r.id
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Plant-level roles: full manpower control (distribute, accept, adjust, assign)
  FOR r IN SELECT id FROM roles WHERE name IN ('PLANT_HEAD', 'PRODUCTION_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER') AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['MANPOWER_VIEW', 'MANPOWER_ALLOCATE', 'MANPOWER_ACCEPT', 'MANPOWER_DISTRIBUTE', 'MANPOWER_QUERY', 'MANPOWER_ADJUST', 'MANPOWER_ASSIGN'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      SELECT gen_random_uuid()::text, r2."companyId", r.id, p, CURRENT_TIMESTAMP FROM roles r2 WHERE r2.id = r.id
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Stage Head / Supervisor: accept, distribute to Work Orders, assign individuals, query
  FOR r IN SELECT id FROM roles WHERE name = 'SUPERVISOR' AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['MANPOWER_VIEW', 'MANPOWER_ACCEPT', 'MANPOWER_DISTRIBUTE', 'MANPOWER_QUERY', 'MANPOWER_ASSIGN'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      SELECT gen_random_uuid()::text, r2."companyId", r.id, p, CURRENT_TIMESTAMP FROM roles r2 WHERE r2.id = r.id
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Management: view-only visibility
  FOR r IN SELECT id FROM roles WHERE name = 'CORPORATE_ADMIN' AND "isActive" = true LOOP
    INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
    SELECT gen_random_uuid()::text, r2."companyId", r.id, 'MANPOWER_VIEW', CURRENT_TIMESTAMP FROM roles r2 WHERE r2.id = r.id
    ON CONFLICT ("roleId", permission) DO NOTHING;
  END LOOP;

  -- SUPER_ADMIN gets the new permission too (already has the rest)
  FOR r IN SELECT id FROM roles WHERE name = 'SUPER_ADMIN' AND "isActive" = true LOOP
    INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
    SELECT gen_random_uuid()::text, r2."companyId", r.id, 'MANPOWER_ASSIGN', CURRENT_TIMESTAMP FROM roles r2 WHERE r2.id = r.id
    ON CONFLICT ("roleId", permission) DO NOTHING;
  END LOOP;
END $$;
