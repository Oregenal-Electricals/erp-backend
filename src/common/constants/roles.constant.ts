// Roles that self-approve rather than needing Plant Head sign-off - used
// consistently across Work Orders, Stage Transfers, Manpower allocation,
// and now Delete Requests. Already duplicated identically in
// work-order.service.ts, stage-transfer.service.ts, and manpower.service.ts
// (see PROJECT_STATUS.md's own note about this engine nearly being
// duplicated twice) - this is the shared source for new code, not a 4th
// copy. Those three existing files aren't touched here to keep this
// change isolated; worth consolidating them onto this import later.
export const STAGE_BYPASS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
