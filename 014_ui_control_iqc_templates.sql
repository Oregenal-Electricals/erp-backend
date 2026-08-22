UPDATE ui_control_elements SET sort_order = sort_order + 1 WHERE parent_key = 'sidebar.quality' AND sort_order >= 2;

INSERT INTO ui_control_elements (
  company_id, key, element_type, module, page, label, icon, parent_key,
  sort_order, default_visible, is_active, is_test_data
) VALUES (
  '83eda866-ba63-472c-902f-561f05b6b1c1',
  'sidebar.quality.iqcTemplates',
  'SIDEBAR_ITEM',
  'Quality',
  '/inventory/iqc-templates',
  'IQC Templates',
  'clipboard-list',
  'sidebar.quality',
  2,
  true,
  true,
  false
);
