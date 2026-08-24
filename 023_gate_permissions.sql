-- Security Guard: day-to-day operational gate actions (create, verify,
-- check-in, event logging) - not approval/authorization.
DO $$
DECLARE r RECORD; p TEXT;
BEGIN
  FOR r IN SELECT id, "companyId" FROM roles WHERE name = 'GAURD' AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['GATE_INWARD_CREATE', 'GATE_INWARD_VERIFY', 'GATE_OUTWARD_CREATE', 'GATE_PASS_CREATE', 'GATE_PASS_VERIFY', 'VISITOR_CREATE', 'VISITOR_CHECKIN', 'VEHICLE_LOG_CREATE', 'GATE_EVENT_VIEW', 'GATE_EVENT_CREATE'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      VALUES (gen_random_uuid()::text, r."companyId", r.id, p, CURRENT_TIMESTAMP)
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Approval/authorization authority: same plant-leadership set already
  -- used for manpower approvals earlier today, for consistency.
  FOR r IN SELECT id, "companyId" FROM roles WHERE name IN ('PLANT_HEAD', 'PRODUCTION_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER') AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['GATE_INWARD_VIEW', 'GATE_INWARD_VERIFY', 'GATE_OUTWARD_VIEW', 'GATE_OUTWARD_AUTHORIZE', 'GATE_PASS_VIEW', 'GATE_PASS_APPROVE', 'VISITOR_VIEW', 'VEHICLE_LOG_VIEW', 'GATE_DASHBOARD_VIEW', 'GATE_MASTER_MANAGE', 'PARKING_MANAGE', 'GATE_EVENT_VIEW', 'GATE_EVENT_CORRECT'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      VALUES (gen_random_uuid()::text, r."companyId", r.id, p, CURRENT_TIMESTAMP)
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Store handles material inward acceptance context
  FOR r IN SELECT id, "companyId" FROM roles WHERE name = 'STORE_MANAGER' AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['GATE_INWARD_VIEW', 'GATE_INWARD_VERIFY', 'GATE_DASHBOARD_VIEW'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      VALUES (gen_random_uuid()::text, r."companyId", r.id, p, CURRENT_TIMESTAMP)
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- SUPER_ADMIN gets everything new too (already has the view-level set)
  FOR r IN SELECT id, "companyId" FROM roles WHERE name = 'SUPER_ADMIN' AND "isActive" = true LOOP
    FOREACH p IN ARRAY ARRAY['GATE_INWARD_CREATE', 'GATE_INWARD_VERIFY', 'GATE_OUTWARD_CREATE', 'GATE_OUTWARD_AUTHORIZE', 'GATE_PASS_CREATE', 'GATE_PASS_APPROVE', 'GATE_PASS_VERIFY', 'VISITOR_CREATE', 'VISITOR_CHECKIN', 'VEHICLE_LOG_CREATE', 'GATE_MASTER_MANAGE', 'PARKING_MANAGE', 'GATE_EVENT_VIEW', 'GATE_EVENT_CREATE', 'GATE_EVENT_CORRECT'] LOOP
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "updatedAt")
      VALUES (gen_random_uuid()::text, r."companyId", r.id, p, CURRENT_TIMESTAMP)
      ON CONFLICT ("roleId", permission) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
