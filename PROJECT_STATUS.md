# Oregenal Electricals ERP — Project Status

**Last updated:** July 29, 2026
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

---

## Not yet started

- **Sidebar/page cleanup review** — full audit of unused tabs/pages, still not started as a systematic pass (one specific broken link was fixed opportunistically - item 16 above - but that's not the full review). Nothing should be removed without explicit per-item confirmation, and never remove something still needed even if a newer feature was just built to replace it - verify the old one is truly dead first.
- **Production Floor page messaging** — doesn't yet tell floor staff that completing a WO/confirming an FG Receipt no longer makes stock instantly usable (Phase C). Floor staff may be confused why stock doesn't show up immediately downstream. Needs a UX pass, not a backend change.
- **OQC / IPQC rework/scrap/quarantine flow** — a `FAIL`/`CONDITIONAL` OQC result currently just stays permanently un-released with no formal next step, and a stopped WO with an unresolved IPQC FAIL has no formal disposition path either (scrap the WIP? rework and re-inspect? who decides?) beyond "someone eventually logs a corrective PASS." Both are safe (nothing bad happens automatically) but incomplete as a workflow - worth a combined pass across both.
- **Stock Adjustment historical audit** — see item 17 above. Every pre-fix `DECREASE` adjustment needs manual review for silently-inflated balances.
- **Frontend UI for Stop/Restart's own dedicated request flow** exists (buttons on Work Orders page), but Manpower Adjust/Transfer's UI (`/production/manpower`) only has the request-side forms - no dedicated "my pending manpower approvals" panel yet (Plant Head must use the generic `/workflows` page for these).
- **MRP Shortage Report** — no "Create PR from Shortage" quick-action button; manual re-entry required to raise a Purchase Requisition from a shortage line.
- **Gate Inward for Import shipments** — Gate Inward currently only links to domestic Purchase Orders; Import shipments physically pass through the same gate but bypass this step entirely today.
- **Duplicate `RolePermission` rows** for `PURCHASE_MANAGER` (found 2026-07-15) — harmless but still unaudited across other roles.
- **Test-session dashboard filtering** — even with auto-tagging working (both backend and frontend now done - item 21), the key reporting endpoints (stock balance, production dashboard, MRP shortage checks) don't yet exclude `isTestData: true` records from their calculations. Auto-tagging alone doesn't hide test data from real numbers - this filtering step is what actually would.
- **Test-data purge capability** — no way yet to bulk-delete everything tagged `isTestData: true` in one action; cleanup is still manual per-record (as this whole session's cleanup steps demonstrate).
- **Two extra DRAFT duplicate "MAGIK-0001" BOM uploads** (`c85dbade-dcc7-431d-a5ce-11bbb57ad7a9`, `b4ae5f2d-cf43-47c9-8580-0647a28aa61d`) found while investigating item 24's duplicate-BOM issue — harmless (DRAFT, never picked up by production logic) but not cleaned up.
- **Master data rebuild** — customers (beyond one test customer), vendors, additional warehouses/racks/bins beyond the one `TEST-WH` rack. The end-to-end live test (Sales Order → Work Orders) is done - see item 25.

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
