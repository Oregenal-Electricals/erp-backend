# Oregenal Electricals ERP — Project Status

**Last updated:** July 27, 2026
**Purpose:** If you're Claude starting a fresh chat with no memory of prior sessions, read this file first. It tells you exactly what's built, what's pending, and how to pick up work correctly.

---

## Project basics

- **Company:** Oregenal Electricals India Pvt Ltd — Smart Manufacturing ERP/MES
- **Backend:** NestJS + TypeScript + Prisma → Render (`erp-backend-ry5v.onrender.com`), repo `Oregenal-Electricals/erp-backend`
- **Frontend:** Next.js + Tailwind → Vercel, repo `Oregenal-Electricals/erp-frontend`
- **DB:** Neon Postgres. Dev: `ep-rough-rain-aoif6ijx/erp_development`. Staging: `ep-square-feather-aogpdkfj/erp_staging`
- **Local repos:** `~/Desktop/websites/erp/erp-backend` and `~/Desktop/websites/erp/erp-frontend`
- Every push to `main` on either repo auto-deploys to staging (there is no separate production environment yet).
- Login: `superadmin@oregenalelectrical.com` / `Oregenal@123`. Company ID: `83eda866-ba63-472c-902f-561f05b6b1c1`
- **Workflow with the user:** Claude has a sandboxed copy of both repos and makes all edits there first, verifies with a build, then hands the user a `git apply` patch (or occasionally a base64-encoded full file, or raw `cat > file` for new/status files) to run on their real machine. The user does not code themselves — Claude does 100% of the implementation and the user copy-pastes and reports build output back.
- **Critical Prisma rule:** never use `prisma migrate dev` — always hand-write SQL DDL and apply directly to both dev and staging DBs via psql, then update `schema.prisma` to match and run `npx prisma generate`.
- Always run `rm -rf dist && npx nest build` before committing on the backend (dist/ is committed to the repo for Render).

---

## What's been built, in order (all live on staging as of this file's date)

### 1. Store / Inventory visibility overhaul
Fixed dead/orphaned Stock Ledger page, added low-stock flagging, idempotent IQC receive, Putaway pending queue auto-populated from real GRN data, Rack & Bin inline forms.

### 2. Production routing engine — verified end-to-end
SMT → MI → Assembly → Packaging chain via `ProductRouting` / `RoutingStage` / `WorkOrder.routingGroupId`. Each stage auto-releases only once the prior stage gets a **confirmed FG Receipt**. First real click-test of this system happened this session — it works.

### 3. Critical material-reservation bug (found and fixed)
Reservations were created on Work Order release but **never released** on completion or cancellation — material stayed locked forever. Fixed in three places: `WorkOrderService.complete()`, `.cancel()`, and `ProductionEntryService.confirm()` (which bypasses the service's `complete()` with its own raw update — a separate code path that needed its own fix). Backfilled ~52,000 units of incorrectly-locked stock on both DBs.

### 4. Double-reservation bug (found and fixed)
`MrpService.runAllocation()` used to create a "parent" Work Order AND the routing chain separately reserved the same material again. Fixed by merging Run Allocation directly into routing-chain creation — no more redundant parent WO.

### 5. Work Order naming
Routing stage WOs are named `{root}-{STAGENAME}` (e.g. `WO-2026-0009-SMT`, `-MI`, `-ASSEMBLY`, `-PACKAGING`). This was implemented in `RoutingService.startProduction()`. Historical WOs from before the fix were manually backfilled via SQL (`WO-2026-0005` and `WO-2026-0006` chains).

### 6. Production Floor page (`/production/floor`)
Single-screen execution: pick your active Work Order, enter Good/Scrap Qty, one button does Start → Record → Confirm → Complete → FG Receipt (previously 5 separate pages).

### 7. Per-user stage assignment (`assignedStage` on User)
An operator assigned to e.g. `SMT` only sees SMT's Work Orders (backend-filtered in `WorkOrderService.findAll()`/`getStats()`). Supervisors/Plant Head/Admin tier always see everything. Set via **Users → Edit → Assigned Production Stage**.

### 8. Grouped Work Orders view
Routing chains collapse into one clickable header row with overall chain progress, instead of one flat row per stage. `groupSummary()` in `work-orders/page.jsx`.

### 9. Manpower Allocation module (new: `ManpowerAllocation`, `ManpowerQuery` models)
Hierarchical: `HR_TO_PLANT` → `PLANT_TO_STAGE` → `STAGE_TO_LINE`. Each level must **accept** what's handed to them. **Distribute** splits to multiple recipients at once. A line can go to a person (Line Incharge), directly to a **Work Order** (`workOrderId` field, optional `toUserId`), or both. Mismatches between distributed total and parent count can be **queried** and resolved. Page: `/production/manpower`. Permissions: `MANPOWER_VIEW/ALLOCATE/ACCEPT/DISTRIBUTE/QUERY/ADJUST`.

### 10. Stage-to-Stage FG Transfer Notes (new: `StageTransferNote` model)
Explicit Give/Receive handoff between stages' Work Orders — a visible acknowledgment record sitting *alongside* (not replacing) the automatic BOM-based material consumption. Page: `/production/stage-transfers`. Permissions: `STAGE_TRANSFER_VIEW/GIVE/RECEIVE`.

### 11. Plant Head Approval Gate — **reuses the existing generic multi-level workflow engine** (`WorkflowDefinition` / `WorkflowStep` / `ApprovalRequest` / `ApprovalAction` — this already existed for PO/SO/Voucher approvals; do NOT build a parallel approval system, always check for and reuse this one first)
- **Work Order Start**: gated. Plant-Head-tier roles (`SUPER_ADMIN`, `ADMIN`, `CORPORATE_ADMIN`, `PLANT_HEAD`, `UNIT_HEAD`, `PLANNING_MANAGER` — this exact list is called `STAGE_BYPASS_ROLES` in `work-order.service.ts` and `SUPERVISOR_ROLES` in `manpower.service.ts`, same roles) self-approve instantly; anyone else's Start submits a `WO_START` approval request and does NOT take effect until approved.
- **Work Order Stop**: instant, no approval needed (reactive/floor decision).
- **Work Order Restart**: gated, same pattern, `documentType: 'WO_RESTART'`.
- **Manpower Increase/Decrease** on an active (`IN_PROGRESS`) Work Order's allocation: gated, `documentType: 'MANPOWER_INCREASE'`/`'MANPOWER_DECREASE'`.
- **Manpower Transfer** between Work Orders: gated, `documentType: 'MANPOWER_TRANSFER'`. Destination WO id is packed into `ApprovalRequest.remarks` as JSON (`{reason, toWorkOrderId}`) since the generic engine's schema has no bespoke payload field — this is intentional, not a hack to "fix" later.
- All of these share **one pair of endpoints per domain**: `POST /work-orders/approvals/:requestId/approve|reject` and `POST /manpower/approvals/:requestId/approve|reject` — each dispatches internally based on `documentType`, so adding a new gated action later is just one more `if` branch, not a new route.
- Every approval **auto-notifies all Admin/Super Admin users** via the existing `NotificationsService`.
- A frontend **Pending Approvals panel** exists on the Work Orders page (visible to Plant-Head-tier roles); Plant Head can also just use the pre-existing generic `/workflows` page (it works with any `documentType` automatically — no frontend change was needed there).
- `WorkflowDefinition` rows for `WO_START`, `WO_RESTART`, `MANPOWER_INCREASE`, `MANPOWER_DECREASE`, `MANPOWER_TRANSFER` were seeded via SQL for every company (1 approval level, "Plant Head Approval" step, `triggerCondition: 'ALWAYS'`). If a new company is added later, seed these the same way or the generic engine will still create requests with default 1-level behavior (it doesn't hard-require a definition to exist) but the UI/reporting is cleaner with one.
- Permission: `WORK_ORDER_APPROVE` gates all approve/reject endpoints (both Work Order and Manpower ones — one permission, deliberately, since it's the same real-world authority).

### 12. Work Order Types 1-4 (partial routing chains) — **in progress, Types 1-3 done, Type 4 not yet verified**
Per the user's detailed process doc (see "Source documents" below), a customer's order determines how much of the routing chain needs to run:
- **Type 1** (full product): order the final packaged item code → full chain, unchanged existing behavior.
- **Type 2** (SMT-only dispatch): order the SMT stage's own item code directly → chain runs stage 1 only.
- **Type 3** (MI-only dispatch): order the MI stage's item code → chain runs SMT → MI, stops there.
- **Type 4** (raw material only, no manufacturing): order a plain raw material with no matching routing at all → falls through to existing bare-WO/no-routing behavior. **This existed already and was not specifically re-verified this session** — worth a real test.

Implementation: `MrpService.runAllocation()` now looks up a `RoutingStage` (not just `ProductRouting.finalProductId`) whose own BOM produces the ordered item, and passes `stopAtSequence` to `RoutingService.startProduction()`, which filters `routing.stages` down to `sequence <= stopAtSequence` before creating Work Orders. **This was just pushed and has NOT yet been tested with a real order** — next step when resuming is to create a Sales Order for `TRPLEDECOPN036CW-MI` and confirm Run Allocation creates exactly 2 stage Work Orders (SMT + MI), not 4.

The "Store must receive, verify, and inventory before dispatch" business rule (from the process doc) is believed to already be satisfied by the existing FG Receipt mechanism for whichever stage ends up being the last one run — **this has not been explicitly verified for Type 2/3 orders**, only reasoned about. Worth confirming.

---

## Not yet started

- **Phase C** — confirm Dispatch can only ever pull from Store-verified inventory (all item types: final FG, SMT FG, MI FG, raw material), no department bypassing Store.
- **Phase D** — Hourly Production Monitoring Dashboard (active/completed/started WOs, manpower per WO, product/stage-wise output, utilization, idle manpower, transfers, efficiency, manpower-based costing).
- **Sidebar/page cleanup review** — the user asked for a full review of unused sidebar tabs/pages, to be removed only after explicit confirmation per item, and never removing something that's still needed even if a newer feature was just built to replace it (verify the old one is truly dead first). **This has not been started at all.**
- **Frontend UI for Stop/Restart's own dedicated request flow** exists (buttons on Work Orders page), but Manpower Adjust/Transfer's UI (`/production/manpower`) only has the request-side forms — there's no dedicated "my pending manpower approvals" panel there yet (Plant Head currently must use the generic `/workflows` page for these, same as Work Order approvals before the panel was added there).

---

## Key architectural invariants (apply to everything)

- Every table: UUID id, 8 audit columns (`createdAt/updatedAt/createdBy/updatedBy` + `isActive`/`isTestData`), soft delete via `isActive`.
- All APIs: JWT + RBAC (`PermissionsGuard`) + validation + audit logging.
- No negative stock at DB or service layer; prices frozen on approved documents.
- Multi-company isolation via `companyId` on all tables.
- New permissions must be added to `src/common/permissions/permissions.enum.ts` AND, if they should be visible in the admin UI, to the `PERMISSION_SECTIONS` array in `erp-frontend/src/app/(app)/settings/roles-permissions/page.jsx` (tabs + actions), plus `ACTION_LABELS` for readable action names. Adding to the enum alone makes the permission functional but invisible to admins trying to grant it.
- **Before building any new cross-cutting system (approval, notification, transfer, etc.), search the existing codebase first** — this project already has more general-purpose infrastructure than expected (a full multi-level approval engine, a notification system) that was nearly duplicated twice this session before being discovered and reused instead. `grep -rn "ApprovalRequest\|WorkflowDefinition\|Notification"` style searches across `src/` are cheap insurance.
- Sandbox note: `npx prisma generate` and `npx nest build` sometimes fail in Claude's sandbox due to network restrictions on Prisma's binary CDN, even when the actual code is correct — when this happens, ask the user to run `npx prisma generate` on their own machine as the real validation step, since their machine has full network access.

---

## Source documents referenced this session

The user provided two planning documents mid-session that are worth re-reading if continuing this work:
1. A 6-step manpower/production description (HR→Plant→Stage→Line manpower, WO merging under one root number, stage-to-stage transfer notes) — fully implemented (items 9, 10 above, plus the WO naming/grouping in items 5/8).
2. A longer "Production Prediction, Manpower Planning & Work Order Approval Process" document covering: morning manpower allocation, Plant Head approval workflow (with the exact list of gated actions), Work Order Types 1-4, dynamic manpower management, hourly production monitoring, and dispatch control exclusively through Store. This is the source for items 11 and 12 above, and for the "Not yet started" Phase C/D items. If the user references "the doc" or "as I described," this is almost certainly what they mean — ask them to re-paste it if it's not already in view, since it's long and detailed enough that summarizing from memory risks missing a rule.
