"""
RBAC Test Suite — Module 1: Users, Roles, Permissions
=======================================================
Tests every RBAC rule:
  1. super_admin bypasses all restrictions
  2. admin cannot view/edit/delete super_admin users
  3. Users cannot assign roles with level >= their own
  4. is_system roles cannot be deleted
  5. Role level constraint on creation
  6. Permission actions validated
  7. Audit log is written on every permission change
  8. Login returns correct permissions

Run:
  cd erp-backend
  source venv/bin/activate
  pip install pytest pytest-asyncio httpx
  pytest tests/test_auth/test_rbac.py -v
"""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


# ── Fixtures ──────────────────────────────────────────────────────────────
# NOTE: scope="session" shares one client + event loop across all tests.
# This avoids "Future attached to a different loop" errors from the
# shared SQLAlchemy async engine.

@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


# ── Helpers ───────────────────────────────────────────────────────────────
async def login(client, email: str, password: str) -> dict:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        return {}
    d = r.json()
    return {"token": d["access_token"], "user": d["user"], "permissions": d["permissions"]}


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Basic Auth ─────────────────────────────────────────────────────────────
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert "status" in r.json()


async def test_login_wrong_password(client):
    r = await client.post("/api/v1/auth/login", json={
        "email": "admin@oregenal.com",
        "password": "wrongpassword",
    })
    assert r.status_code == 401
    assert "Incorrect" in r.json()["detail"]


async def test_login_invalid_email_format(client):
    r = await client.post("/api/v1/auth/login", json={
        "email": "not-an-email",
        "password": "anything",
    })
    assert r.status_code == 422


async def test_me_unauthenticated(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


async def test_forgot_password_always_200(client):
    r = await client.post("/api/v1/auth/forgot-password", json={
        "email": "doesnotexist@example.com"
    })
    assert r.status_code == 200
    assert r.json()["success"] is True


async def test_login_super_admin_success(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present — run: python scripts/seed_rbac.py")
    assert session["token"]
    assert session["user"]["role"] == "super_admin"


async def test_login_returns_permissions(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    perms = session["permissions"]
    assert isinstance(perms, dict)
    assert len(perms) > 0


async def test_get_me_returns_permissions(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/auth/me", headers=auth(session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["role"] == "super_admin"
    assert "permissions" in d


# ── Role listing ───────────────────────────────────────────────────────────
async def test_list_roles_as_admin(client):
    session = await login(client, "rahul@oregenal.com", "Admin@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    assert r.status_code == 200
    slugs = [ro["slug"] for ro in r.json()["items"]]
    for slug in ["super_admin", "admin", "gate_guard", "iqc_inspector", "store_manager"]:
        assert slug in slugs, f"Missing system role: {slug}"


async def test_list_roles_unauthenticated(client):
    r = await client.get("/api/v1/roles/")
    assert r.status_code == 401


async def test_list_roles_as_gate_guard_forbidden(client):
    session = await login(client, "gate@oregenal.com", "Gate@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    assert r.status_code == 403


# ── RBAC Rule 1: super_admin bypasses all ─────────────────────────────────
async def test_super_admin_can_see_all_users(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/users/", headers=auth(session["token"]))
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()["items"]]
    assert "admin@oregenal.com" in emails


# ── RBAC Rule 2: admin cannot see/modify super_admin ──────────────────────
async def test_admin_cannot_see_super_admin_users(client):
    session = await login(client, "rahul@oregenal.com", "Admin@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/users/", headers=auth(session["token"]))
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()["items"]]
    assert "admin@oregenal.com" not in emails, "Admin should NOT see super_admin users"


async def test_admin_cannot_assign_super_admin_role(client):
    session = await login(client, "rahul@oregenal.com", "Admin@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/users/", headers=auth(session["token"]))
    if not r.json()["items"]:
        pytest.skip("No visible users found")
    target_id = r.json()["items"][0]["id"]
    r = await client.put(
        f"/api/v1/users/{target_id}/role",
        json={"role_slug": "super_admin"},
        headers=auth(session["token"]),
    )
    assert r.status_code == 403


# ── RBAC Rule 3: Cannot assign role with level >= own ─────────────────────
async def test_create_user_with_equal_level_role_rejected(client):
    """Admin (level 90) cannot create user with admin role (level 90)."""
    session = await login(client, "rahul@oregenal.com", "Admin@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.post("/api/v1/users/", json={
        "name":      "Test Equal Level",
        "email":     f"equallevel_{uuid.uuid4().hex[:6]}@test.com",
        "password":  "Test@1234",
        "role_slug": "admin",
    }, headers=auth(session["token"]))
    assert r.status_code == 403


async def test_super_admin_can_assign_any_role(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    email = f"testassign_{uuid.uuid4().hex[:6]}@test.com"
    r = await client.post("/api/v1/users/", json={
        "name":      "Test Assign",
        "email":     email,
        "password":  "Test@12345",
        "role_slug": "admin",
    }, headers=auth(session["token"]))
    assert r.status_code == 201


# ── RBAC Rule 4: is_system roles cannot be deleted ────────────────────────
async def test_cannot_delete_system_role(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    roles_r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}
    for slug in ["super_admin", "admin", "gate_guard", "iqc_inspector", "store_manager"]:
        if slug in roles:
            r = await client.delete(f"/api/v1/roles/{roles[slug]}", headers=auth(session["token"]))
            assert r.status_code == 400, f"System role '{slug}' should not be deletable"
            assert "system" in r.json()["detail"].lower()


# ── RBAC Rule 5: Role level constraint ────────────────────────────────────
async def test_cannot_create_role_above_89(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.post("/api/v1/roles/", json={
        "name":  "Ultra Admin",
        "slug":  "ultra_admin",
        "level": 95,
    }, headers=auth(session["token"]))
    assert r.status_code == 422, "Level > 89 should fail Pydantic validation"


async def test_can_create_custom_role(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    slug = f"custom_role_{uuid.uuid4().hex[:6]}"
    r = await client.post("/api/v1/roles/", json={
        "name":        "Custom Role",
        "slug":        slug,
        "description": "Test custom role",
        "level":       15,
        "permissions": {"inventory": ["view"], "reports": ["view", "export"]},
    }, headers=auth(session["token"]))
    assert r.status_code == 201
    d = r.json()
    assert d["slug"] == slug
    assert d["is_system"] is False
    assert d["level"] == 15


async def test_duplicate_role_slug_rejected(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.post("/api/v1/roles/", json={
        "name":  "Duplicate Gate Guard",
        "slug":  "gate_guard",
        "level": 5,
    }, headers=auth(session["token"]))
    assert r.status_code == 409


# ── RBAC Rule 6: Permission actions validated ──────────────────────────────
async def test_invalid_action_rejected(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    roles_r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}
    if "gate_guard" not in roles:
        pytest.skip("gate_guard role not found")
    r = await client.put(
        f"/api/v1/roles/{roles['gate_guard']}/permissions",
        json={"permissions": {"inventory": ["view", "hack"]}},
        headers=auth(session["token"]),
    )
    assert r.status_code == 422
    assert "hack" in r.json()["detail"]


async def test_valid_permissions_update(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    roles_r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}
    if "gate_guard" not in roles:
        pytest.skip("gate_guard role not found")
    r = await client.put(
        f"/api/v1/roles/{roles['gate_guard']}/permissions",
        json={"permissions": {"dispatch": ["view", "create"], "inventory": ["view"]}},
        headers=auth(session["token"]),
    )
    assert r.status_code == 200
    assert "dispatch" in r.json()["permissions"]


# ── RBAC Rule 7: Audit log written on change ──────────────────────────────
async def test_audit_log_written_on_permission_change(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    roles_r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    roles = {ro["slug"]: ro["id"] for ro in roles_r.json()["items"]}
    if "gate_guard" not in roles:
        pytest.skip("gate_guard role not found")
    await client.put(
        f"/api/v1/roles/{roles['gate_guard']}/permissions",
        json={"permissions": {"dispatch": ["view", "create", "edit"], "inventory": ["view"]}},
        headers=auth(session["token"]),
    )
    r = await client.get("/api/v1/rbac/audit-log", headers=auth(session["token"]))
    assert r.status_code == 200
    actions = [i["action"] for i in r.json()["items"]]
    assert "permission_change" in actions


# ── Role-specific access ───────────────────────────────────────────────────
async def test_gate_guard_cannot_access_admin_endpoints(client):
    session = await login(client, "gate@oregenal.com", "Gate@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/users/", headers=auth(session["token"]))
    assert r.status_code == 403
    r = await client.get("/api/v1/roles/", headers=auth(session["token"]))
    assert r.status_code == 403
    r = await client.get("/api/v1/rbac/my-permissions", headers=auth(session["token"]))
    assert r.status_code == 200
    assert r.json()["role"] == "gate_guard"


async def test_iqc_inspector_permissions(client):
    session = await login(client, "qc@oregenal.com", "Qc@12345678")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/rbac/my-permissions", headers=auth(session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["role"] == "iqc_inspector"
    assert "approve" in d["permissions"].get("qc", [])
    assert d["permissions"].get("hr", []) == []


async def test_store_manager_permissions(client):
    session = await login(client, "store@oregenal.com", "Store@1234")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.get("/api/v1/rbac/my-permissions", headers=auth(session["token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["role"] == "store_manager"
    assert "approve" in d["permissions"].get("purchase", [])
    assert d["permissions"].get("settings", []) == []


# ── User validation ────────────────────────────────────────────────────────
async def test_create_user_duplicate_email(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.post("/api/v1/users/", json={
        "name":      "Duplicate",
        "email":     "admin@oregenal.com",
        "password":  "Duplicate@123",
        "role_slug": "gate_guard",
    }, headers=auth(session["token"]))
    assert r.status_code == 409


async def test_create_user_weak_password(client):
    session = await login(client, "admin@oregenal.com", "Oregenal@2024")
    if not session:
        pytest.skip("Seed data not present")
    r = await client.post("/api/v1/users/", json={
        "name":      "Weak Pass",
        "email":     "weakpass@test.com",
        "password":  "123",
        "role_slug": "gate_guard",
    }, headers=auth(session["token"]))
    assert r.status_code == 422


async def test_cannot_delete_own_account(client):
    session = await login(client, "rahul@oregenal.com", "Admin@1234")
    if not session:
        pytest.skip("Seed data not present")
    my_id = session["user"]["id"]
    r = await client.delete(f"/api/v1/users/{my_id}", headers=auth(session["token"]))
    assert r.status_code == 400


# ── Token refresh ──────────────────────────────────────────────────────────
async def test_token_refresh(client):
    r = await client.post("/api/v1/auth/login", json={
        "email": "admin@oregenal.com",
        "password": "Oregenal@2024",
    })
    if r.status_code != 200:
        pytest.skip("Seed data not present")
    r2 = await client.post("/api/v1/auth/refresh",
                           json={"refresh_token": r.json()["refresh_token"]})
    assert r2.status_code == 200
    assert "access_token" in r2.json()
