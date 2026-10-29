INSERT INTO system_settings (id, key, value, description, category, "createdBy", "updatedBy", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', 'false', 'When true, starting a Work Order that is linked to a Sales Order is blocked unless every item on that Sales Order is backed by fully available/allocated material (no shortfall). When false (default), a Work Order can start even if its Sales Order''s material is only partially available - today''s existing partial-build behavior. Defaults to false so turning this feature on is an explicit, later, opt-in decision.', 'PRODUCTION', 'system', 'system', now())
ON CONFLICT (key) DO NOTHING;
