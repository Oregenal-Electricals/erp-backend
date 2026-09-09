UPDATE ui_control_elements
SET is_active = false, updated_at = now()
WHERE key IN ('sidebar.inventory.grn', 'sidebar.inventory.rejected', 'sidebar.inventory.putaway', 'sidebar.inventory.stock');
