"""
Master Setup Module — Router
==============================
Covers:
  Company Setup        GET/PUT  /master/company
  Branches             CRUD     /master/branches
  Financial Years      CRUD     /master/financial-years
  Numbering Series     GET/PUT  /master/number-series
  Approval Rules       GET/PUT  /master/approval-rules
  Change Req Settings  GET/PUT  /master/change-request-settings
  Test Data            POST/DELETE /master/test-data
  Audit Log            GET      /master/audit-log

Permission rules:
  - All GET endpoints: admin + super_admin
  - All write endpoints: super_admin only
  - Purge test data: super_admin only (hard-coded, not in role matrix)

Audit logging:
  - Every write operation appends a row to audit_log table
  - Captures old value, new value, user, IP, timestamp
"""
import math
from datetime import date, datetime, timezone
from typing import Optional, List, Any
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.master import (
    Company, Branch, FinancialYear, NumberSeries,
    ApprovalRule, ChangeRequestSetting, AuditLog,
)

router = APIRouter(prefix="/master", tags=["Master Setup"])


# ═══════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════

# All document types that can have number series, approval rules, and
# change request settings configured.
DOCUMENT_TYPES = [
    "purchase_order",
    "sales_order",
    "gate_entry",
    "delivery_challan",
    "qc_inspection",
    "work_order",
    "invoice",
    "payment",
    "journal_entry",
    "goods_receipt_note",
]

DOCUMENT_LABELS = {
    "purchase_order":    "Purchase Order",
    "sales_order":       "Sales Order",
    "gate_entry":        "Gate Entry",
    "delivery_challan":  "Delivery Challan",
    "qc_inspection":     "QC Inspection",
    "work_order":        "Work Order",
    "invoice":           "Invoice",
    "payment":           "Payment",
    "journal_entry":     "Journal Entry",
    "goods_receipt_note":"Goods Receipt Note (GRN)",
}


# ═══════════════════════════════════════════════════════════════════════
# PERMISSION HELPERS
# ═══════════════════════════════════════════════════════════════════════

def _require_super_admin(user: User):
    """Raise 403 if caller is not super_admin."""
    if user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only Super Admin can perform this action.",
        )


def _require_admin_or_above(user: User):
    """Raise 403 if caller is not admin or super_admin."""
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Super Admin can view master settings.",
        )


# ═══════════════════════════════════════════════════════════════════════
# AUDIT LOG HELPER
# ═══════════════════════════════════════════════════════════════════════

async def _write_audit(
    db:              AsyncSession,
    user:            User,
    action:          str,
    module:          str,
    request:         Optional[Request] = None,
    document_type:   Optional[str]     = None,
    document_id:     Optional[UUID]    = None,
    document_number: Optional[str]     = None,
    old_value:       Optional[dict]    = None,
    new_value:       Optional[dict]    = None,
    notes:           Optional[str]     = None,
):
    """Append one row to audit_log. Silent on error — never block business logic."""
    try:
        ip = None
        ua = None
        if request:
            fwd = request.headers.get("X-Forwarded-For")
            ip  = fwd.split(",")[0].strip() if fwd else (
                  request.client.host if request.client else None)
            ua  = request.headers.get("User-Agent", "")[:500]

        log = AuditLog(
            tenant_id       = user.tenant_id,
            user_id         = user.id,
            user_name       = user.name,
            user_role       = user.role,
            action          = action,
            module          = module,
            document_type   = document_type,
            document_id     = document_id,
            document_number = document_number,
            old_value       = old_value,
            new_value       = new_value,
            ip_address      = ip,
            user_agent      = ua,
            notes           = notes,
        )
        db.add(log)
        # Flush but don't commit — the caller's transaction commits everything
        await db.flush()
    except Exception:
        pass  # audit failures must never break the main operation


# ═══════════════════════════════════════════════════════════════════════
# SERIALIZERS
# ═══════════════════════════════════════════════════════════════════════

def _co(c: Company) -> dict:
    return {
        "id": str(c.id), "name": c.name, "legal_name": c.legal_name,
        "gstin": c.gstin, "pan": c.pan, "cin": c.cin, "tan": c.tan,
        "address_line1": c.address_line1, "address_line2": c.address_line2,
        "city": c.city, "state": c.state, "pincode": c.pincode,
        "country": c.country,
        "phone": c.phone, "email": c.email, "website": c.website,
        "logo_url": c.logo_url, "stamp_url": c.stamp_url,
        "signature_url": c.signature_url, "primary_color": c.primary_color,
        "currency": c.currency, "timezone": c.timezone,
        "date_format": c.date_format,
        "fiscal_year_start_month": c.fiscal_year_start_month,
        "is_active": c.is_active, "is_test_data": c.is_test_data,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


def _br(b: Branch) -> dict:
    return {
        "id": str(b.id), "name": b.name, "code": b.code,
        "branch_type": b.branch_type,
        "company_id": str(b.company_id) if b.company_id else None,
        "address_line1": b.address_line1, "address_line2": b.address_line2,
        "city": b.city, "state": b.state, "pincode": b.pincode,
        "gstin": b.gstin, "phone": b.phone, "email": b.email,
        "is_head_office": b.is_head_office,
        "is_active": b.is_active, "is_test_data": b.is_test_data,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


def _fy(f: FinancialYear) -> dict:
    return {
        "id": str(f.id), "name": f.name,
        "start_date": f.start_date.isoformat() if f.start_date else None,
        "end_date":   f.end_date.isoformat()   if f.end_date   else None,
        "is_active": f.is_active, "is_closed": f.is_closed,
        "is_test_data": f.is_test_data,
        "closed_at": f.closed_at.isoformat() if f.closed_at else None,
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


def _ns(n: NumberSeries) -> dict:
    return {
        "id": str(n.id),
        "document_type": n.document_type,
        "document_label": DOCUMENT_LABELS.get(n.document_type, n.document_type),
        "prefix": n.prefix, "include_year": n.include_year,
        "year_format": n.year_format, "separator": n.separator,
        "padding_digits": n.padding_digits,
        "current_number": n.current_number, "suffix": n.suffix,
        "is_active": n.is_active,
        "preview": _preview_number(n, n.current_number + 1),
        "updated_at": n.updated_at.isoformat() if n.updated_at else None,
    }


def _preview_number(ns: NumberSeries, next_num: int) -> str:
    """Generate a preview like PO-2425-0001."""
    parts = []
    if ns.prefix:
        parts.append(ns.prefix)
    if ns.include_year:
        today = date.today()
        yr = today.year
        # fiscal year logic: if month >= FY start (April=4), current FY
        # is yr to yr+1, else yr-1 to yr
        if today.month >= 4:
            fy_start, fy_end = yr, yr + 1
        else:
            fy_start, fy_end = yr - 1, yr
        fmt = ns.year_format or "YY-YY"
        if fmt == "YY-YY":
            year_str = f"{str(fy_start)[-2:]}-{str(fy_end)[-2:]}"
        elif fmt == "YYYY":
            year_str = str(fy_start)
        else:  # YY
            year_str = str(fy_start)[-2:]
        parts.append(year_str)
    num_str = str(next_num).zfill(ns.padding_digits or 4)
    parts.append(num_str)
    if ns.suffix:
        parts.append(ns.suffix)
    sep = ns.separator if ns.separator is not None else "-"
    return sep.join(parts)


def _ar(a: ApprovalRule) -> dict:
    return {
        "id": str(a.id),
        "document_type": a.document_type,
        "document_label": DOCUMENT_LABELS.get(a.document_type, a.document_type),
        "is_approval_required": a.is_approval_required,
        "auto_approve_below_amt": float(a.auto_approve_below_amt) if a.auto_approve_below_amt else None,
        "approver_role": a.approver_role,
        "escalation_hours": a.escalation_hours,
        "notify_on_submit": a.notify_on_submit,
        "notify_on_approve": a.notify_on_approve,
        "notify_on_reject": a.notify_on_reject,
        "is_active": a.is_active,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }


def _cr(c: ChangeRequestSetting) -> dict:
    return {
        "id": str(c.id),
        "document_type": c.document_type,
        "document_label": DOCUMENT_LABELS.get(c.document_type, c.document_type),
        "allow_change_request": c.allow_change_request,
        "who_can_raise": c.who_can_raise,
        "who_can_approve": c.who_can_approve,
        "requires_reason": c.requires_reason,
        "is_active": c.is_active,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


def _al(a: AuditLog) -> dict:
    return {
        "id": str(a.id),
        "user_id": str(a.user_id) if a.user_id else None,
        "user_name": a.user_name, "user_role": a.user_role,
        "action": a.action, "module": a.module,
        "document_type": a.document_type,
        "document_id": str(a.document_id) if a.document_id else None,
        "document_number": a.document_number,
        "old_value": a.old_value, "new_value": a.new_value,
        "ip_address": a.ip_address,
        "notes": a.notes,
        "is_test_data": a.is_test_data,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class CompanyUpdate(BaseModel):
    name:                    Optional[str] = None
    legal_name:              Optional[str] = None
    gstin:                   Optional[str] = None
    pan:                     Optional[str] = None
    cin:                     Optional[str] = None
    tan:                     Optional[str] = None
    address_line1:           Optional[str] = None
    address_line2:           Optional[str] = None
    city:                    Optional[str] = None
    state:                   Optional[str] = None
    pincode:                 Optional[str] = None
    country:                 Optional[str] = None
    phone:                   Optional[str] = None
    email:                   Optional[str] = None
    website:                 Optional[str] = None
    logo_url:                Optional[str] = None
    stamp_url:               Optional[str] = None
    signature_url:           Optional[str] = None
    primary_color:           Optional[str] = None
    currency:                Optional[str] = None
    timezone:                Optional[str] = None
    date_format:             Optional[str] = None
    fiscal_year_start_month: Optional[int] = None

    @field_validator("fiscal_year_start_month")
    @classmethod
    def valid_month(cls, v):
        if v is not None and not (1 <= v <= 12):
            raise ValueError("Month must be 1-12")
        return v


class BranchCreate(BaseModel):
    name:          str
    code:          Optional[str] = None
    branch_type:   str = "factory"
    company_id:    Optional[UUID] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city:          Optional[str] = None
    state:         Optional[str] = None
    pincode:       Optional[str] = None
    gstin:         Optional[str] = None
    phone:         Optional[str] = None
    email:         Optional[str] = None
    is_head_office: bool = False

    @field_validator("branch_type")
    @classmethod
    def valid_type(cls, v):
        allowed = ("factory", "warehouse", "office", "showroom")
        if v not in allowed:
            raise ValueError(f"branch_type must be one of {allowed}")
        return v


class BranchUpdate(BaseModel):
    name:          Optional[str]  = None
    code:          Optional[str]  = None
    branch_type:   Optional[str]  = None
    address_line1: Optional[str]  = None
    address_line2: Optional[str]  = None
    city:          Optional[str]  = None
    state:         Optional[str]  = None
    pincode:       Optional[str]  = None
    gstin:         Optional[str]  = None
    phone:         Optional[str]  = None
    email:         Optional[str]  = None
    is_head_office: Optional[bool] = None
    is_active:     Optional[bool] = None


class FinancialYearCreate(BaseModel):
    name:       str
    start_date: str   # YYYY-MM-DD
    end_date:   str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class NumberSeriesUpdate(BaseModel):
    prefix:         Optional[str]  = None
    include_year:   Optional[bool] = None
    year_format:    Optional[str]  = None
    separator:      Optional[str]  = None
    padding_digits: Optional[int]  = None
    suffix:         Optional[str]  = None
    is_active:      Optional[bool] = None

    @field_validator("year_format")
    @classmethod
    def valid_year_format(cls, v):
        if v is not None and v not in ("YY-YY", "YYYY", "YY"):
            raise ValueError("year_format must be YY-YY, YYYY, or YY")
        return v

    @field_validator("padding_digits")
    @classmethod
    def valid_padding(cls, v):
        if v is not None and not (1 <= v <= 8):
            raise ValueError("padding_digits must be 1-8")
        return v


class ApprovalRuleUpdate(BaseModel):
    is_approval_required:   Optional[bool]  = None
    auto_approve_below_amt: Optional[float] = None
    approver_role:          Optional[str]   = None
    escalation_hours:       Optional[int]   = None
    notify_on_submit:       Optional[bool]  = None
    notify_on_approve:      Optional[bool]  = None
    notify_on_reject:       Optional[bool]  = None


class ChangeRequestUpdate(BaseModel):
    allow_change_request: Optional[bool] = None
    who_can_raise:        Optional[str]  = None
    who_can_approve:      Optional[str]  = None
    requires_reason:      Optional[bool] = None


# ═══════════════════════════════════════════════════════════════════════
# SECTION 1 — COMPANY
# ═══════════════════════════════════════════════════════════════════════

@router.get("/company")
async def get_company(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the company profile. Visible to all logged-in users."""
    r = await db.execute(
        select(Company).where(
            Company.tenant_id == current_user.tenant_id,
            Company.is_active == True,
        ).limit(1)
    )
    company = r.scalar_one_or_none()
    if not company:
        return {}   # first-time setup — no company yet
    return _co(company)


@router.put("/company")
async def update_company(
    payload: CompanyUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update company profile. Super Admin only."""
    _require_super_admin(current_user)

    r = await db.execute(
        select(Company).where(
            Company.tenant_id == current_user.tenant_id,
            Company.is_active == True,
        ).limit(1)
    )
    company = r.scalar_one_or_none()

    if not company:
        # First-time creation
        company = Company(
            tenant_id   = current_user.tenant_id,
            created_by  = current_user.id,
            updated_by  = current_user.id,
            name        = payload.name or "My Company",
        )
        db.add(company)
        await db.flush()
        old_val = None
    else:
        old_val = _co(company)
        company.updated_by = current_user.id

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(company, k, v)

    await db.flush()
    await db.refresh(company)   # reload after flush so attributes are not expired

    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="company",
        document_id=company.id,
        old_value=old_val,
        new_value=_co(company),
    )
    return _co(company)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2 — BRANCHES
# ═══════════════════════════════════════════════════════════════════════

@router.get("/branches")
async def list_branches(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all branches. Admin+ only."""
    _require_admin_or_above(current_user)
    r = await db.execute(
        select(Branch).where(Branch.tenant_id == current_user.tenant_id)
        .order_by(Branch.is_head_office.desc(), Branch.name)
    )
    return {"items": [_br(b) for b in r.scalars().all()]}


@router.post("/branches", status_code=201)
async def create_branch(
    payload: BranchCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a branch / factory / warehouse. Super Admin only."""
    _require_super_admin(current_user)

    # If setting as head office, demote existing
    if payload.is_head_office:
        await db.execute(
            sa.update(Branch)
            .where(Branch.tenant_id == current_user.tenant_id)
            .values(is_head_office=False)
        )

    branch = Branch(
        tenant_id      = current_user.tenant_id,
        created_by     = current_user.id,
        updated_by     = current_user.id,
        **payload.model_dump(),
    )
    db.add(branch)
    await db.flush()
    await db.refresh(branch)

    await _write_audit(
        db, current_user, "create", "master",
        request=request, document_type="branch",
        document_id=branch.id, document_number=branch.code,
        new_value=_br(branch),
    )
    return _br(branch)


@router.put("/branches/{branch_id}")
async def update_branch(
    branch_id: UUID,
    payload:   BranchUpdate,
    request:   Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a branch. Super Admin only."""
    _require_super_admin(current_user)

    r = await db.execute(
        select(Branch).where(
            Branch.id == branch_id,
            Branch.tenant_id == current_user.tenant_id,
        )
    )
    branch = r.scalar_one_or_none()
    if not branch:
        raise HTTPException(404, "Branch not found")

    old_val = _br(branch)

    if payload.is_head_office:
        await db.execute(
            sa.update(Branch)
            .where(Branch.tenant_id == current_user.tenant_id, Branch.id != branch_id)
            .values(is_head_office=False)
        )

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(branch, k, v)
    branch.updated_by = current_user.id

    await db.flush()
    await db.refresh(branch)
    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="branch",
        document_id=branch.id,
        old_value=old_val, new_value=_br(branch),
    )
    return _br(branch)


@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: UUID,
    request:   Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a branch. Super Admin only."""
    _require_super_admin(current_user)

    r = await db.execute(
        select(Branch).where(
            Branch.id == branch_id,
            Branch.tenant_id == current_user.tenant_id,
        )
    )
    branch = r.scalar_one_or_none()
    if not branch:
        raise HTTPException(404, "Branch not found")
    if branch.is_head_office:
        raise HTTPException(400, "Cannot delete head office branch. Assign another branch as head office first.")

    branch.is_active = False
    branch.updated_by = current_user.id

    await _write_audit(
        db, current_user, "delete", "master",
        request=request, document_type="branch",
        document_id=branch.id,
        old_value=_br(branch),
    )
    return {"success": True, "message": f"Branch '{branch.name}' deactivated"}


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3 — FINANCIAL YEARS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/financial-years")
async def list_financial_years(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all financial years. Admin+ only."""
    _require_admin_or_above(current_user)
    r = await db.execute(
        select(FinancialYear).where(FinancialYear.tenant_id == current_user.tenant_id)
        .order_by(FinancialYear.start_date.desc())
    )
    return {"items": [_fy(f) for f in r.scalars().all()]}


@router.post("/financial-years", status_code=201)
async def create_financial_year(
    payload: FinancialYearCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new financial year. Super Admin only."""
    _require_super_admin(current_user)

    # Duplicate name check
    existing = await db.execute(
        select(FinancialYear).where(
            FinancialYear.tenant_id == current_user.tenant_id,
            FinancialYear.name == payload.name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Financial year '{payload.name}' already exists")

    fy = FinancialYear(
        tenant_id    = current_user.tenant_id,
        created_by   = current_user.id,
        updated_by   = current_user.id,
        name         = payload.name,
        start_date   = date.fromisoformat(payload.start_date),
        end_date     = date.fromisoformat(payload.end_date),
    )
    db.add(fy)
    await db.flush()

    await _write_audit(
        db, current_user, "create", "master",
        request=request, document_type="financial_year",
        document_id=fy.id, document_number=fy.name,
        new_value=_fy(fy),
    )
    return _fy(fy)


@router.put("/financial-years/{fy_id}/activate")
async def activate_financial_year(
    fy_id:   UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Set this financial year as active. Deactivates all others. Super Admin only."""
    _require_super_admin(current_user)

    r = await db.execute(
        select(FinancialYear).where(
            FinancialYear.id == fy_id,
            FinancialYear.tenant_id == current_user.tenant_id,
        )
    )
    fy = r.scalar_one_or_none()
    if not fy:
        raise HTTPException(404, "Financial year not found")
    if fy.is_closed:
        raise HTTPException(400, f"Financial year '{fy.name}' is already closed and cannot be reactivated")

    # Deactivate all
    await db.execute(
        sa.update(FinancialYear)
        .where(FinancialYear.tenant_id == current_user.tenant_id)
        .values(is_active=False)
    )
    fy.is_active = True
    fy.updated_by = current_user.id

    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="financial_year",
        document_id=fy.id, document_number=fy.name,
        notes=f"Activated financial year {fy.name}",
    )
    return _fy(fy)


@router.put("/financial-years/{fy_id}/close")
async def close_financial_year(
    fy_id:   UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently close a financial year. Super Admin only. Irreversible."""
    _require_super_admin(current_user)

    r = await db.execute(
        select(FinancialYear).where(
            FinancialYear.id == fy_id,
            FinancialYear.tenant_id == current_user.tenant_id,
        )
    )
    fy = r.scalar_one_or_none()
    if not fy:
        raise HTTPException(404, "Financial year not found")
    if fy.is_closed:
        raise HTTPException(400, f"Financial year '{fy.name}' is already closed")

    fy.is_closed  = True
    fy.is_active  = False
    fy.closed_by  = current_user.id
    fy.closed_at  = datetime.now(timezone.utc)
    fy.updated_by = current_user.id

    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="financial_year",
        document_id=fy.id, document_number=fy.name,
        notes=f"Closed financial year {fy.name}",
    )
    return _fy(fy)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4 — NUMBERING SERIES
# ═══════════════════════════════════════════════════════════════════════

async def _ensure_number_series(tenant_id: UUID, db: AsyncSession):
    """Ensure every document type has a NumberSeries row. Idempotent."""
    for doc_type in DOCUMENT_TYPES:
        exists = await db.execute(
            select(NumberSeries).where(
                NumberSeries.tenant_id    == tenant_id,
                NumberSeries.document_type == doc_type,
            )
        )
        if not exists.scalar_one_or_none():
            # Default prefix from doc type (PO, SO, GE, DC, QC, WO, INV, PAY, JE, GRN)
            prefix_map = {
                "purchase_order":    "PO",
                "sales_order":       "SO",
                "gate_entry":        "GE",
                "delivery_challan":  "DC",
                "qc_inspection":     "QC",
                "work_order":        "WO",
                "invoice":           "INV",
                "payment":           "PAY",
                "journal_entry":     "JE",
                "goods_receipt_note":"GRN",
            }
            db.add(NumberSeries(
                tenant_id     = tenant_id,
                document_type = doc_type,
                prefix        = prefix_map.get(doc_type, doc_type[:3].upper()),
                include_year  = True,
                year_format   = "YY-YY",
                separator     = "-",
                padding_digits = 4,
                current_number = 0,
            ))
    await db.flush()


@router.get("/number-series")
async def list_number_series(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List numbering series for all document types. Admin+ only."""
    _require_admin_or_above(current_user)
    await _ensure_number_series(current_user.tenant_id, db)

    r = await db.execute(
        select(NumberSeries).where(NumberSeries.tenant_id == current_user.tenant_id)
        .order_by(NumberSeries.document_type)
    )
    return {"items": [_ns(n) for n in r.scalars().all()]}


@router.put("/number-series/{document_type}")
async def update_number_series(
    document_type: str,
    payload:       NumberSeriesUpdate,
    request:       Request,
    current_user:  User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update numbering series for a document type. Super Admin only."""
    _require_super_admin(current_user)

    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type. Must be one of: {DOCUMENT_TYPES}")

    await _ensure_number_series(current_user.tenant_id, db)

    r = await db.execute(
        select(NumberSeries).where(
            NumberSeries.tenant_id     == current_user.tenant_id,
            NumberSeries.document_type == document_type,
        )
    )
    ns = r.scalar_one_or_none()
    if not ns:
        raise HTTPException(404, "Number series not found")

    old_val = _ns(ns)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ns, k, v)
    ns.updated_by = current_user.id

    await db.flush()
    await db.refresh(ns)
    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="number_series",
        document_id=ns.id, document_number=document_type,
        old_value=old_val, new_value=_ns(ns),
    )
    return _ns(ns)


@router.post("/number-series/{document_type}/preview")
async def preview_number(
    document_type: str,
    current_user:  User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Preview what the NEXT number will look like. Admin+ only."""
    _require_admin_or_above(current_user)

    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type.")

    r = await db.execute(
        select(NumberSeries).where(
            NumberSeries.tenant_id     == current_user.tenant_id,
            NumberSeries.document_type == document_type,
        )
    )
    ns = r.scalar_one_or_none()
    if not ns:
        raise HTTPException(404, "Number series not found. Call GET /number-series first.")

    return {
        "document_type":   document_type,
        "current_number":  ns.current_number,
        "next_number":     ns.current_number + 1,
        "next_formatted":  _preview_number(ns, ns.current_number + 1),
    }


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5 — APPROVAL RULES
# ═══════════════════════════════════════════════════════════════════════

async def _ensure_approval_rules(tenant_id: UUID, db: AsyncSession):
    """Ensure every document type has an ApprovalRule row. Idempotent."""
    for doc_type in DOCUMENT_TYPES:
        exists = await db.execute(
            select(ApprovalRule).where(
                ApprovalRule.tenant_id    == tenant_id,
                ApprovalRule.document_type == doc_type,
            )
        )
        if not exists.scalar_one_or_none():
            db.add(ApprovalRule(
                tenant_id              = tenant_id,
                document_type          = doc_type,
                is_approval_required   = False,
                auto_approve_below_amt = None,
                approver_role          = "admin",
                escalation_hours       = 24,
            ))
    await db.flush()


@router.get("/approval-rules")
async def list_approval_rules(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List approval rules for all document types. Admin+ only."""
    _require_admin_or_above(current_user)
    await _ensure_approval_rules(current_user.tenant_id, db)

    r = await db.execute(
        select(ApprovalRule).where(ApprovalRule.tenant_id == current_user.tenant_id)
        .order_by(ApprovalRule.document_type)
    )
    return {"items": [_ar(a) for a in r.scalars().all()]}


@router.put("/approval-rules/{document_type}")
async def update_approval_rule(
    document_type: str,
    payload:       ApprovalRuleUpdate,
    request:       Request,
    current_user:  User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update approval rule for a document type. Super Admin only."""
    _require_super_admin(current_user)

    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type.")

    await _ensure_approval_rules(current_user.tenant_id, db)

    r = await db.execute(
        select(ApprovalRule).where(
            ApprovalRule.tenant_id     == current_user.tenant_id,
            ApprovalRule.document_type == document_type,
        )
    )
    rule = r.scalar_one_or_none()
    old_val = _ar(rule)

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    rule.updated_by = current_user.id

    await db.flush()
    await db.refresh(rule)
    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="approval_rule",
        document_id=rule.id, document_number=document_type,
        old_value=old_val, new_value=_ar(rule),
    )
    return _ar(rule)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 6 — CHANGE REQUEST SETTINGS
# ═══════════════════════════════════════════════════════════════════════

async def _ensure_change_request_settings(tenant_id: UUID, db: AsyncSession):
    for doc_type in DOCUMENT_TYPES:
        exists = await db.execute(
            select(ChangeRequestSetting).where(
                ChangeRequestSetting.tenant_id     == tenant_id,
                ChangeRequestSetting.document_type == doc_type,
            )
        )
        if not exists.scalar_one_or_none():
            db.add(ChangeRequestSetting(
                tenant_id            = tenant_id,
                document_type        = doc_type,
                allow_change_request = False,
                who_can_raise        = "admin",
                who_can_approve      = "super_admin",
                requires_reason      = True,
            ))
    await db.flush()


@router.get("/change-request-settings")
async def list_change_request_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List change request settings for all document types. Admin+ only."""
    _require_admin_or_above(current_user)
    await _ensure_change_request_settings(current_user.tenant_id, db)

    r = await db.execute(
        select(ChangeRequestSetting)
        .where(ChangeRequestSetting.tenant_id == current_user.tenant_id)
        .order_by(ChangeRequestSetting.document_type)
    )
    return {"items": [_cr(c) for c in r.scalars().all()]}


@router.put("/change-request-settings/{document_type}")
async def update_change_request_setting(
    document_type: str,
    payload:       ChangeRequestUpdate,
    request:       Request,
    current_user:  User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update change request setting. Super Admin only."""
    _require_super_admin(current_user)

    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type.")

    await _ensure_change_request_settings(current_user.tenant_id, db)

    r = await db.execute(
        select(ChangeRequestSetting).where(
            ChangeRequestSetting.tenant_id     == current_user.tenant_id,
            ChangeRequestSetting.document_type == document_type,
        )
    )
    setting = r.scalar_one_or_none()
    old_val = _cr(setting)

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(setting, k, v)
    setting.updated_by = current_user.id

    await db.flush()
    await db.refresh(setting)
    await _write_audit(
        db, current_user, "update", "master",
        request=request, document_type="change_request_setting",
        document_id=setting.id, document_number=document_type,
        old_value=old_val, new_value=_cr(setting),
    )
    return _cr(setting)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 7 — TEST DATA
# ═══════════════════════════════════════════════════════════════════════

# Tables that support is_test_data — in dependency order for deletion
TEST_DATA_TABLES = [
    "audit_log",
    # Gate module tables — must be in FK order (items before entries)
    "gate_entry_items",
    "gate_entries",
    "gate_passes",
    "vehicle_logs",
    "visitor_entries",
    # Master setup tables
    "change_request_settings",
    "approval_rules",
    "number_series",
    "financial_years",
    "branches",
    "companies",
    # NOTE: permission_audit_log excluded — it has no is_test_data column
]


@router.get("/test-data/status")
async def test_data_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """How many test data rows exist per table? Super Admin only."""
    _require_super_admin(current_user)

    counts = {}
    for table in TEST_DATA_TABLES:
        try:
            r = await db.execute(
                sa.text(f"SELECT COUNT(*) FROM {table} WHERE is_test_data = true AND tenant_id = :tid"),
                {"tid": current_user.tenant_id}
            )
            counts[table] = r.scalar_one()
        except Exception:
            counts[table] = "n/a"

    total = sum(v for v in counts.values() if isinstance(v, int))
    return {"tables": counts, "total_test_rows": total}


@router.post("/test-data/load")
async def load_test_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Load realistic dummy data for Oregenal Electrical India.
    All rows created with is_test_data=True.
    Safe to run multiple times — checks before inserting.
    Super Admin only.
    """
    _require_super_admin(current_user)

    tid = current_user.tenant_id
    uid = current_user.id
    created = []

    # ── Company ──────────────────────────────────────────────────────
    existing_co = await db.execute(
        select(Company).where(Company.tenant_id == tid).limit(1)
    )
    if not existing_co.scalar_one_or_none():
        co = Company(
            tenant_id=tid, created_by=uid, updated_by=uid,
            is_test_data=True,
            name="Oregenal Electrical India Private Limited",
            legal_name="Oregenal Electrical India Private Limited",
            gstin="27AABCO1234F1ZQ",
            pan="AABCO1234F",
            address_line1="Plot No. 42, Phase II, MIDC",
            address_line2="Taloja Industrial Area",
            city="Navi Mumbai", state="Maharashtra", pincode="410208",
            country="India",
            phone="+91-22-27415678", email="info@oregenal.com",
            website="https://www.oregenal.com",
            currency="INR", timezone="Asia/Kolkata",
            date_format="DD/MM/YYYY", fiscal_year_start_month=4,
        )
        db.add(co)
        await db.flush()
        created.append(f"Company: {co.name}")

        # ── Branches ─────────────────────────────────────────────────
        branches_data = [
            dict(name="Taloja Factory",       code="TF", branch_type="factory",   is_head_office=True,
                 address_line1="Plot 42, MIDC Taloja", city="Navi Mumbai",
                 state="Maharashtra", pincode="410208", gstin="27AABCO1234F1ZQ"),
            dict(name="Pune Warehouse",       code="PW", branch_type="warehouse",  is_head_office=False,
                 address_line1="Gat No 15, Chakan", city="Pune",
                 state="Maharashtra", pincode="410501"),
            dict(name="Mumbai Sales Office",  code="MSO", branch_type="office",   is_head_office=False,
                 address_line1="Unit 5, Bandra Kurla Complex", city="Mumbai",
                 state="Maharashtra", pincode="400051"),
        ]
        for bd in branches_data:
            br = Branch(
                tenant_id=tid, company_id=co.id,
                created_by=uid, updated_by=uid, is_test_data=True, **bd,
            )
            db.add(br)
        created.append("3 branches")

    # ── Financial Years ───────────────────────────────────────────────
    fy_data = [
        dict(name="FY 2023-24", start_date=date(2023, 4, 1), end_date=date(2024, 3, 31), is_closed=True),
        dict(name="FY 2024-25", start_date=date(2024, 4, 1), end_date=date(2025, 3, 31), is_active=True),
        dict(name="FY 2025-26", start_date=date(2025, 4, 1), end_date=date(2026, 3, 31)),
    ]
    existing_fy_count = (await db.execute(
        select(func.count(FinancialYear.id)).where(
            FinancialYear.tenant_id == tid
        )
    )).scalar_one()
    if existing_fy_count == 0:
        for fd in fy_data:
            db.add(FinancialYear(
                tenant_id=tid, created_by=uid, updated_by=uid,
                is_test_data=True, **fd,
            ))
        created.append("3 financial years")

    # ── Ensure Number Series + Approval Rules + Change Request Settings ──
    await _ensure_number_series(tid, db)
    await _ensure_approval_rules(tid, db)
    await _ensure_change_request_settings(tid, db)
    created.append("number series for all document types")
    created.append("approval rules for all document types")
    created.append("change request settings for all document types")

    await db.flush()
    await _write_audit(
        db, current_user, "create", "master",
        request=request, document_type="test_data",
        notes=f"Loaded test data: {', '.join(created)}",
    )

    return {
        "success": True,
        "created": created,
        "message": "Test data loaded. All rows marked is_test_data=true.",
    }


@router.delete("/test-data/purge")
async def purge_test_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete ALL rows where is_test_data=True for this tenant.
    ONLY affects test data — live data is never touched.
    Super Admin only. Irreversible.
    """
    _require_super_admin(current_user)

    deleted_counts = {}
    tid = str(current_user.tenant_id)

    for table in TEST_DATA_TABLES:
        try:
            # Use raw connection to avoid session state issues with DELETE
            r = await db.execute(
                sa.text(
                    f"DELETE FROM {table} "
                    f"WHERE is_test_data = true "
                    f"AND tenant_id = :tid"
                ),
                {"tid": tid}
            )
            deleted_counts[table] = r.rowcount
        except Exception as e:
            deleted_counts[table] = f"error: {str(e)[:50]}"

    await db.flush()

    # Write a single non-test-data audit entry for the purge action
    log = AuditLog(
        tenant_id   = current_user.tenant_id,
        user_id     = current_user.id,
        user_name   = current_user.name,
        user_role   = current_user.role,
        action      = "purge",
        module      = "master",
        document_type = "test_data",
        new_value   = deleted_counts,
        notes       = "Purged all test data rows",
        is_test_data = False,
    )
    db.add(log)

    total = sum(v for v in deleted_counts.values() if isinstance(v, int))
    return {
        "success": True,
        "deleted": deleted_counts,
        "total_deleted": total,
        "message": f"Purged {total} test data rows. Live data untouched.",
    }


# ═══════════════════════════════════════════════════════════════════════
# SECTION 8 — AUDIT LOG
# ═══════════════════════════════════════════════════════════════════════

@router.get("/audit-log")
async def get_audit_log(
    page:          int           = Query(1,  ge=1),
    page_size:     int           = Query(25, le=100),
    module:        Optional[str] = Query(None),
    action:        Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    user_id:       Optional[UUID]= Query(None),
    include_test:  bool          = Query(False),
    current_user:  User          = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Full audit trail. Admin+ only.
    include_test=false (default) hides test data rows.
    """
    _require_admin_or_above(current_user)

    q = select(AuditLog).where(AuditLog.tenant_id == current_user.tenant_id)

    if not include_test:
        q = q.where(AuditLog.is_test_data == False)
    if module:
        q = q.where(AuditLog.module == module)
    if action:
        q = q.where(AuditLog.action == action)
    if document_type:
        q = q.where(AuditLog.document_type == document_type)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)

    total  = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return {
        "items":       [_al(a) for a in rows],
        "total":       total,
        "page":        page,
        "page_size":   page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }
