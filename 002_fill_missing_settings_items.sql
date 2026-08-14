-- Fills in the 8 Settings-section items that failed to seed via ts-node
-- (script hit the same cutoff point twice — likely a Neon connection/pool
-- timeout at a consistent elapsed time, not a data problem). Safe to run
-- even if some of these already exist, thanks to ON CONFLICT DO NOTHING.

INSERT INTO ui_control_elements
  (id, company_id, key, element_type, module, page, label, parent_key, sort_order, default_visible, is_active, is_test_data)
VALUES
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.financialYear',    'SIDEBAR_ITEM', 'Settings', '/masters/financial-year',      'Financial Year',        'sidebar.settings', 6,  true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.users',             'SIDEBAR_ITEM', 'Settings', '/users',                       'Users',                  'sidebar.settings', 7,  true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.system',            'SIDEBAR_ITEM', 'Settings', '/settings/system',             'System Settings',        'sidebar.settings', 8,  true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.rolesPermissions',  'SIDEBAR_ITEM', 'Settings', '/settings/roles-permissions',  'Roles & Permissions',    'sidebar.settings', 9,  true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.numbering',         'SIDEBAR_ITEM', 'Settings', '/settings/numbering',          'Numbering Series',       'sidebar.settings', 10, true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.customFields',      'SIDEBAR_ITEM', 'Settings', '/settings/custom-fields',      'Custom Fields',          'sidebar.settings', 11, true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.dummyData',         'SIDEBAR_ITEM', 'Settings', '/settings/dummy-data',         'Dummy Data',             'sidebar.settings', 12, true, true, false),
  (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.settings.uiControl',         'SIDEBAR_ITEM', 'Settings', '/settings/ui-control',         'UI Control Center',      'sidebar.settings', 13, true, true, false)
ON CONFLICT (company_id, key) DO NOTHING;
