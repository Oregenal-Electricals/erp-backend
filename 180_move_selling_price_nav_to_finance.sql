-- 180_move_selling_price_nav_to_finance.sql
--
-- Rahul's policy: amount/price-related data belongs ONLY inside the
-- Accounts/Finance portal. Store, Production and other operational
-- modules must never surface a pricing tab of their own, or operational
-- staff start confusing themselves with figures that aren't theirs to
-- act on; anyone (including management) who needs a price looks it up
-- inside the Accounts portal, not wherever they happen to be working.
--
-- The "Selling Price" tab (product-selling-price module, page
-- /products/selling-prices) is currently showing up grouped under the
-- Inventory sidebar section. It was never created through a committed
-- migration or the seed-ui-control.ts TS seed - 086/087 only created the
-- product_selling_prices table and its two PRODUCT_SELLING_PRICE_*
-- permissions - so it must have been added live via the UI Control
-- Center admin screen directly against production, with whatever
-- key/parent_key that admin action happened to write.
--
-- Sidebar grouping is driven purely by parent_key, not by the `module`
-- label column (see ui-control.service.ts buildTree/buildRoleAwareSidebar)
-- - and a per-role/per-user row in ui_control_overrides can relocate an
-- element independently of its own base parent_key. Since we don't know
-- whether this element ended up under Inventory via its base parent_key
-- or via such an override (or both), this migration covers both paths,
-- matching the element by its page/label rather than by an exact key we
-- don't have on record.
--
-- Leaves role_permissions (087_selling_price_permissions.sql) untouched:
-- who may view/manage selling price is a separate question from where
-- the tab is filed, and the current grantee list (SUPER_ADMIN,
-- CORPORATE_ADMIN, PLANT_HEAD, UNIT_HEAD, PRODUCTION_HEAD, ACCOUNTS -
-- renamed from FINANCE_MANAGER by 141_org_roles_setup.sql) already
-- excludes Store/operational roles.
BEGIN;

-- Base element: wherever it is currently filed as a direct child of
-- Inventory, move it under Finance instead.
UPDATE ui_control_elements
SET parent_key = 'sidebar.finance', module = 'Finance', sort_order = 6, updated_at = now()
WHERE company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
  AND element_type = 'SIDEBAR_ITEM'
  AND parent_key = 'sidebar.inventory'
  AND (page ILIKE '%selling-price%' OR label ILIKE '%selling price%');

-- Any role/user override that independently relocated the same element
-- under Inventory (e.g. for Super Admin specifically) - repoint it too,
-- so the fix holds regardless of which path put it there.
UPDATE ui_control_overrides o
SET parent_key_override = 'sidebar.finance', updated_at = now()
FROM ui_control_elements e
WHERE o.element_id = e.id
  AND e.company_id = '83eda866-ba63-472c-902f-561f05b6b1c1'
  AND (e.page ILIKE '%selling-price%' OR e.label ILIKE '%selling price%')
  AND o.parent_key_override = 'sidebar.inventory';

COMMIT;
