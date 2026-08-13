# ERP Manual Testing Guide

**Purpose:** A step-by-step walkthrough for manually testing the Oregenal Electricals Smart Manufacturing ERP/MES from a completely fresh login through the full order-to-cash and procure-to-pay cycles. Follow it top to bottom the first time; after that, jump to whichever section you're validating.

This is a **living document** — append to it (don't rewrite it) as new modules ship, following the same style as `MODULE_REFERENCE.md`. Sections marked **[Verified]** were walked through end-to-end, live, on staging, with real curl/API calls or the actual UI, and their exact expected results confirmed. Sections marked **[Checklist]** are built from reading the actual backend routes/permissions/DTOs but have not had a live walkthrough — treat them as a strong starting point, not a guarantee, and upgrade them to [Verified] once you've actually run them.

**Base URL (staging):** `https://erp-backend-ry5v.onrender.com/api/v1`
**Frontend (staging):** Vercel deployment of `erp-frontend` `main` branch

---

## 0. Before You Start

### 0.1 Environment

- Staging backend and staging frontend both auto-deploy from each repo's `main` branch — there is no separate production environment yet. Every push to `main` is a live staging deploy.
- Staging is wired to the Neon `erp_staging` database — **anything you create here is real, persistent data** unless you explicitly clean it up. See §0.4.
- Local dev environment (if running `npm run start:dev` locally) is wired to `erp_development` instead — safe to experiment more freely there, but always confirm which DB you're pointed at (`.env` → `DATABASE_URL`) before running destructive tests.

### 0.2 Logging In

```bash
TOKEN=$(curl -s -X POST https://erp-backend-ry5v.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@oregenalelectrical.com","password":"Oregenal@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo $TOKEN
```

- Tokens expire — if you get `401 Invalid or expired token` mid-session, just re-run the login block. **Always combine login + the commands that use `$TOKEN` in one single paste/one single terminal command block** — a token fetched in a separate earlier command may have gone stale by the time you use it.
- Every route is prefixed `/api/v1` — a bare `curl {url}/auth/login` (no prefix) will 404.
- `superadmin@oregenalelectrical.com` bypasses all permission checks. To test a specific role's real boundaries, log in as that role's dedicated account instead (see §0.3).

### 0.3 Roles & Test Accounts

The system has 14 base roles (`UserRole` enum): `SUPER_ADMIN`, `CORPORATE_ADMIN`, `PLANT_HEAD`, `UNIT_HEAD`, `PRODUCTION_HEAD`, `PLANNING_MANAGER`, `PURCHASE_MANAGER`, `STORE_MANAGER`, `QC_MANAGER`, `FINANCE_MANAGER`, `HR_MANAGER`, `SUPERVISOR`, `OPERATOR`, `VIEWER`. A user can also carry `additionalRoles` (an array) on top of their primary `role` — the JWT's `allRoles` claim is the deduplicated union of both.

All seeded test accounts follow `role@oregenalelectrical.com` / `Oregenal@123` (e.g. `purchase.manager@oregenalelectrical.com`, `store.manager@oregenalelectrical.com`, `qc.manager@oregenalelectrical.com`).

**Known architecture gap** (tracked, not a bug you need to re-report): `SUPERVISOR` and `OPERATOR` are shared across 6+ genuinely distinct floor job functions (line supervisor, gate security, store operator, etc.) with no `department` field to distinguish them — so two people with wildly different jobs can have identical permissions today. Don't be surprised if a "gate security" style account is really just an `OPERATOR`/`SUPERVISOR` login under the hood.

`companyId` for the seeded company: `83eda866-ba63-472c-902f-561f05b6b1c1`.

### 0.4 Test Data Hygiene

- Every table carries `isTestData` (boolean) and `isActive` (soft delete) — respect both when writing new test/seed data or cleanup scripts.
- **If you create real records on staging while testing** (a WO, an FG Receipt, a stock adjustment, etc.) and don't need them to persist: either flag them `isTestData = true` via SQL afterward, or properly reverse them (e.g. a stock adjustment with the opposite sign — see the stock adjustment gotcha in §8.1). Don't just leave stray test units sitting in real stock balances; they'll silently pollute dashboards, shortage checks, and reports for real users.
- Stock adjustments in particular are shared-aggregate operations (`StockBalance` is one row per item+warehouse, not a per-transaction ledger) — you cannot "hide" a bad test adjustment by flagging it `isTestData`; you have to actually reverse the quantity. See §8.1 for the exact mechanics.

### 0.5 Both databases were fully wiped and rebuilt (see PROJECT_STATUS.md item 20)

Both dev and staging were completely reset (`prisma db push --force-reset`) and reseeded from scratch via `prisma/seeds/seed.ts`, at the user's explicit request. **Every specific example record number referenced anywhere below this point in this guide** (CPO numbers, SO numbers, WO numbers, product IDs beyond the ones with fixed IDs, etc.) **no longer exists** — those were real records from before the wipe. The *procedures* themselves (which endpoints to call, in what order, what to expect) remain fully valid; you'll just need to create fresh records to follow along, using the same steps.

Company ID, Warehouse ID (`WH-MAIN`), and the `superadmin@oregenalelectrical.com` login survived the wipe unchanged (see §0.3) since the new seed script hardcodes them. Every other role's login (`role@oregenalelectrical.com` / `Oregenal@123`) was recreated fresh with a new underlying User ID, but the same email/password. Products, raw materials, BOMs, routing, customers, and vendors are all empty post-wipe — none of that is seeded automatically. Re-verify §1 (Masters Setup) is populated before attempting any of the later sections.

---

## 1. Masters Setup [Checklist]

Confirm these exist (or create them) before testing anything downstream — almost everything else depends on masters being populated.

| Master | Frontend route | Key backend concern |
|---|---|---|
| Company / Plant / Branch | `/masters/company`, `/masters/plant`, `/masters/branch` | Multi-company isolation via `companyId` on every table |
| Warehouse | `/inventory/warehouses` | `isDefault` flag; most flows need a `warehouseId` |
| Products | `/masters/products` | `productType` (`FINISHED_GOOD` etc.); code is the join key almost everything else uses |
| Raw Materials | `/masters/raw-materials` | Separate table from `Product` — an itemCode matches **either** a Product **or** a RawMaterial, never both, and a lot of logic branches on which one it is |
| BOM | `/inventory/bom` | `bomType`: `MASTER` (a product's own top-level recipe) or `STAGE` (auto-generated per routing stage — see §3.3); `status` must be `APPROVED` before anything can use it |
| Routing | Set up from the BOM detail page (`/inventory/bom/[id]`) once approved — no separate page as of item 28 | Defines the multi-stage chain (e.g. SMT → MI → Assembly → Packaging) a product's production actually follows; manually starting build-to-stock production against one lives on `/production/work-orders` ("+ Start Routing Chain") |
| Vendors | `/masters/vendors` | Needed for RFQ/PO/GRN flow (§7) |
| Customers | `/sales/customers` | Auto-fills onto Customer PO |
| UOM / HSN-SAC / Price Lists | `/masters/unit`, `/masters/hsn-sac`, `/masters/price-lists` | Standard lookup data |

**Quick sanity check:**
```bash
curl -s "https://erp-backend-ry5v.onrender.com/api/v1/products?limit=5" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s "https://erp-backend-ry5v.onrender.com/api/v1/warehouses" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 2. Sales Flow — Customer PO → Sales Order [Verified]

Full detail already lives in `MODULE_REFERENCE.md` under **Module 97**; summarized here for the end-to-end flow.

1. **Create a Customer PO** — `POST /customer-po`. `poType: "WRITTEN"` needs a real `customerPoNumber`; `poType: "VERBAL"` needs `verbalConfirmedBy` + `verbalConfirmedDate` and auto-generates a placeholder number (`VERBAL-CPO-YYYY-NNNN`).
2. **Shortage check runs automatically on creation** — no manual trigger. See §3 for exactly how this is calculated (it now recursively explodes multi-level BOM/routing trees, not just one level — this was a major fix this session).
3. **Acknowledge the CPO** — `POST /customer-po/:id/acknowledge`. This **auto-creates the linked Sales Order** (`remarks: "Auto-created on acknowledgment of {cpoNumber}"`) with status `DRAFT`.
4. **Confirm the Sales Order** — `POST /sales-orders/:id/confirm`. Only a `CONFIRMED` (or `IN_PRODUCTION`) SO shows up on the Production Planning board (§3).
5. A CPO can only be **edited** while `status: RECEIVED` (before acknowledgment) — edits fully replace the item list, not merge, and re-run the shortage check.

**Gotcha already hit once:** `GET /sales-orders/by-cpo/:cpoId` returns an **array**, not a single object — index into `[0]`.

---

## 3. Production Planning — MRP / Planning Board / Run Allocation [Verified]

This is the most heavily reworked area this session. The core concept: **one shared recursive engine** (`MrpService.explodeMultiCpoMaterialNeeds`) now backs the Planning board, Run Allocation, and the Customer PO shortage check — previously each did its own single-level BOM lookup independently, which produced wrong/misleading results for multi-stage products (see §3.3).

### 3.1 Order Types

A customer/sales order can target the full chain or an intermediate stage's own output directly:

- **Type 1** — orders the final packaged product → full routing chain (e.g. SMT → MI → Assembly → Packaging).
- **Type 2** — orders an intermediate stage's item directly (e.g. just the SMT board) → chain runs only that one stage.
- **Type 3** — orders a later intermediate stage's item (e.g. the MI board) → chain runs every stage **up through and including** that one, stopping there (e.g. SMT → MI, no Assembly/Packaging).
- **Type 4** — orders a plain raw material with no matching routing at all → falls through to the existing bare-WO/no-routing behavior.

**How to verify Type 2/3 end-to-end:**
```bash
# 1. Find the product ID and confirm it's an intermediate stage output with its own routing-stage BOM
curl -s "https://erp-backend-ry5v.onrender.com/api/v1/products?search=<intermediate-item-code>" -H "Authorization: Bearer $TOKEN"

# 2. Create + acknowledge a CPO/SO for that item (see §2), then run allocation
curl -s -X POST https://erp-backend-ry5v.onrender.com/api/v1/mrp/run-allocation \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"warehouseId":"<id>","allocations":[{"soItemId":"<id>","buildQty":<n>}]}'
```
Expect: if feasible, `createdWorkOrders`/the resulting routing chain contains **only** the stages up through the ordered item — verified live producing exactly `{root}-SMT` + `{root}-MI` for a Type 3 order, no Assembly/Packaging WO created.

### 3.2 The Recursive Shortage Engine

For any material need calculation (Planning board, Run Allocation, CPO shortage check):

- Every item, at every level of its BOM/routing tree, is netted against its **own** stock first.
- An intermediate item (SMT board, MI board, etc.) that already has enough finished stock **never** has its own raw materials checked at all — the recursion simply doesn't go deeper for that branch.
- Only a genuine shortfall recurses further down into that item's own BOM.
- This means: ordering an item with **zero finished stock** does **not** automatically mean "shortage" — if the raw materials to *produce* it are abundant, the result is `feasible: true` / empty shortage list, because the system correctly recognizes production, not purchasing, is what's needed.
- A true raw material (or anything with no BOM at all, at any level) also counts purchase-order-in-transit quantity as available supply — re-running a shortage check while a PO is already in flight shouldn't manufacture a duplicate shortage.

**How to verify:** order an intermediate item that has zero FG stock but whose own BOM's raw materials are well-stocked (e.g. solder, chip resistors — commodity items almost always in surplus). The Planning board's `rmRequirements` for that line should come back **empty** (`[]`), not showing the intermediate item itself as an opaque shortage. If you instead deplete one of those underlying raw materials, the shortage should correctly surface *that* raw material, several levels down, not the intermediate item.

### 3.3 BOM Types — MASTER vs STAGE

- `findProducingBom(companyId, productId)` looks for a `bomType: MASTER` BOM first (the product's own standalone recipe — Type 1 full products). If none exists, it falls back to whichever `RoutingStage`'s `STAGE`-type BOM produces that exact product (Type 2/3 intermediate items). This fallback is used **everywhere** a "does this item have a producible BOM" question is asked — Planning board, Run Allocation, CPO shortage check, and the recursive engine's own tree discovery.
- `POST /bom/:id/generate-stages` auto-creates sub-assembly products and numbered stage BOMs from a source master BOM. Newly generated stage BOMs start `status: DRAFT` — **they must be manually approved** before anything downstream (routing, MRP) can use them; a `DRAFT` stage BOM is invisible to `findProducingBom`.

### 3.4 Planning Board & Run Allocation — API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/mrp/planning-board?warehouseId=` | Per-SO-item remaining-to-plan quantity + recursive RM shortage list |
| `POST` | `/mrp/run-allocation` | Given `{warehouseId, allocations:[{soItemId, buildQty}]}`, either creates the routing-chain Work Orders (feasible) or returns the shortage list (not feasible) |
| `GET` | `/mrp/calculate/:woId` | **Single-level, execution-time** material check for one already-committed WO — deliberately does *not* use the recursive engine (see note below) |

**Why `calculateMrp` stays single-level on purpose:** it answers "can I physically issue material to this exact Work Order right now" — a floor-execution question, not a planning question. Recursing into "well, the input stage *could* theoretically be produced" doesn't help an operator who needs real stock on the shelf immediately. Don't mistake this for an inconsistency with §3.2 — it's an intentional scope difference between planning-time and execution-time checks.

---

## 4. Production Execution [Verified]

### 4.1 Work Order Lifecycle

`DRAFT → RELEASED → IN_PROGRESS → COMPLETED` (or `CANCELLED`; `STOP`/`RESTART` also exist mid-flight).

```bash
POST /work-orders                  # create (DRAFT)
POST /work-orders/:id/release      # DRAFT -> RELEASED (reserves material; gated by Plant Head approval for non-Plant-Head-tier roles - see §13)
POST /work-orders/:id/start        # RELEASED -> IN_PROGRESS
POST /work-orders/:id/complete     # -> COMPLETED, body: {completedQty, rejectedQty}
POST /work-orders/:id/stop         # instant, no approval needed - reactive floor decision
POST /work-orders/:id/cancel
```

Routing-chain stage WOs are numbered `{root}-{STAGENAME}` (e.g. `WO-2026-0009-SMT`). A grouped view collapses a full chain into one clickable row with overall progress (`work-orders/page.jsx`'s `groupSummary()`).

**Material reservation never throws on shortage** — `MaterialReservationService.reserveForWorkOrder` reserves whatever is actually available and leaves the rest unreserved; it does not block `release()`. A WO can be `RELEASED` with 0 material reserved if none exists yet.

### 4.2 Production Floor (Simplified Execution) [Checklist]

`/production/floor` — single-screen execution: pick an active WO, enter Good/Scrap qty, one button drives Start → Record → Confirm → Complete. Per-user `assignedStage` on `User` filters which WOs an operator sees (Plant-Head-tier roles always see everything — the bypass list is `STAGE_BYPASS_ROLES` in `work-order.service.ts`).

**Important as of Phase C (§5.3):** completing a WO here and getting an FG Receipt confirmed does **not** make that stock dispatchable or usable by the next stage anymore — it now requires OQC to pass and release first. If you're testing this page, don't be alarmed that stock doesn't move immediately; that's the new, intended gate.

### 4.3 Manpower Allocation [Checklist]

`/production/manpower` — hierarchical: `HR_TO_PLANT → PLANT_TO_STAGE → STAGE_TO_LINE`, each level must explicitly **accept** what's handed down; **distribute** splits to multiple recipients; mismatches can be **queried**. A line can be assigned to a person, directly to a Work Order, or both.

### 4.4 Stage-to-Stage Transfer Notes [Checklist]

`/production/stage-transfers` — an explicit Give/Receive acknowledgment record between two stages' Work Orders, sitting *alongside* (not replacing) the automatic BOM-based material consumption.

### 4.5 Plant Head Approval Gate [Checklist — see §13]

WO Start (for non-Plant-Head-tier roles), WO Restart, and Manpower Increase/Decrease/Transfer are gated through the generic multi-level workflow engine. Full detail in §13.

---

## 5. Store & Quality [Verified — Phase C is new this session]

This is the department boundary the business actually cares about most: **nothing becomes real, usable, dispatchable stock without Store/QC physically checking it first** — for raw materials coming in from vendors, and now, as of this session, for finished goods coming out of production too.

### 5.1 Incoming — IQC (raw materials)

GRN → `IqcService.approve()` → **only then** does `StockLedgerService.receiveFromIqc()` credit `StockBalance`. Material sitting in an unapproved IQC record is completely invisible to stock, shortage checks, and any downstream consumption. This has worked correctly since before this session — treat it as the reference pattern.

```bash
GET  /iqc                    # list pending/approved
POST /iqc/:id/approve        # credits stock via receiveFromIqc()
```

### 5.2 Putaway / Rack & Bin [Checklist]

`/inventory/putaway`, `/inventory/rack-bin` — pending-putaway queue auto-populated from real GRN data; assigns physical bin locations after IQC approval.

### 5.3 Outgoing — OQC (finished goods) — **NEW behavior, test this carefully** [Verified]

Before this session, `FgReceiptService.confirm()` credited `StockBalance` **directly**, the instant a completed Work Order's FG Receipt was confirmed — meaning the Production Floor's single-button flow made stock dispatchable, reservable by the next routing stage, and visible to shortage checks within seconds, with **zero** Store/QC checkpoint. A whole `OqcInspection` module existed (create → complete → release) but had no connection to stock at all — pure paperwork.

**Now:** `FgReceipt.confirm()` only marks the receipt `RECEIVED` (physically in Store, pending QC) — it does **not** touch `StockBalance` and does **not** create a stock batch. Stock only becomes real once an OQC inspection is created against that receipt, completed with `result: PASS`, and explicitly released. This mirrors IQC's gate exactly, and applies identically to all FG types — final panel, SMT board, MI board.

**Full verified flow:**
```bash
# 1. Complete a Work Order, create + confirm its FG Receipt
POST /work-orders/:id/complete           # {completedQty, rejectedQty}
POST /fg-receipts/from-wo/:woId          # auto-creates the DRAFT receipt
POST /fg-receipts/:id/confirm            # -> status RECEIVED. Stock balance is STILL 0 here - this is correct.

# 2. Confirm the gate is holding
GET /stock-reports/item-card/{itemCode}?warehouseId={id}   # availableQty must still be 0

# 3. Create, complete, and release the OQC inspection
POST /oqc                                # requires fgReceiptId (now mandatory), sampleSize, passQty, failQty
POST /oqc/:id/complete                   # {result: "PASS"|"FAIL"|"CONDITIONAL"} - create() often auto-completes this already if sampleSize>0
POST /oqc/:id/release                    # ONLY allowed if result === PASS and status === COMPLETED
                                          # this is what actually calls StockLedgerService.receiveFromOqc() and credits stock

# 4. Confirm stock is now real
GET /stock-reports/item-card/{itemCode}?warehouseId={id}   # availableQty should now equal the receipt's receivedQty
```

Verified live end-to-end on staging: stock stayed at 0 through steps 1–2, then jumped to the full received quantity immediately upon release in step 3–4.

**Key business rules encoded:**
- Every OQC record must now be tied to a real `fgReceiptId` (was optional before — now required, both in the DTO and validated in `create()`). Attempting to release without ever creating an OQC, or creating one without a receipt, is rejected.
- A `FAIL` or `CONDITIONAL` result can **never** be released — that lot's stock simply never becomes available until someone resolves it (rework/scrap/quarantine handling is not yet built as a formal flow — currently it just stays stuck, which is at least *safe*, if not yet a complete workflow).
- A `PASS` releases the **full received lot**, not just the sampled quantity — `sampleSize`/`passQty` are a statistical AQL-style check on the batch, not a per-unit accept/reject.
- One OQC record per FG Receipt — attempting to create a second is rejected with `OQC-XXXX already exists for this FG Receipt`.

**Frontend:** `/quality/oqc` — has a "Pending OQC" stat card and a dropdown that only shows FG Receipts genuinely still awaiting inspection (`GET /oqc/pending-fg-receipts`), not just any `RECEIVED`-status receipt. Selecting an already-inspected receipt would hit the backend's duplicate guard.

**Follow-up not yet built:** the Production Floor page (§4.2) doesn't yet display any messaging that FG isn't instantly dispatchable post-Complete — worth a UX pass so floor staff aren't confused about why stock doesn't show up immediately.

---

## 6. Dispatch [Checklist]

`/sales/dispatch-planning`, `/sales/dispatch` — `DispatchService.create()` checks `StockBalance.availableQty` directly. As of §5.3, that balance now correctly reflects only OQC-released stock, so dispatch is transitively gated by Store/QC the same way it already should be — but there is no dispatch-specific code change; the gate lives entirely upstream in the stock-crediting step. If you're testing dispatch and stock isn't appearing, check whether OQC was actually released first before assuming dispatch itself is broken.

---

## 7. Purchase Flow [Checklist]

RFQ → Vendor Quotation → Comparison → Purchase Order → GRN → IQC (§5.1) → Putaway (§5.2).

| Frontend route | Backend area |
|---|---|
| `/purchase/rfqs` | `src/rfq` |
| `/purchase/quotations` | `src/vendor-quotations` |
| `/purchase/comparison` | `src/quotation-comparison` |
| `/purchase/orders`, `/po-approvals`, `/po-amendments` | `src/purchase-orders` |
| `/inventory/grn` | GRN creation — does **not** itself post to stock; only `IqcService.approve()` does |
| `/purchase/shortages` | Aggregated `MaterialShortage` view across all open CPOs (`getAllOpenShortages`) |

---

## 8. Inventory Operations [Verified — a real bug fixed this session]

### 8.1 Stock Adjustments — **sign convention fixed this session, re-verify if testing pre-fix behavior**

`/stock-adjustments`. **Prior bug (now fixed):** for `adjustmentType: DECREASE`, the create-time formula computed `adjustmentQty = systemQty - physicalQty`, which is *positive* when the physical count is genuinely lower than system (the normal reason to raise a decrease). But `approve()` treats any positive `adjustmentQty` as crediting stock **in**, regardless of the stated type — so a real decrease (e.g. recording damage/shrinkage) silently **added** stock instead of removing it. Every `DECREASE` adjustment ever made in the system's history where physical < system was affected by this.

**Fixed:** all three types (`INCREASE`, `DECREASE`, `RECOUNT`) now use the same `adjustmentQty = physicalQty - systemQty` convention, matching exactly what `approve()` expects. A guard was also added: submitting `INCREASE` with numbers that actually represent a decrease (or vice versa) is now rejected with a clear error telling you to use the right type or `RECOUNT`.

**How to verify:**
```bash
# Put 10 units on the shelf (INCREASE, systemQty:0 -> physicalQty:10)
# Then DECREASE from 10 down to 4 (systemQty:10, physicalQty:4)
# adjustmentQty in the response must be -6, and after approval availableQty must be 4 - NOT 16.
```
If you ever see a `DECREASE` adjustment result in *more* stock than before, that's this bug regressing — check the formula in `stock-adjustment.service.ts`'s `create()` immediately.

**Type semantics, post-fix:**
- `INCREASE` — physicalQty must be ≥ systemQty (rejected otherwise)
- `DECREASE` — physicalQty must be ≤ systemQty (rejected otherwise)
- `RECOUNT` — free to go either direction, no guard

### 8.2 Stock Batches, Transfers, Issues [Checklist]

`/stock-batches`, `/inventory/transfers`, `/inventory/issues` — standard lot-tracking, inter-warehouse movement, and material-issue-to-production flows. Not touched this session; no known issues, but not freshly re-verified either.

### 8.3 Stock Ledger & Reports [Checklist]

`/stock-ledger`, `/stock-reports` — the ledger is the append-only source of truth (`StockLedger.postTransaction`); `StockBalance` is the derived current-state aggregate. `stock-reports/item-card/:itemCode` is the fastest way to sanity-check a single item's full movement history + current balance during any test.

---

## 9. Finance [Checklist]

`/finance/vouchers`, `/finance/ap`, `/finance/ar`, `/finance/gst`, `/finance/bank-recon`, `/finance/reports`. Not touched this session.

## 10. HR [Checklist]

`/hr/employees`, `/hr/attendance`, `/hr/payroll`, `/hr/leave`, `/hr/tds`, `/hr/pf-esi`, `/hr/training`. Not touched this session.

## 11. Gate & Security [Checklist]

`/gate/inward`, `/gate/outward`, `/gate/visitors`, `/gate/vehicles`, `/gate/passes`, `/gate-dashboard`.

**Known follow-up (not yet built):** Gate Inward currently only links to domestic Purchase Orders. Import shipments physically pass through the same gate but bypass this step entirely today — GRN should eventually be able to pull from Gate Inward universally for both Domestic and Import types, but that's not implemented yet.

## 12. Quality Beyond OQC [Checklist]

`/quality/ncr`, `/quality/capa`, `/quality/rca`, `/quality/supplier`, `/quality/complaints`, `/quality/dashboard`, `/quality/reports`. IQC and OQC are covered in §5; these are the broader quality-management modules (non-conformance, corrective/preventive action, root-cause analysis, supplier quality, customer complaints).

## 13. Workflow / Approval Engine [Checklist]

The **generic, reusable multi-level approval engine** (`WorkflowDefinition` / `WorkflowStep` / `ApprovalRequest` / `ApprovalAction`) — originally built for PO/SO/Voucher approvals, now also reused for the Plant Head gate on WO Start/Restart and Manpower Increase/Decrease/Transfer. **This is intentional architecture** — before building any new approval flow anywhere in this system, check whether this engine already covers it; it was nearly duplicated twice in past sessions before being discovered and reused instead.

```bash
GET  /workflows                              # generic page, works with any documentType automatically
POST /work-orders/approvals/:requestId/approve
POST /work-orders/approvals/:requestId/reject
POST /manpower/approvals/:requestId/approve
POST /manpower/approvals/:requestId/reject
```

Plant-Head-tier roles (`SUPER_ADMIN`, `ADMIN`, `CORPORATE_ADMIN`, `PLANT_HEAD`, `UNIT_HEAD`, `PLANNING_MANAGER`) self-approve instantly; anyone else's WO Start submits a request that does not take effect until approved. WO Stop is always instant (reactive floor decision, no approval needed).

## 14. Reports & Dashboards [Checklist]

`/analytics/*`, `/mis-reports`, `/inventory-dashboard`, `/production-dashboard`, `/purchase-analytics`. Not systematically re-verified this session.

## 15. Settings & Admin [Checklist]

`/settings/roles-permissions` — granting a new permission requires updating **both** `permissions.enum.ts` (functional) **and** the `PERMISSION_SECTIONS` array in this page (visible to admins granting it) — adding to the enum alone makes a permission functional but invisible in this UI.

`/settings/numbering`, `/settings/custom-fields`, `/settings/system`.

---

## 16. Role & Permission Boundary Testing [Checklist — systematic pattern]

For any endpoint you're testing, don't just confirm it works for `SUPER_ADMIN` — confirm it's **correctly blocked** for roles that shouldn't have it. Pattern:

```bash
# Log in as the role that SHOULD have access -> expect 200
# Log in as a role that should NOT -> expect 403
# Confirm the frontend sidebar doesn't even show the nav item for the blocked role
```

Already-verified boundary example (Module 97): Purchase Manager can view Customer PO shortages (`PURCHASE_VIEW`); HR Manager, Gate Security-tier operators, and Production Operators cannot (403), and the "Customer PO" nav item doesn't render in their sidebar at all.

---

## 17. Known Gaps / Follow-ups (don't mistake these for bugs)

- Sidebar/page cleanup review — full audit of unused tabs/pages requested but not started; nothing should be removed without explicit per-item confirmation.
- Manpower Adjust/Transfer has no dedicated "my pending approvals" panel yet (unlike WO approvals) — Plant Head must use the generic `/workflows` page for these in the meantime.
- MRP Shortage Report has no "Create PR from Shortage" quick-action button yet — manual re-entry required to raise a Purchase Requisition from a shortage line.
- Gate Inward doesn't cover Import shipments yet (§11).
- OQC has no formal rework/scrap/quarantine flow for FAIL/CONDITIONAL results — they just stay permanently un-released today.
- Duplicate `RolePermission` rows were found for `PURCHASE_MANAGER` (`VENDOR_QUOTATION_VIEW`, `VENDOR_PORTAL_VIEW` each appeared twice) during debugging on 2026-07-15 — harmless but unaudited across other roles.
- `SUPERVISOR`/`OPERATOR` shared-role gap (§0.3) — no `department` field to distinguish genuinely different jobs sharing one role.
- `explodeMultiCpoMaterialNeeds`'s BOM-tree structure discovery (`discoverBomTree`) doesn't have an `orderBy` tiebreaker if multiple active routings' stages could theoretically produce the same item code — picks an arbitrary match. Unlikely to matter given current product structure, but worth a comment/fix if the product line ever grows more complex.

---

*(Next section's addition should be appended below this line, following the [Verified] / [Checklist] convention above.)*
