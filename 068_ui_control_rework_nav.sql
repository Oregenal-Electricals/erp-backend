INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, is_active, is_test_data)
VALUES (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.production.rework', 'SIDEBAR_ITEM', 'Production', '/production/rework', 'Rework', NULL, 'sidebar.production', 12, true, now(), now(), true, false)
ON CONFLICT (company_id, key) DO NOTHING;
