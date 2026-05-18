"""
Purchase Module — Test Suite
============================
Covers the full PR → RFQ → Quotation → PO → GRN → Return flow.

Run:
  cd erp-backend
  source venv/bin/activate
  pytest tests/test_purchase/test_purchase.py -v --tb=short

Prerequisites:
  - Database migrated to 020_purchase_module
  - seed_rbac.py + seed_master.py + seed_masters.py run first
  - seed_purchase.py run first (provides realistic data)
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


# ─────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


async def _login(client, email: str, password: str) -> dict:
    r = await client.post("/api/v1/auth/login",
                          json={"email": email, "password": password})
    if r.status_code != 200:
        return {}
    d = r.json()
    return {"token": d.get("access_token"), "user": d.get("user")}


def H(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def skip_if_no_token(session: dict):
    if not session.get("token"):
        pytest.skip("Login failed — run seed scripts first")


# ─────────────────────────────────────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────────────────────────────────────

async def sa(c):  return await _login(c, "admin@oregenal.com",  "Oregenal@2024")
async def adm(c): return await _login(c, "rahul@oregenal.com",  "Admin@1234")
async def sm(c):  return await _login(c, "store@oregenal.com",  "Store@1234")
async def gg(c):  return await _login(c, "gate@oregenal.com",   "Gate@1234")
async def iqc(c): return await _login(c, "qc@oregenal.com",     "Qc@12345678")


# ═══════════════════════════════════════════════════════════════════════
# 1. AUTH & RBAC
# ═══════════════════════════════════════════════════════════════════════

async def test_unauthenticated_blocked(client):
    r = await client.get("/api/v1/purchase/orders")
    assert r.status_code == 401, r.text


async def test_gate_guard_can_view_orders(client):
    g = await gg(client)
    skip_if_no_token(g)
    r = await client.get("/api/v1/purchase/orders", headers=H(g["token"]))
    assert r.status_code == 200


async def test_gate_guard_cannot_create_po(client):
    g = await gg(client)
    skip_if_no_token(g)
    r = await client.post("/api/v1/purchase/orders", headers=H(g["token"]),
                          json={"vendor_name": "X", "items": []})
    assert r.status_code == 403


async def test_iqc_can_view_purchase(client):
    q = await iqc(client)
    skip_if_no_token(q)
    r = await client.get("/api/v1/purchase/requisitions", headers=H(q["token"]))
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# 2. PURCHASE REQUISITIONS
# ═══════════════════════════════════════════════════════════════════════

@pytest_asyncio.fixture(scope="session")
async def store_session(client):
    return await sm(client)


async def test_list_prs(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/requisitions", headers=H(store_session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "total" in d


async def test_create_pr(client, store_session):
    skip_if_no_token(store_session)
    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(store_session["token"]),
                          json={
                              "title": "Test PR — pytest",
                              "department": "QA",
                              "priority": "urgent",
                              "items": [{
                                  "product_name": "LED Chip Test",
                                  "unit": "Pcs",
                                  "quantity": 100,
                                  "estimated_unit_price": 2.50,
                                  "gst_rate": 12,
                              }],
                          })
    assert r.status_code == 201, r.text
    d = r.json()
    assert d["status"] == "DRAFT"
    assert d["pr_number"].startswith("PR")
    return d["id"]


async def test_pr_title_required(client, store_session):
    skip_if_no_token(store_session)
    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(store_session["token"]),
                          json={"title": "", "items": []})
    assert r.status_code in (400, 422)


async def test_pr_item_qty_validation(client, store_session):
    skip_if_no_token(store_session)
    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(store_session["token"]),
                          json={
                              "title": "Bad PR",
                              "items": [{"product_name": "X", "quantity": -5}],
                          })
    assert r.status_code == 422


async def test_submit_pr_requires_items(client, store_session):
    """Submitting an empty PR must fail."""
    skip_if_no_token(store_session)
    # Create empty PR first
    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(store_session["token"]),
                          json={"title": "Empty PR", "items": []})
    assert r.status_code == 201
    pr_id = r.json()["id"]
    # Try to submit it
    r2 = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/submit",
                           headers=H(store_session["token"]))
    assert r2.status_code == 400


async def test_pr_submit_and_approve_flow(client):
    """Full PR workflow: create → submit → approve."""
    s = await sm(client)
    skip_if_no_token(s)
    a = await adm(client)
    skip_if_no_token(a)

    # 1. Create
    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(s["token"]),
                          json={
                              "title": "Full flow PR",
                              "items": [{"product_name": "Test Item",
                                         "quantity": 50, "estimated_unit_price": 10}],
                          })
    assert r.status_code == 201
    pr_id = r.json()["id"]

    # 2. Submit
    r = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/submit",
                          headers=H(s["token"]))
    assert r.status_code == 200
    assert r.json()["status"] == "SUBMITTED"

    # 3. Cannot submit again
    r = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/submit",
                          headers=H(s["token"]))
    assert r.status_code == 400

    # 4. Approve
    r = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/approve",
                          headers=H(a["token"]))
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    return pr_id


async def test_pr_reject_flow(client):
    """PR reject requires reason."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(s["token"]),
                          json={"title": "Reject me",
                                "items": [{"product_name": "X", "quantity": 1}]})
    pr_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/requisitions/{pr_id}/submit",
                      headers=H(s["token"]))
    r = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/reject",
                          headers=H(a["token"]),
                          json={"reason": "Budget exceeded for Q1"})
    assert r.status_code == 200
    assert r.json()["status"] == "REJECTED"
    assert r.json()["rejection_reason"] == "Budget exceeded for Q1"


async def test_reject_without_reason_fails(client):
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    r = await client.post("/api/v1/purchase/requisitions",
                          headers=H(s["token"]),
                          json={"title": "Reason test",
                                "items": [{"product_name": "X", "quantity": 1}]})
    pr_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/requisitions/{pr_id}/submit",
                      headers=H(s["token"]))
    r = await client.post(f"/api/v1/purchase/requisitions/{pr_id}/reject",
                          headers=H(a["token"]),
                          json={"reason": "  "})
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# 3. RFQ
# ═══════════════════════════════════════════════════════════════════════

async def test_list_rfqs(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/rfq", headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_create_rfq(client, store_session):
    skip_if_no_token(store_session)
    r = await client.post("/api/v1/purchase/rfq",
                          headers=H(store_session["token"]),
                          json={
                              "title": "pytest RFQ",
                              "items": [{
                                  "product_name": "LED Chip",
                                  "quantity": 1000, "unit": "Pcs", "gst_rate": 12,
                              }],
                              "vendor_ids": [],
                          })
    assert r.status_code == 201
    d = r.json()
    assert d["status"] == "DRAFT"
    assert d["rfq_number"].startswith("RFQ")
    return d["id"]


async def test_rfq_comparison_sheet(client, store_session):
    skip_if_no_token(store_session)
    # Get any PARTIALLY_RECEIVED or SENT RFQ
    r = await client.get("/api/v1/purchase/rfq?status=PARTIALLY_RECEIVED",
                         headers=H(store_session["token"]))
    items = r.json().get("items", [])
    if not items:
        pytest.skip("No PARTIALLY_RECEIVED RFQ found — run seed_purchase.py first")
    rfq_id = items[0]["id"]
    r2 = await client.get(f"/api/v1/purchase/rfq/{rfq_id}/comparison",
                           headers=H(store_session["token"]))
    assert r2.status_code == 200
    d = r2.json()
    assert "matrix" in d and "vendors" in d


# ═══════════════════════════════════════════════════════════════════════
# 4. VENDOR QUOTATIONS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_quotations_via_rfq(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/rfq?status=PARTIALLY_RECEIVED",
                         headers=H(store_session["token"]))
    items = r.json().get("items", [])
    if not items:
        pytest.skip("No suitable RFQ")
    rfq_id = items[0]["id"]
    r2 = await client.get(f"/api/v1/purchase/rfq/{rfq_id}/quotations",
                           headers=H(store_session["token"]))
    assert r2.status_code == 200
    assert "items" in r2.json()


# ═══════════════════════════════════════════════════════════════════════
# 5. PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════════════════

async def test_po_stats(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders/stats",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "total" in d and "total_spend" in d


async def test_list_orders(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders", headers=H(store_session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "total" in d


async def test_create_po_without_vendor_id(client, store_session):
    """PO with no vendor_id (free text) should succeed for DRAFT."""
    skip_if_no_token(store_session)
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(store_session["token"]),
                          json={
                              "vendor_name": "Ad-hoc Supplier",
                              "items": [{
                                  "product_name": "Test Component",
                                  "quantity": 10, "unit_price": 100,
                                  "gst_rate": 18,
                              }],
                          })
    assert r.status_code == 201
    d = r.json()
    assert d["status"] == "DRAFT"
    assert d["po_number"].startswith("PO")
    return d["id"]


async def test_create_po_with_unapproved_vendor_blocked(client, store_session):
    """PO pointing to a PENDING vendor must be rejected."""
    skip_if_no_token(store_session)
    # VEN-TEST-004 is PENDING in seed_masters
    from httpx import AsyncClient
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text as sql_text
    import os
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        pytest.skip("DATABASE_URL not set")

    engine  = create_async_engine(db_url, echo=False)
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as sess:
        row = (await sess.execute(sql_text(
            "SELECT v.id FROM vendors v "
            "JOIN tenants t ON t.id=v.tenant_id "
            "WHERE v.status='PENDING' AND t.slug='oregenal' LIMIT 1"
        ))).fetchone()
    await engine.dispose()
    if not row:
        pytest.skip("No PENDING vendor in seed data")
    pending_vendor_id = str(row[0])

    r = await client.post("/api/v1/purchase/orders",
                          headers=H(store_session["token"]),
                          json={
                              "vendor_id":   pending_vendor_id,
                              "vendor_name": "Pending Vendor",
                              "items": [{"product_name": "X", "quantity": 1, "unit_price": 10}],
                          })
    assert r.status_code == 400
    assert "APPROVED" in r.text or "not APPROVED" in r.text.lower() or "approved" in r.text.lower()


async def test_po_submit_approve_flow(client):
    """Full PO workflow: create → submit → approve."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    # 1. Create
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={
                              "vendor_name": "pytest Vendor",
                              "items": [{"product_name": "PO Flow Item",
                                         "quantity": 5, "unit_price": 200, "gst_rate": 18}],
                          })
    assert r.status_code == 201
    po = r.json()
    po_id = po["id"]
    assert po["status"] == "DRAFT"
    assert abs(po["total_amount"] - 5 * 200 * 1.18) < 1.0

    # 2. Submit
    r = await client.post(f"/api/v1/purchase/orders/{po_id}/submit",
                          headers=H(s["token"]))
    assert r.status_code == 200
    assert r.json()["status"] == "SUBMITTED"

    # 3. Non-approver cannot approve
    r = await client.post(f"/api/v1/purchase/orders/{po_id}/approve",
                          headers=H(s["token"]))
    assert r.status_code in (400, 403)

    # 4. Admin approves
    r = await client.post(f"/api/v1/purchase/orders/{po_id}/approve",
                          headers=H(a["token"]))
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    assert r.json()["is_locked"] == False

    return po_id


async def test_approved_po_not_editable(client):
    """Approved PO must reject PUT edits."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    # Create + submit + approve a PO
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "No Edit Vendor",
                                "items": [{"product_name": "X", "quantity": 1, "unit_price": 100}]})
    po_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/orders/{po_id}/submit", headers=H(s["token"]))
    await client.post(f"/api/v1/purchase/orders/{po_id}/approve", headers=H(a["token"]))

    # Now try to edit
    r = await client.put(f"/api/v1/purchase/orders/{po_id}",
                         headers=H(s["token"]),
                         json={"notes": "should fail"})
    assert r.status_code == 400


async def test_po_message_thread(client):
    """Add message to PO and retrieve it."""
    s = await sm(client)
    skip_if_no_token(s)

    # Get any PO
    r = await client.get("/api/v1/purchase/orders?page_size=1", headers=H(s["token"]))
    items = r.json().get("items", [])
    if not items:
        pytest.skip("No POs found")
    po_id = items[0]["id"]

    # Add message
    r = await client.post(f"/api/v1/purchase/orders/{po_id}/messages",
                          headers=H(s["token"]),
                          json={"message_type": "internal_note",
                                "body": "Test message from pytest",
                                "is_private": False})
    assert r.status_code == 201
    assert r.json()["body"] == "Test message from pytest"

    # Retrieve
    r = await client.get(f"/api/v1/purchase/orders/{po_id}/messages",
                         headers=H(s["token"]))
    assert r.status_code == 200
    assert r.json()["total"] >= 1


async def test_delete_draft_po(client):
    s = await sm(client)
    skip_if_no_token(s)
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "Delete me",
                                "items": [{"product_name": "X", "quantity": 1, "unit_price": 10}]})
    po_id = r.json()["id"]
    r = await client.delete(f"/api/v1/purchase/orders/{po_id}", headers=H(s["token"]))
    assert r.status_code == 200
    assert r.json()["success"] == True

    # Verify gone
    r = await client.get(f"/api/v1/purchase/orders/{po_id}", headers=H(s["token"]))
    assert r.status_code == 404


async def test_cannot_delete_approved_po(client):
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "No del",
                                "items": [{"product_name": "X", "quantity": 1, "unit_price": 10}]})
    po_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/orders/{po_id}/submit", headers=H(s["token"]))
    await client.post(f"/api/v1/purchase/orders/{po_id}/approve", headers=H(a["token"]))
    r = await client.delete(f"/api/v1/purchase/orders/{po_id}", headers=H(a["token"]))
    assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# 6. GRN
# ═══════════════════════════════════════════════════════════════════════

async def test_list_grn(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/grn", headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_pending_grn(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/grn/pending", headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_grn_requires_approved_po(client):
    """Cannot create GRN for a DRAFT PO."""
    s = await sm(client)
    skip_if_no_token(s)

    # Create a DRAFT PO
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "GRN block vendor",
                                "items": [{"product_name": "Y", "quantity": 10, "unit_price": 50}]})
    po_id = r.json()["id"]

    # Attempt GRN immediately (PO is DRAFT)
    r = await client.post("/api/v1/purchase/grn",
                          headers=H(s["token"]),
                          json={
                              "po_id": po_id,
                              "items": [],   # even empty — blocked by PO status
                          })
    # GRN on DRAFT PO must fail
    assert r.status_code in (400, 422)


async def test_grn_over_receipt_blocked(client):
    """Receiving more than ordered quantity must fail."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    # Create + approve PO with 10 units
    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "Over vendor",
                                "items": [{"product_name": "Z", "quantity": 10, "unit_price": 100}]})
    po_id = r.json()["id"]
    po_item_id = (await client.get(f"/api/v1/purchase/orders/{po_id}",
                                    headers=H(s["token"]))).json()["items"][0]["id"]
    await client.post(f"/api/v1/purchase/orders/{po_id}/submit", headers=H(s["token"]))
    await client.post(f"/api/v1/purchase/orders/{po_id}/approve", headers=H(a["token"]))

    # Try to receive 999 units (ordered = 10)
    r = await client.post("/api/v1/purchase/grn",
                          headers=H(s["token"]),
                          json={
                              "po_id": po_id,
                              "items": [{"po_item_id": po_item_id, "received_qty": 999}],
                          })
    assert r.status_code == 400
    assert "over-receipt" in r.text.lower() or "blocked" in r.text.lower()


async def test_cannot_cancel_posted_grn(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/grn?status=POSTED&page_size=1",
                         headers=H(store_session["token"]))
    items = r.json().get("items", [])
    if not items:
        pytest.skip("No POSTED GRN found — run seed_purchase.py first")
    grn_id = items[0]["id"]
    r = await client.post(f"/api/v1/purchase/grn/{grn_id}/cancel",
                          headers=H(store_session["token"]))
    assert r.status_code == 400
    assert "POSTED" in r.text or "cancel" in r.text.lower()


# ═══════════════════════════════════════════════════════════════════════
# 7. PURCHASE RETURNS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_returns(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/returns", headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_return_only_on_received_po(client, store_session):
    """Cannot create a return against a DRAFT PO."""
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders?status=DRAFT&page_size=1",
                         headers=H(store_session["token"]))
    items = r.json().get("items", [])
    if not items:
        pytest.skip("No DRAFT PO")
    po_id = items[0]["id"]
    r = await client.post("/api/v1/purchase/returns",
                          headers=H(store_session["token"]),
                          json={"po_id": po_id, "return_reason": "Test",
                                "items": [{"product_name": "X", "unit": "Pcs",
                                           "return_qty": 1, "unit_cost": 10}]})
    assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# 8. REPORTS
# ═══════════════════════════════════════════════════════════════════════

async def test_po_register(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/reports/po-register",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "summary" in d


async def test_vendor_spend_report(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/reports/vendor-spend",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_grn_register(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/reports/grn-register",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_po_register_date_filter(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/reports/po-register"
                         "?date_from=2025-01-01&date_to=2030-12-31",
                         headers=H(store_session["token"]))
    assert r.status_code == 200


async def test_po_register_invalid_date(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/reports/po-register?date_from=not-a-date",
                         headers=H(store_session["token"]))
    assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# 9. PAGINATION & FILTERS
# ═══════════════════════════════════════════════════════════════════════

async def test_pagination_params(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders?page=1&page_size=2",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["page_size"] == 2
    assert len(d["items"]) <= 2


async def test_status_filter(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders?status=DRAFT",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    for item in r.json()["items"]:
        assert item["status"] == "DRAFT"


async def test_search_filter(client, store_session):
    skip_if_no_token(store_session)
    r = await client.get("/api/v1/purchase/orders?search=PO-TEST",
                         headers=H(store_session["token"]))
    assert r.status_code == 200
    # Seeded POs should appear
    d = r.json()
    assert isinstance(d["items"], list)


# ═══════════════════════════════════════════════════════════════════════
# 10. AMENDMENT WORKFLOW
# ═══════════════════════════════════════════════════════════════════════

async def test_amendment_allowed_fields_only(client):
    """Amending a non-allowed field must fail."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "Amend vendor",
                                "items": [{"product_name": "X", "quantity": 1, "unit_price": 100}]})
    po_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/orders/{po_id}/submit", headers=H(s["token"]))
    await client.post(f"/api/v1/purchase/orders/{po_id}/approve", headers=H(a["token"]))

    # Try to amend unit_price — not allowed
    r = await client.post(f"/api/v1/purchase/orders/{po_id}/amend",
                          headers=H(a["token"]),
                          json={"reason": "Price change", "changes": {"unit_price": 200}})
    assert r.status_code == 400
    assert "unit_price" in r.text or "cannot be amended" in r.text.lower()


async def test_amendment_allowed_delivery_date(client):
    """Amending delivery_date on approved PO must succeed."""
    s = await sm(client)
    a = await adm(client)
    skip_if_no_token(s)
    skip_if_no_token(a)

    r = await client.post("/api/v1/purchase/orders",
                          headers=H(s["token"]),
                          json={"vendor_name": "Date amend vendor",
                                "items": [{"product_name": "Y", "quantity": 2, "unit_price": 50}]})
    po_id = r.json()["id"]
    await client.post(f"/api/v1/purchase/orders/{po_id}/submit", headers=H(s["token"]))
    await client.post(f"/api/v1/purchase/orders/{po_id}/approve", headers=H(a["token"]))

    r = await client.post(f"/api/v1/purchase/orders/{po_id}/amend",
                          headers=H(a["token"]),
                          json={"reason": "Delivery pushed by vendor",
                                "changes": {"delivery_date": "2026-01-31"}})
    assert r.status_code == 200
    d = r.json()
    assert d["amendment_count"] == 1
    assert d["amendment"]["version"] == 1
