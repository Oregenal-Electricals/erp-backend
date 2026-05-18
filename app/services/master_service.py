"""
app/services/master_service.py
================================
Master Setup — Service Layer
Business logic for Company, Branch, FinancialYear, NumberSeries,
ApprovalRule, ChangeRequestSetting, AuditLog, and TestData.

All DB calls are async. Routers call these functions;
no SQLAlchemy imports in routers beyond session injection.
"""
from __future__ import annotations

import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import (
    ApprovalRule,
    AuditLog,
    Branch,
    ChangeRequestSetting,
    Company,
    FinancialYear,
    NumberSeries,
)
from app.models.user import User

# ── Constants ──────────────────────────────────────────────────────────────

DOCUMENT_TYPES: List[str] = [
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

DOCUMENT_LABELS: Dict[str, str] = {
    "purchase_order":    "Purchase Order",
    "sales_order":       "Sales Order",
    "gate_entry":        "Gate Entry",
    "delivery_challan":  "Delivery Challan",
    "qc_inspection":     "QC Inspection",
    "work_order":        "Work Order",
    "invoice":           "Invoice",
    "payment":           "Payment",
    "journal_entry":     "Journal Entry",
    "goods_receipt_note": "Goods Receipt Note (GRN)",
}

# Tables that carry is_test_data — ordered for safe CASCADE deletion
TEST_DATA_TABLES: List[str] = [
    "audit_log",
    "gate_entry_items",
    "gate_entries",
    "gate_passes",
    "vehicle_logs",
    "visitor_entries",
    "change_request_settings",
    "approval_rules",
    "number_series",
    "financial_years",
    "branches",
    "companies",
]


# ── Permission Guards ─────────────────────────────────────────────────────

def require_super_admin(user: User) -> None:
    """Raise 403 unless caller is super_admin."""
    if user.role != "super_admin":
        raise HTTPException(403, "Only Super Admin can perform this action.")


def require_admin_or_above(user: User) -> None:
    """Raise 403 unless caller is admin or super_admin."""
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin or Super Admin required.")


# ── Audit Helper ──────────────────────────────────────────────────────────

async def write_audit(
    db: AsyncSession,
    user: User,
    action: str,
    module: str,
    *,
    request: Optional[Request] = None,
    document_type: Optional[str] = None,
    document_id: Optional[UUID] = None,
    document_number: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    notes: Optional[str] = None,
    is_test_data: bool = False,
) -> None:
    """Append one row to audit_log. Never raises — audit must not break the main flow."""
    try:
        ip = None
        ua = None
        if request:
            forwarded = request.headers.get("x-forwarded-for")
            ip = forwarded.split(",")[0].strip() if forwarded else (
                request.client.host if request.client else None
            )
            ua = request.headers.get("user-agent", "")[:500]

        log = AuditLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            user_name=user.name,
            user_role=user.role,
            action=action,
            module=module,
            document_type=document_type,
            document_id=document_id,
            document_number=document_number,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip,
            user_agent=ua,
            notes=notes,
            is_test_data=is_test_data,
        )
        db.add(log)
        await db.flush()
    except Exception:
        pass  # never propagate audit failures


# ── Serialisers ───────────────────────────────────────────────────────────

def _co(c: Company) -> Dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "legal_name": c.legal_name,
        "gstin": c.gstin,
        "pan": c.pan,
        "cin": c.cin,
        "tan": c.tan,
        "address_line1": c.address_line1,
        "address_line2": c.address_line2,
        "city": c.city,
        "state": c.state,
        "pincode": c.pincode,
        "country": c.country,
        "phone": c.phone,
        "email": c.email,
        "website": c.website,
        "logo_url": c.logo_url,
        "stamp_url": c.stamp_url,
        "signature_url": c.signature_url,
        "primary_color": c.primary_color,
        "currency": c.currency,
        "timezone": c.timezone,
        "date_format": c.date_format,
        "fiscal_year_start_month": c.fiscal_year_start_month,
        "is_active": c.is_active,
        "is_test_data": c.is_test_data,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


def _br(b: Branch) -> Dict:
    return {
        "id": str(b.id),
        "name": b.name,
        "code": b.code,
        "branch_type": b.branch_type,
        "company_id": str(b.company_id) if b.company_id else None,
        "address_line1": b.address_line1,
        "address_line2": b.address_line2,
        "city": b.city,
        "state": b.state,
        "pincode": b.pincode,
        "gstin": b.gstin,
        "phone": b.phone,
        "email": b.email,
        "is_head_office": b.is_head_office,
        "is_active": b.is_active,
        "is_test_data": b.is_test_data,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
    }


def _fy(f: FinancialYear) -> Dict:
    return {
        "id": str(f.id),
        "name": f.name,
        "start_date": f.start_date.isoformat() if f.start_date else None,
        "end_date": f.end_date.isoformat() if f.end_date else None,
        "is_active": f.is_active,
        "is_closed": f.is_closed,
        "is_test_data": f.is_test_data,
        "closed_at": f.closed_at.isoformat() if f.closed_at else None,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


def _preview_number(ns: NumberSeries, next_num: int) -> str:
    """Generate a preview like PO-2425-0001."""
    now = datetime.now()
    year_str = ""
    if ns.include_year:
        fy = ns.year_format or "YY-YY"
        if fy == "YYYY":
            year_str = str(now.year)
        elif fy == "YY":
            year_str = str(now.year)[-2:]
        elif fy == "YY-YY":
            y1 = str(now.year)[-2:]
            y2 = str(now.year + 1)[-2:]
            year_str = f"{y1}{y2}"
        elif fy == "YYYY-YYYY":
            year_str = f"{now.year}-{now.year + 1}"
        else:
            year_str = str(now.year)[-2:]

    sep = ns.separator or "-"
    num_str = str(next_num).zfill(ns.padding_digits or 4)

    parts = [p for p in [ns.prefix, year_str, num_str, ns.suffix] if p]
    return sep.join(parts)


def _ns(n: NumberSeries) -> Dict:
    return {
        "id": str(n.id),
        "document_type": n.document_type,
        "document_label": DOCUMENT_LABELS.get(n.document_type, n.document_type),
        "prefix": n.prefix,
        "include_year": n.include_year,
        "year_format": n.year_format,
        "separator": n.separator,
        "padding_digits": n.padding_digits,
        "current_number": n.current_number,
        "suffix": n.suffix,
        "is_active": n.is_active,
        "preview": _preview_number(n, n.current_number + 1),
        "updated_at": n.updated_at.isoformat() if n.updated_at else None,
    }


def _ar(a: ApprovalRule) -> Dict:
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


def _cr(c: ChangeRequestSetting) -> Dict:
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


def _al(a: AuditLog) -> Dict:
    return {
        "id": str(a.id),
        "user_id": str(a.user_id) if a.user_id else None,
        "user_name": a.user_name,
        "user_role": a.user_role,
        "action": a.action,
        "module": a.module,
        "document_type": a.document_type,
        "document_id": str(a.document_id) if a.document_id else None,
        "document_number": a.document_number,
        "old_value": a.old_value,
        "new_value": a.new_value,
        "ip_address": a.ip_address,
        "notes": a.notes,
        "is_test_data": a.is_test_data,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


# ── Idempotent Seed Helpers ────────────────────────────────────────────────

async def ensure_number_series(tenant_id: UUID, db: AsyncSession) -> None:
    """Create NumberSeries rows for all doc types if they don't exist. Idempotent."""
    PREFIX_MAP = {
        "purchase_order": "PO", "sales_order": "SO",
        "gate_entry": "GE", "delivery_challan": "DC",
        "qc_inspection": "QC", "work_order": "WO",
        "invoice": "INV", "payment": "PAY",
        "journal_entry": "JE", "goods_receipt_note": "GRN",
    }
    for doc_type in DOCUMENT_TYPES:
        exists = (await db.execute(
            select(NumberSeries).where(
                NumberSeries.tenant_id == tenant_id,
                NumberSeries.document_type == doc_type,
            )
        )).scalar_one_or_none()
        if not exists:
            db.add(NumberSeries(
                tenant_id=tenant_id,
                document_type=doc_type,
                prefix=PREFIX_MAP.get(doc_type, doc_type[:3].upper()),
                include_year=True,
                year_format="YY-YY",
                separator="-",
                padding_digits=4,
                current_number=0,
                suffix="",
                is_active=True,
            ))
    await db.flush()


async def ensure_approval_rules(tenant_id: UUID, db: AsyncSession) -> None:
    """Create ApprovalRule rows for all doc types if they don't exist. Idempotent."""
    for doc_type in DOCUMENT_TYPES:
        exists = (await db.execute(
            select(ApprovalRule).where(
                ApprovalRule.tenant_id == tenant_id,
                ApprovalRule.document_type == doc_type,
            )
        )).scalar_one_or_none()
        if not exists:
            db.add(ApprovalRule(
                tenant_id=tenant_id,
                document_type=doc_type,
                is_approval_required=False,
                auto_approve_below_amt=None,
                approver_role="admin",
                escalation_hours=24,
                notify_on_submit=True,
                notify_on_approve=True,
                notify_on_reject=True,
            ))
    await db.flush()


async def ensure_change_request_settings(tenant_id: UUID, db: AsyncSession) -> None:
    """Create ChangeRequestSetting rows for all doc types if they don't exist. Idempotent."""
    for doc_type in DOCUMENT_TYPES:
        exists = (await db.execute(
            select(ChangeRequestSetting).where(
                ChangeRequestSetting.tenant_id == tenant_id,
                ChangeRequestSetting.document_type == doc_type,
            )
        )).scalar_one_or_none()
        if not exists:
            db.add(ChangeRequestSetting(
                tenant_id=tenant_id,
                document_type=doc_type,
                allow_change_request=False,
                who_can_raise="admin",
                who_can_approve="super_admin",
                requires_reason=True,
            ))
    await db.flush()


# ── Company Service ───────────────────────────────────────────────────────

async def get_company(tenant_id: UUID, db: AsyncSession) -> Optional[Dict]:
    r = (await db.execute(
        select(Company).where(Company.tenant_id == tenant_id, Company.is_active == True)
    )).scalar_one_or_none()
    return _co(r) if r else None


async def update_company(
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    r = (await db.execute(
        select(Company).where(Company.tenant_id == tenant_id, Company.is_active == True)
    )).scalar_one_or_none()

    if not r:
        # Auto-create company profile if none exists
        r = Company(tenant_id=tenant_id, name="My Company", created_by=user.id)
        db.add(r)
        await db.flush()

    old_val = _co(r)
    for k, v in payload.items():
        if v is not None and hasattr(r, k):
            setattr(r, k, v)
    r.updated_by = user.id

    await db.flush()
    await db.refresh(r)
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="company",
        document_id=r.id,
        document_number=r.name,
        old_value=old_val,
        new_value=_co(r),
    )
    return _co(r)


# ── Branch Service ────────────────────────────────────────────────────────

async def list_branches(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    rows = (await db.execute(
        select(Branch)
        .where(Branch.tenant_id == tenant_id, Branch.is_active == True)
        .order_by(Branch.is_head_office.desc(), Branch.name)
    )).scalars().all()
    return [_br(b) for b in rows]


async def create_branch(
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    # Get linked company
    company = (await db.execute(
        select(Company).where(Company.tenant_id == tenant_id, Company.is_active == True)
    )).scalar_one_or_none()

    b = Branch(
        tenant_id=tenant_id,
        company_id=company.id if company else None,
        created_by=user.id,
        updated_by=user.id,
        **{k: v for k, v in payload.items() if hasattr(Branch, k)},
    )
    db.add(b)
    await db.flush()
    await db.refresh(b)
    await write_audit(
        db, user, "create", "master",
        request=request,
        document_type="branch",
        document_id=b.id,
        document_number=b.name,
        new_value=_br(b),
    )
    return _br(b)


async def update_branch(
    branch_id: UUID,
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    b = (await db.execute(
        select(Branch).where(Branch.id == branch_id, Branch.tenant_id == tenant_id)
    )).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Branch not found")

    old_val = _br(b)
    for k, v in payload.items():
        if v is not None and hasattr(b, k):
            setattr(b, k, v)
    b.updated_by = user.id

    await db.flush()
    await db.refresh(b)
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="branch",
        document_id=b.id,
        document_number=b.name,
        old_value=old_val,
        new_value=_br(b),
    )
    return _br(b)


async def delete_branch(
    branch_id: UUID,
    tenant_id: UUID,
    user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    b = (await db.execute(
        select(Branch).where(Branch.id == branch_id, Branch.tenant_id == tenant_id)
    )).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Branch not found")
    if b.is_head_office:
        raise HTTPException(400, "Cannot deactivate the head office branch. Assign another branch as head office first.")

    b.is_active = False
    b.updated_by = user.id
    await write_audit(
        db, user, "delete", "master",
        request=request,
        document_type="branch",
        document_id=b.id,
        old_value=_br(b),
    )
    return {"success": True, "message": f"Branch '{b.name}' deactivated"}


# ── Financial Year Service ────────────────────────────────────────────────

async def list_financial_years(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    rows = (await db.execute(
        select(FinancialYear)
        .where(FinancialYear.tenant_id == tenant_id)
        .order_by(FinancialYear.start_date.desc())
    )).scalars().all()
    return [_fy(f) for f in rows]


async def create_financial_year(
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    # Uniqueness check
    existing = (await db.execute(
        select(FinancialYear).where(
            FinancialYear.tenant_id == tenant_id,
            FinancialYear.name == payload["name"],
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, f"Financial year '{payload['name']}' already exists.")

    fy = FinancialYear(
        tenant_id=tenant_id,
        created_by=user.id,
        updated_by=user.id,
        name=payload["name"],
        start_date=payload["start_date"],
        end_date=payload["end_date"],
        is_active=payload.get("is_active", False),
        is_test_data=payload.get("is_test_data", False),
    )
    db.add(fy)
    await db.flush()
    await db.refresh(fy)
    await write_audit(
        db, user, "create", "master",
        request=request,
        document_type="financial_year",
        document_id=fy.id,
        document_number=fy.name,
        new_value=_fy(fy),
    )
    return _fy(fy)


async def activate_financial_year(
    fy_id: UUID,
    tenant_id: UUID,
    user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    fy = (await db.execute(
        select(FinancialYear).where(
            FinancialYear.id == fy_id, FinancialYear.tenant_id == tenant_id
        )
    )).scalar_one_or_none()
    if not fy:
        raise HTTPException(404, "Financial year not found")
    if fy.is_closed:
        raise HTTPException(400, f"'{fy.name}' is closed and cannot be reactivated.")

    # Deactivate all others
    await db.execute(
        sa.update(FinancialYear)
        .where(FinancialYear.tenant_id == tenant_id)
        .values(is_active=False)
    )
    fy.is_active = True
    fy.updated_by = user.id
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="financial_year",
        document_id=fy.id,
        document_number=fy.name,
        notes=f"Activated financial year {fy.name}",
    )
    await db.flush()
    await db.refresh(fy)
    return _fy(fy)


async def close_financial_year(
    fy_id: UUID,
    tenant_id: UUID,
    user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    fy = (await db.execute(
        select(FinancialYear).where(
            FinancialYear.id == fy_id, FinancialYear.tenant_id == tenant_id
        )
    )).scalar_one_or_none()
    if not fy:
        raise HTTPException(404, "Financial year not found")
    if fy.is_closed:
        raise HTTPException(400, f"'{fy.name}' is already closed.")

    fy.is_closed = True
    fy.is_active = False
    fy.closed_by = user.id
    fy.closed_at = datetime.now(timezone.utc)
    fy.updated_by = user.id
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="financial_year",
        document_id=fy.id,
        document_number=fy.name,
        notes=f"Closed financial year {fy.name}",
    )
    return _fy(fy)


# ── Number Series Service ─────────────────────────────────────────────────

async def list_number_series(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    await ensure_number_series(tenant_id, db)
    rows = (await db.execute(
        select(NumberSeries)
        .where(NumberSeries.tenant_id == tenant_id)
        .order_by(NumberSeries.document_type)
    )).scalars().all()
    return [_ns(n) for n in rows]


async def update_number_series(
    document_type: str,
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type: {document_type}")

    await ensure_number_series(tenant_id, db)
    ns = (await db.execute(
        select(NumberSeries).where(
            NumberSeries.tenant_id == tenant_id,
            NumberSeries.document_type == document_type,
        )
    )).scalar_one_or_none()

    old_val = _ns(ns)
    for k, v in payload.items():
        if hasattr(ns, k):
            setattr(ns, k, v)
    ns.updated_by = user.id

    await db.flush()
    await db.refresh(ns)
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="number_series",
        document_id=ns.id,
        document_number=document_type,
        old_value=old_val,
        new_value=_ns(ns),
    )
    return _ns(ns)


async def preview_number_series(document_type: str, tenant_id: UUID, db: AsyncSession) -> Dict:
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type: {document_type}")
    await ensure_number_series(tenant_id, db)
    ns = (await db.execute(
        select(NumberSeries).where(
            NumberSeries.tenant_id == tenant_id,
            NumberSeries.document_type == document_type,
        )
    )).scalar_one_or_none()
    return {
        "document_type": document_type,
        "next_number": ns.current_number + 1,
        "preview": _preview_number(ns, ns.current_number + 1),
    }


# ── Approval Rule Service ─────────────────────────────────────────────────

async def list_approval_rules(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    await ensure_approval_rules(tenant_id, db)
    rows = (await db.execute(
        select(ApprovalRule)
        .where(ApprovalRule.tenant_id == tenant_id)
        .order_by(ApprovalRule.document_type)
    )).scalars().all()
    return [_ar(a) for a in rows]


async def update_approval_rule(
    document_type: str,
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type: {document_type}")

    await ensure_approval_rules(tenant_id, db)
    rule = (await db.execute(
        select(ApprovalRule).where(
            ApprovalRule.tenant_id == tenant_id,
            ApprovalRule.document_type == document_type,
        )
    )).scalar_one_or_none()

    old_val = _ar(rule)
    for k, v in payload.items():
        if hasattr(rule, k):
            setattr(rule, k, v)
    rule.updated_by = user.id

    await db.flush()
    await db.refresh(rule)
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="approval_rule",
        document_id=rule.id,
        document_number=document_type,
        old_value=old_val,
        new_value=_ar(rule),
    )
    return _ar(rule)


# ── Change Request Setting Service ────────────────────────────────────────

async def list_change_request_settings(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    await ensure_change_request_settings(tenant_id, db)
    rows = (await db.execute(
        select(ChangeRequestSetting)
        .where(ChangeRequestSetting.tenant_id == tenant_id)
        .order_by(ChangeRequestSetting.document_type)
    )).scalars().all()
    return [_cr(c) for c in rows]


async def update_change_request_setting(
    document_type: str,
    tenant_id: UUID,
    user: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(400, f"Unknown document type: {document_type}")

    await ensure_change_request_settings(tenant_id, db)
    setting = (await db.execute(
        select(ChangeRequestSetting).where(
            ChangeRequestSetting.tenant_id == tenant_id,
            ChangeRequestSetting.document_type == document_type,
        )
    )).scalar_one_or_none()

    old_val = _cr(setting)
    for k, v in payload.items():
        if hasattr(setting, k):
            setattr(setting, k, v)
    setting.updated_by = user.id

    await db.flush()
    await db.refresh(setting)
    await write_audit(
        db, user, "update", "master",
        request=request,
        document_type="change_request_setting",
        document_id=setting.id,
        document_number=document_type,
        old_value=old_val,
        new_value=_cr(setting),
    )
    return _cr(setting)


# ── Audit Log Service ─────────────────────────────────────────────────────

async def list_audit_log(
    tenant_id: UUID,
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 25,
    action: Optional[str] = None,
    module: Optional[str] = None,
    document_type: Optional[str] = None,
    user_id: Optional[UUID] = None,
) -> Dict:
    q = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
    if action:
        q = q.where(AuditLog.action == action)
    if module:
        q = q.where(AuditLog.module == module)
    if document_type:
        q = q.where(AuditLog.document_type == document_type)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        q.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return {
        "items": [_al(a) for a in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


# ── Test Data Service ─────────────────────────────────────────────────────

async def get_test_data_status(tenant_id: UUID, db: AsyncSession) -> Dict:
    counts: Dict[str, Any] = {}
    for table in TEST_DATA_TABLES:
        try:
            r = await db.execute(
                sa.text(
                    f"SELECT COUNT(*) FROM {table} "
                    f"WHERE is_test_data = true AND tenant_id = :tid"
                ),
                {"tid": str(tenant_id)},
            )
            counts[table] = r.scalar_one()
        except Exception:
            counts[table] = "n/a"

    total = sum(v for v in counts.values() if isinstance(v, int))
    return {"tables": counts, "total_test_rows": total}


async def load_test_data(
    tenant_id: UUID,
    user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    """
    Load realistic dummy data for Oregenal Electrical India.
    All rows created with is_test_data=True.
    Idempotent — skips existing data.
    """
    tid = tenant_id
    uid = user.id
    created: List[str] = []

    # ── Company ──────────────────────────────────────────────────────
    existing_co = (await db.execute(
        select(Company).where(Company.tenant_id == tid, Company.is_test_data == True)
    )).scalar_one_or_none()

    if not existing_co:
        db.add(Company(
            tenant_id=tid,
            created_by=uid,
            updated_by=uid,
            is_test_data=True,
            name="Oregenal Electrical India Private Limited",
            legal_name="Oregenal Electrical India Private Limited",
            gstin="27AABCO9999T1ZQ",
            pan="AABCO1234F",
            cin="U31200MH2010PTC123456",
            tan="MUMA12345B",
            address_line1="Plot No. 123, MIDC Industrial Area",
            address_line2="Taloja Phase II",
            city="Navi Mumbai",
            state="Maharashtra",
            pincode="410208",
            country="India",
            phone="+91-22-27408900",
            email="info@oregenal.com",
            website="https://www.oregenal.com",
            currency="INR",
            timezone="Asia/Kolkata",
            date_format="DD/MM/YYYY",
            fiscal_year_start_month=4,
            primary_color="#4F46E5",
        ))
        created.append("Company profile (Oregenal Electrical India)")

    # ── Branches ──────────────────────────────────────────────────────
    existing_branches = (await db.execute(
        sa.text(
            "SELECT COUNT(*) FROM branches WHERE tenant_id = :tid AND is_test_data = true"
        ),
        {"tid": str(tid)},
    )).scalar_one()

    if existing_branches == 0:
        company = (await db.execute(
            select(Company).where(Company.tenant_id == tid)
        )).scalar_one_or_none()
        co_id = company.id if company else None

        branches_data = [
            dict(
                tenant_id=tid, company_id=co_id, created_by=uid, updated_by=uid,
                is_test_data=True, is_head_office=True,
                name="Taloja Factory", code="TLJ", branch_type="factory",
                address_line1="Plot No. 123, MIDC Taloja Phase II",
                city="Navi Mumbai", state="Maharashtra", pincode="410208",
                gstin="27AABCO9999T1ZQ", phone="+91-22-27408900",
                email="factory@oregenal.com",
            ),
            dict(
                tenant_id=tid, company_id=co_id, created_by=uid, updated_by=uid,
                is_test_data=True, is_head_office=False,
                name="Pune Warehouse", code="PNE", branch_type="warehouse",
                address_line1="Gut No. 45, Ranjangaon MIDC",
                city="Pune", state="Maharashtra", pincode="412220",
                phone="+91-20-27600100", email="pune@oregenal.com",
            ),
            dict(
                tenant_id=tid, company_id=co_id, created_by=uid, updated_by=uid,
                is_test_data=True, is_head_office=False,
                name="Mumbai Sales Office", code="MUM", branch_type="office",
                address_line1="1203, Maker Chambers IV, Nariman Point",
                city="Mumbai", state="Maharashtra", pincode="400021",
                phone="+91-22-22885500", email="sales@oregenal.com",
            ),
        ]
        for bd in branches_data:
            db.add(Branch(**bd))
        created.append("3 branches (Taloja, Pune, Mumbai)")

    # ── Financial Years ────────────────────────────────────────────────
    existing_fy_names = {row[0] for row in (await db.execute(
        sa.text("SELECT name FROM financial_years WHERE tenant_id = :tid"),
        {"tid": str(tid)},
    )).fetchall()}
    fy_data = [
        dict(name="FY 2023-24", start_date=date(2023, 4, 1), end_date=date(2024, 3, 31),
             is_active=False, is_closed=True),
        dict(name="FY 2024-25", start_date=date(2024, 4, 1), end_date=date(2025, 3, 31),
             is_active=True, is_closed=False),
        dict(name="FY 2025-26", start_date=date(2025, 4, 1), end_date=date(2026, 3, 31),
             is_active=False, is_closed=False),
    ]
    fy_added = 0
    for fd in fy_data:
        if fd["name"] not in existing_fy_names:
            db.add(FinancialYear(
                tenant_id=tid, created_by=uid, updated_by=uid, is_test_data=True, **fd
            ))
            fy_added += 1
    if fy_added:
        created.append(f"{fy_added} financial years added")

    # ── Ensure Number Series / Approval Rules / Change Req Settings ───
    await ensure_number_series(tid, db)
    await ensure_approval_rules(tid, db)
    await ensure_change_request_settings(tid, db)
    created.append("Number series for all 10 document types")
    created.append("Approval rules for all 10 document types")
    created.append("Change request settings for all 10 document types")

    await db.flush()
    await write_audit(
        db, user, "create", "master",
        request=request,
        document_type="test_data",
        notes=f"Loaded test data: {', '.join(created)}",
    )

    return {
        "success": True,
        "created": created,
        "message": "Test data loaded. All rows marked is_test_data=true.",
    }


async def purge_test_data(
    tenant_id: UUID,
    user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    """
    Delete all rows where is_test_data=True for this tenant.
    Live data is NEVER touched.
    """
    deleted_counts: Dict[str, Any] = {}
    tid = str(tenant_id)

    for table in TEST_DATA_TABLES:
        try:
            r = await db.execute(
                sa.text(
                    f"DELETE FROM {table} WHERE is_test_data = true AND tenant_id = :tid"
                ),
                {"tid": tid},
            )
            deleted_counts[table] = r.rowcount
        except Exception as exc:
            deleted_counts[table] = f"error: {str(exc)[:60]}"

    await db.flush()

    # Write non-test audit entry
    log = AuditLog(
        tenant_id=tenant_id,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="purge",
        module="master",
        document_type="test_data",
        new_value=deleted_counts,
        notes="Purged all test data rows",
        is_test_data=False,
    )
    db.add(log)
    await db.flush()

    total = sum(v for v in deleted_counts.values() if isinstance(v, int))
    return {
        "success": True,
        "deleted": deleted_counts,
        "total_deleted": total,
        "message": f"Purged {total} test data rows. Live data untouched.",
    }
