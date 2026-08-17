INSERT INTO ui_control_elements (
  id, company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, created_at, updated_at, created_by, updated_by,
  is_active, is_test_data
) VALUES (
  gen_random_uuid(),
  '83eda866-ba63-472c-902f-561f05b6b1c1',
  'sidebar.inventory.productFamilies',
  'SIDEBAR_ITEM',
  'Inventory',
  '/masters/product-families',
  'Product Families',
  'layers',
  'sidebar.inventory',
  18,
  true,
  now(),
  now(),
  '19b228a1-c479-4b25-bf69-a5d3e091f682',
  '19b228a1-c479-4b25-bf69-a5d3e091f682',
  true,
  false
)
ON CONFLICT (company_id, key) DO NOTHING;
