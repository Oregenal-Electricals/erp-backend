"""
Gate Guard / Security Module — Test Suite
==========================================
Tests all gate endpoints and permission rules.

Run:
  cd erp-backend
  source venv/bin/activate
  pytest tests/test_gate/test_gate.py -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


async def login(client, email, password):
    r = await client.post("/api/v1/auth/login",
                          json={"email": email, "password": password})
    if r.status_code != 200:
        return {}
    d = r.json()
    return {"token": d["access_token"], "user": d["user"]}


def H(token):
    return {"Authorization": f"Bearer {token}"}


def skip_if_no_seed(session):
    if not session:
        pytest.skip("Seed data missing — run seed_rbac.py first")


async def sa(client):
    return await login(client, "admin@oregenal.com",   "Oregenal@2024")

async def adm(client):
    return await login(client, "rahul@oregenal.com",   "Admin@1234")

async def sm(client):
    return await login(client, "store@oregenal.com",   "Store@1234")

async def gg(client):
    return await login(client, "gate@oregenal.com",    "Gate@1234")

async def iqc(client):
    return await login(client, "qc@oregenal.com",      "Qc@12345678")


# ═══════════════════════════════════════════════════════════════════════
# VISITOR TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_gate_guard_can_create_visitor(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/visitors", json={
        "visitor_name": "Test Visitor",
        "visitor_phone": "+91-9999999999",
        "purpose": "Testing",
        "meeting_with_name": "Manager",
    }, headers=H(g["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["entry_number"].startswith("VIS-") or "VIS" in d["entry_number"]
    assert d["status"] == "inside"
    assert d["gate_in"] is not None
    return d["id"]


async def test_gate_guard_can_list_visitors(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/visitors", headers=H(g["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_iqc_can_view_visitors(client):
    i = await iqc(client); skip_if_no_seed(i)
    r = await client.get("/api/v1/gate/visitors", headers=H(i["token"]))
    assert r.status_code == 200


async def test_visitor_exit(client):
    g = await gg(client); skip_if_no_seed(g)
    # Create a visitor first
    r = await client.post("/api/v1/gate/visitors", json={
        "visitor_name": "Exit Test Visitor",
        "purpose": "Exit test",
        "meeting_with_name": "HR",
    }, headers=H(g["token"]))
    assert r.status_code == 201
    vid = r.json()["id"]

    # Record exit
    r2 = await client.patch(f"/api/v1/gate/visitors/{vid}/exit", headers=H(g["token"]))
    assert r2.status_code == 200
    assert r2.json()["status"] == "exited"
    assert r2.json()["gate_out"] is not None


async def test_visitor_double_exit_rejected(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/visitors", json={
        "visitor_name": "Double Exit Test",
        "purpose": "Test",
        "meeting_with_name": "HR",
    }, headers=H(g["token"]))
    vid = r.json()["id"]
    await client.patch(f"/api/v1/gate/visitors/{vid}/exit", headers=H(g["token"]))
    r2 = await client.patch(f"/api/v1/gate/visitors/{vid}/exit", headers=H(g["token"]))
    assert r2.status_code == 400


async def test_visitor_name_required(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/visitors", json={
        "visitor_name": "",
        "purpose": "Test",
    }, headers=H(g["token"]))
    assert r.status_code == 422


async def test_unauthenticated_visitor_rejected(client):
    r = await client.get("/api/v1/gate/visitors")
    assert r.status_code == 401


# ═══════════════════════════════════════════════════════════════════════
# VEHICLE TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_gate_guard_can_create_vehicle(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/vehicles", json={
        "vehicle_number": "MH04TEST001",
        "vehicle_type": "truck",
        "driver_name": "Test Driver",
        "driver_phone": "+91-9988776655",
        "purpose": "delivery",
    }, headers=H(g["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["vehicle_number"] == "MH04TEST001"
    assert d["status"] == "inside"
    assert d["gate_in"] is not None
    return d["id"]


async def test_vehicle_exit(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/vehicles", json={
        "vehicle_number": "MH04EXIT001",
        "vehicle_type": "car",
        "purpose": "visit",
    }, headers=H(g["token"]))
    vid = r.json()["id"]
    r2 = await client.patch(f"/api/v1/gate/vehicles/{vid}/exit", headers=H(g["token"]))
    assert r2.status_code == 200
    assert r2.json()["status"] == "exited"


async def test_vehicle_number_uppercased(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/vehicles", json={
        "vehicle_number": "mh04lower001",
        "purpose": "delivery",
    }, headers=H(g["token"]))
    assert r.status_code == 201
    assert r.json()["vehicle_number"] == "MH04LOWER001"


# ═══════════════════════════════════════════════════════════════════════
# GATE ENTRY (Inward) TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_gate_guard_can_create_gate_entry(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Test Vendor Pvt Ltd",
        "vendor_gstin": "27AAACT1234F1ZQ",
        "vehicle_number": "MH04TEST002",
        "driver_name": "Test Driver",
        "transport_mode": "road",
        "vendor_invoice_no": "TEST/INV/001",
        "vendor_invoice_amount": 50000,
        "po_number": "PO-TEST-001",
        "items": [
            {"item_name": "Test Material A", "qty_received": 100, "unit": "kg"},
            {"item_name": "Test Material B", "qty_received": 50,  "unit": "pcs"},
        ],
    }, headers=H(g["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["status"] == "PENDING"
    assert d["is_locked"] is False
    assert len(d["items"]) == 2
    return d["id"]


async def test_gate_entry_requires_items(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Test Vendor",
        "items": [],
    }, headers=H(g["token"]))
    assert r.status_code == 422


async def test_gate_entry_stats(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/entries/stats", headers=H(g["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "pending" in d and "approved" in d and "rejected" in d


async def test_iqc_can_view_gate_entries(client):
    i = await iqc(client); skip_if_no_seed(i)
    r = await client.get("/api/v1/gate/entries", headers=H(i["token"]))
    assert r.status_code == 200


async def test_iqc_cannot_create_gate_entry(client):
    i = await iqc(client); skip_if_no_seed(i)
    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Hacker Vendor",
        "items": [{"item_name": "Test", "qty_received": 1, "unit": "pcs"}],
    }, headers=H(i["token"]))
    assert r.status_code == 403


async def test_gate_guard_cannot_approve(client):
    g = await gg(client); skip_if_no_seed(g)
    # Create an entry to try to approve
    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Approve Test Vendor",
        "items": [{"item_name": "Item", "qty_received": 10, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]
    r2 = await client.post(f"/api/v1/gate/entries/{eid}/approve",
                           headers=H(g["token"]))
    assert r2.status_code == 403


async def test_store_manager_can_approve(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    # Gate guard creates
    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Approval Test Vendor",
        "vendor_invoice_no": "APR/TEST/001",
        "items": [{"item_name": "LED Driver", "qty_received": 100, "unit": "pcs"}],
    }, headers=H(g["token"]))
    assert r.status_code == 201
    eid = r.json()["id"]

    # Store manager approves
    r2 = await client.post(f"/api/v1/gate/entries/{eid}/approve",
                           headers=H(s["token"]))
    assert r2.status_code == 200
    d = r2.json()
    assert d["status"] == "APPROVED"
    assert d["approved_by_id"] is not None
    assert d["approved_at"] is not None
    assert d["is_locked"] is True


async def test_approve_locked_entry_rejected(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Lock Test Vendor",
        "items": [{"item_name": "Item", "qty_received": 1, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]
    await client.post(f"/api/v1/gate/entries/{eid}/approve", headers=H(s["token"]))

    # Try to approve again
    r2 = await client.post(f"/api/v1/gate/entries/{eid}/approve",
                           headers=H(s["token"]))
    assert r2.status_code == 400


async def test_store_manager_can_reject_with_reason(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Reject Test Vendor",
        "items": [{"item_name": "Wrong Item", "qty_received": 1, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]

    r2 = await client.post(f"/api/v1/gate/entries/{eid}/reject",
                           json={"reason": "Wrong material delivered"},
                           headers=H(s["token"]))
    assert r2.status_code == 200
    d = r2.json()
    assert d["status"] == "REJECTED"
    assert d["rejection_reason"] == "Wrong material delivered"


async def test_reject_without_reason_fails(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "No Reason Vendor",
        "items": [{"item_name": "Item", "qty_received": 1, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]

    r2 = await client.post(f"/api/v1/gate/entries/{eid}/reject",
                           json={"reason": ""},
                           headers=H(s["token"]))
    assert r2.status_code == 422


async def test_store_manager_can_hold(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Hold Test Vendor",
        "items": [{"item_name": "Suspicious Item", "qty_received": 1, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]

    r2 = await client.post(f"/api/v1/gate/entries/{eid}/hold",
                           json={"reason": "PO mismatch — checking with purchase"},
                           headers=H(s["token"]))
    assert r2.status_code == 200
    assert r2.json()["status"] == "HOLD"


async def test_edit_pending_entry_allowed(client):
    g = await gg(client); skip_if_no_seed(g)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Edit Test Vendor",
        "items": [{"item_name": "Item", "qty_received": 10, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]

    r2 = await client.put(f"/api/v1/gate/entries/{eid}",
                          json={"remarks": "Updated by gate guard"},
                          headers=H(g["token"]))
    assert r2.status_code == 200


async def test_edit_approved_entry_locked(client):
    g = await gg(client); skip_if_no_seed(g)
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/entries", json={
        "vendor_name": "Lock Edit Vendor",
        "items": [{"item_name": "Item", "qty_received": 5, "unit": "pcs"}],
    }, headers=H(g["token"]))
    eid = r.json()["id"]
    await client.post(f"/api/v1/gate/entries/{eid}/approve", headers=H(s["token"]))

    r3 = await client.put(f"/api/v1/gate/entries/{eid}",
                          json={"remarks": "Trying to edit locked entry"},
                          headers=H(g["token"]))
    assert r3.status_code == 400
    assert "locked" in r3.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════════════
# GATE PASS (Outward) TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_gate_guard_cannot_create_pass(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "non_returnable",
        "party_name": "Test Party",
        "items": [{"item_name": "Scrap", "qty": 100, "unit": "kg"}],
    }, headers=H(g["token"]))
    assert r.status_code == 403


async def test_store_manager_can_create_returnable_pass(client):
    s = await sm(client); skip_if_no_seed(s)
    from datetime import date, timedelta
    exp = (date.today() + timedelta(days=7)).isoformat()
    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "returnable",
        "party_name": "Test Tool Workshop",
        "vehicle_number": "MH04TOOL001",
        "driver_name": "Tool Driver",
        "purpose": "Tools sent for sharpening",
        "reference_type": "job_work",
        "reference_number": "JW-TEST-001",
        "expected_return_date": exp,
        "items": [
            {"item_name": "Cutting Tool 100mm", "qty": 5, "unit": "pcs"},
            {"item_name": "Drill Bit Set",       "qty": 2, "unit": "set"},
        ],
    }, headers=H(s["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["pass_type"] == "returnable"
    assert d["status"] == "OPEN"
    assert d["pass_number"].startswith("RGP")
    assert len(d["items"]) == 2
    return d["id"]


async def test_store_manager_can_create_non_returnable_pass(client):
    s = await sm(client); skip_if_no_seed(s)
    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "non_returnable",
        "party_name": "Scrap Dealer",
        "purpose": "Scrap disposal",
        "reference_type": "scrap",
        "reference_number": "SCR-TEST-001",
        "items": [{"item_name": "MS Scrap", "qty": 200, "unit": "kg"}],
    }, headers=H(s["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["pass_type"] == "non_returnable"
    assert d["pass_number"].startswith("NRGP")


async def test_invalid_pass_type_rejected(client):
    s = await sm(client); skip_if_no_seed(s)
    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "invalid_type",
        "party_name": "Test",
        "items": [{"item_name": "X", "qty": 1, "unit": "pcs"}],
    }, headers=H(s["token"]))
    assert r.status_code == 422


async def test_gate_guard_can_record_pass_exit(client):
    s = await sm(client); skip_if_no_seed(s)
    g = await gg(client); skip_if_no_seed(g)

    # Store manager creates pass
    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "non_returnable",
        "party_name": "Exit Test Party",
        "purpose": "Test exit",
        "items": [{"item_name": "Test Item", "qty": 1, "unit": "pcs"}],
    }, headers=H(s["token"]))
    pid = r.json()["id"]

    # Gate guard records exit
    r2 = await client.post(f"/api/v1/gate/passes/{pid}/exit",
                           headers=H(g["token"]))
    assert r2.status_code == 200
    assert r2.json()["gate_out"] is not None


async def test_gate_pass_return(client):
    s = await sm(client); skip_if_no_seed(s)
    g = await gg(client); skip_if_no_seed(g)

    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "returnable",
        "party_name": "Return Test Party",
        "purpose": "Return test",
        "items": [{"item_name": "Tool A", "qty": 3, "unit": "pcs"}],
    }, headers=H(s["token"]))
    pid = r.json()["id"]
    await client.post(f"/api/v1/gate/passes/{pid}/exit", headers=H(g["token"]))

    # Partial return
    r2 = await client.post(f"/api/v1/gate/passes/{pid}/return",
                           json={
                               "items": [{"item_name": "Tool A", "qty": 3, "unit": "pcs", "qty_returned": 2}]
                           },
                           headers=H(g["token"]))
    assert r2.status_code == 200
    assert r2.json()["status"] == "PARTIAL"


async def test_close_gate_pass(client):
    s = await sm(client); skip_if_no_seed(s)

    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "non_returnable",
        "party_name": "Close Test Party",
        "purpose": "Close test",
        "items": [{"item_name": "Waste", "qty": 10, "unit": "kg"}],
    }, headers=H(s["token"]))
    pid = r.json()["id"]

    r2 = await client.post(f"/api/v1/gate/passes/{pid}/close",
                           json={"reason": "Material collected"},
                           headers=H(s["token"]))
    assert r2.status_code == 200
    assert r2.json()["status"] == "CLOSED"


async def test_return_on_non_returnable_fails(client):
    s = await sm(client); skip_if_no_seed(s)
    g = await gg(client); skip_if_no_seed(g)

    r = await client.post("/api/v1/gate/passes", json={
        "pass_type": "non_returnable",
        "party_name": "No Return Party",
        "items": [{"item_name": "Item", "qty": 1, "unit": "pcs"}],
    }, headers=H(s["token"]))
    pid = r.json()["id"]

    r2 = await client.post(f"/api/v1/gate/passes/{pid}/return",
                           json={"items": [{"item_name": "Item", "qty": 1, "unit": "pcs", "qty_returned": 1}]},
                           headers=H(g["token"]))
    assert r2.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# REPORTS TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_gate_guard_cannot_view_reports_stats(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/reports/stats", headers=H(g["token"]))
    assert r.status_code == 403


async def test_store_manager_can_view_stats(client):
    s = await sm(client); skip_if_no_seed(s)
    r = await client.get("/api/v1/gate/reports/stats", headers=H(s["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "visitors" in d
    assert "gate_entries" in d
    assert "gate_passes" in d


async def test_visitors_inside_report(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/reports/visitors-inside", headers=H(g["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_vehicles_inside_report(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/reports/vehicles-inside", headers=H(g["token"]))
    assert r.status_code == 200


async def test_pending_returns_report(client):
    s = await sm(client); skip_if_no_seed(s)
    r = await client.get("/api/v1/gate/reports/pending-returns", headers=H(s["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d
    for item in d["items"]:
        assert "is_overdue" in item


async def test_daily_register(client):
    s = await sm(client); skip_if_no_seed(s)
    from datetime import date
    today = date.today().isoformat()
    r = await client.get(f"/api/v1/gate/reports/daily-register?date={today}",
                         headers=H(s["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "visitors" in d
    assert "vehicles" in d
    assert "inward" in d
    assert "outward" in d


async def test_daily_register_invalid_date(client):
    s = await sm(client); skip_if_no_seed(s)
    r = await client.get("/api/v1/gate/reports/daily-register?date=not-a-date",
                         headers=H(s["token"]))
    assert r.status_code == 400


async def test_gate_guard_cannot_view_daily_register(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/reports/daily-register", headers=H(g["token"]))
    assert r.status_code == 403


async def test_gate_guard_cannot_view_pending_returns(client):
    g = await gg(client); skip_if_no_seed(g)
    r = await client.get("/api/v1/gate/reports/pending-returns", headers=H(g["token"]))
    assert r.status_code == 403


async def test_unauthenticated_all_endpoints_rejected(client):
    endpoints = [
        "/api/v1/gate/visitors",
        "/api/v1/gate/vehicles",
        "/api/v1/gate/entries",
        "/api/v1/gate/passes",
        "/api/v1/gate/reports/stats",
    ]
    for url in endpoints:
        r = await client.get(url)
        assert r.status_code == 401, f"{url} should return 401"


async def get_super_admin(client):
    return await login(client, "admin@oregenal.com", "Oregenal@2024")


async def get_admin(client):
    return await login(client, "rahul@oregenal.com", "Admin@1234")


async def test_purge_removes_gate_test_data(client):
    """Purge endpoint must remove gate test data (is_test_data=True rows)."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)

    # Load test data first
    load_r = await client.post("/api/v1/master/test-data/load",
                               headers=H(sa["token"]))
    if load_r.status_code not in (200, 409):
        pytest.skip("Could not load test data")

    # Get count before purge
    status_r = await client.get("/api/v1/master/test-data/status",
                                headers=H(sa["token"]))
    assert status_r.status_code == 200
    before = status_r.json()["tables"]

    # Purge
    purge_r = await client.delete("/api/v1/master/test-data/purge",
                                  headers=H(sa["token"]))
    assert purge_r.status_code == 200
    result = purge_r.json()
    assert result["success"] is True

    # Verify gate tables were purged
    deleted = result["deleted"]
    gate_tables = ["visitor_entries", "vehicle_logs",
                   "gate_entries", "gate_passes"]
    for table in gate_tables:
        assert table in deleted, f"{table} should be in purge result"


async def test_soft_delete_gate_entry_as_admin(client):
    """Admin can soft-delete a PENDING gate entry."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)

    # Create an entry to delete
    sm = await get_store_manager(client)
    skip_if_no_seed(sm)

    create_r = await client.post("/api/v1/gate/entries",
        json={
            "vendor_name": "Delete Test Vendor",
            "items": [{"item_name": "Test Item", "qty_received": 1, "unit": "pcs"}]
        },
        headers=H(sm["token"]))
    assert create_r.status_code == 201
    entry_id = create_r.json()["id"]

    # Admin deletes it
    del_r = await client.delete(f"/api/v1/gate/entries/{entry_id}",
                                headers=H(adm["token"]))
    assert del_r.status_code == 200
    assert del_r.json()["success"] is True

    # Should no longer appear in list
    list_r = await client.get("/api/v1/gate/entries", headers=H(adm["token"]))
    ids = [e["id"] for e in list_r.json()["items"]]
    assert entry_id not in ids, "Deleted entry should not appear in list"


async def test_gate_guard_cannot_delete_entry(client):
    """Gate Guard cannot delete gate entries."""
    gg_sess = await gg(client)
    sm_sess  = await get_store_manager(client)
    skip_if_no_seed(gg_sess)

    # Create entry
    create_r = await client.post("/api/v1/gate/entries",
        json={
            "vendor_name": "Guard Delete Test",
            "items": [{"item_name": "Item", "qty_received": 1, "unit": "pcs"}]
        },
        headers=H(gg_sess["token"]))
    assert create_r.status_code == 201
    entry_id = create_r.json()["id"]

    # Gate Guard tries to delete — must fail
    del_r = await client.delete(f"/api/v1/gate/entries/{entry_id}",
                                headers=H(gg_sess["token"]))
    assert del_r.status_code == 403
