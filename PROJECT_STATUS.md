# Oregenal Electricals ERP — Project Status

**Last updated:** August 15, 2026
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
- **Workflow with the user:** Claude has a sandboxed copy of both repos and makes all edits there first, verifies with a build, then hands the user a patch to run on their real machine. The user does not code themselves — Claude does 100% of the implementation and the user copy-pastes and reports build output back.
- **Critical Prisma rule:** never use `prisma migrate dev` — always hand-write SQL DDL and apply directly to both dev and staging DBs via psql, then update `schema.prisma` to match and run `npx prisma generate`. (Exception: `prisma db push --force-reset` is fine for a deliberate full wipe-and-rebuild of an empty database — see item 20 below. It's incremental drift on a database with existing data that this rule guards against.)
- **`prisma/seeds/seed.ts`** creates the real Company/Plant/Warehouse/all 14 role logins directly via Prisma Client (bypasses HTTP/JWT - the only way to bootstrap back in after a full wipe, since login itself requires an existing User). It does **not** seed products, raw materials, BOMs, routing, customers, or vendors - no automated script exists for any of that yet.
- Always run `rm -rf dist && npx nest build` before committing on the backend (dist/ is committed to the repo for Render deployment - see the "dist/ tracking incident" lesson below, this has broken silently before).
- **Companion doc:** `ERP_Manual_Testing_Guide.md` (added this session) is a sequential, top-to-bottom manual testing walkthrough organized by business flow (login → masters → sales → planning → production → store/QC → dispatch → etc.), separate from this file's per-session changelog format. Update it alongside this file when a flow's behavior changes.

### Patch delivery lessons (read this before handing the user any patch)

This session surfaced two real, repeatable terminal-paste failure modes - both now solved, but worth knowing so they aren't rediscovered the hard way:

1. **zsh history expansion on `!`**: any `!` character (common in TypeScript - `if (!bom)`, non-null assertions like `.get(x)!`) triggers zsh's `!`-as-history-reference behavior when pasted into an interactive terminal, silently corrupting or failing the paste (`zsh: event not found`). Fix: have the user run `setopt no_bang_hist` once per terminal session before pasting anything containing `!`. This persists for that terminal tab/window only - remind them to re-run it if they open a new one.
2. **Long single-line content gets silently corrupted at the terminal's wrap boundary** - specifically, a space character can be dropped exactly where a long line wraps, producing joined words (`onebutton`, `withreal`, etc.) in what actually lands in the file. This happens on prose/markdown files with long paragraph lines far more than on code (which naturally wraps at reasonable widths). **Do not trust a visual `cat`/`head`/`tail` of a long-line file pasted back into chat as proof of corruption or correctness** - display-level wrapping can look corrupted even when the file is fine, and vice versa. The reliable check is always `grep -c` for a specific suspicious substring (reads real bytes) or a checksum, never eyeballing wrapped terminal output. For files with long prose lines, deliver via base64 embedded as a Python string literal (`python3 -c "data='...'; open(f,'wb').write(base64.b64decode(data))"`) rather than a raw heredoc - short fixed-width base64 lines never hit a wrap boundary. Code patches with normal line lengths are fine as plain-text heredocs (`cat > file << 'EOF'`) once `no_bang_hist` is set.
3. **Always confirm `pwd` before delivering a patch.** The user works across three related directories (`~/Desktop/websites/erp`, `.../erp-backend`, `.../erp-frontend`) in the same terminal session and has landed in the wrong one more than once (patch silently fails with "No such file or directory", or worse, a file gets created in the wrong repo entirely). Have every patch/heredoc command start with an explicit `cd` to the intended repo, and echo `pwd` as part of the verification step.

---

## What's been built, in order (all live on staging as of this file's date)

### 1. Store / Inventory visibility overhaul
Fixed dead/orphaned Stock Ledger page, added low-stock flagging, idempotent IQC receive, Putaway pending queue auto-populated from real GRN data, Rack & Bin inline forms.

### 2. Production routing engine — verified end-to-end
SMT → MI → Assembly → Packaging chain via `ProductRouting` / `RoutingStage` / `WorkOrder.routingGroupId`. Each stage auto-releases only once the prior stage gets a confirmed FG Receipt (note: as of item 14 below, "confirmed" alone no longer means the stock is actually usable - see Phase C).

### 3. Critical material-reservation bug (found and fixed)
Reservations were created on Work Order release but never released on completion or cancellation. Fixed in `WorkOrderService.complete()`, `.cancel()`, and `ProductionEntryService.confirm()`. Backfilled ~52,000 units of incorrectly-locked stock on both DBs.

### 4. Double-reservation bug (found and fixed)
`MrpService.runAllocation()` used to create a redundant "parent" Work Order alongside the routing chain, double-reserving material. Fixed by merging Run Allocation directly into routing-chain creation.

### 5. Work Order naming
Routing stage WOs are named `{root}-{STAGENAME}` (e.g. `WO-2026-0009-SMT`). Implemented in `RoutingService.startProduction()`.

### 6. Production Floor page (`/production/floor`)
Single-screen execution: Start → Record → Confirm → Complete → FG Receipt collapsed to one button. **Note (Phase C):** completing here no longer makes stock instantly dispatchable/consumable - see item 14. The page itself doesn't yet display any messaging about this; still an open follow-up (see "Not yet started").

### 7. Per-user stage assignment (`assignedStage` on User)
Backend-filtered in `WorkOrderService.findAll()`/`getStats()`. Plant-Head-tier roles always see everything.

### 8. Grouped Work Orders view
Routing chains collapse into one clickable header row with overall chain progress. `groupSummary()` in `work-orders/page.jsx`.

### 9. Manpower Allocation module (`ManpowerAllocation`, `ManpowerQuery` models)
Hierarchical `HR_TO_PLANT → PLANT_TO_STAGE → STAGE_TO_LINE`, accept/distribute/query. Page: `/production/manpower`.

### 10. Stage-to-Stage FG Transfer Notes (`StageTransferNote` model)
Explicit Give/Receive handoff, alongside (not replacing) automatic BOM-based consumption. Page: `/production/stage-transfers`.

### 11. Plant Head Approval Gate
Reuses the existing generic multi-level workflow engine (`WorkflowDefinition`/`WorkflowStep`/`ApprovalRequest`/`ApprovalAction`) - do NOT build a parallel approval system, always check for and reuse this one first. Gates WO Start (non-Plant-Head-tier roles), WO Restart, Manpower Increase/Decrease/Transfer. WO Stop is always instant. Endpoints: `POST /work-orders/approvals/:requestId/approve|reject`, `POST /manpower/approvals/:requestId/approve|reject`.

### 12. Work Order Types 1-4 (partial routing chains) — **verified this session, Types 1-3 confirmed working end-to-end; Type 4 unchanged/pre-existing, not specifically re-tested**
A customer/sales order can target the full routing chain (Type 1) or an intermediate stage's own output directly (Type 2: e.g. just SMT boards; Type 3: e.g. SMT+MI, stopping before Assembly/Packaging). Type 4 (plain raw material, no routing match) falls through to existing bare-WO behavior.

Implementation: `MrpService.runAllocation()` looks up whichever `RoutingStage`'s own BOM produces the ordered item, passes `stopAtSequence` to `RoutingService.startProduction()`, which filters `routing.stages` down to `sequence <= stopAtSequence`.

**Verified live this session**: creating a Sales Order for an MI-stage item and running allocation created exactly 2 stage Work Orders (`{root}-SMT`, `{root}-MI`), no Assembly/Packaging WO - confirmed via both direct API calls and the actual Production Planning board UI.

### 13. Recursive multi-level BOM/routing shortage engine — **new this session, replaces four separate single-level lookups**
Before this session, every material-shortage/requirement calculation (Production Planning board, Run Allocation, Customer PO shortage check) did its own independent single-level BOM lookup - meaning an intermediate item (SMT board, MI board) with zero finished stock but abundant raw materials to actually *produce* it would incorrectly show as an opaque "shortage" or even a false "No approved BOM" error, instead of correctly recursing into that item's own BOM/routing chain.

**Fixed**: one shared engine, `MrpService.explodeMultiCpoMaterialNeeds()`, now backs all three calculation points. Every item at every level of its BOM/routing tree is netted against its own stock first; only a genuine shortfall recurses further down into that item's own components. An intermediate item that already has enough finished stock never has its own raw materials checked at all. A true raw material (or anything with no BOM at all, at any level) also counts purchase-order-in-transit quantity as available supply. For the multi-CPO shortage check specifically, stock allocation is FIFO across all open Customer POs *at every level* of the tree, not just the top one - whichever PO was created first gets first claim on scarce material anywhere in the chain, not just on the final product.

`MrpService.calculateMrp()` (the per-Work-Order, execution-time material check used by Production Issues) deliberately stays single-level - it answers "can I physically issue material to this exact WO right now," a floor-execution question where "the input stage could theoretically be produced" isn't actionable. Don't mistake this for an inconsistency; it's an intentional scope difference between planning-time and execution-time checks.

`getFinishedGoodDemand`/`getRawMaterialDemand` (the old single-level helpers in `customer-po.service.ts`) were removed entirely, fully superseded.

### 14. Phase C — Store/OQC gate on finished goods — **new this session, done, backend + frontend**
Before this session, `FgReceiptService.confirm()` credited `StockBalance` directly the instant a completed Work Order's FG Receipt was confirmed - meaning the Production Floor's single-button flow made stock dispatchable, reservable by the next routing stage, and visible to shortage checks within seconds, with zero Store/QC checkpoint. A whole `OqcInspection` module existed (create/complete/release) but had no connection to stock at all - pure paperwork.

**Fixed, mirroring the pre-existing IQC pattern exactly** (GRN → `IqcService.approve()` → `StockLedgerService.receiveFromIqc()` credits stock - this raw-material-side gate already worked correctly and needed no changes):
- `FgReceipt.confirm()` now only marks the receipt `RECEIVED` (physically in Store, pending QC) - does not touch `StockBalance`, does not create a stock batch.
- New `StockLedgerService.receiveFromOqc(oqcId, user)` - the FG mirror of `receiveFromIqc()` - credits stock (and creates the batch) only once an OQC inspection is `COMPLETED` with `result: PASS` and explicitly `RELEASED`.
- `OqcInspection.fgReceiptId` is now **required** (was optional) - every OQC must trace to a real receipt, both DTO-level and validated in `create()`. One OQC per FG Receipt (duplicate creation rejected).
- A `FAIL`/`CONDITIONAL` result can never release - that lot's stock simply never becomes available until someone resolves it. (No formal rework/scrap/quarantine flow exists yet for this - see "Not yet started".)
- Applies identically to all FG types: final panel, SMT board, MI board.
- New `GET /oqc/pending-fg-receipts` - the actual Store/QC work queue (FG Receipts `RECEIVED` with no OQC record yet). Without this endpoint the whole gate would be practically invisible to the people who need to act on it.
- Frontend `/quality/oqc` updated: requires FG Receipt selection (was optional), dropdown sourced from the new pending-queue endpoint instead of a generic RECEIVED-status fetch, added a "Pending OQC" stat card.

**Verified live end-to-end on staging**: created a real Work Order, completed it, confirmed its FG Receipt (stock stayed at 0, correctly gated), then created/completed/released an OQC inspection (stock immediately became available, matching the received quantity).

### 15. Phase D — Hourly Production Monitoring Dashboard — **new this session, done, backend + frontend**
The pre-existing `production-dashboard` module (overview/active-wos/today/alerts/quality endpoints) had no hourly granularity, no manpower data, no stage-wise output breakdown, no utilization/efficiency, no manpower costing.

New `GET /production-dashboard/hourly-monitoring` (optional `?date=YYYY-MM-DD`, defaults to today):
- Active/started-today/completed-today Work Orders, each with manpower headcount and a simple actual-vs-planned efficiency % where start/planned dates allow it.
- Output bucketed both by hour (from `ProductionEntry.entryDate`) and by routing stage, from the same confirmed-entries data.
- Manpower: total allocated today, idle headcount (allocated but not tied to any currently-active WO), utilization %.
- Stage-to-stage transfers logged today (`StageTransferNote`).
- **Manpower-cost estimate** - converts each allocated employee's monthly gross salary (`Employee.basicSalary + hraAmount + conveyanceAmount + otherAllowances`, matched via `Employee.userId → ManpowerAllocation.toUserId`) into an hourly rate using a documented `HOURS_PER_MONTH = 208` (26 days × 8 hours) assumption - this constant lives at the top of `getHourlyMonitoring()` in `production-dashboard.service.ts` if the real convention differs. Headcount with no matched Employee record (e.g. a contractor logged only as a bare User) is reported separately, never silently costed at zero.

Frontend: new "Hourly Monitoring" panel added to the *real* `/production/dashboard` page (see the sidebar-bug note below) - stat row, hourly bar chart, stage output + transfers side by side, cost estimate with the assumption note shown inline so it's never mistaken for an exact figure.

**Verified live**: endpoint returns correct structured data reflecting real active Work Orders; full-zero values on days with no logged floor activity are correct, not a bug.

### 16. Sidebar bug fix — Production Dashboard nav link pointed to a stale duplicate page
Discovered while visually verifying Phase D: the sidebar's "Production Dashboard" link pointed to `/production-dashboard` (a stale, broken duplicate page that calls a nonexistent bare API endpoint and just shows an empty-state placeholder), not `/production/dashboard` (the real, actively-maintained page every other Production Floor/Manpower/etc. link correctly points to). Fixed the one-line link in `Sidebar.jsx`. **The stale duplicate page file itself was deliberately left in place** - deleting it is sidebar-cleanup territory needing its own explicit confirmation, not something to fold into a quick link fix. Flagged again under "Not yet started."

### 17. Stock Adjustment DECREASE sign bug (found and fixed) — unrelated to the rest of this session, found while cleaning up test data
`adjustmentQty` for `DECREASE` type was computed as `systemQty - physicalQty`, which is *positive* when the physical count is genuinely lower than system (the normal reason to raise a decrease) - but `approve()` treats any positive `adjustmentQty` as crediting stock **in**, regardless of stated type. Every real `DECREASE` adjustment in the system's history where physical < system silently added stock instead of removing it.

Fixed: all three types (`INCREASE`/`DECREASE`/`RECOUNT`) now use the same `adjustmentQty = physicalQty - systemQty` convention. Added a guard rejecting `INCREASE`/`DECREASE` submissions whose numbers actually represent the opposite direction (use `RECOUNT` for a genuine either-direction correction).

**Not yet done: a historical data audit.** Every `DECREASE` adjustment ever approved before this fix should be reviewed - some may have silently inflated stock balances and need manual correction. This hasn't been attempted yet.

### 18. `dist/` tracking incident (found and fixed) — process lesson, not a product feature
During the Phase D commit, the local `nest build` step apparently hadn't finished writing `dist/` at the moment `git add -A && git commit` ran, resulting in a commit that deleted all 1,414 previously-tracked `dist/` files and added back none (`+189/-113233` lines). Render was never actually affected - it builds from source on its own infrastructure regardless of what's committed - but this contradicted the documented "dist/ is committed" convention and surfaced as 1,400+ "untracked files" noise in the user's local git status/VS Code. Fixed by re-adding the current (complete, verified) on-disk `dist/` and committing fresh. **Lesson for future sessions:** after any `rm -rf dist && npx nest build`, verify `ls dist/src | wc -l` roughly matches `ls src | wc -l` (off by ~1 for naming convention) *before* trusting `git add -A` picked everything up correctly - don't just trust that the build command succeeded silently.

### 19. IPQC becomes a real gate — new this session, backend only (no frontend change needed)
The pre-existing `production-qc` module (In-Process QC, tied to a Work Order + optional Production Entry, `inspectionStage` defaulting to `IN_PROCESS`) was in the exact same situation OQC was in before Phase C: real inspection records with PASS/FAIL/CONDITIONAL results, but zero enforcement - a FAIL had no effect on production, which could carry on and complete normally regardless.

**Fixed, reusing existing patterns rather than building new approval logic:**
- `ProductionQcService.complete()`: when `result: FAIL` is recorded, the linked Work Order (if `IN_PROGRESS`) is automatically `stop()`'d - same as a manual Stop, instant, no approval needed (a reactive floor decision, consistent with the existing WO Stop semantics).
- Resuming already requires Plant Head approval for non-Plant-Head-tier roles via the pre-existing WO Restart workflow gate - no new approval logic needed there.
- `WorkOrderService.complete()` additionally, independently checks the most recent `ProductionQc` record for that WO and rejects completion outright if it's still `FAIL` - this holds even after a Plant Head approves a restart, since approving a restart isn't the same as confirming a corrective re-inspection actually happened. A new IPQC record with `PASS` or `CONDITIONAL` clears it.

**Verified live end-to-end on staging**: started a WO → logged IPQC FAIL → WO auto-stopped → restarted (instant, SUPER_ADMIN bypass) → completion attempt correctly rejected citing the specific failed inspection number → logged a corrective PASS re-inspection → completion succeeded.

No frontend changes were needed - the existing `/production/ipqc` page's create/complete flow already exercises this correctly; the enforcement is entirely backend-side.

### 20. Both databases fully wiped and rebuilt from scratch, at the user's explicit request
`prisma/seeds/seed.ts` previously seeded a placeholder "Acme Electronics" company that had nothing to do with this project - real master data (Oregenal Electricals company/plant/warehouse/user accounts) had only ever been created manually via the API/UI across many past sessions, with no repeatable seed script for any of it. When the user asked for a complete wipe of both dev and staging, this was flagged clearly before doing anything - a full wipe destroys that master data with no automated way back, since no seed script could reconstruct it.

**Rewrote `prisma/seeds/seed.ts`** to seed the real company via Prisma Client directly (bypassing HTTP/JWT entirely - the only way to bootstrap back in once every table, including Users, is empty): Company, Plant, Warehouse, Financial Year, one login per role (`role@oregenalelectrical.com` / `Oregenal@123`, matching the pattern already used throughout this project's documentation), Numbering Series, and System Settings. `Company`/`Plant`'s `address`/`city`/`state`/`pincode` are required fields with no default - the first version of this rewrite omitted them and failed to compile; fixed in a follow-up commit.

The Company ID (`83eda866-...`), Warehouse ID (`8ee69281-...`), and SUPER_ADMIN User ID (`19b228a1-...`) are hardcoded to the exact values already referenced throughout this file and `ERP_Manual_Testing_Guide.md`, so none of that documentation needed updating after the wipe.

**Sequence used** (dev first as a rehearsal, then the identical sequence against staging once dev was confirmed working):
```bash
npx prisma db push --force-reset      # drops everything, rebuilds schema fresh from schema.prisma
npx ts-node prisma/seeds/seed.ts      # company/plant/warehouse/users/settings
npx ts-node prisma/seed_roles_from_static_file.ts   # RolePermission rows for every seeded role
```
`db push --force-reset` (not `prisma migrate`) is the right tool here specifically *because* the target is an empty database being brought to a known-good current-schema state - it doesn't generate migration history, consistent with this project never using `prisma migrate dev`. That established rule is about avoiding risky auto-generated drift on a database that already has data; it doesn't apply the same way to a deliberate full rebuild.

**Real gotcha hit along the way:** `export DATABASE_URL=...` in the shell did **not** override the value Prisma actually used - `db push` clearly printed it was still connecting to dev even with staging's URL exported. Prisma's own `.env` loading took precedence over the shell export. Fixed by editing `.env` directly (verified via `grep` before running anything, reverted via a backup copy immediately after) rather than relying on shell env vars for this kind of operation in the future.

**Verified**: seed script output confirmed all data created correctly on both DBs; live login against the real Render-served staging API (`https://erp-backend-ry5v.onrender.com/api/v1/auth/login`) returned a valid token with the correct company - the actual proof this worked, not just the seed script claiming success.

**What's still empty and needs manual re-creation via the UI/API** (no seed script exists for any of this): products, raw materials, BOMs, routing definitions, customers, vendors, and any warehouses beyond `WH-MAIN`.

### 21. Test-session auto-tagging infrastructure — new this session, both backend and frontend now done
User's core, ongoing pain: repeated feature testing on staging kept polluting real stock/dashboard calculations, requiring manual `isTestData` cleanup after every test (this whole session's cleanup steps are a case study in why). Solution landed in three pieces (see "Not yet started" for what's still left - dashboard filtering and a purge tool):

- A dedicated `TEST-WH` warehouse (id `e13b8c52-faf6-470f-81c6-803763b2bc44`) for stock-touching tests, isolated from `WH-MAIN`'s real balances.
- **Automatic `isTestData` tagging (backend)**: any request carrying header `X-Test-Session: true` has every record it creates - across all 150+ modules, no matter how deeply nested the service call - automatically stamped `isTestData: true`, with zero changes to any individual service. Implemented via `TestSessionMiddleware` (reads the header, runs the rest of the request inside an `AsyncLocalStorage` context) + `PrismaService` wrapping `create`/`createMany`/`createManyAndReturn`/`upsert` on every model delegate that has the field (computed from `Prisma.dmmf` at startup, not hardcoded).
- **Frontend Test Mode toggle** (`erp-frontend`, `src/lib/testSession.js`): a toggle button in `Header.jsx`, visible on every page, backed by `localStorage` + a one-time `window.fetch` interceptor that attaches the same `X-Test-Session: true` header to every request the UI makes to our own API while enabled - no changes needed to any individual page's fetch calls. A persistent orange banner in `AppLayout.jsx` shows whenever it's on, so it can't be left on by accident during real work. Curl and manual UI testing now go through the exact same backend tagging mechanism, just triggered differently.

**Deliberately did NOT use Prisma's `$extends()`** for the backend piece - Prisma 6.14+ changed how `$extends()` combines with a class-based `PrismaService` (the "well-tested" fix requires a specific factory-function pattern whose interaction with this project's already-working `PrismaService extends PrismaClient` + its own added methods like `onModuleInit` couldn't be verified without live testing, which this sandbox can't do for Prisma). Chose the lower-risk path instead: leave the proven class extension completely untouched, wrap each model delegate's methods directly after normal construction. Installation is wrapped in try/catch so any unexpected failure degrades silently (feature just doesn't install) rather than being able to crash startup - every module depends on `PrismaService`.

**Verified live on staging**: a request with no header still creates `isTestData: false` (zero behavior change); a request with the header creates `isTestData: true`. Frontend toggle confirmed working live - banner appears, pill button reflects state.

### 22. Two silent deploy-pipeline failures found and fixed - both had been failing for a while before being noticed
- **Render (`erp-backend`)**: the Render Build Command included `&& npx prisma migrate deploy` - a leftover from early scaffolding this project never actually uses (always hand-written SQL DDL / `db push`, never `prisma migrate`). The full DB wipe (item 20) dropped Prisma's internal `_prisma_migrations` tracking table along with everything else, so this step started failing with `P3005` ("database schema is not empty" with no migration history) on every deploy since. Render doesn't take a service down when a new build fails - it just keeps serving the last successful one - so this failed silently for several commits before being caught. **Fixed** by removing that step from the Build Command entirely (now just `npm install && npm run build && npx prisma generate`).
- **Vercel (`erp-frontend`)**: the GitHub webhook silently stopped firing at some point - pushes to `main` stopped triggering new deployments at all (not failing, just never attempted), leaving Production stuck on a stale commit from the day before. No "Redeploy" option was available in the dashboard either. Root cause wasn't identified (Git connection looked normal in Settings) - what actually resolved it was simply pushing another new commit, which did trigger correctly. If this recurs, disconnecting/reconnecting the Git integration in Vercel Settings is the next thing to try.

**Lesson for future sessions**: a successful local build (`npm run build`) only proves the code compiles - it says nothing about whether the actual deploy pipeline is healthy. When something that was just pushed doesn't appear live, check the platform's own deployment list/logs before assuming the code itself is wrong.

### 23. Two more real bugs found and fixed while rebuilding master data
- **BOM section display** (`erp-frontend`): the BOM import parser had always correctly captured each item's `section` from the uploaded sheet (e.g. "SMT Components") into `BomItem.section`, but the BOM detail page displayed everything as one flat list with no section info visible anywhere, and the Add/Edit item form had no section field at all. Fixed: items now render grouped under a header row per section with a per-section "+ Add" button, and the form gained a Section field with datalist autocomplete from the BOM's own existing sections.
- **Stock Putaway bin capacity** (`erp-backend`): `StockPutawayService.complete()` used `bin.maxQty` only to choose the FULL/PARTIAL status label - nothing actually stopped `currentQty` from exceeding it. Found live on staging: three bins with `maxQty: 500` showing `currentQty` of 12000/11760/8000 (16-24x over capacity) after a single putaway completion. Fixed: every item is now validated against its bin's remaining capacity before anything is written, atomically - if any single item would overflow its bin, the whole completion is rejected with a message naming the bin and by how much, telling the user to split across multiple bins or pick one with more room.

### 24. Master data rebuild in progress - all 3 uploaded BOMs now have full routing chains
Following item 20's wipe, three products have been fully taken from BOM upload through to a working routing chain: `MAGIK-2*2` (MAGIK brand), `TRPLEDECOPN036CW` (HPL brand), `LHEBAEP7IW1W036` (HAVELLS brand) - each with master BOM → 4 auto-generated stage BOMs (SMT/MI/Assembly/Packaging, split by the uploaded sheet's own section headers) → approved → a `Routing` record tying the 4 stages together in sequence. All verified via direct API responses, not just assumed from a "success" message.

**Real gotcha hit along the way**: the same file got uploaded twice for `MAGIK-0001` (09:49 and 10:19, the second right after approving the first), and the *second, sectionless* copy ended up as the "official" `APPROVED` one, while the *correct* one (with proper section data, which we'd already built the section-display fix and started stage-generation against) got silently marked `OBSOLETE` by `BomService.approve()`'s own supersede-previous-version logic - working exactly as designed, just triggered by an accidental duplicate upload rather than a genuine new version. Fixed by directly flipping the two BOMs' status via SQL once the mismatch was found (`grep`-ing the schema for `@@map` to get the real `boms` table name, since Prisma model names and DB table names differ throughout this schema - always check `@@map` before guessing a table name in raw SQL). **Two more DRAFT duplicate "MAGIK-0001" uploads were also discovered** (harmless - only `APPROVED` BOMs get picked up by production logic - but not yet cleaned up) - see "Not yet started."

Still needed: customers (beyond one test customer), vendors, additional warehouses/racks/bins beyond the one `TEST-WH` rack set up this session.

### 25. Full end-to-end live verification: Customer PO → Sales Order → 4-stage Work Order chain - genuinely proves the rebuild works together
Created a real test Customer, a Customer PO for `MAGIK-2*2` (qty 10), acknowledged it (auto-created the Sales Order), confirmed the SO, added enough test stock in `TEST-WH` to cover every raw material the recursive shortage engine identified, then called `Run Allocation`. Result: `feasible: true`, zero shortages, and all 4 stage Work Orders created in the correct sequence (`WO-2026-0002-SMT` → `-MI` → `-ASSEMBLY` → `-PACKAGING`), each linked via the same `routingGroupId`. This is real proof the whole chain rebuilt in item 24 actually works together, not just that each piece exists in isolation.

**A real investigation happened along the way, worth understanding**: the Planning Board initially showed only 11 of `MAGIK-2*2`'s 50 raw materials as short in `WH-MAIN`, which looked like a serious bug in the recursive MRP engine (item 13). Investigated thoroughly - added a temporary `GET /mrp/debug-tree/:itemCode` diagnostic endpoint (since removed) that ran the real `explodeMultiCpoMaterialNeeds()` with a trace attached, rather than guessing from code reading alone. **Conclusion: not a bug.** A leftover test Purchase Order (`PO-2026-0001`, `SENT` status, from the earlier Stock Putaway demo this session) genuinely covered 39 of the 50 raw materials with large pending quantities - the engine was correctly counting real purchase-order-in-transit quantity as available supply, exactly as item 13 documents it should. Our earlier test-data cleanup for that demo had flagged the downstream `StockPutaway`/`GrnHeader`/`IqcInspection` records but missed the source PO itself. Fixed by cancelling that PO and flagging it `isTestData`; the Planning Board immediately corrected to 50/50.

**Lesson for future sessions**: when a live number looks wrong, don't assume the calculation logic is broken before checking whether it's reading real (possibly leftover test) data correctly. `explodeMultiCpoMaterialNeeds()`'s on-order-quantity check (`purchaseOrderItem.findMany` for `SENT`/`APPROVED`/`PARTIALLY_RECEIVED` POs) is **not** scoped by warehouse - a PO anywhere in the company counts toward every warehouse's shortage calculation for that item code. Test-data cleanup for any flow that touches Purchase Orders needs to include the PO itself, not just GRN/IQC/Putaway records downstream of it.

### 26. Test-session dashboard/MRP filtering - the piece that makes item 21's tagging actually invisible from real numbers
Prompted directly by item 25's investigation: a leftover test Purchase Order silently skewed a real MRP calculation, and nothing had been excluding test-flagged records from any reporting/planning endpoint before now. Fixed:

- **MRP** (`mrp.service.ts`): the on-order-PO lookup inside `explodeMultiCpoMaterialNeeds()` now excludes test-flagged `PurchaseOrder`/`PurchaseOrderItem` records - this is the exact calculation item 25 spent a real investigation root-causing. The Planning Board (`getPlanningBoard()`) now excludes test-flagged `SalesOrder`/`SalesOrderItem`, and the already-planned quantity aggregate excludes test-flagged `WorkOrder`.
- **Production Dashboard** (`production-dashboard.service.ts`): all 6 endpoints (`getOverview`, `getActiveWos`, `getToday`, `getAlerts`, `getQualityMetrics`, `getHourlyMonitoring`) now exclude test-flagged `WorkOrder`, `ProductionEntry`, `FgReceipt`, `ProductionQc`, `ProductionCostSheet`, `ManpowerAllocation`, and `StageTransferNote` from every count/list/sum - 25 query sites total.

**Deliberately did NOT attempt to filter `StockBalance`** - it is a single running-total row per item+warehouse, updated incrementally by many transactions (some real, some test) rather than a discrete per-row record with a clean test/real split. `isTestData` does not apply meaningfully to an aggregate number that is already mixed. `TEST-WH` warehouse isolation (item 21) is what actually keeps test stock activity from ever touching `WH-MAIN`'s balance in the first place - that is the real fix for stock numbers, not a filter.

**Verified live on staging**: after this fix, the Planning Board correctly shows 0 Sales Orders (our item-25 test SO is properly excluded now), and the Production Dashboard's Work Order count dropped from 5 to the 1 genuinely real Work Order in the system - the 4 test-flagged stage WOs from item 25's verification are correctly invisible.

**Related safeguard added earlier the same stretch** (`erp-frontend`, BOM upload page): Test Mode's tagging works cleanly for transactional records but not for master/reference data (Products, Raw Materials) - `bom-import`'s `findFirst`-by-code reuse logic means an item code created while Test Mode is on stays tagged `isTestData: true` forever, even after Test Mode is turned off and the same code gets reused for real work. Added a visible warning banner plus a `confirm()` gate on the BOM upload page specifically, since that is the master-data-creation flow most likely to be hit while testing other things.

### 27. Test-data purge tool built and immediately used to clear the whole session's accumulated test data - completes the tag -> filter -> purge trilogy
Found the existing `dummy-data` module already had SUPER_ADMIN-gated seed/purge endpoints, but scoped to a fixed, narrow set of 8 org-structure demo entities (Company/Plant/Unit/Department/Branch/FinancialYear/User/ChangeRequest) that predates the X-Test-Session auto-tagging feature and does not cover any of the 150+ modules Test Mode can actually create data in. Extended it with two new, clearly-separate endpoints rather than touching the existing narrow logic:

- `GET /dummy-data/test-session-summary` - read-only counts of `isTestData: true` rows across every table that has the field (computed from `Prisma.dmmf`, not hardcoded).
- `DELETE /dummy-data/purge-test-session` - deletes them, using a self-ordering retry loop (166 models, no hand-maintained FK dependency order) - repeatedly attempts every remaining table and drops one from the retry list once it succeeds. A table still blocked by a real (non-test) record referencing one of its test rows is reported, never silently skipped or force-deleted.

**Immediately used for real**: ran it against everything this session had accumulated. First pass purged 75 of 83 known rows across 9 tables, correctly leaving 4 tables (`grn_headers`, `iqc_inspections`, `work_orders`, `customer_pos`) blocked. Investigating each blocker surfaced a genuine, useful pattern: **side-effect records created by read-like operations were never tagged**, because the *triggering* request (Planning Board queries, Run Allocation, GRN/IQC approval) was called directly via curl for real feature verification earlier this session, not through Test Mode - so the auto-tagging correctly left them `isTestData: false`, exactly as designed. Found and manually flagged four such gaps: `MaterialShortage` (written by the Planning Board as an audit trail), `MaterialReservation` (written by Run Allocation), `StockBatch`/`GrnItem`/`IqcItem` (written by IQC approval), and `RejectedStock` (written by IQC rejection). After flagging each and re-running the purge, **the final pass reported `blockedTables: []` and `test-session-summary` reads `{total: 0}`** - all 187 test-tagged rows across 19 tables from this entire session are gone, and real data was never touched.

**Lesson for future sessions**: the auto-tagging feature (item 21) only tags what the *directly-headed* request creates - it has no way to know that a seemingly read-only endpoint has a persistence side-effect, so anything triggered outside an actual Test Mode session (including Claude's own curl-based verification work) needs the same manual-flagging discipline this whole session used. The purge tool's refusal to force-delete blocked tables is what made these four gaps visible and safe to fix, rather than either leaving orphaned rows or corrupting real data.

**Two small cleanup items also closed out this stretch**: the 2 leftover DRAFT duplicate "MAGIK-0001" BOM uploads from item 24's investigation were confirmed genuinely unused (DRAFT, never picked up by production logic) and deleted. The "duplicate `RolePermission` rows for PURCHASE_MANAGER" item was checked directly - zero duplicates found anywhere in `role_permissions`, because that issue predated item 20's full database wipe (found 2026-07-15) and the reseed rebuilt roles/permissions cleanly from scratch. Both items removed from Not yet started.

### 28. Real user feedback acted on directly: the BOM -> Routing journey and the standalone Routing page both simplified
User feedback, verbatim: the app has too many disconnected places to do one thing - specifically, uploading a BOM gave no indication that a completely separate Production module and manual routing setup were needed next. Two connected fixes:

- **Guided "Set Up Production" flow added to the BOM detail page** (`erp-frontend`): once a master BOM is approved, a new card walks through generating stages (auto-guessing stage names like "SMT"/"MI"/"Assembly"/"Packaging" from the uploaded sheet's own sections, always editable), approving all stages in one click, and creating the routing - all on the one page, ending at "routing ready." Deliberately does **not** also trigger Start Production - that decision (full chain vs. a specific intermediate stage, per Work Order Types 1-4) belongs to the Sales Order / Planning Board / Run Allocation path, which already knows which case applies to a given order; bolting it on here would risk defaulting to the wrong chain for partial orders. The backend endpoint this uses (`GET /boms/:id/stages`) already existed with a comment saying it was "for the detail page's Stage BOMs section" - built but never actually wired up on the frontend until now.
- **The standalone `/production/routing` page removed entirely**, following through on the same feedback once applied to that page too: its "Defined Routings" list was now fully redundant with the BOM page's own status, and its manual routing-creation form redundant with the guided flow above. The one thing on that page that wasn't redundant - manually starting build-to-stock production not tied to any Sales Order - moved to the Work Orders page as a "+ Start Routing Chain" button next to "+ New Work Order," so there's no page whose only remaining purpose is one small form. Removed from the sidebar entirely.

Net effect: BOM pages show routing status inline; Work Orders is the one place left to manually start production. One less concept to learn, nothing lost.

### 29. Full order-to-dispatch end-to-end test run live, entirely under Test Mode - found and fixed a real gap in item 21's auto-tagging along the way
At the user's explicit request: ran the complete real business flow from zero to a delivered order, live on staging, with `X-Test-Session: true` on every single call. Customer + Vendor -> Purchase Order (all 50 raw materials) -> Approve -> Send -> GRN -> Submit -> IQC -> Approve (raw material stock credited) -> Customer PO -> Acknowledge -> Sales Order -> Confirm -> Run Allocation (`feasible: true`, all 4 stage Work Orders created) -> SMT -> MI -> Assembly -> Packaging, each stage Released/Started/Completed -> FG Receipt -> Confirmed -> OQC created/completed/released (finished-good stock credited, next stage auto-released each time, exactly as items 2 and 14 describe) -> Dispatch Plan -> Approved -> Dispatch created -> **Delivered**. Every stage of the system built and fixed this session worked together correctly in one real, continuous sequence.

**A genuine, previously-undiscovered gap in the test-tagging feature surfaced along the way**: `dummy-data/test-session-summary` after the run showed `sales_orders`, `sales_order_items`, `customer_po_items`, `purchase_order_items`, `grn_items`, and `iqc_items` completely missing, despite every request in the whole test correctly carrying the header. Root cause: several flows (Customer PO acknowledge creating its Sales Order, GRN, IQC, dispatch) use `this.$transaction(async (tx) => {...})` for atomic multi-table writes - Prisma generates `tx` fresh per call, a completely different object from `this`, so item 21's wrapping of `this`'s model delegates never touched it. Any `create()` made via `tx` bypassed auto-tagging entirely, silently, for every transactional flow in the app, not just this one.

**Fixed properly, not worked around**: `PrismaService` now also wraps $transaction itself - for the callback form specifically, the same model-delegate wrapping gets applied to the `tx` object before it reaches the caller's function, so every write inside any transaction is tagged exactly like it is outside one. The array form (`$transaction([p1, p2])`) is untouched, since those promises are already built from wrapped delegate calls before reaching $transaction. This is a real correctness fix, not a one-off patch - it closes the gap for every current and future transactional flow in the app, not just the 6 tables this specific test happened to touch.

**Verified end to end**: manually flagged the pre-fix records this run had created (559 rows, 25 tables), then ran `purge-test-session` - `558` deleted, `blockedTables: []`, and a final `test-session-summary` read back `{total: 0}`. Real data was never touched at any point.

### 30. Full sidebar/page cleanup audit completed - 45 dead duplicate pages removed, one missing link added
User feedback, verbatim: too many pages that either aren't in use or aren't clearly connected. Did the full systematic pass this had been waiting on since item 16 (which fixed one instance of this same pattern opportunistically without doing the complete audit).

Cross-referenced every href actually used in `Sidebar.jsx` against every `page.jsx`/`page.js` that exists in the app router, then grepped the whole `src/` tree for any other reference (href, router.push) to each orphaned page before touching anything - found a single, extremely consistent pattern repeating across nearly every domain: an old generation of flat top-level pages (`/production-dashboard`, `/stock-ledger`, `/rejected-stock`, `/po-amendments`, etc.) had been superseded by a folder-structure redesign (`/production/dashboard`, `/inventory/stock`, `/inventory/rejected`, `/purchase/amendments`) and the sidebar updated to point at the new locations, but the old page files were never deleted - the exact same shape as item 16's single fix, just never done comprehensively. Presented the full list with what replaced each one before removing anything, per the standing rule never to delete a sidebar/page without explicit confirmation.

**Removed 45 page directories** (47 individual page files, since `inventory/warehouses` alone contained 3: list + `create` + `[id]`) across Production, Quality, Purchase, Inventory/Stock, Sales, Import, Gate, Finance, and HR - full list in the commit message. One deliberate exception: `quality/dashboard` was the *orphan* here while the old flat `/quality-dashboard` is what the sidebar actually still uses - the reverse of every other case - so that old-looking one was left alone rather than assumed dead by pattern-matching. A few unrelated genuinely-unwired features (`finance/reports`, `finance/bank-recon`, `hr/departments`, `hr/reports`, `item-categories`/`inventory/categories`, `gate/vehicle-entry`, `data-import`) surfaced the same way (zero references anywhere) and were removed too, rather than left as more orphaned clutter.

**Also added Raw Materials to the Inventory sidebar section** - `/masters/raw-materials` is a real, actively-used page (its data has been referenced constantly all session) that had simply never been linked from anywhere in the nav.

**Verified**: `npm run build` succeeded cleanly both times (page count 194 -> 148), no broken imports, nothing else in `src/` referenced any of the removed paths.

---

### 31. UI Control Center — built, deployed, extensively live-tested and bug-fixed on staging this session (SUPERSEDES any earlier item 31 draft from mid-session)

At the user's direct request: a permanent, admin-configurable visibility layer covering sidebar structure (sections + items, fully drag-and-drop and CRUD-editable) and a framework for page-level fields/columns/buttons. Super Admin — or anyone granted the new `UI_CONTROL_MANAGE` permission via the existing Roles & Permissions page — can restructure the sidebar and control exactly who sees what, per role or per individual person, without a code deploy.

**Design decision, load-bearing for everything downstream**: strictly a visibility layer on top of RBAC, never a replacement - can only hide something a user's real permissions would otherwise allow, never reveal beyond actual API access. `SUPER_ADMIN` is hard-locked to always-visible everywhere (checkbox disabled in the UI, backend bypasses overrides entirely for that role by name) - mirrors the existing hardcoded Super-Admin bypass already in `PermissionsGuard`.

**Backend, live on staging (Render):** new tables `ui_control_elements` / `ui_control_overrides` (overrides matched by `Role.name` string, not a role-type split - simpler and consistent with how `PermissionsGuard` already treats every role uniformly by name); `ui-control` module (`GET /my-sidebar` returns the real nested, visibility-filtered tree; full admin CRUD/reorder/sync gated by `UI_CONTROL_MANAGE`); seed script populated the real 13-section, 111-item structure taken directly from the live `Sidebar.jsx` NAV array - **124 rows confirmed on staging**.

**Frontend, live on staging (Vercel):** `Sidebar.jsx` fully rewritten to be DB-driven (same file path/props as before, zero `AppLayout.jsx` changes needed); admin screen at `/settings/ui-control` with drag-and-drop **and** "Move to…" dropdown + up/down buttons (added as a more reliable alternative after drag proved flaky under heavy use); Visibility Panel per element; **batched editing** - nothing hits the server until "Save Changes," with a pending-change counter, Discard option, and toast-style confirmation instead of a page-reload feel; `UiControlProvider`/`useUiControl()`/`<UiGate>` wired into the auth-gated layout only (see bug #1 below).

**Real bugs found and fixed live this session:**
1. **Login infinite-refresh loop** - `UiControlProvider` was first wrapped around the entire root layout (including `/login`), so it fired a protected API call before any token existed, got a 401, and the axios interceptor's "redirect to /login on 401" logic created an infinite loop. Fixed by moving the provider inside `AppLayout.jsx` (which only renders post-auth) instead of the root layout, plus a token-existence guard in the context itself as a second line of defense.
2. **Downloads-folder file collision** - a stale `Sidebar.jsx` already sitting in the user's Downloads folder caused the browser to silently rename the *new* downloaded file to `Sidebar (1).jsx` and keep the old one as `Sidebar.jsx` - an entire deploy shipped the wrong file (old hardcoded "Master Setup" sidebar) with zero errors anywhere. Caught only by comparing the live rendered sidebar against what was expected. **Lesson: always `grep` a downloaded file for a known unique string immediately after `mv`, never trust the command's exit code alone.**
3. `getStructureTree()` only nested items under a section - a standalone top-level item (Dashboard) was silently dropped from the tree. Fixed by treating parentKey-less `SIDEBAR_ITEM` rows as top-level nodes alongside sections.
4. Drag-and-drop reorder returned HTTP 400 intermittently - a `drop` event was bubbling from a row to its parent container's own `onDrop`, firing twice; the second firing read an already-cleared drag-tracking variable, sending a request missing the required `id`, correctly rejected by the project's strict `forbidNonWhitelisted` validation pipe. Fixed with `e.stopPropagation()` plus defensive frontend guards.
5. Visibility Panel showed stale data after any toggle - save/reload worked, but the panel kept referencing the pre-reload object. Fixed with a sync effect keeping the selected element pointed at fresh data.
6. User dropdown in per-person override showed a blank name - assumed a `name` field that doesn't exist on this project's `User` model (uses separate `firstName`/`lastName`). Fixed with a fallback chain.
7. Dev database (Neon `erp_development`) turned out completely empty (zero companies, zero users) - the full-wipe-and-reseed from an earlier session either never touched this specific branch or was wiped again since. Session pivoted to testing directly against staging (which had real data) for the entire remainder of the work. **Dev still needs `prisma/seeds/seed.ts` run before it's usable again.**

**Explicitly NOT done yet:** never run or verified against local dev (`npm run start:dev` + localhost) - per the project's own Final Rule, **this module is not yet Module Complete** until a local pass happens too. Zero retrofit of individual page fields/columns/buttons beyond the sidebar itself and one manifest example. The "duplicate an item into a second section with an independent label" idea (distinct from drag-move) was discussed but not built.

### 32. BOM "Set Up Production" stage ordering bug — found live, fixed

Generating production stages from an approved BOM (typed in physical order: SMT → MI → Assembly → Packaging) displayed back as ASSEMBLY → MI → PACKAGING → SMT - alphabetical, not the real sequence. Root-caused to `BomService.getStages()`: after correctly grouping stage-BOM versions by `createdAt: 'asc'`, the final return line re-sorted the array with `.sort((a,b) => a.bomNumber.localeCompare(b.bomNumber))`, silently alphabetizing by BOM number. **The actual routing chain created by `generateStages()` was never affected** - this was purely a display-order bug in the read-back endpoint, not a corruption of the underlying production sequence. Fixed by preserving first-seen (creation) order through the grouping step instead of re-sorting. One real hiccup during the manual edit (a leftover duplicate `const groups`/`for` loop pair caused 159 cascading TypeScript errors) - fixed by deleting the two stray leftover lines. Pushed to staging; visual confirmation on the live BOM detail page still pending from the user.

### 33. BOM upload Test Mode data separation — new feature, built and confirmed working on staging

At the user's request: uploading the same BOM once in Test Mode and once for real must produce two structurally independent BOMs (separate Products, separate Raw Materials, separate everything) - not just tagged differently, genuinely non-colliding. Implemented in `bom-import.service.ts`: a new `applyTestPrefix()` helper prefixes any *newly created* Product/RawMaterial code with `TEST-` whenever `isTestSessionActive()` (the project's existing AsyncLocalStorage-based Test Mode detector) is true; a real (non-test) session always looks up/creates bare codes and structurally cannot find or reuse a `TEST-`-prefixed row. `buildPreview()` (the pre-confirm preview step) applies the same prefix logic so the preview never disagrees with what `confirmImport()` will actually create. Existing `isTestData: true` tagging (and therefore the existing purge tool) is untouched and still works exactly as before - this is a structural addition on top of the existing tagging, not a replacement for it.

Also updated the BOM upload page's Test Mode warning banner/confirm dialog, which previously described the *old* problem ("codes will get permanently tagged as test data even after you turn Test Mode off") - now accurately describes the fix instead of scaring users about a problem that no longer exists.

**Verified live on staging**: uploading a real BOM in Test Mode produced `TEST-POLYCAB9 WATT` as the product code and `TEST-CELZOX0104`-style raw material codes, visible directly on the BOM detail page. **Not yet confirmed**: the full cycle (test upload → real upload of the same file → confirming two independent BOMs exist → purge only removing the test one).

### 34. Full data wipe (except master data) — new SUPER_ADMIN tool, built, dry-run-verified, and successfully executed on staging

At the user's explicit request, after a long test/development session left staging's transactional data in a state they wanted cleared entirely (not just Test-Mode-tagged rows - real data too), keeping only foundational setup. Extended the existing `dummy-data` module (same self-ordering FK-retry-loop deletion engine as the proven `purgeTestSessionData`) with two new endpoints:

- `GET /dummy-data/full-wipe-preview` - read-only dry run. Computes `KEEP_TABLES` (master data: Company, Plant, Unit, Department, Branch, Warehouse, FinancialYear, User, Role, RolePermission, NumberingSeries, SystemSetting, UnitOfMeasure, HsnSacCode, UiControlElement, UiControlOverride, AuditLog) vs. every other table, from live Prisma schema metadata rather than a hardcoded table-name list - and **explicitly flags any KEEP model name that doesn't match the real schema** (`safeToProceed: false` + `unmatchedKeepNames` list) rather than silently wiping something meant to be protected due to a naming typo. Caught two real mismatches on the first run (`SystemSettings`→`SystemSetting`, `HsnSac`→`HsnSacCode`) before anything was deleted.
- `DELETE /dummy-data/full-wipe` - the actual delete. Requires the literal request-body string `"DELETE ALL TRANSACTIONAL DATA"`; refuses to run at all if `unmatchedKeepNames` is non-empty; SUPER_ADMIN checked again in the service layer itself, not just the route guard, given the stakes.

**Executed live on staging after full dry-run review**: deleted 1,069 directly-targeted rows across 26 tables (491 more via FK cascade, confirmed by direct row-count math and spot-checked with raw SQL against the live DB), `blockedTables: []`. All master data - 1 company, 14 users, 14 roles, 436 role permissions, system settings, numbering series, UOM, HSN codes, the UI Control Center structure, and all 231 audit log entries - confirmed intact via direct SQL verification.

### 35. Test Mode Data page simplified

The `/settings/dummy-data` page had three legacy purge-related controls (a header "Purge All Test Data" button, per-company "Seed Test Data"/"Purge" buttons, plus a "Test User Credentials" block) left over from before the X-Test-Session/Test Mode feature existed - all three still functioned correctly but only ever touched a fixed set of 8 org-structure demo tables (Plant/Unit/Department/Branch/FinancialYear/User/ChangeRequest), nothing to do with real Test Mode usage (BOMs, Work Orders, Sales Orders, 150+ modules). Removed all three plus the now-irrelevant credentials block; the page now shows only the real, comprehensive "Delete All Test Mode Data" tool (item 27's `purgeTestSessionData`, computed live from schema) and the Safety Notice.

### 36. Dead `bom-revisions` module and page removed

User flagged, during a sidebar review, that "BOM Revisions" in the Inventory section looked unused. Investigated per the standing rule before touching anything: confirmed the real BOM detail page's version history comes entirely from `BomService.getHistory()`/`getVersions()` (`GET /boms/:id/history`) - a completely separate, fully-functional implementation. The `bom-revisions` module (`BomRevisionController`/`Service`/DTO, its own `create`/`approve`/`findByProduct` endpoints) was a parallel implementation with real backend code but **zero live callers anywhere in the active app** - its only reference in the whole codebase was the retired `Sidebar.legacy.jsx`. Confirmed genuinely dead, then fully removed per the user's explicit go-ahead: backend module deleted and unregistered from `app.module.ts` (verified clean build, 124/125), frontend page deleted (verified clean build, 148 routes, down from 149), sidebar entry deactivated directly in the `ui_control_elements` table.

---

### 37. Manual "Start Routing Chain" removed entirely - production now only ever starts via Customer PO → Sales Order → Run Allocation

At the user's explicit direction: no production should ever start from a manual trigger, even for build-to-stock - only through the real pipeline. Removed `POST /routing/start-production` from `RoutingController` (the underlying `RoutingService.startProduction()` method is untouched and still called directly by `MrpService.runAllocation()` as an internal service method, not via HTTP - confirmed safe to remove the endpoint without affecting the automatic pipeline). Removed the "+ Start Routing Chain" button, its modal, and all associated state/handlers from the Work Orders page.

The BOM detail page's routing panel - which used to point people at the now-removed button ("For build-to-stock, use Work Orders → Start Routing Chain") - now shows the routing chain as a simple, persistent, informational two-line display: the routing name/stage count, then the stage sequence (e.g. `SMT → MI → ASSEMBLY → PACKAGING`), with no start action at all. The BOM page's job is now purely "show how this product is built," never "start building it."

### 38. Customer PO now links to a real, permanent Customer record

Found via user report: typing a new customer name on a Customer PO never actually created anything in the Customers master list - `customerName` was pure free text with zero connection to the real `Customer` table (no `customerId` field existed on `CustomerPo` at all). Fixed properly, not cosmetically:

- **Schema**: added nullable `customerId` FK on `CustomerPo` → `Customer` (hand-written SQL, applied to dev and staging - caught and fixed a genuine `@map` mismatch on the first attempt, where `customerId` had no `@map("customer_id")` and Prisma tried to write to a column that didn't exist, blocking every single Customer PO creation until fixed).
- **Backend**: new `POST /customers/quick-create` (name/email/phone only, auto-generates a unique code the same way BOM numbers do); `customer-po.service.ts` now stores `customerId` on both create and update paths.
- **Frontend**: rather than keep the minimal quick-create form, extracted the *existing, full* Customer create/edit modal (address/contacts/GST) out of the Customers list page into a shared `CustomerFormModal` component - both the Customers page and the Customer PO form now use the identical, fully-featured form. Customer Name field moved above Customer PO Number per the user's explicit request. Selecting or creating a customer now fetches full detail (addresses etc.) and auto-fills the form exactly the same way whether the customer is new or existing.

**Verified live on staging**: created a real customer ("Bajaj") via the inline modal from the Customer PO form, confirmed it appeared permanently in `/sales/customers` with its address, and confirmed searching that name on a second Customer PO showed it as an existing match rather than offering to create it again.

### 39. Material Shortage Check redesigned as a proper table

The Customer PO detail page's shortage check displayed each raw material as an inline flex-row of text. Rebuilt as a real bordered grid table - columns Item / Available / Required / Difference, item names at readable size with proper word-wrap for long descriptions, and the Difference column now shows its unit (e.g. `-1000 PCS`, `-5880 MTR`) instead of a bare number.

### 40. Document Attachments: two real bugs fixed

- **Every upload/download/delete was silently broken** - `DocumentAttachments.jsx` read its auth token from `localStorage.getItem('accessToken')`, a key that is never set anywhere in this app (the real key, used everywhere else, is `erp_token`). `getToken()` always returned `undefined`, so the backend correctly rejected every request as unauthorized regardless of how fresh the login was. One-line fix.
- **Added a "View" option** alongside the existing Download - opens the file inline in a new browser tab (via a blob URL) instead of always forcing a file-system download, for PDFs/images people just want to look at. (One follow-up slip during this fix: the button referencing `handleView` got added in a commit where the actual `handleView` function failed to match/insert - would have thrown a runtime error on click. Caught before the user tried it, fixed in the very next commit with a verified line-number insertion instead of text matching.)

### 41. Three real Test Mode isolation bugs found via a genuine live end-to-end run

Attempting a full Test-Mode-only rehearsal of Customer PO → Sales Order → Run Allocation (at the user's request, to understand why Test Mode couldn't do this at all) surfaced three separate, real bugs - each traced to ground truth via direct SQL queries rather than guessed at:

1. **Planning Board hard-excluded ALL test data, unconditionally** - `MrpService.getPlanningBoard()` (and its on-order-PO shortage helper) had `isTestData: false` hardcoded with no session awareness at all, unlike every other Test Mode fix this session. This meant a test session's own Sales Orders were **permanently invisible** to the one screen that triggers Work Order creation - Test Mode could create data but never act on it. Fixed by making the query session-aware via `isTestSessionActive()`, exactly like the BOM import fix earlier: a test session now sees only its own test-flagged Sales Orders (a complete, isolated sandbox), a real session sees only real ones, never mixed. Applied consistently across all four `isTestData: false` sites in the affected code path.

2. **Sales Order items auto-created from CPO acknowledgment were never tagged test, even when the parent Sales Order correctly was.** Root cause: `SalesOrdersService.createFromCpo()` creates the SO via `tx.salesOrder.create({ data: { items: { create: calcItems } } })` - a **nested Prisma write**. The project's global auto-tagging Client Extension only intercepts **top-level** `create`/`createMany`/`upsert` calls per model; a nested `items: { create: [...] }` inside a parent's create() never triggers the child model's own hook, so it's completely invisible to the tagging mechanism. The parent `SalesOrder` row got tagged correctly (`isTestData: true`, since that's a top-level call); every one of its `SalesOrderItem` rows silently defaulted to `false`. Since `getPlanningBoard()`'s item-inclusion filter also matches on `isTestData`, this alone was enough to make the Sales Order vanish from the board even after fix #1, because the mismatched item made `so.items.length === 0` after filtering. Fixed by explicitly setting `isTestData: isTestSessionActive()` on each nested item at the point of creation, rather than relying on the global mechanism reaching somewhere it structurally cannot. **This is the same class of gap as the `$transaction` nested-write issue found in a much earlier session (item 29) - nested writes of any kind bypass the top-level auto-tagging extension and need explicit tagging at the source.** Worth grep-ing for other `X: { create: [...] }` nested writes elsewhere in the codebase that may have the identical silent gap.

3. **MRP Production Planning table showed blank quantities** - unrelated to Test Mode, a plain field-name mismatch: the backend's Planning Board response uses `rm.totalNeeded`/`rm.available`, but the frontend read `rm.qtyPerUnit`/`rm.availableQty` (fields that don't exist in the response), so React silently rendered nothing for the number while the adjacent unit label (`rm.uom`, which does exist) still showed - looked like "PCS" with no number in front of it. One-line fix once traced.

**Existing broken data corrected via direct SQL** after each fix (the specific `SO-2026-0001` item that predated the tagging fix), rather than only fixing the code going forward.

### 42. Run Allocation rewritten: priority-ordered, partial-fulfillment - major feature, proven end-to-end

At the user's explicit request, confirmed via two direct design questions before building: Run Allocation no longer requires 100% material coverage to do anything. New behavior, confirmed by the user:

- **Sales Order items are processed in the exact priority order submitted** (the Production Planning screen's ↑↓ ranking) - the highest-priority item gets first claim on available material; whatever's left goes to the next, and so on. Scarce shared raw materials are never double-claimed by two orders in the same run.
- **An item with only partial material coverage gets a Work Order for the maximum quantity actually producible right now** - not an all-or-nothing rejection. The shortfall simply stays as `pendingQty` (already computed dynamically everywhere else in this file) for a future allocation run once more stock arrives.
- **"Virtual consumption" tracked in memory across the run**: since nothing is reserved in the database until a Work Order is actually created, a higher-priority item's claim on a shared material has to be subtracted from what the next item in the same run sees as available, or every item would see identical starting stock and over-allocate the same scarce material to multiple orders. Implemented as a `Map<itemCode, consumedQty>` accumulated item-by-item within `runAllocation()`.
- Response shape changed from `{ feasible, shortages, createdWorkOrders }` to `{ feasible, createdWorkOrders, partiallyFulfilled, skipped, note }` - `feasible` now means "at least one Work Order was created," not "everything was fully covered." **Frontend has not yet been updated to display `partiallyFulfilled`/`skipped` - still shows only `createdWorkOrders` from the old contract.** This is the immediate next step.

**Verified end-to-end live on staging, twice, proving both the zero-stock and partial-success paths in one session**:
- With zero stock anywhere: correctly returned `feasible: false`, item landed in `skipped` with a clear reason, no crash, nothing malformed.
- With 10,000 units seeded for every raw material (via direct SQL into the isolated Test Warehouse, never touching Main Store): one material still needed more than that per unit, correctly bottlenecking the build to **312 of 1000 requested** - the full 4-stage routing chain (SMT → MI → Assembly → Packaging) was created with `plannedQty: 312` **consistently across every stage**, first stage `RELEASED`, remaining stages correctly `DRAFT` pending the prior stage's completion, Sales Order flipped to `IN_PRODUCTION`, and `remainingPending: 688` correctly reported - confirmed directly against the database, not just the API response.

---

### 43. UI Control Center — Module Complete (local test pass done, final closeout)

Confirmed working end-to-end against **local dev** as the last remaining step from item 31 (dev DB needed bootstrapping first - found already restored to a working state, 1 company/14 users/124 UI Control elements, cause unclear but data verified correct). One real environment issue caught and fixed along the way: `.env` had been left pointing at staging (from an earlier same-session swap-and-restore) rather than dev - restored from `.env.dev.backup`, verified the connection string before trusting it.

**Verified locally**: backend (`npm run start:dev`, port 3001) returns the identical `/ui-control/my-sidebar` response as staging - same 14 top-level entries, same nested item counts across every section. Frontend (`npm run dev`, port 3000, `NEXT_PUBLIC_API_URL` correctly pointed at `localhost:3001`) - sidebar renders correctly, `/settings/ui-control` loads, drag/move-and-save persists correctly.

**Per the project's own Final Rule** ("no module is complete until local and staging both work") - **UI Control Center is now Module Complete.** Manifest rollout (extending field/column-level control beyond the one BOM price example to other modules) remains open as a separate, ongoing, module-by-module task - same cadence as everything else in this project - not a blocker to closing this module out.

---

---

## Not yet started

- **Production Floor page messaging** - doesn't yet tell floor staff that completing a WO/confirming an FG Receipt no longer makes stock instantly usable (Phase C). Needs a UX pass, not a backend change.
- **OQC / IPQC rework/scrap/quarantine flow** - a `FAIL`/`CONDITIONAL` OQC result currently just stays permanently un-released with no formal next step, and a stopped WO with an unresolved IPQC FAIL has no formal disposition path either.
- **Stock Adjustment historical audit** - every pre-fix `DECREASE` adjustment needs manual review for silently-inflated balances.
- **Frontend UI for a dedicated Manpower approvals panel** - Plant Head must currently use the generic `/workflows` page; no "my pending manpower approvals" view exists yet.
- **MRP Shortage Report** - no "Create PR from Shortage" quick-action button; manual re-entry required to raise a Purchase Requisition from a shortage line.
- **Gate Inward for Import shipments** - Gate Inward currently only links to domestic Purchase Orders; Import shipments bypass this step entirely today.
- **UI Control Center: manifest rollout** - field/column-level control (the `<UiGate>` framework) is proven working for one example (`purchase.po.field.unitPrice`); the other ~145 modules' fields/columns/buttons still need their keys added one module at a time.
- **A pre-existing, unrelated bug found but not fixed**: the `/masters` landing page has dead links using old pluralized/hyphenated route names (`/gate-inward`, `/masters/branches`, etc.) that no longer exist post-routing-cleanup - same disease as the sidebar audit in item 30, on a page that audit didn't cover.
- **Audit other nested Prisma writes for the silent test-tagging gap found in item 41 #2** - any `X: { create: [...] }` nested write anywhere in the codebase is a candidate for the same bug (a top-level model gets auto-tagged `isTestData` correctly, its nested-created children silently don't). The CPO→SO one is fixed; others may not be.
- **JWT token lifetime** - observed expiring within roughly a minute or two of issuance multiple times this session, well short of the documented `24h`/`7d` intent. Genuinely disruptive during rapid API testing; worth checking `JWT_EXPIRES_IN` is actually being read/honored, and whether Render restarts are invalidating sessions.
- **A true multi-order priority-ranking test of Run Allocation** has not been run - only a single-item partial-fulfillment scenario was verified. The "higher-priority order gets first claim on shared scarce material" behavior is implemented and logically sound but hasn't been exercised with two competing Sales Orders sharing a bottleneck material.

---

## Key architectural invariants (apply to everything)

- Every table: UUID id, 8 audit columns (`createdAt/updatedAt/createdBy/updatedBy` + `isActive`/`isTestData`), soft delete via `isActive`.
- All APIs: JWT + RBAC (`PermissionsGuard`) + validation + audit logging.
- No negative stock at DB or service layer; prices frozen on approved documents.
- Multi-company isolation via `companyId` on all tables.
- New permissions must be added to `src/common/permissions/permissions.enum.ts` AND, if they should be visible in the admin UI, to the `PERMISSION_SECTIONS` array in `erp-frontend/src/app/(app)/settings/roles-permissions/page.jsx`.
- **Before building any new cross-cutting system (approval, notification, transfer, shortage-calculation, stock-gating, etc.), search the existing codebase first.** This project consistently has more general-purpose infrastructure than expected - the multi-level approval engine and the IQC stock-gating pattern (reused for OQC this session, item 14) are the two clearest examples. `grep -rn` across `src/` before building anything that smells like it might already exist is cheap insurance.
- **Store/QC is a real gate on stock, symmetrically, for both directions**: raw materials via IQC (`receiveFromIqc`), finished goods via OQC (`receiveFromOqc`, new this session). Nothing becomes real `StockBalance` - dispatchable, reservable by the next stage, visible to shortage checks - without an explicit Store/QC pass-and-release step. If a future module needs to introduce ANY new way material enters stock, check whether it should go through one of these two gates rather than posting to `StockLedger` directly.
- Sandbox note: `npx prisma generate` and `npx nest build` fail in Claude's sandbox due to network restrictions on Prisma's binary CDN, even when the code is correct - this is expected and not a signal of a real problem. Ask the user to run these on their own machine as the real validation step. See the "Patch delivery lessons" section above for the terminal-paste gotchas discovered alongside this.

---

## Source documents referenced in past sessions

1. A 6-step manpower/production description (HR→Plant→Stage→Line manpower, WO merging under one root number, stage-to-stage transfer notes) — fully implemented (items 9, 10, plus WO naming/grouping in items 5/8).
2. A longer "Production Prediction, Manpower Planning & Work Order Approval Process" document covering: morning manpower allocation, Plant Head approval workflow, Work Order Types 1-4, dynamic manpower management, hourly production monitoring, and dispatch control exclusively through Store. Source for items 11, 12, 14, 15 above. If the user references "the doc" or "as I described," this is almost certainly what they mean.
3. `ERP_Manual_Testing_Guide.md` (this repo root, added this session) — not a planning doc, but the companion sequential testing walkthrough. Read it alongside this file when picking up work; it documents exact verified commands/expected-results for everything marked [Verified] here.
