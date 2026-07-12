# MODULE_REFERENCE.md

Living reference for each completed requirement — what it does, how it works, and how to test it. Updated after every requirement is completed. Anyone (developer, tester, or future you) should be able to read one section and fully understand + verify that piece of the system without needing chat history.

---

## Module 97 — Customer PO (Written/Verbal) + BOM Material Shortage Check

**Status:** Backend complete and deployed to staging. Frontend not yet built.
**Date completed (backend):** 2026-07-12
**Related files:** `src/customer-po/*`, `prisma/schema.prisma` (`CustomerPo`, `CustomerPoItem`, `MaterialShortage` models)

### 1. Business Requirement

> When a customer gives a PO, it may be a **written** PO (physical/email document with a real PO number) or a **verbal** PO (phone call, no document — someone in Admin/Super Admin logs it manually). Once entered, the system must check each ordered item's Bill of Materials (BOM) against current store stock. Any raw material short of what's needed must be flagged for the Purchase department to act on.

### 2. Workflow (step by step)

1. **Admin or Super Admin receives a customer PO** — either a real document (WRITTEN) or a phone call (VERBAL).
2. **Create the Customer PO** via `POST /api/v1/customer-po`:
   - `poType: "WRITTEN"` → requires a real `customerPoNumber`.
   - `poType: "VERBAL"` → requires `verbalConfirmedBy` (who took the call) and `verbalConfirmedDate`; the system auto-generates a placeholder PO number (`VERBAL-CPO-YYYY-NNNN`) since there's no real document number.
3. **Run the shortage check** via `POST /api/v1/customer-po/:id/run-shortage-check`. For each item ordered, the system determines what it actually is:
   - **It's a Product with an approved BOM** → explode the BOM (quantity × BOM ratio + wastage%), compare each raw material's requirement against `StockBalance.availableQty`. Any shortfall is written to `MaterialShortage` with status `OPEN`.
   - **It's a Product with NO approved BOM** → do not guess at stock. Instead, auto-create a `Task` (category `BOM_CREATION`, priority `HIGH`, due in 3 days) linking back to the PO, so someone is assigned to create the missing BOM.
   - **It's a raw material sold directly** (matches `RawMaterial.code`, not `Product.code`) → skip BOM entirely, check that raw material's own stock directly against the ordered quantity.
   - **Item code matches neither** → flagged `NO_PRODUCT_MASTER` (data-entry issue, needs investigation).
4. **Purchase department views open shortages** via `GET /api/v1/customer-po/:id/shortages` — shows item, required qty, available qty, shortage qty, status. (Endpoint is permissioned `PURCHASE_VIEW`, so Purchase and Sales/Unit Head can both see it; other departments cannot.)
5. Re-running the shortage check on the same PO clears previous `OPEN` shortages first, so numbers stay current as stock changes — safe to re-run any time.

### 3. Key Business Rules Encoded

- Written PO requires a real customer PO number; verbal does not (auto-placeholder generated).
- BOM explosion only happens for Products; raw materials sold directly skip BOM checking entirely.
- Missing BOM is never silently ignored — it always produces a traceable Task.
- Shortage records are always scoped to the specific Customer PO that triggered them (`MaterialShortage.customerPoId`).

### 4. API Reference

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| `POST` | `/customer-po` | `SALES_CREATE` | Create a written or verbal PO |
| `GET` | `/customer-po` | `SALES_VIEW` | List all customer POs |
| `GET` | `/customer-po/:id` | `SALES_VIEW` | View one PO with items |
| `GET` | `/customer-po/stats` | `SALES_VIEW` | Dashboard counts (written/verbal/status) |
| `POST` | `/customer-po/:id/acknowledge` | `SALES_EDIT` | Mark PO as acknowledged |
| `POST` | `/customer-po/:id/cancel` | `SALES_EDIT` | Cancel a PO |
| `POST` | `/customer-po/:id/run-shortage-check` | `SALES_EDIT` | Run the BOM/RM shortage check |
| `GET` | `/customer-po/:id/shortages` | `PURCHASE_VIEW` | View shortage results (Purchase-facing) |

### 5. How To Test This (step by step, reusable)

**Prerequisite data needed** (only if testing on a fresh/empty database):
```sql
-- One raw material, one finished product, one approved BOM linking them,
-- and a deliberately low stock balance to produce a real shortage.
-- See: seed_shortage_test_data_v3.sql (2026-07-12) for exact working script.
```

**Test 1 — Written PO with a real shortage:**
```bash
curl -X POST {BASE_URL}/api/v1/customer-po -H "Authorization: Bearer {TOKEN}" -H "Content-Type: application/json" -d '{
  "poType": "WRITTEN", "customerPoNumber": "TEST-001", "customerName": "Test Customer",
  "poDate": "2026-07-12", "deliveryDate": "2026-08-12",
  "items": [{ "itemCode": "<product-code-with-bom>", "itemName": "...", "qty": 2, "unitPrice": 15000 }]
}'
# -> then POST /customer-po/{id}/run-shortage-check
# Expect: hasShortage: true if BOM requirement exceeds stock, false otherwise.
```

**Test 2 — Verbal PO:**
```bash
curl -X POST {BASE_URL}/api/v1/customer-po ... -d '{
  "poType": "VERBAL", "verbalConfirmedBy": "Name - phone call", "verbalConfirmedDate": "2026-07-12", ...
}'
# Expect: response includes auto-generated customerPoNumber starting with "VERBAL-"
```

**Test 3 — Raw material sold directly:**
```bash
# Use an itemCode that matches RawMaterial.code, not Product.code
# Expect shortage-check result status: "CHECKED_DIRECT_STOCK", no BOM explosion attempted
```

**Test 4 — Product with no BOM:**
```bash
# Use a Product.code with zero approved BOMs
# Expect shortage-check result status: "BOM_MISSING", and a new row in Tasks
# (category: BOM_CREATION) referencing this PO
```

**Test 5 — Permission boundaries:**
```bash
# Purchase Manager -> GET /customer-po/{id}/shortages -> expect 200
# HR Manager / Gate Security / Production Operator -> same endpoint -> expect 403
```

### 6. Known Limitations / Follow-ups (not yet built)

- **No frontend yet** — this module is API-only right now. Frontend build is next.
- **Shortage stock check is single-warehouse** (`StockBalance.findFirst`, not summed across all warehouses) — matches existing MRP module's behavior for consistency, but if a company splits stock across multiple warehouses, this could undercount total availability. Tracked as a shared follow-up affecting both this module and `mrp.service.ts`.
- **`SUPERVISOR`/`OPERATOR` shared-role architecture gap** — these two `UserRole` enum values each cover 6+ distinct job functions with no `department` field to distinguish them, so permission grants for these roles are broader than ideal. Tracked separately; requires a `User.department` field + `PermissionsGuard` update to resolve properly.
- **BOM-missing Task is always assigned to whoever ran the shortage check** — there's no dedicated "BOM owner" role yet, so the task isn't auto-routed to Production/Planning. Reassign manually for now.

---

*(Next module's reference will be appended below this line.)*
