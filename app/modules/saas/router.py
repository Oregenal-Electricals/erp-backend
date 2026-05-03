"""
Oregenal ERP — SaaS / Tenant Router
================================
Endpoints:
  POST /saas/register             register new tenant (public)
  GET  /saas/plan                 get current plan
  PUT  /saas/plan                 upgrade/change plan
  GET  /saas/usage                usage metrics
  GET  /saas/tenants              list all tenants (superadmin only)
  PUT  /saas/tenants/{id}         update tenant (superadmin only)
  POST /saas/tenants/{id}/suspend suspend tenant
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from uuid import UUID
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel, EmailStr, field_validator
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, require_admin
from app.core.security import hash_password
from app.models.user import User, Role
from app.models.tenant import Tenant

router = APIRouter(prefix="/saas", tags=["SaaS"])


# ── Subscription plans ─────────────────────────────────────────────────
PLANS = {
    "free": {
        "id":        "free",
        "name":      "Free",
        "price_monthly": 0,
        "price_yearly":  0,
        "currency":  "INR",
        "limits": {
            "users":    3,
            "records":  500,
            "storage_gb": 1,
            "modules":  ["crm", "sales", "inventory"],
            "api_calls_per_day": 1000,
        },
        "features": ["Basic CRM", "Sales Orders", "Inventory", "5 custom fields", "Email support"],
    },
    "starter": {
        "id":        "starter",
        "name":      "Starter",
        "price_monthly": 2999,
        "price_yearly":  29990,
        "currency":  "INR",
        "limits": {
            "users":    10,
            "records":  10000,
            "storage_gb": 10,
            "modules":  ["crm", "sales", "purchase", "inventory", "manufacturing", "qc", "accounts", "hr"],
            "api_calls_per_day": 10000,
        },
        "features": ["All modules", "50 custom fields", "PDF documents", "Basic reports", "Priority support"],
    },
    "pro": {
        "id":        "pro",
        "name":      "Professional",
        "price_monthly": 7999,
        "price_yearly":  79990,
        "currency":  "INR",
        "limits": {
            "users":    50,
            "records":  100000,
            "storage_gb": 100,
            "modules":  ["*"],
            "api_calls_per_day": 100000,
        },
        "features": [
            "Everything in Starter",
            "Unlimited custom fields",
            "Advanced reports + export",
            "Workflow automation",
            "API access",
            "Dedicated support",
            "Custom domain",
            "SSO / SAML",
        ],
    },
    "enterprise": {
        "id":        "enterprise",
        "name":      "Enterprise",
        "price_monthly": None,
        "price_yearly":  None,
        "currency":  "INR",
        "limits": {"users": -1, "records": -1, "storage_gb": -1, "modules": ["*"], "api_calls_per_day": -1},
        "features": ["Everything in Pro", "Unlimited everything", "On-premise option", "Custom contract", "SLA guarantee", "Dedicated CSM"],
    },
}


# ── Schemas ────────────────────────────────────────────────────────────
class TenantRegisterRequest(BaseModel):
    # Company
    company_name: str
    company_slug: Optional[str] = None
    industry:     Optional[str] = None

    # Admin user
    admin_name:     str
    admin_email:    str
    admin_password: str
    admin_phone:    Optional[str] = None

    # Plan
    plan: str = "free"

    @field_validator("admin_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("company_slug")
    @classmethod
    def slug_format(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError("Slug must be lowercase letters, numbers, and hyphens only")
        return v


class PlanChangeRequest(BaseModel):
    plan:        str
    billing:     str = "monthly"   # monthly | yearly
    coupon_code: Optional[str] = None


class TenantUpdateRequest(BaseModel):
    name:     Optional[str] = None
    plan:     Optional[str] = None
    is_active:Optional[bool] = None


# ── Registration ───────────────────────────────────────────────────────
@router.post("/register", status_code=201)
async def register_tenant(
    payload: TenantRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Creates a new tenant + admin user in one transaction.
    """
    # Check plan is valid
    if payload.plan not in PLANS:
        raise HTTPException(400, f"Invalid plan. Choose from: {', '.join(PLANS.keys())}")

    # Generate slug from company name if not provided
    slug = payload.company_slug or re.sub(r'[^a-z0-9]+', '-', payload.company_name.lower()).strip('-')

    # Check slug uniqueness
    existing_slug = await db.execute(select(Tenant).where(Tenant.slug == slug))
    if existing_slug.scalar_one_or_none():
        raise HTTPException(409, f"Company slug '{slug}' already taken. Try a different name or provide a custom slug.")

    # Check email uniqueness
    existing_email = await db.execute(select(User).where(User.email == payload.admin_email.lower()))
    if existing_email.scalar_one_or_none():
        raise HTTPException(409, "An account with this email already exists.")

    # Create tenant
    tenant = Tenant(
        name=payload.company_name,
        slug=slug,
        plan=payload.plan,
        is_active=True,
        settings={
            "industry": payload.industry,
            "registered_at": datetime.now(timezone.utc).isoformat(),
            "billing": "monthly",
        },
    )
    db.add(tenant)
    await db.flush()

    # Create super_admin role for this tenant
    role_result = await db.execute(
        select(Role).where(Role.tenant_id == tenant.id, Role.name == "super_admin")
    )
    role = role_result.scalar_one_or_none()
    if not role:
        role = Role(
            tenant_id=tenant.id,
            name="super_admin",
            display_name="Super Admin",
            level=100,
            permissions={"*": ["*"]},
        )
        db.add(role)
        await db.flush()

    # Create admin user
    admin = User(
        tenant_id=tenant.id,
        role_id=role.id,
        name=payload.admin_name,
        email=payload.admin_email.lower().strip(),
        hashed_password=hash_password(payload.admin_password),
        phone=payload.admin_phone,
        role="super_admin",
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    await db.flush()

    return {
        "success":    True,
        "tenant_id":  str(tenant.id),
        "tenant_slug": slug,
        "message":    f"Welcome to Oregenal ERP! Your workspace '{payload.company_name}' is ready.",
        "plan":       PLANS[payload.plan],
        "next_steps": [
            "Login at /login with your admin credentials",
            "Complete your company profile at /settings/modules",
            "Add your first product at /inventory",
            "Create your first sales order at /sales",
        ],
    }


# ── Plan management ────────────────────────────────────────────────────
@router.get("/plans")
async def list_plans():
    """Public — returns all available plans."""
    return {"plans": list(PLANS.values())}


@router.get("/plan")
async def get_current_plan(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    plan_key = getattr(tenant, "plan", "free") or "free"
    plan = PLANS.get(plan_key, PLANS["free"])

    return {
        "tenant_id":    str(tenant.id),
        "tenant_name":  tenant.name,
        "current_plan": plan,
        "billing":      tenant.settings.get("billing", "monthly") if tenant.settings else "monthly",
        "next_renewal": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
    }


@router.put("/plan")
async def change_plan(
    payload: PlanChangeRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.plan not in PLANS:
        raise HTTPException(400, f"Invalid plan. Available: {', '.join(PLANS.keys())}")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant: raise HTTPException(404, "Tenant not found")

    old_plan = getattr(tenant, "plan", "free")
    tenant.plan = payload.plan
    if not tenant.settings:
        tenant.settings = {}
    tenant.settings["billing"] = payload.billing
    tenant.settings["plan_changed_at"] = datetime.now(timezone.utc).isoformat()

    new_plan = PLANS[payload.plan]

    return {
        "success":  True,
        "old_plan": old_plan,
        "new_plan": payload.plan,
        "plan":     new_plan,
        "message":  f"Plan changed to {new_plan['name']}",
        "note":     "In production, billing would be processed here via Razorpay/Stripe.",
    }


# ── Usage metrics ──────────────────────────────────────────────────────
@router.get("/usage")
async def get_usage(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    tid = str(current_user.tenant_id)

    def safe_count(q): return q or 0

    try:
        users_count = (await db.execute(text(f"SELECT COUNT(*) FROM users WHERE tenant_id='{tid}'"))).scalar()
        orders_count = (await db.execute(text(f"SELECT COUNT(*) FROM sales_orders WHERE tenant_id='{tid}' AND deleted_at IS NULL"))).scalar()
        leads_count = (await db.execute(text(f"SELECT COUNT(*) FROM crm_leads WHERE tenant_id='{tid}' AND deleted_at IS NULL"))).scalar()
        products_count = (await db.execute(text(f"SELECT COUNT(*) FROM inventory_products WHERE tenant_id='{tid}' AND deleted_at IS NULL"))).scalar()
    except Exception:
        users_count = orders_count = leads_count = products_count = 0

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    plan_key = getattr(tenant, "plan", "free") or "free"
    limits = PLANS[plan_key]["limits"]

    return {
        "plan": plan_key,
        "usage": {
            "users":    {"current": safe_count(users_count),   "limit": limits["users"],   "pct": round(safe_count(users_count)   / max(limits["users"],1)   * 100, 1) if limits["users"] > 0 else 0},
            "records":  {"current": safe_count(orders_count) + safe_count(leads_count) + safe_count(products_count), "limit": limits["records"], "pct": 0},
            "storage":  {"current": "0.2 GB", "limit": f'{limits["storage_gb"]} GB'},
        },
    }


# ── Tenant list (superadmin only) ──────────────────────────────────────
@router.get("/tenants")
async def list_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in ("super_admin",):
        raise HTTPException(403, "Superadmin only")

    offset = (page - 1) * page_size
    q = select(Tenant).order_by(Tenant.created_at.desc()).offset(offset).limit(page_size)
    total = (await db.execute(select(func.count(Tenant.id)))).scalar_one()
    tenants = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": str(t.id), "name": t.name, "slug": t.slug,
                "plan": getattr(t, "plan", "free"),
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat() if t.created_at else "",
            }
            for t in tenants
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ── Company Branding & Settings ────────────────────────────────────────
class BrandingUpdate(BaseModel):
    company_name:   Optional[str] = None
    primary_color:  Optional[str] = None
    logo_url:       Optional[str] = None
    address:        Optional[str] = None
    gstin:          Optional[str] = None
    pan:            Optional[str] = None
    phone:          Optional[str] = None
    email:          Optional[str] = None
    website:        Optional[str] = None
    currency:       Optional[str] = None
    timezone:       Optional[str] = None
    financial_year_start: Optional[str] = None


@router.get("/company")
async def get_company(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current company/tenant settings."""
    result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    settings = tenant.settings or {}
    return {
        "id":            str(tenant.id),
        "company_name":  tenant.name,
        "slug":          tenant.slug,
        "plan":          tenant.plan,
        "primary_color": tenant.primary_color or "#4F46E5",
        "logo_url":      tenant.logo_url,
        "address":       settings.get("address"),
        "gstin":         settings.get("gstin"),
        "pan":           settings.get("pan"),
        "phone":         settings.get("phone"),
        "email":         settings.get("email"),
        "website":       settings.get("website"),
        "currency":      settings.get("currency", "INR"),
        "timezone":      settings.get("timezone", "Asia/Kolkata"),
        "financial_year_start": settings.get("financial_year_start", "04"),
    }


@router.put("/company")
async def update_company(
    payload: BrandingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update company branding and settings."""
    result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    if payload.company_name:  tenant.name          = payload.company_name
    if payload.primary_color: tenant.primary_color = payload.primary_color
    if payload.logo_url is not None: tenant.logo_url = payload.logo_url

    # Store rest in settings JSON
    settings = dict(tenant.settings or {})
    for field in ["address","gstin","pan","phone","email","website","currency","timezone","financial_year_start"]:
        val = getattr(payload, field, None)
        if val is not None:
            settings[field] = val
    tenant.settings = settings

    await db.flush()
    return {"success": True, "message": "Company settings updated"}
