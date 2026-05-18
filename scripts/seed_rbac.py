"""
scripts/seed_rbac.py
======================
Oregenal ERP — RBAC Seed Script (Production-safe)

Creates:
  1. Tenant:      Oregenal Electrical India Private Limited
  2. Roles:       super_admin, admin, store_manager, iqc_inspector, gate_guard,
                  production_manager, accounts_manager, hr_manager, sales_manager, viewer
  3. Users:       One user per role + super admin
  4. Departments: Manufacturing, Quality, Accounts, HR, Sales, Purchase, Stores

Idempotent — safe to re-run.
Uses raw SQL + per-item SAVEPOINTs to avoid transaction poisoning.

Run:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_rbac.py
"""
import asyncio
import json
import os
import sys
import uuid

import bcrypt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ── Load .env ──────────────────────────────────────────────────────────────
def _load_env() -> None:
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
    )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env()

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.environ["DATABASE_URL"]


def uid() -> str:
    return str(uuid.uuid4())


def hp(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


# ── Module / action definitions ────────────────────────────────────────────

ALL_MODULES = [
    "crm", "sales", "purchase", "inventory", "manufacturing",
    "qc", "accounts", "hr", "reports", "settings",
    "dispatch", "gate", "masters", "finance", "gst",
    "payroll", "maintenance", "costing", "documents",
]
ALL_ACTIONS = ["view", "create", "edit", "delete", "approve", "export"]


def perms(**overrides) -> str:
    """Build a permissions JSON dict. Start from no_perms, apply overrides."""
    base = {m: [] for m in ALL_MODULES}
    base.update(overrides)
    return json.dumps(base)


# ── Role definitions ───────────────────────────────────────────────────────

ROLES = [
    {
        "slug":        "super_admin",
        "name":        "Super Admin",
        "description": "Unrestricted access. Cannot be modified by Admin.",
        "level":       100,
        "is_system":   True,
        "permissions": json.dumps({m: ALL_ACTIONS for m in ALL_MODULES}),
    },
    {
        "slug":        "admin",
        "name":        "Admin",
        "description": "Full access. Cannot modify Super Admin accounts.",
        "level":       90,
        "is_system":   True,
        "permissions": json.dumps({m: ALL_ACTIONS for m in ALL_MODULES}),
    },
    {
        "slug":        "store_manager",
        "name":        "Store Manager",
        "description": "Manages inventory and purchase. Can approve POs and gate entries.",
        "level":       40,
        "is_system":   True,
        "permissions": perms(
            inventory=ALL_ACTIONS,
            purchase=ALL_ACTIONS,
            dispatch=["view", "create", "edit"],
            gate=["view", "create", "edit", "approve"],
            masters=["view", "create", "edit"],
            reports=["view", "export"],
            crm=["view"],
            sales=["view"],
            manufacturing=["view"],
            qc=["view"],
            accounts=["view"],
            maintenance=["view"],
            costing=["view"],
            documents=["view"],
        ),
    },
    {
        "slug":        "iqc_inspector",
        "name":        "IQC Inspector",
        "description": "Incoming Quality Control. Creates and closes QC inspections.",
        "level":       30,
        "is_system":   True,
        "permissions": perms(
            qc=ALL_ACTIONS,
            inventory=["view"],
            purchase=["view"],
            manufacturing=["view"],
            dispatch=["view"],
            gate=["view"],
            masters=["view"],
            reports=["view", "export"],
            documents=["view"],
        ),
    },
    {
        "slug":        "gate_guard",
        "name":        "Gate Guard",
        "description": "Records vehicle entry/exit and incoming material at gate.",
        "level":       20,
        "is_system":   True,
        "permissions": perms(
            gate=["view", "create"],
            masters=["view"],
            dispatch=["view"],
            inventory=["view"],
            purchase=["view"],
            qc=["view"],
            documents=["view"],
        ),
    },
    {
        "slug":        "production_manager",
        "name":        "Production Manager",
        "description": "Manages work orders, BOM, production scheduling.",
        "level":       45,
        "is_system":   True,
        "permissions": perms(
            manufacturing=ALL_ACTIONS,
            inventory=["view", "create", "edit", "export"],
            qc=["view", "create", "edit"],
            purchase=["view"],
            masters=["view"],
            reports=["view", "export"],
            costing=["view"],
            maintenance=["view", "create"],
            documents=["view", "create"],
        ),
    },
    {
        "slug":        "accounts_manager",
        "name":        "Accounts Manager",
        "description": "Full access to accounts, finance, GST, and payroll.",
        "level":       45,
        "is_system":   True,
        "permissions": perms(
            accounts=ALL_ACTIONS,
            finance=ALL_ACTIONS,
            gst=ALL_ACTIONS,
            payroll=ALL_ACTIONS,
            sales=["view", "export"],
            purchase=["view", "export"],
            inventory=["view"],
            reports=ALL_ACTIONS,
            masters=["view"],
            documents=["view", "create", "export"],
            costing=["view", "export"],
        ),
    },
    {
        "slug":        "hr_manager",
        "name":        "HR Manager",
        "description": "Manages employees, payroll inputs, and HR records.",
        "level":       45,
        "is_system":   True,
        "permissions": perms(
            hr=ALL_ACTIONS,
            payroll=["view", "create", "edit"],
            reports=["view", "export"],
            masters=["view"],
            documents=["view"],
        ),
    },
    {
        "slug":        "sales_manager",
        "name":        "Sales Manager",
        "description": "Manages CRM, sales orders, customers, and dispatch.",
        "level":       45,
        "is_system":   True,
        "permissions": perms(
            crm=ALL_ACTIONS,
            sales=ALL_ACTIONS,
            dispatch=["view", "create", "edit", "approve"],
            inventory=["view"],
            masters=["view"],
            reports=["view", "export"],
            documents=["view", "create"],
            gst=["view"],
        ),
    },
    {
        "slug":        "viewer",
        "name":        "Viewer",
        "description": "Read-only access to all non-sensitive modules.",
        "level":       10,
        "is_system":   True,
        "permissions": perms(
            crm=["view"],
            sales=["view"],
            purchase=["view"],
            inventory=["view"],
            manufacturing=["view"],
            qc=["view"],
            accounts=["view"],
            dispatch=["view"],
            gate=["view"],
            masters=["view"],
            reports=["view"],
            documents=["view"],
            maintenance=["view"],
            costing=["view"],
        ),
    },
]

# ── Users (one per key role) ───────────────────────────────────────────────

USERS = [
    {"name": "Super Admin",        "email": "admin@oregenal.com",      "password": "Oregenal@2024", "role_slug": "super_admin",        "phone": "+91-9876543210"},
    {"name": "Rahul Sharma",       "email": "rahul@oregenal.com",      "password": "Admin@1234",    "role_slug": "admin",              "phone": "+91-9876543211"},
    {"name": "Suresh Yadav",       "email": "store@oregenal.com",      "password": "Store@1234",    "role_slug": "store_manager",      "phone": "+91-9876543212"},
    {"name": "Amit Kumar",         "email": "qc@oregenal.com",         "password": "Qc@12345678",   "role_slug": "iqc_inspector",      "phone": "+91-9876543213"},
    {"name": "Ramesh Patel",       "email": "gate@oregenal.com",       "password": "Gate@1234",     "role_slug": "gate_guard",         "phone": "+91-9876543214"},
    {"name": "Vikram Singh",       "email": "prod@oregenal.com",       "password": "Prod@1234",     "role_slug": "production_manager", "phone": "+91-9876543215"},
    {"name": "Sunita Joshi",       "email": "accounts@oregenal.com",   "password": "Accounts@1234", "role_slug": "accounts_manager",   "phone": "+91-9876543216"},
    {"name": "Priya Nair",         "email": "hr@oregenal.com",         "password": "Hr@123456",     "role_slug": "hr_manager",         "phone": "+91-9876543217"},
    {"name": "Deepak Mehta",       "email": "sales@oregenal.com",      "password": "Sales@1234",    "role_slug": "sales_manager",      "phone": "+91-9876543218"},
    {"name": "Ravi Verma",         "email": "viewer@oregenal.com",     "password": "View@1234",     "role_slug": "viewer",             "phone": "+91-9876543219"},
]

# ── Departments ────────────────────────────────────────────────────────────

DEPARTMENTS = [
    {"name": "Manufacturing",     "code": "MFG"},
    {"name": "Quality Assurance", "code": "QA"},
    {"name": "Accounts",          "code": "ACC"},
    {"name": "Human Resources",   "code": "HR"},
    {"name": "Sales",             "code": "SLS"},
    {"name": "Purchase",          "code": "PUR"},
    {"name": "Stores",            "code": "STR"},
    {"name": "Dispatch",          "code": "DSP"},
    {"name": "R&D",               "code": "RND"},
    {"name": "IT",                "code": "IT"},
]


# ── Safe execute with SAVEPOINT ────────────────────────────────────────────

async def safe_exec(conn, label: str, sql: str, params: dict | None = None) -> bool:
    """
    Execute SQL inside a SAVEPOINT.
    - On duplicate/unique violation: silently skip, ROLLBACK TO SAVEPOINT
    - On other errors: print warning, ROLLBACK TO SAVEPOINT
    - On success: RELEASE SAVEPOINT
    Returns True on success, False on any error.
    """
    sp = f"sp_{label.replace('-', '_').replace('@', '_').replace('.', '_')}"
    try:
        await conn.execute(text(f"SAVEPOINT {sp}"))
        if params:
            await conn.execute(text(sql), params)
        else:
            await conn.execute(text(sql))
        await conn.execute(text(f"RELEASE SAVEPOINT {sp}"))
        return True
    except Exception as e:
        # Always rollback to savepoint — this un-poisons the transaction
        try:
            await conn.execute(text(f"ROLLBACK TO SAVEPOINT {sp}"))
        except Exception:
            pass
        msg = str(e).lower()
        if any(x in msg for x in ["duplicate", "unique", "already exists"]):
            return False  # silent skip — expected on re-run
        print(f"  ⚠️  Warning [{label}]: {str(e)[:150]}")
        return False


# ── Seed function ──────────────────────────────────────────────────────────

async def seed() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:

        # ── Tenant ───────────────────────────────────────────────────
        existing_tenant = (await conn.execute(text(
            "SELECT id FROM tenants WHERE slug = 'oregenal' LIMIT 1"
        ))).fetchone()

        if existing_tenant:
            tid = str(existing_tenant[0])
            print(f"  ✓ Tenant already exists: {tid}")
        else:
            tid = uid()
            ok = await safe_exec(conn, "tenant", """
                INSERT INTO tenants (id, name, slug, plan, is_active, settings, primary_color)
                VALUES (
                    :id, :name, :slug, :plan, true,
                    '{"currency":"INR","timezone":"Asia/Kolkata","modules_enabled":["crm","sales","purchase","inventory","manufacturing","qc","accounts","hr","reports","gate","dispatch","masters","finance","gst","payroll","maintenance","costing","documents"]}',
                    '#4F46E5'
                )
            """, {
                "id":   tid,
                "name": "Oregenal Electrical India Private Limited",
                "slug": "oregenal",
                "plan": "enterprise",
            })
            if ok:
                print(f"  ✅ Tenant created: {tid}")
            else:
                # Tenant may already exist under a different slug check — fetch it
                existing_tenant = (await conn.execute(text(
                    "SELECT id FROM tenants LIMIT 1"
                ))).fetchone()
                if existing_tenant:
                    tid = str(existing_tenant[0])
                    print(f"  ✓ Tenant fallback: {tid}")
                else:
                    print("  ❌ Could not create or find tenant. Aborting.")
                    await engine.dispose()
                    return

        # ── Roles ────────────────────────────────────────────────────
        print("\n📋 Seeding roles...")
        role_id_map: dict[str, str] = {}

        for role in ROLES:
            existing = (await conn.execute(text(
                "SELECT id FROM roles WHERE tenant_id = :tid AND slug = :slug LIMIT 1"
            ), {"tid": tid, "slug": role["slug"]})).fetchone()

            if existing:
                role_id_map[role["slug"]] = str(existing[0])
                print(f"  ✓ Role exists: {role['slug']}")
            else:
                rid = uid()
                ok = await safe_exec(conn, f"role-{role['slug']}", """
                    INSERT INTO roles (
                        id, tenant_id, name, slug, description,
                        level, is_system, permissions
                    ) VALUES (
                        :id, :tid, :name, :slug, :description,
                        :level, :is_system, :permissions
                    )
                """, {
                    "id":          rid,
                    "tid":         tid,
                    "name":        role["name"],
                    "slug":        role["slug"],
                    "description": role["description"],
                    "level":       role["level"],
                    "is_system":   role["is_system"],
                    "permissions": role["permissions"],
                })
                if ok:
                    role_id_map[role["slug"]] = rid
                    print(f"  ✅ Role created: {role['slug']} (level={role['level']})")
                else:
                    # Try to fetch it — it might have been created with a conflict
                    row = (await conn.execute(text(
                        "SELECT id FROM roles WHERE tenant_id = :tid AND slug = :slug LIMIT 1"
                    ), {"tid": tid, "slug": role["slug"]})).fetchone()
                    if row:
                        role_id_map[role["slug"]] = str(row[0])
                        print(f"  ✓ Role recovered: {role['slug']}")

        # ── Users ────────────────────────────────────────────────────
        print("\n👤 Seeding users...")

        for u in USERS:
            existing = (await conn.execute(text(
                "SELECT id FROM users WHERE tenant_id = :tid AND email = :email LIMIT 1"
            ), {"tid": tid, "email": u["email"]})).fetchone()

            if existing:
                print(f"  ✓ User exists: {u['email']}")
            else:
                uid_val  = uid()
                role_id  = role_id_map.get(u["role_slug"])
                if not role_id:
                    print(f"  ⚠️  Skipping user {u['email']} — role_id not found for {u['role_slug']}")
                    continue

                ok = await safe_exec(conn, f"user-{u['email']}", """
                    INSERT INTO users (
                        id, tenant_id, role_id, role,
                        name, email, hashed_password, phone,
                        is_active, is_email_verified,
                        extra_permissions, preferences
                    ) VALUES (
                        :id, :tid, :role_id, :role,
                        :name, :email, :hashed_password, :phone,
                        true, true,
                        '{}', '{}'
                    )
                """, {
                    "id":              uid_val,
                    "tid":             tid,
                    "role_id":         role_id,
                    "role":            u["role_slug"],
                    "name":            u["name"],
                    "email":           u["email"],
                    "hashed_password": hp(u["password"]),
                    "phone":           u["phone"],
                })
                if ok:
                    print(f"  ✅ User created: {u['email']} → {u['role_slug']}")

        # ── Departments ──────────────────────────────────────────────
        print("\n🏢 Seeding departments...")

        dept_table_exists = (await conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'departments'
            )
        """))).scalar_one()

        if dept_table_exists:
            for dept in DEPARTMENTS:
                existing = (await conn.execute(text(
                    "SELECT id FROM departments WHERE tenant_id = :tid AND code = :code LIMIT 1"
                ), {"tid": tid, "code": dept["code"]})).fetchone()

                if existing:
                    print(f"  ✓ Department exists: {dept['name']}")
                else:
                    ok = await safe_exec(conn, f"dept-{dept['code']}", """
                        INSERT INTO departments (id, tenant_id, name, code, is_active)
                        VALUES (:id, :tid, :name, :code, true)
                    """, {
                        "id":   uid(),
                        "tid":  tid,
                        "name": dept["name"],
                        "code": dept["code"],
                    })
                    if ok:
                        print(f"  ✅ Department created: {dept['name']}")
        else:
            print("  ⚠️  departments table not found — run migration 019 first.")

    await engine.dispose()
    print("\n✅  RBAC seed complete!")
    print("\n🔑 Login credentials:")
    print("  Super Admin:        admin@oregenal.com     / Oregenal@2024")
    print("  Admin:              rahul@oregenal.com     / Admin@1234")
    print("  Store Manager:      store@oregenal.com     / Store@1234")
    print("  IQC Inspector:      qc@oregenal.com        / Qc@12345678")
    print("  Gate Guard:         gate@oregenal.com      / Gate@1234")
    print("  Production Manager: prod@oregenal.com      / Prod@1234")
    print("  Accounts Manager:   accounts@oregenal.com  / Accounts@1234")
    print("  HR Manager:         hr@oregenal.com        / Hr@123456")
    print("  Sales Manager:      sales@oregenal.com     / Sales@1234")
    print("  Viewer:             viewer@oregenal.com    / View@1234")


if __name__ == "__main__":
    asyncio.run(seed())