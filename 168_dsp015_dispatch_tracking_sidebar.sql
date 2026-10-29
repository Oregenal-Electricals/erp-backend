-- 168_dsp015_dispatch_tracking_sidebar.sql
-- Registers the DSP-015 tracking timeline as a sidebar item under the
-- existing Dispatch section, following the same ui_control_elements /
-- ui_control_overrides convention 143_dispatch_sidebar.sql used for the
-- sibling Gate-Out Status and Trace Dispatch entries.
BEGIN;

INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'dispatch.trackingTimeline', 'SIDEBAR_ITEM', 'dispatch', '/dispatch/tracking', 'Shipment Tracking', 'map-pin', 'dispatch.section', 6, false, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (SELECT 1 FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trackingTimeline');

INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trackingTimeline'), 'ROLE', 'ADMIN', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trackingTimeline' AND o.role_name = 'ADMIN' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

INSERT INTO ui_control_overrides (id, company_id, element_id, scope_type, role_name, is_visible, created_at, updated_at, created_by, updated_by, is_active, is_test_data)
SELECT gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', (SELECT id FROM ui_control_elements WHERE company_id='83eda866-ba63-472c-902f-561f05b6b1c1' AND key='dispatch.trackingTimeline'), 'ROLE', 'SALES', true, now(), now(), '19b228a1-c479-4b25-bf69-a5d3e091f682', '19b228a1-c479-4b25-bf69-a5d3e091f682', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM ui_control_overrides o JOIN ui_control_elements e ON e.id = o.element_id
  WHERE e.key = 'dispatch.trackingTimeline' AND o.role_name = 'SALES' AND o.scope_type = 'ROLE' AND o.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
);

COMMIT;
