"""
Database Seed Script
====================
Run once after first migration to populate:
  - Demo tenant
  - System roles (super_admin, admin, manager, staff, viewer)
  - Super admin user
  - Demo users
  - Default status configs for each module
  - Sample workflow rules

Usage:
    python -m scripts.seed
    # OR from project root:
    python scripts/seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User, Role, Department
from app.models.customization import StatusConfig
from app.models.engines import WorkflowRule


engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Default permissions per role ──────────────────────────────────────
ALL_MODULES = ["crm", "sales", "purchase", "inventory", "manufacturing", "qc", "accounts", "hr", "reports"]
ALL_ACTIONS = ["view", "create", "edit", "delete", "approve", "export"]

ROLE_PERMISSIONS = {
    "super_admin": {m: ALL_ACTIONS for m in ALL_MODULES},
    "admin":       {m: ALL_ACTIONS for m in ALL_MODULES},
    "manager":     {m: ["view", "create", "edit", "approve", "export"] for m in ALL_MODULES},
    "staff":       {m: ["view", "create", "edit"] for m in ALL_MODULES},
    "viewer":      {m: ["view"] for m in ALL_MODULES},
}

# ── Default statuses per module ───────────────────────────────────────
DEFAULT_STATUSES = {
    "sales_orders": [
        {"name": "Draft",       "slug": "draft",       "color": "#6B7280", "bg_color": "#F9FAFB", "sort_order": 1, "is_initial": True,  "is_terminal": False, "allowed_transitions": ["pending", "cancelled"]},
        {"name": "Pending",     "slug": "pending",     "color": "#D97706", "bg_color": "#FFFBEB", "sort_order": 2, "is_initial": False, "is_terminal": False, "allowed_transitions": ["approved", "rejected"]},
        {"name": "Approved",    "slug": "approved",    "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 3, "is_initial": False, "is_terminal": False, "allowed_transitions": ["in_progress", "cancelled"]},
        {"name": "In Progress", "slug": "in_progress", "color": "#2563EB", "bg_color": "#EFF6FF", "sort_order": 4, "is_initial": False, "is_terminal": False, "allowed_transitions": ["completed"]},
        {"name": "Completed",   "slug": "completed",   "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 5, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
        {"name": "Cancelled",   "slug": "cancelled",   "color": "#DC2626", "bg_color": "#FEF2F2", "sort_order": 6, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
        {"name": "Rejected",    "slug": "rejected",    "color": "#DC2626", "bg_color": "#FEF2F2", "sort_order": 7, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
    ],
    "purchase_orders": [
        {"name": "Draft",     "slug": "draft",     "color": "#6B7280", "bg_color": "#F9FAFB", "sort_order": 1, "is_initial": True,  "is_terminal": False, "allowed_transitions": ["sent"]},
        {"name": "Sent",      "slug": "sent",      "color": "#2563EB", "bg_color": "#EFF6FF", "sort_order": 2, "is_initial": False, "is_terminal": False, "allowed_transitions": ["acknowledged", "cancelled"]},
        {"name": "Confirmed", "slug": "acknowledged","color":"#D97706","bg_color": "#FFFBEB", "sort_order": 3, "is_initial": False, "is_terminal": False, "allowed_transitions": ["received"]},
        {"name": "Received",  "slug": "received",  "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 4, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
        {"name": "Cancelled", "slug": "cancelled", "color": "#DC2626", "bg_color": "#FEF2F2", "sort_order": 5, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
    ],
    "manufacturing_orders": [
        {"name": "Planned",    "slug": "planned",    "color": "#6B7280", "bg_color": "#F9FAFB", "sort_order": 1, "is_initial": True,  "is_terminal": False, "allowed_transitions": ["in_production"]},
        {"name": "Production", "slug": "in_production","color":"#2563EB","bg_color": "#EFF6FF", "sort_order": 2, "is_initial": False, "is_terminal": False, "allowed_transitions": ["qc_pending"]},
        {"name": "QC Pending", "slug": "qc_pending", "color": "#D97706", "bg_color": "#FFFBEB", "sort_order": 3, "is_initial": False, "is_terminal": False, "allowed_transitions": ["qc_passed", "qc_failed"]},
        {"name": "QC Passed",  "slug": "qc_passed",  "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 4, "is_initial": False, "is_terminal": False, "allowed_transitions": ["dispatched"]},
        {"name": "QC Failed",  "slug": "qc_failed",  "color": "#DC2626", "bg_color": "#FEF2F2", "sort_order": 5, "is_initial": False, "is_terminal": False, "allowed_transitions": ["in_production"]},
        {"name": "Dispatched", "slug": "dispatched", "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 6, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
    ],
    "crm_leads": [
        {"name": "New",         "slug": "new",         "color": "#2563EB", "bg_color": "#EFF6FF", "sort_order": 1, "is_initial": True,  "is_terminal": False, "allowed_transitions": ["contacted"]},
        {"name": "Contacted",   "slug": "contacted",   "color": "#D97706", "bg_color": "#FFFBEB", "sort_order": 2, "is_initial": False, "is_terminal": False, "allowed_transitions": ["qualified", "lost"]},
        {"name": "Qualified",   "slug": "qualified",   "color": "#7C3AED", "bg_color": "#F5F3FF", "sort_order": 3, "is_initial": False, "is_terminal": False, "allowed_transitions": ["proposal", "lost"]},
        {"name": "Proposal",    "slug": "proposal",    "color": "#0891B2", "bg_color": "#ECFEFF", "sort_order": 4, "is_initial": False, "is_terminal": False, "allowed_transitions": ["won", "lost"]},
        {"name": "Won",         "slug": "won",         "color": "#059669", "bg_color": "#ECFDF5", "sort_order": 5, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
        {"name": "Lost",        "slug": "lost",        "color": "#DC2626", "bg_color": "#FEF2F2", "sort_order": 6, "is_initial": False, "is_terminal": True,  "allowed_transitions": []},
    ],
}

# ── Default workflow rules ────────────────────────────────────────────
DEFAULT_WORKFLOWS = [
    {
        "name": "High Value Order — Manager Approval",
        "module": "sales_orders",
        "trigger": {"event": "record_created"},
        "conditions": [{"field": "amount", "operator": "greater_than", "value": 100000}],
        "actions": [{"type": "notify", "targets": ["role:manager"]}, {"type": "require_approval", "chain_id": None}],
    },
    {
        "name": "Low Stock Alert",
        "module": "inventory",
        "trigger": {"event": "field_updated", "field": "stock"},
        "conditions": [{"field": "stock", "operator": "less_than", "value": "reorder_point"}],
        "actions": [{"type": "notify", "targets": ["role:manager", "role:store_keeper"]}],
    },
    {
        "name": "Manufacturing Complete → QC",
        "module": "manufacturing_orders",
        "trigger": {"event": "status_changed", "to_status": "in_production"},
        "conditions": [],
        "actions": [{"type": "notify", "targets": ["role:qc_manager"]}],
    },
]


async def seed():
    print("🌱 Starting database seed...")

    async with Session() as db:
        # ── 1. Create demo tenant ──────────────────────────────────────
        tenant = Tenant(
            name=settings.DEMO_TENANT_NAME,
            slug=settings.DEMO_TENANT_SLUG,
            plan="pro",
            is_active=True,
            settings={
                "currency": "INR",
                "timezone": "Asia/Kolkata",
                "date_format": "DD/MM/YYYY",
                "financial_year_start": "04",
                "modules_enabled": ALL_MODULES,
                "gstin": "27AABCU9603R1ZX",
                "address": "123 Industrial Area, Mumbai, Maharashtra 400001",
            },
        )
        db.add(tenant)
        await db.flush()
        print(f"  ✅ Tenant created: {tenant.name} (slug: {tenant.slug})")

        # ── 2. Create system roles ────────────────────────────────────
        roles_map = {}
        for role_slug, perms in ROLE_PERMISSIONS.items():
            role = Role(
                tenant_id=tenant.id,
                name=role_slug.replace("_", " ").title(),
                slug=role_slug,
                level={"super_admin": 100, "admin": 90, "manager": 50, "staff": 10, "viewer": 1}[role_slug],
                permissions=perms,
                is_system=True,
            )
            db.add(role)
            await db.flush()
            roles_map[role_slug] = role
        print(f"  ✅ {len(roles_map)} roles created")

        # ── 3. Create departments ──────────────────────────────────────
        depts = {}
        for dept_name in ["Sales", "Purchase", "Production", "QC", "Accounts", "HR", "IT"]:
            dept = Department(
                tenant_id=tenant.id,
                name=dept_name,
                code=dept_name[:3].upper(),
                is_active=True,
            )
            db.add(dept)
            await db.flush()
            depts[dept_name] = dept
        print(f"  ✅ {len(depts)} departments created")

        # ── 4. Create super admin user ────────────────────────────────
        admin = User(
            tenant_id=tenant.id,
            role_id=roles_map["super_admin"].id,
            name=settings.SUPERADMIN_NAME,
            email=settings.SUPERADMIN_EMAIL,
            hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
            role="super_admin",
            is_active=True,
            is_email_verified=True,
        )
        db.add(admin)

        # ── 5. Create demo users ──────────────────────────────────────
        demo_users = [
            {"name": "Rahul Mehta",    "email": "manager@demo.com",   "role": "manager",  "dept": "Sales"},
            {"name": "Priya Sharma",   "email": "sales@demo.com",     "role": "staff",    "dept": "Sales"},
            {"name": "Amit Kumar",     "email": "purchase@demo.com",  "role": "staff",    "dept": "Purchase"},
            {"name": "Sunita Patel",   "email": "accounts@demo.com",  "role": "staff",    "dept": "Accounts"},
            {"name": "Raj Verma",      "email": "production@demo.com","role": "staff",    "dept": "Production"},
            {"name": "Meena Singh",    "email": "qc@demo.com",        "role": "staff",    "dept": "QC"},
            {"name": "Viewer User",    "email": "viewer@demo.com",    "role": "viewer",   "dept": "Sales"},
        ]
        for u in demo_users:
            user = User(
                tenant_id=tenant.id,
                role_id=roles_map[u["role"]].id,
                department_id=depts[u["dept"]].id if u["dept"] in depts else None,
                name=u["name"],
                email=u["email"],
                hashed_password=hash_password("demo1234"),
                role=u["role"],
                is_active=True,
                is_email_verified=True,
            )
            db.add(user)
        await db.flush()
        print(f"  ✅ {len(demo_users) + 1} users created (all password: demo1234)")

        # ── 6. Create default status configs ──────────────────────────
        status_count = 0
        for module, statuses in DEFAULT_STATUSES.items():
            for s in statuses:
                obj = StatusConfig(tenant_id=tenant.id, module=module, **s)
                db.add(obj)
                status_count += 1
        await db.flush()
        print(f"  ✅ {status_count} status configs created")

        # ── 7. Create default workflow rules ──────────────────────────
        for wf in DEFAULT_WORKFLOWS:
            rule = WorkflowRule(
                tenant_id=tenant.id,
                is_active=True,
                run_count=0,
                **wf,
            )
            db.add(rule)
        await db.flush()
        print(f"  ✅ {len(DEFAULT_WORKFLOWS)} workflow rules created")

        await db.commit()

    print("\n🎉 Seed complete!")
    print(f"\nLogin credentials:")
    print(f"  Admin:      {settings.SUPERADMIN_EMAIL} / {settings.SUPERADMIN_PASSWORD}")
    print(f"  Manager:    manager@demo.com / demo1234")
    print(f"  Sales:      sales@demo.com / demo1234")
    print(f"  Accounts:   accounts@demo.com / demo1234")
    print(f"  Viewer:     viewer@demo.com / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
