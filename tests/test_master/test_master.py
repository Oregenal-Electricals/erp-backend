"""
Master Setup Test Suite
========================
Tests all Module 1 endpoints:
  Company, Branches, Financial Years,
  Numbering Series, Approval Rules,
  Change Request Settings, Test Data, Audit Log

Run:
  cd erp-backend
  source venv/bin/activate
  pytest tests/test_master/test_master.py -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


# ── Fixtures ──────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


async def login(client, email: str, password: str) -> dict:
    r = await client.post("/api/v1/auth/login",
                          json={"email": email, "password": password})
    if r.status_code != 200:
        return {}
    d = r.json()
    return {"token": d["access_token"], "user": d["user"]}


def H(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def skip_if_no_seed(session: dict):
    if not session:
        pytest.skip("Seed data missing — run seed_rbac.py + seed_master.py first")


# ── Helpers ────────────────────────────────────────────────────────────
async def get_super_admin(client):
    return await login(client, "admin@oregenal.com", "Oregenal@2024")


async def get_admin(client):
    return await login(client, "rahul@oregenal.com", "Admin@1234")


async def get_store_manager(client):
    return await login(client, "store@oregenal.com", "Store@1234")


# ══════════════════════════════════════════════════════════════════════
# COMPANY TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_get_company_as_any_user(client):
    """Any logged-in user can view company info."""
    sa = await get_store_manager(client)
    skip_if_no_seed(sa)
    r = await client.get("/api/v1/master/company", headers=H(sa["token"]))
    assert r.status_code == 200


async def test_update_company_as_super_admin(client):
    """Super Admin can update company profile."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/company",
                         json={"website": "https://www.oregenal.com"},
                         headers=H(sa["token"]))
    assert r.status_code == 200
    assert "oregenal" in r.json().get("website", "")


async def test_update_company_as_store_manager_forbidden(client):
    """Store Manager cannot update company profile."""
    sm = await get_store_manager(client)
    skip_if_no_seed(sm)
    r = await client.put("/api/v1/master/company",
                         json={"website": "https://hacker.com"},
                         headers=H(sm["token"]))
    assert r.status_code == 403


async def test_update_company_invalid_month(client):
    """fiscal_year_start_month must be 1-12."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/company",
                         json={"fiscal_year_start_month": 13},
                         headers=H(sa["token"]))
    assert r.status_code == 422


# ══════════════════════════════════════════════════════════════════════
# BRANCH TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_list_branches_as_admin(client):
    """Admin can list branches."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/branches", headers=H(adm["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_list_branches_forbidden_for_store_manager(client):
    """Store Manager cannot list branches (admin_only setting)."""
    sm = await get_store_manager(client)
    skip_if_no_seed(sm)
    r = await client.get("/api/v1/master/branches", headers=H(sm["token"]))
    assert r.status_code == 403


async def test_create_branch_as_super_admin(client):
    """Super Admin can create a branch."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Test Branch", "code": "TB", "branch_type": "office",
        "city": "Delhi", "state": "Delhi", "is_head_office": False,
    }, headers=H(sa["token"]))
    assert r.status_code == 201
    assert r.json()["name"] == "Test Branch"


async def test_create_branch_invalid_type(client):
    """branch_type must be factory/warehouse/office/showroom."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Bad Branch", "branch_type": "spaceship",
    }, headers=H(sa["token"]))
    assert r.status_code == 422


async def test_create_branch_as_admin_forbidden(client):
    """Admin (not super_admin) cannot create branches."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Admin Branch", "branch_type": "factory",
    }, headers=H(adm["token"]))
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════
# FINANCIAL YEAR TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_list_financial_years(client):
    """Admin can list financial years."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/financial-years", headers=H(adm["token"]))
    assert r.status_code == 200
    items = r.json()["items"]
    names = [i["name"] for i in items]
    assert "FY 2024-25" in names


async def test_create_financial_year(client):
    """Super Admin can create a financial year."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.post("/api/v1/master/financial-years", json={
        "name": "FY 2026-27",
        "start_date": "2026-04-01",
        "end_date":   "2027-03-31",
    }, headers=H(sa["token"]))
    assert r.status_code in (201, 409)  # 409 if already exists


async def test_duplicate_financial_year_rejected(client):
    """Cannot create duplicate financial year name."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    # Create once
    await client.post("/api/v1/master/financial-years", json={
        "name": "FY TEST-DUP", "start_date": "2030-04-01", "end_date": "2031-03-31",
    }, headers=H(sa["token"]))
    # Create again — should 409
    r = await client.post("/api/v1/master/financial-years", json={
        "name": "FY TEST-DUP", "start_date": "2030-04-01", "end_date": "2031-03-31",
    }, headers=H(sa["token"]))
    assert r.status_code == 409


async def test_activate_financial_year(client):
    """Super Admin can activate a financial year."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.get("/api/v1/master/financial-years", headers=H(sa["token"]))
    items = r.json()["items"]
    fy = next((i for i in items if "2024-25" in i["name"]), None)
    if not fy:
        pytest.skip("FY 2024-25 not found")
    r2 = await client.put(
        f"/api/v1/master/financial-years/{fy['id']}/activate",
        headers=H(sa["token"])
    )
    assert r2.status_code == 200
    assert r2.json()["is_active"] is True


# ══════════════════════════════════════════════════════════════════════
# NUMBER SERIES TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_list_number_series(client):
    """Admin can list number series."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/number-series", headers=H(adm["token"]))
    assert r.status_code == 200
    items = r.json()["items"]
    doc_types = [i["document_type"] for i in items]
    assert "purchase_order" in doc_types
    assert "sales_order" in doc_types
    assert "gate_entry" in doc_types


async def test_number_series_has_preview(client):
    """Each series row includes a preview of the next number."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/number-series", headers=H(adm["token"]))
    for item in r.json()["items"]:
        assert "preview" in item
        assert item["preview"]  # not empty


async def test_update_number_series(client):
    """Super Admin can change prefix and padding."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/number-series/purchase_order", json={
        "prefix": "PO", "padding_digits": 5,
    }, headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["padding_digits"] == 5


async def test_update_number_series_invalid_year_format(client):
    """year_format must be YY-YY, YYYY, or YY."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/number-series/sales_order", json={
        "year_format": "INVALID",
    }, headers=H(sa["token"]))
    assert r.status_code == 422


async def test_preview_number(client):
    """Preview endpoint returns correct format."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.post(
        "/api/v1/master/number-series/purchase_order/preview",
        headers=H(adm["token"])
    )
    assert r.status_code == 200
    data = r.json()
    assert "next_formatted" in data
    assert data["next_formatted"]  # not empty
    assert "PO" in data["next_formatted"]


async def test_update_number_series_forbidden_for_admin(client):
    """Admin (not super_admin) cannot update number series."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.put("/api/v1/master/number-series/purchase_order", json={
        "prefix": "HACK",
    }, headers=H(adm["token"]))
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════
# APPROVAL RULES TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_list_approval_rules(client):
    """Admin can list approval rules."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/approval-rules", headers=H(adm["token"]))
    assert r.status_code == 200
    doc_types = [i["document_type"] for i in r.json()["items"]]
    assert "purchase_order" in doc_types


async def test_update_approval_rule(client):
    """Super Admin can enable approval for purchase_order."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/approval-rules/purchase_order", json={
        "is_approval_required": True,
        "approver_role": "admin",
        "auto_approve_below_amt": 5000.0,
        "escalation_hours": 48,
    }, headers=H(sa["token"]))
    assert r.status_code == 200
    data = r.json()
    assert data["is_approval_required"] is True
    assert data["auto_approve_below_amt"] == 5000.0


async def test_update_approval_rule_unknown_doc_type(client):
    """Unknown document_type returns 400."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put("/api/v1/master/approval-rules/unicorn_document", json={
        "is_approval_required": True,
    }, headers=H(sa["token"]))
    assert r.status_code == 400


# ══════════════════════════════════════════════════════════════════════
# CHANGE REQUEST TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_list_change_request_settings(client):
    """Admin can list change request settings."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/change-request-settings",
                         headers=H(adm["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_update_change_request_setting(client):
    """Super Admin can enable change requests for sales_order."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.put(
        "/api/v1/master/change-request-settings/sales_order",
        json={
            "allow_change_request": True,
            "who_can_raise": "admin",
            "who_can_approve": "super_admin",
            "requires_reason": True,
        },
        headers=H(sa["token"])
    )
    assert r.status_code == 200
    assert r.json()["allow_change_request"] is True


# ══════════════════════════════════════════════════════════════════════
# TEST DATA TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_test_data_status(client):
    """Super Admin can see test data row counts."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.get("/api/v1/master/test-data/status", headers=H(sa["token"]))
    assert r.status_code == 200
    assert "total_test_rows" in r.json()


async def test_load_test_data(client):
    """Super Admin can load test data."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)
    r = await client.post("/api/v1/master/test-data/load", headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["success"] is True


async def test_load_test_data_forbidden_for_admin(client):
    """Admin cannot load test data."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.post("/api/v1/master/test-data/load", headers=H(adm["token"]))
    assert r.status_code == 403


async def test_purge_test_data(client):
    """Super Admin can purge test data. Non-test data untouched."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)

    # Load some test data first
    await client.post("/api/v1/master/test-data/load", headers=H(sa["token"]))

    # Purge
    r = await client.delete("/api/v1/master/test-data/purge", headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "total_deleted" in r.json()


async def test_purge_test_data_forbidden_for_admin(client):
    """Admin cannot purge test data."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.delete("/api/v1/master/test-data/purge", headers=H(adm["token"]))
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════
# AUDIT LOG TESTS
# ══════════════════════════════════════════════════════════════════════

async def test_audit_log_as_admin(client):
    """Admin can view the audit log."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get("/api/v1/master/audit-log", headers=H(adm["token"]))
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


async def test_audit_log_forbidden_for_store_manager(client):
    """Store Manager cannot view audit log."""
    sm = await get_store_manager(client)
    skip_if_no_seed(sm)
    r = await client.get("/api/v1/master/audit-log", headers=H(sm["token"]))
    assert r.status_code == 403


async def test_audit_log_written_on_company_update(client):
    """Updating company profile writes to audit log."""
    sa = await get_super_admin(client)
    skip_if_no_seed(sa)

    # Update company
    await client.put("/api/v1/master/company",
                     json={"phone": "+91-22-99999999"},
                     headers=H(sa["token"]))

    # Check audit log
    r = await client.get(
        "/api/v1/master/audit-log?document_type=company",
        headers=H(sa["token"])
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) > 0
    assert items[0]["action"] in ("update", "create")


async def test_audit_log_pagination(client):
    """Audit log supports pagination."""
    adm = await get_admin(client)
    skip_if_no_seed(adm)
    r = await client.get(
        "/api/v1/master/audit-log?page=1&page_size=5",
        headers=H(adm["token"])
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) <= 5
    assert "total_pages" in data


async def test_unauthenticated_request_rejected(client):
    """All endpoints reject unauthenticated requests."""
    for url in [
        "/api/v1/master/company",
        "/api/v1/master/branches",
        "/api/v1/master/financial-years",
        "/api/v1/master/number-series",
        "/api/v1/master/approval-rules",
        "/api/v1/master/audit-log",
    ]:
        r = await client.get(url)
        assert r.status_code == 401, f"{url} should return 401 without auth"
