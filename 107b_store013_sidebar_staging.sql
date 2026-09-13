INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, is_active, is_test_data)
SELECT gen_random_uuid(), company_id, 'sidebar.inventory.additionalMaterialRequests', 'SIDEBAR_ITEM', 'Inventory', '/inventory/additional-material-requests', 'Additional Material Requests', NULL, 'sidebar.inventory', 4, true, now(), now(), true, false
FROM ui_control_elements WHERE key = 'sidebar.inventory.materialIssueOverrides';
