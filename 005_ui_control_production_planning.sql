-- Adds "Production Planning" as its own sidebar item under Production,
-- positioned right before "Work Orders" (matching the real flow: plan ->
-- Work Orders get created -> appear in the Work Orders list). Shifts the
-- 7 existing rows from that point on by +1 rather than appending at the
-- end, since position matters here per explicit user request for a
-- "clean flow" - this is meant to be the natural next stop after a Sales
-- Order is confirmed, not buried after unrelated tools.
UPDATE ui_control_elements
SET sort_order = sort_order + 1
WHERE parent_key = 'sidebar.production' AND sort_order >= 4;

INSERT INTO ui_control_elements (
  id, company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, created_at, updated_at, created_by, updated_by,
  is_active, is_test_data
) VALUES (
  gen_random_uuid(),
  '83eda866-ba63-472c-902f-561f05b6b1c1',
  'sidebar.production.planning',
  'SIDEBAR_ITEM',
  'Production',
  '/production/planning',
  'Production Planning',
  'clipboard-list',
  'sidebar.production',
  4,
  true,
  now(),
  now(),
  '19b228a1-c479-4b25-bf69-a5d3e091f682',
  '19b228a1-c479-4b25-bf69-a5d3e091f682',
  true,
  false
)
ON CONFLICT (company_id, key) DO NOTHING;
