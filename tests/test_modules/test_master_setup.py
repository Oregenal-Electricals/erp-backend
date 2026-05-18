"""
tests/test_module1/test_master_setup.py
=========================================
Module 1 — Complete Test Suite

Covers:
  Auth:              login, refresh, me, change-password, logout
  Users:             CRUD, status toggle, role change, permission override, RBAC guards
  Roles:             CRUD, permission update, system role protection, level guards
  RBAC:              my-permissions, audit-log
  Departments:       CRUD
  Master - Company:  GET, PUT, validation, RBAC
  Master - Branches: CRUD, RBAC
  Master - FY:       CRUD, activate, close, uniqueness
  Master - NumSeries: list, update, preview
  Master - Approvals: list, update
  Master - ChangeReq: list, update
  Master - TestData:  status, load, purge, RBAC
  Master - AuditLog:  pagination, filters, RBAC

Run:
  cd erp-backend
  source venv/bin/activate
  pytest tests/test_module1/test_master_setup.py -v --tb=short

Prerequisites:
  python scripts/seed_rbac.py
  python scripts/seed_master.py
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


# ═══════════════════════════════════════════════════════════════════════
# FIXTURES & HELPERS
# ═══════════════════════════════════════════════════════════════════════

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
    return {"token": d["access_token"], "refresh": d.get("refresh_token"), "user": d["user"]}


def H(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def skip_no_seed(s: dict, name: str = "seed") -> None:
    if not s:
        pytest.skip(f"{name} not available — run seed scripts first")


async def super_admin(client) -> dict:
    return await login(client, "admin@oregenal.com", "Oregenal@2024")


async def admin(client) -> dict:
    return await login(client, "rahul@oregenal.com", "Admin@1234")


async def store_mgr(client) -> dict:
    return await login(client, "store@oregenal.com", "Store@1234")


async def gate_guard(client) -> dict:
    return await login(client, "gate@oregenal.com", "Gate@1234")


async def viewer(client) -> dict:
    return await login(client, "viewer@oregenal.com", "View@1234")


# ═══════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] in ("ok", "degraded")


async def test_login_super_admin(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    assert sa["token"]
    assert sa["user"]["role"] == "super_admin"


async def test_login_wrong_password(client):
    r = await client.post("/api/v1/auth/login",
                          json={"email": "admin@oregenal.com", "password": "wrongpassword"})
    assert r.status_code == 401


async def test_login_invalid_email(client):
    r = await client.post("/api/v1/auth/login",
                          json={"email": "not-an-email", "password": "anything"})
    assert r.status_code == 422


async def test_login_returns_permissions(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/auth/login",
                          json={"email": "admin@oregenal.com", "password": "Oregenal@2024"})
    d = r.json()
    assert "permissions" in d
    assert isinstance(d["permissions"], dict)
    assert len(d["permissions"]) > 0


async def test_login_returns_tenant(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/auth/login",
                          json={"email": "admin@oregenal.com", "password": "Oregenal@2024"})
    d = r.json()
    assert "tenant" in d
    assert d["tenant"]["slug"] == "oregenal"


async def test_get_me_unauthenticated(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


async def test_get_me_authenticated(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.get("/api/v1/auth/me", headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["role"] == "super_admin"
    assert "permissions" in r.json()


async def test_token_refresh(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/auth/refresh",
                          json={"refresh_token": sa["refresh"]})
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_forgot_password_always_200(client):
    r = await client.post("/api/v1/auth/forgot-password",
                          json={"email": "doesnotexist@example.com"})
    assert r.status_code == 200
    assert r.json()["success"] is True


async def test_logout(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/auth/logout", headers=H(sa["token"]))
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# USER MANAGEMENT TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_users_as_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/users/", headers=H(adm["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d
    assert d["total"] >= 2


async def test_list_users_unauthenticated(client):
    r = await client.get("/api/v1/users/")
    assert r.status_code == 401


async def test_list_users_forbidden_for_gate_guard(client):
    gg = await gate_guard(client)
    skip_no_seed(gg)
    r = await client.get("/api/v1/users/", headers=H(gg["token"]))
    assert r.status_code == 403


async def test_create_user_weak_password(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.post("/api/v1/users/", json={
        "name": "Weak Pass", "email": "weakpass@test.com",
        "password": "123", "role_slug": "viewer",
    }, headers=H(adm["token"]))
    assert r.status_code == 422


async def test_create_user_duplicate_email(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.post("/api/v1/users/", json={
        "name": "Duplicate", "email": "admin@oregenal.com",
        "password": "Duplicate@123", "role_slug": "viewer",
    }, headers=H(adm["token"]))
    assert r.status_code == 409


async def test_create_and_delete_user(client):
    sa = await super_admin(client)
    skip_no_seed(sa)

    import time; email = f"testuser_{int(time.time())}@oregenal.com"
    # Create
    r = await client.post("/api/v1/users/", json={
        "name": "Test Delete", "email": email,
        "password": "TestUser@123", "role_slug": "viewer",
    }, headers=H(sa["token"]))
    assert r.status_code == 201
    user_id = r.json()["id"]

    # Delete
    r2 = await client.delete(f"/api/v1/users/{user_id}", headers=H(sa["token"]))
    assert r2.status_code == 200
    assert r2.json()["success"] is True


async def test_cannot_delete_own_account(client):
    adm = await admin(client)
    skip_no_seed(adm)
    my_id = adm["user"]["id"]
    r = await client.delete(f"/api/v1/users/{my_id}", headers=H(adm["token"]))
    assert r.status_code == 400


async def test_admin_cannot_delete_super_admin(client):
    adm = await admin(client)
    sa  = await super_admin(client)
    skip_no_seed(adm)
    sa_id = sa["user"]["id"]
    r = await client.delete(f"/api/v1/users/{sa_id}", headers=H(adm["token"]))
    assert r.status_code == 403


async def test_toggle_user_status(client):
    sa = await super_admin(client)
    skip_no_seed(sa)

    vw = await viewer(client)
    skip_no_seed(vw)
    viewer_id = vw["user"]["id"]

    # Disable
    r = await client.patch(f"/api/v1/users/{viewer_id}/status",
                           json={"is_active": False}, headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # Re-enable
    r2 = await client.patch(f"/api/v1/users/{viewer_id}/status",
                            json={"is_active": True}, headers=H(sa["token"]))
    assert r2.status_code == 200
    assert r2.json()["is_active"] is True


async def test_change_user_role(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    vw = await viewer(client)
    skip_no_seed(vw)
    viewer_id = vw["user"]["id"]

    r = await client.put(f"/api/v1/users/{viewer_id}/role",
                         json={"role_slug": "viewer"},
                         headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["role"] == "viewer"


async def test_update_user_extra_permissions(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    vw = await viewer(client)
    skip_no_seed(vw)
    viewer_id = vw["user"]["id"]

    r = await client.put(
        f"/api/v1/users/{viewer_id}/permissions",
        json={"permissions": {"inventory": ["view", "create"]}},
        headers=H(sa["token"]),
    )
    assert r.status_code == 200
    assert "inventory" in r.json()["extra_permissions"]

    # Reset
    await client.put(
        f"/api/v1/users/{viewer_id}/permissions",
        json={"permissions": {}},
        headers=H(sa["token"]),
    )


async def test_update_user_invalid_permission_action(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    vw = await viewer(client)
    skip_no_seed(vw)
    viewer_id = vw["user"]["id"]

    r = await client.put(
        f"/api/v1/users/{viewer_id}/permissions",
        json={"permissions": {"inventory": ["hack"]}},
        headers=H(sa["token"]),
    )
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# ROLE MANAGEMENT TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_roles_as_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/roles/", headers=H(adm["token"]))
    assert r.status_code == 200
    slugs = [ro["slug"] for ro in r.json()["items"]]
    for slug in ["super_admin", "admin", "gate_guard", "iqc_inspector", "store_manager"]:
        assert slug in slugs, f"System role missing: {slug}"


async def test_list_roles_unauthenticated(client):
    r = await client.get("/api/v1/roles/")
    assert r.status_code == 401


async def test_list_roles_forbidden_for_gate_guard(client):
    gg = await gate_guard(client)
    skip_no_seed(gg)
    r = await client.get("/api/v1/roles/", headers=H(gg["token"]))
    assert r.status_code == 403


async def test_create_and_delete_custom_role(client):
    sa = await super_admin(client)
    skip_no_seed(sa)

    slug = "test_custom_role_xyz"
    # Create
    r = await client.post("/api/v1/roles/", json={
        "name": "Test Custom Role",
        "slug": slug,
        "description": "Temporary test role",
        "level": 5,
        "permissions": {"inventory": ["view"]},
    }, headers=H(sa["token"]))
    assert r.status_code == 201
    role_id = r.json()["id"]

    # Delete
    r2 = await client.delete(f"/api/v1/roles/{role_id}", headers=H(sa["token"]))
    assert r2.status_code == 200


async def test_cannot_delete_system_role(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    roles_r = await client.get("/api/v1/roles/", headers=H(sa["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}
    r = await client.delete(f"/api/v1/roles/{roles['gate_guard']}",
                            headers=H(sa["token"]))
    assert r.status_code == 400


async def test_create_role_with_invalid_level(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/roles/", json={
        "name": "Bad Level", "slug": "bad_level_role",
        "level": 95, "permissions": {},
    }, headers=H(sa["token"]))
    # super_admin CAN create any level — admin cannot
    # Level > 89 is rejected by validator regardless
    assert r.status_code == 422


async def test_update_role_permissions_valid(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    roles_r = await client.get("/api/v1/roles/", headers=H(sa["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}

    r = await client.put(
        f"/api/v1/roles/{roles['gate_guard']}/permissions",
        json={"permissions": {"gate": ["view", "create"], "inventory": ["view"]}},
        headers=H(sa["token"]),
    )
    assert r.status_code == 200
    assert "gate" in r.json()["permissions"]


async def test_update_role_permissions_invalid_action(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    roles_r = await client.get("/api/v1/roles/", headers=H(sa["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}

    r = await client.put(
        f"/api/v1/roles/{roles['gate_guard']}/permissions",
        json={"permissions": {"gate": ["hack"]}},
        headers=H(sa["token"]),
    )
    assert r.status_code == 422


async def test_duplicate_role_slug_rejected(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/roles/", json={
        "name": "Duplicate Admin", "slug": "admin",
        "level": 10, "permissions": {},
    }, headers=H(sa["token"]))
    assert r.status_code == 409


# ═══════════════════════════════════════════════════════════════════════
# RBAC TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_my_permissions(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.get("/api/v1/rbac/my-permissions", headers=H(sa["token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["is_super_admin"] is True
    assert d["role_level"] == 100


async def test_rbac_audit_log_as_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/rbac/audit-log", headers=H(adm["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_rbac_audit_log_forbidden_for_store_manager(client):
    sm = await store_mgr(client)
    skip_no_seed(sm)
    r = await client.get("/api/v1/rbac/audit-log", headers=H(sm["token"]))
    assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
# DEPARTMENT TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_departments(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.get("/api/v1/departments/", headers=H(sa["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_create_department(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/departments/", json={
        "name": "Test Department",
        "code": "TST",
    }, headers=H(sa["token"]))
    assert r.status_code == 201
    dept_id = r.json()["id"]

    # Clean up
    await client.delete(f"/api/v1/departments/{dept_id}", headers=H(sa["token"]))


# ═══════════════════════════════════════════════════════════════════════
# MASTER — COMPANY TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_get_company_any_user(client):
    sm = await store_mgr(client)
    skip_no_seed(sm)
    r = await client.get("/api/v1/master/company", headers=H(sm["token"]))
    assert r.status_code == 200


async def test_update_company_super_admin(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/company",
                         json={"website": "https://www.oregenal.com"},
                         headers=H(sa["token"]))
    assert r.status_code == 200


async def test_update_company_forbidden_for_store_manager(client):
    sm = await store_mgr(client)
    skip_no_seed(sm)
    r = await client.put("/api/v1/master/company",
                         json={"name": "Hacked"},
                         headers=H(sm["token"]))
    assert r.status_code == 403


async def test_update_company_invalid_month(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/company",
                         json={"fiscal_year_start_month": 13},
                         headers=H(sa["token"]))
    assert r.status_code == 422


async def test_update_company_invalid_gstin(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/company",
                         json={"gstin": "SHORT"},
                         headers=H(sa["token"]))
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# MASTER — BRANCH TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_branches_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/branches", headers=H(adm["token"]))
    assert r.status_code == 200
    assert "items" in r.json()


async def test_create_branch_super_admin(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Test Branch", "branch_type": "warehouse",
        "city": "Mumbai", "state": "Maharashtra",
    }, headers=H(sa["token"]))
    assert r.status_code == 201
    branch_id = r.json()["id"]

    # Cleanup
    await client.delete(f"/api/v1/master/branches/{branch_id}", headers=H(sa["token"]))


async def test_create_branch_forbidden_for_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Admin Branch", "branch_type": "factory",
    }, headers=H(adm["token"]))
    assert r.status_code == 403


async def test_create_branch_invalid_type(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/master/branches", json={
        "name": "Bad Type Branch", "branch_type": "spaceship",
    }, headers=H(sa["token"]))
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# MASTER — FINANCIAL YEAR TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_financial_years(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/financial-years", headers=H(adm["token"]))
    assert r.status_code == 200
    names = [i["name"] for i in r.json()["items"]]
    assert any("2024" in n for n in names), f"Expected FY 2024-xx in: {names}"


async def test_create_financial_year(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/master/financial-years", json={
        "name": "FY TEST-2099",
        "start_date": "2099-04-01",
        "end_date": "2100-03-31",
    }, headers=H(sa["token"]))
    assert r.status_code in (201, 409)


async def test_duplicate_financial_year_rejected(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    payload = {"name": "FY DUP-TEST", "start_date": "2090-04-01", "end_date": "2091-03-31"}
    await client.post("/api/v1/master/financial-years", json=payload, headers=H(sa["token"]))
    r = await client.post("/api/v1/master/financial-years", json=payload, headers=H(sa["token"]))
    assert r.status_code == 409


async def test_activate_financial_year(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    fys = (await client.get("/api/v1/master/financial-years", headers=H(sa["token"]))).json()["items"]
    fy = next((f for f in fys if not f["is_closed"]), None)
    if not fy:
        pytest.skip("No open financial year found")
    r = await client.put(f"/api/v1/master/financial-years/{fy['id']}/activate",
                         headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["is_active"] is True


async def test_create_fy_end_before_start_rejected(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/master/financial-years", json={
        "name": "FY INVALID",
        "start_date": "2080-04-01",
        "end_date": "2080-01-01",
    }, headers=H(sa["token"]))
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# MASTER — NUMBER SERIES TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_number_series(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/number-series", headers=H(adm["token"]))
    assert r.status_code == 200
    items = r.json()["items"]
    doc_types = [i["document_type"] for i in items]
    assert "purchase_order" in doc_types
    assert "sales_order" in doc_types
    assert "work_order" in doc_types


async def test_number_series_preview(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.post("/api/v1/master/number-series/purchase_order/preview",
                          headers=H(adm["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "preview" in d
    assert "PO" in d["preview"]


async def test_update_number_series(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/number-series/purchase_order", json={
        "prefix": "PO",
        "padding_digits": 5,
        "include_year": True,
    }, headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["padding_digits"] == 5


async def test_update_number_series_invalid_type(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/number-series/nonexistent_type", json={
        "prefix": "XX",
    }, headers=H(sa["token"]))
    assert r.status_code == 400


async def test_update_number_series_invalid_padding(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/number-series/sales_order", json={
        "padding_digits": 99,
    }, headers=H(sa["token"]))
    assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# MASTER — APPROVAL RULES TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_approval_rules(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/approval-rules", headers=H(adm["token"]))
    assert r.status_code == 200
    assert len(r.json()["items"]) > 0


async def test_update_approval_rule(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/approval-rules/purchase_order", json={
        "is_approval_required": True,
        "approver_role": "admin",
        "escalation_hours": 48,
    }, headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["is_approval_required"] is True


async def test_approval_rule_forbidden_for_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.put("/api/v1/master/approval-rules/purchase_order", json={
        "is_approval_required": False,
    }, headers=H(adm["token"]))
    assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
# MASTER — CHANGE REQUEST SETTINGS TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_list_change_request_settings(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/change-request-settings", headers=H(adm["token"]))
    assert r.status_code == 200
    assert len(r.json()["items"]) > 0


async def test_update_change_request_setting(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.put("/api/v1/master/change-request-settings/sales_order", json={
        "allow_change_request": True,
        "requires_reason": True,
        "who_can_raise": "admin",
        "who_can_approve": "super_admin",
    }, headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["allow_change_request"] is True


# ═══════════════════════════════════════════════════════════════════════
# MASTER — TEST DATA TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_test_data_status_super_admin_only(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.get("/api/v1/master/test-data/status", headers=H(sa["token"]))
    assert r.status_code == 200
    assert "total_test_rows" in r.json()


async def test_test_data_status_forbidden_for_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/test-data/status", headers=H(adm["token"]))
    assert r.status_code == 403


async def test_load_test_data(client):
    sa = await super_admin(client)
    skip_no_seed(sa)
    r = await client.post("/api/v1/master/test-data/load", headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert len(r.json()["created"]) > 0


async def test_load_test_data_forbidden_for_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.post("/api/v1/master/test-data/load", headers=H(adm["token"]))
    assert r.status_code == 403


async def test_purge_test_data(client):
    sa = await super_admin(client)
    skip_no_seed(sa)

    # Load first
    await client.post("/api/v1/master/test-data/load", headers=H(sa["token"]))

    # Purge
    r = await client.delete("/api/v1/master/test-data/purge", headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "total_deleted" in r.json()
    assert isinstance(r.json()["total_deleted"], int)


async def test_purge_test_data_forbidden_for_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.delete("/api/v1/master/test-data/purge", headers=H(adm["token"]))
    assert r.status_code == 403


async def test_purge_does_not_delete_live_data(client):
    """After purge, system roles and users (is_test_data=false) remain."""
    sa = await super_admin(client)
    skip_no_seed(sa)

    await client.delete("/api/v1/master/test-data/purge", headers=H(sa["token"]))

    # System users still exist
    r = await client.post("/api/v1/auth/login",
                          json={"email": "admin@oregenal.com", "password": "Oregenal@2024"})
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# MASTER — AUDIT LOG TESTS
# ═══════════════════════════════════════════════════════════════════════

async def test_audit_log_as_admin(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/audit-log", headers=H(adm["token"]))
    assert r.status_code == 200
    d = r.json()
    assert "items" in d
    assert "total" in d
    assert "total_pages" in d


async def test_audit_log_forbidden_for_store_manager(client):
    sm = await store_mgr(client)
    skip_no_seed(sm)
    r = await client.get("/api/v1/master/audit-log", headers=H(sm["token"]))
    assert r.status_code == 403


async def test_audit_log_pagination(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/audit-log?page=1&page_size=5",
                         headers=H(adm["token"]))
    assert r.status_code == 200
    assert len(r.json()["items"]) <= 5


async def test_audit_log_filter_by_document_type(client):
    adm = await admin(client)
    skip_no_seed(adm)
    r = await client.get("/api/v1/master/audit-log?document_type=company",
                         headers=H(adm["token"]))
    assert r.status_code == 200
    items = r.json()["items"]
    for item in items:
        assert item["document_type"] == "company"


async def test_audit_log_written_on_company_update(client):
    sa = await super_admin(client)
    skip_no_seed(sa)

    # Make a change
    await client.put("/api/v1/master/company",
                     json={"phone": "+91-22-12345678"},
                     headers=H(sa["token"]))

    # Verify audit log has entries
    r = await client.get("/api/v1/master/audit-log?document_type=company",
                         headers=H(sa["token"]))
    assert r.status_code == 200
    assert r.json()["total"] > 0


async def test_all_endpoints_reject_unauthenticated(client):
    """All protected endpoints return 401 without a token."""
    endpoints = [
        ("GET",    "/api/v1/master/company"),
        ("GET",    "/api/v1/master/branches"),
        ("GET",    "/api/v1/master/financial-years"),
        ("GET",    "/api/v1/master/number-series"),
        ("GET",    "/api/v1/master/approval-rules"),
        ("GET",    "/api/v1/master/change-request-settings"),
        ("GET",    "/api/v1/master/audit-log"),
        ("GET",    "/api/v1/users/"),
        ("GET",    "/api/v1/roles/"),
        ("GET",    "/api/v1/rbac/my-permissions"),
        ("GET",    "/api/v1/departments/"),
    ]
    for method, url in endpoints:
        r = await client.request(method, url)
        assert r.status_code == 401, f"{method} {url} should return 401, got {r.status_code}"
