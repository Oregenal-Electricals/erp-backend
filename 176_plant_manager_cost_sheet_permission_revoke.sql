-- Task #78: costing/P&L visibility must stay Super Admin / Admin / Management
-- (Accounts) only. prisma/seed_15_role_structure.ts was seeding
-- PRODUCTION_COST_SHEET_VIEW directly onto PLANT_MANAGER, which is neither
-- Super Admin, Admin, nor Accounts - a direct leak of per-work-order material
-- cost, labour cost, rework cost and scrap recovery (see
-- src/production-cost-sheets/cost-sheet.service.ts) to a non-management role.
--
-- This revokes it from any company where PLANT_MANAGER was already seeded
-- (soft-revoke via isActive=false, matching every other role-permission row's
-- own convention, and reversible from Settings > Roles & Permissions if a
-- company genuinely wants to grant it back). It does not touch any other
-- role or permission.
UPDATE role_permissions rp
SET "isActive" = false, "updatedAt" = now(), "updatedBy" = 'plant-manager-cost-sheet-permission-revoke-migration'
FROM roles r
WHERE rp."roleId" = r.id
  AND r.name = 'PLANT_MANAGER'
  AND rp.permission = 'PRODUCTION_COST_SHEET_VIEW'
  AND rp."isActive" = true;
