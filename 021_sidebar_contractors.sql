UPDATE ui_control_elements SET sort_order = sort_order + 1 WHERE parent_key = 'sidebar.hr' AND sort_order >= 1;

INSERT INTO ui_control_elements (
  company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, is_active, is_test_data
) VALUES (
  '83eda866-ba63-472c-902f-561f05b6b1c1',
  'sidebar.hr.contractors',
  'SIDEBAR_ITEM',
  'HR',
  '/hr/contractors',
  'Contractors',
  'briefcase',
  'sidebar.hr',
  1,
  true,
  true,
  false
);
