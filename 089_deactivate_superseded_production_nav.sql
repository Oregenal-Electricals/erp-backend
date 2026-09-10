UPDATE ui_control_elements
SET is_active = false, updated_at = now()
WHERE key IN ('sidebar.production.issues', 'sidebar.production.floor');
