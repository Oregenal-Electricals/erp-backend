"""
Oregenal ERP — RBAC Seed Script
=================================
Creates:
  - Oregenal Electrical India Pvt Ltd (tenant)
  - 5 system roles: super_admin, admin, gate_guard, iqc_inspector, store_manager
  - 1 sample user per role

Run:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_rbac.py
"""
import asyncio, os, sys, uuid, bcrypt
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def _load_env():
    env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env):
        with open(env) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_env()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.environ["DATABASE_URL"]

def uid() -> str:
    return str(uuid.uuid4())

def hp(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def q(sql: str) -> str:
    """Return sql unchanged — used as a label."""
    return sql


# ── Role definitions ───────────────────────────────────────────────────
ALL_MODULES = [
    "crm", "sales", "purchase", "inventory", "manufacturing",
    "qc", "accounts", "hr", "reports", "settings",
    "dispatch", "finance", "gst", "payroll", "maintenance",
    "costing", "documents",
]
ALL_ACTIONS = ["view", "create", "edit", "delete", "approve", "export"]

import json

ROLES = [
    {
        "slug":        "super_admin",
        "name":        "Super Admin",
        "description": "Unrestricted access. Cannot be modified by Admin.",
        "level":       100,
        "is_system":   True,
        "permissions": {m: ALL_ACTIONS for m in ALL_MODULES},
    },
    {
        "slug":        "admin",
        "name":        "Admin",
        "description": "Full access. Cannot modify Super Admin accounts.",
        "level":       90,
        "is_system":   True,
        "permissions": {m: ALL_ACTIONS for m in ALL_MODULES},
    },
    {
        "slug":        "store_manager",
        "name":        "Store Manager",
        "description": "Manages inventory and purchase. Can approve POs.",
        "level":       40,
        "is_system":   True,
        "permissions": {
            "inventory":    ["view", "create", "edit", "approve", "export"],
            "purchase":     ["view", "create", "edit", "approve", "export"],
            "dispatch":     ["view", "create", "edit"],
            "reports":      ["view", "export"],
            "crm":          ["view"],
            "sales":        ["view"],
            "manufacturing":["view"],
            "qc":           ["view"],
            "accounts":     ["view"],
            "hr":           [],
            "settings":     [],
            "finance":      [],
            "gst":          [],
            "payroll":      [],
            "maintenance":  ["view"],
            "costing":      ["view"],
            "documents":    ["view"],
        },
    },
    {
        "slug":        "iqc_inspector",
        "name":        "IQC Inspector",
        "description": "Incoming Quality Control. Creates/closes QC inspections.",
        "level":       30,
        "is_system":   True,
        "permissions": {
            "qc":           ["view", "create", "edit", "delete", "approve"],
            "inventory":    ["view"],
            "purchase":     ["view"],
            "manufacturing":["view"],
            "dispatch":     ["view"],
            "reports":      ["view", "export"],
            "crm":          [],
            "sales":        [],
            "accounts":     [],
            "hr":           [],
            "settings":     [],
            "finance":      [],
            "gst":          [],
            "payroll":      [],
            "maintenance":  [],
            "costing":      [],
            "documents":    ["view"],
        },
    },
    {
        "slug":        "gate_guard",
        "name":        "Gate Guard",
        "description": "Records vehicle entry/exit and incoming material.",
        "level":       20,
        "is_system":   True,
        "permissions": {
            "dispatch":     ["view", "create"],
            "inventory":    ["view"],
            "purchase":     ["view"],
            "qc":           ["view"],
            "crm":          [],
            "sales":        [],
            "manufacturing":[],
            "accounts":     [],
            "hr":           [],
            "finance":      [],
            "reports":      [],
            "settings":     [],
            "gst":          [],
            "payroll":      [],
            "maintenance":  [],
            "costing":      [],
            "documents":    [],
        },
    },
]

# ── Users ──────────────────────────────────────────────────────────────
USERS = [
    {
        "name":      "Super Admin",
        "email":     "admin@oregenal.com",
        "password":  "Oregenal@2024",
        "role_slug": "super_admin",
        "phone":     "+91-9876543210",
    },
    {
        "name":      "Rahul Sharma",
        "email":     "rahul@oregenal.com",
        "password":  "Admin@1234",
        "role_slug": "admin",
        "phone":     "+91-9876543211",
    },
    {
        "name":      "Suresh Yadav",
        "email":     "store@oregenal.com",
        "password":  "Store@1234",
        "role_slug": "store_manager",
        "phone":     "+91-9876543212",
    },
    {
        "name":      "Amit Kumar",
        "email":     "qc@oregenal.com",
        "password":  "Qc@12345678",
        "role_slug": "iqc_inspector",
        "phone":     "+91-9876543213",
    },
    {
        "name":      "Ramesh Patel",
        "email":     "gate@oregenal.com",
        "password":  "Gate@1234",
        "role_slug": "gate_guard",
        "phone":     "+91-9876543214",
    },
]


async def run(db, sql):
    """Execute SQL — silently skip duplicates."""
    try:
        await db.execute(text(sql))
    except Exception as e:
        msg = str(e).lower()
        if "duplicate" in msg or "unique" in msg or "already exists" in msg:
            return  # idempotent
        print(f"  ⚠️  SQL error: {str(e)[:100]}")


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        # ── Tenant ───────────────────────────────────────────────────
        tid = uid()
        await conn.execute(text(
            "INSERT INTO tenants (id, name, slug, plan, is_active) VALUES "
            "('" + tid + "', 'Oregenal Electrical India Private Limited', "
            "'oregenal', 'professional', true) "
            "ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name"
        ))
        print("✅ Tenant created/verified")

        # Fetch actual tenant ID (handles case where tenant already existed)
        r = await conn.execute(text("SELECT id FROM tenants WHERE slug = 'oregenal' LIMIT 1"))
        row = r.fetchone()
        tid = str(row[0])
        print(f"   Tenant ID: {tid}")

    # ── Roles ──────────────────────────────────────────────────────
    async with engine.begin() as conn:
        role_ids: dict[str, str] = {}
        for role in ROLES:
            rid = uid()
            perms_json = json.dumps(role["permissions"]).replace("'", "''")
            try:
                await conn.execute(text(
                    "INSERT INTO roles (id, tenant_id, name, slug, description, level, is_system, permissions) "
                    "VALUES "
                    "('" + rid + "', '" + tid + "', "
                    "'" + role["name"] + "', '" + role["slug"] + "', "
                    "'" + (role["description"] or "") + "', " + str(role["level"]) + ", "
                    + str(role["is_system"]).lower() + ", "
                    "'" + perms_json + "'::jsonb) "
                    "ON CONFLICT ON CONSTRAINT uq_roles_tenant_slug "
                    "DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, "
                    "permissions = EXCLUDED.permissions, is_system = EXCLUDED.is_system"
                ))
            except Exception:
                # Fallback without ON CONFLICT clause if constraint doesn't exist yet
                await conn.execute(text(
                    "INSERT INTO roles (id, tenant_id, name, slug, description, level, is_system, permissions) "
                    "VALUES "
                    "('" + rid + "', '" + tid + "', "
                    "'" + role["name"] + "', '" + role["slug"] + "', "
                    "'" + (role["description"] or "") + "', " + str(role["level"]) + ", "
                    + str(role["is_system"]).lower() + ", "
                    "'" + perms_json + "'::jsonb) "
                    "ON CONFLICT DO NOTHING"
                ))

            # Get actual role id
            r = await conn.execute(text(
                "SELECT id FROM roles WHERE slug = '" + role["slug"] + "' AND tenant_id = '" + tid + "' LIMIT 1"
            ))
            row = r.fetchone()
            role_ids[role["slug"]] = str(row[0])
            print(f"  ✅ Role: {role['name']} (level {role['level']})")

    # ── Users ──────────────────────────────────────────────────────
    async with engine.begin() as conn:
        for u in USERS:
            uid2  = uid()
            rid   = role_ids[u["role_slug"]]
            h     = hp(u["password"])
            phone = u.get("phone", "")
            try:
                await conn.execute(text(
                    "INSERT INTO users (id, tenant_id, role_id, name, email, hashed_password, role, phone, is_active) "
                    "VALUES ('" + uid2 + "', '" + tid + "', '" + rid + "', "
                    "'" + u["name"] + "', '" + u["email"] + "', '" + h + "', "
                    "'" + u["role_slug"] + "', '" + phone + "', true) "
                    "ON CONFLICT DO NOTHING"
                ))
                print(f"  ✅ User: {u['email']}  [{u['role_slug']}]")
            except Exception as e:
                print(f"  ⚠️  User {u['email']}: {str(e)[:80]}")

    print("\n" + "="*55)
    print("✅  RBAC Seed complete — Oregenal Electrical India Pvt Ltd")
    print("="*55)
    print()
    print("  Login credentials:")
    print()
    for u in USERS:
        print(f"  {u['email']:<35} {u['password']:<20} [{u['role_slug']}]")
    print()
    print("  API docs: http://localhost:8000/api/docs")
    print("  Frontend: http://localhost:3000")


if __name__ == "__main__":
    asyncio.run(seed())
