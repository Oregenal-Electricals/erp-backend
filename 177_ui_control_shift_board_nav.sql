-- Adds the "Shift Board" sidebar item under Production, for everyone (no
-- per-role gating needed: a ui_control_elements row with default_visible=true
-- and no matching ui_control_overrides row shows for every role, per
-- ui-control.service.ts's merge order). Points at /production/shift-board,
-- the new simple hourly-entry tool (client-side only for now, no backend
-- data yet - just a page Rahul is iterating the UX of). Same pattern as
-- 068/069/078's Production children.
INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, is_active, is_test_data)
VALUES (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.production.shiftBoard', 'SIDEBAR_ITEM', 'Production', '/production/shift-board', 'Shift Board', 'calculator', 'sidebar.production', 15, true, now(), now(), true, false)
ON CONFLICT (company_id, key) DO NOTHING;
