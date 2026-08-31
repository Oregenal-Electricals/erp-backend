INSERT INTO system_settings (id, key, value, description, category, "createdBy", "updatedBy", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'STANDARD_LABOUR_RATE_PER_SHIFT', '120', 'Standard labour cost per worker per shift (Rupees), used for planned labour cost reference at Work Order release. PROD-001.', 'PRODUCTION', 'system', 'system', now()),
  (gen_random_uuid()::text, 'STANDARD_SHIFT_HOURS', '8', 'Standard shift length in hours, used to derive hourly labour rate for planned labour cost reference. PROD-001.', 'PRODUCTION', 'system', 'system', now()),
  (gen_random_uuid()::text, 'WO_BLOCK_RELEASE_ON_SHORTAGE', 'false', 'When true, releasing a Work Order is blocked if the material availability check finds a shortage. When false, the shortage is shown but release is still allowed. PROD-001.', 'PRODUCTION', 'system', 'system', now())
ON CONFLICT (key) DO NOTHING;
