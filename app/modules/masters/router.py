"""
Masters Module — Router
========================
Covers:
  Vendors     POST/GET /masters/vendors + /{id} + approve/reject/block
  Customers   POST/GET /masters/customers + /{id} + approve/reject
  Items       POST/GET /masters/items + /{id} + search
  HSN Codes   POST/GET /masters/hsn + /{id}
  Price Lists POST/GET /masters/price-lists + /{id} + items
  Price Resolve GET /masters/price-resolve   ← separate route (no UUID conflict)
  Price History GET /masters/price-history

Permission model (module: 'masters'):
  gate_guard / iqc_inspector  — view only
  store_manager               — view, create, edit
  admin                       — view, create, edit, approve
  super_admin                 — all

Business rules:
  1. Only APPROVED vendors selectable on Purchase Orders
  2. Only APPROVED customers selectable on Sales Orders
  3. Price resolved using ORDER DATE — not today
  4. Price history is append-only — never updated or deleted
  5. Duplicate HSN code (per tenant) rejected with 409
"""
import math
from datetime import datetime, timezone, date as date_type
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.master import AuditLog
from app.models.masters import (
    Vendor, HsnCode, PriceList, PriceListItem, PriceHistory
)

router = APIRouter(prefix="/masters", tags=["Masters"])

# ═══════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════

VENDOR_STATUS_PENDING  = "PENDING"
VENDOR_STATUS_APPROVED = "APPROVED"
VENDOR_STATUS_REJECTED = "REJECTED"
VENDOR_STATUS_BLOCKED  = "BLOCKED"

CUSTOMER_STATUS_PENDING  = "PENDING"
CUSTOMER_STATUS_APPROVED = "APPROVED"
CUSTOMER_STATUS_REJECTED = "REJECTED"

PRODUCT_TYPES = ["finished_good", "raw_material", "semi_finished", "service", "consumable"]
VENDOR_TYPES  = ["material", "service", "both"]
LIST_TYPES    = ["sales", "purchase"]


# ═══════════════════════════════════════════════════════════════════════
# PERMISSION HELPERS
# ═══════════════════════════════════════════════════════════════════════

def _require_masters_view(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("masters", [])
    if "view" not in perms:
        raise HTTPException(403, "Masters module: view permission required")


def _require_masters_create(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("masters", [])
    if "create" not in perms:
        raise HTTPException(403, "Masters module: create permission required")


def _require_masters_edit(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("masters", [])
    if "edit" not in perms and "create" not in perms:
        raise HTTPException(403, "Masters module: edit permission required")


def _require_masters_approve(user: User):
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(
            403,
            f"Only Admin or Super Admin can approve/reject masters. Your role: {user.role}"
        )


def _require_admin(user: User):
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(403, "Only Admin or Super Admin can perform this action")


# ═══════════════════════════════════════════════════════════════════════
# NUMBER GENERATION
# ═══════════════════════════════════════════════════════════════════════

async def _next_number(
    tenant_id: UUID,
    doc_type: str,
    fallback_prefix: str,
    fallback_table: str,
    db: AsyncSession,
) -> str:
    try:
        r = await db.execute(text(
            "SELECT id, prefix, include_year, year_format, separator, "
            "padding_digits, current_number, suffix "
            "FROM number_series "
            "WHERE tenant_id = :tid AND document_type = :dt "
            "LIMIT 1"
        ), {"tid": tenant_id, "dt": doc_type})
        ns = r.fetchone()
    except Exception:
        ns = None

    if not ns:
        cnt = (await db.execute(
            text(f"SELECT COUNT(*) FROM {fallback_table} WHERE tenant_id = :tid"),
            {"tid": tenant_id}
        )).scalar_one()
        return f"{fallback_prefix}-{str(cnt + 1).zfill(4)}"

    next_num = (ns.current_number or 0) + 1
    parts = []
    if ns.prefix:
        parts.append(ns.prefix)
    if ns.include_year:
        today = datetime.now()
        yr = today.year
        fy_start, fy_end = (yr, yr+1) if today.month >= 4 else (yr-1, yr)
        fmt = ns.year_format or "YY-YY"
        if fmt == "YY-YY":
            parts.append(f"{str(fy_start)[-2:]}{str(fy_end)[-2:]}")
        elif fmt == "YYYY":
            parts.append(str(fy_start))
        else:
            parts.append(str(fy_start)[-2:])
    sep = ns.separator or "-"
    pad = int(ns.padding_digits or 4)
    parts.append(str(next_num).zfill(pad))
    if ns.suffix:
        parts.append(ns.suffix)

    formatted = sep.join(parts)
    await db.execute(
        text("UPDATE number_series SET current_number = :n, updated_at = now() "
             "WHERE tenant_id = :tid AND document_type = :dt"),
        {"n": next_num, "tid": tenant_id, "dt": doc_type}
    )
    return formatted


# ═══════════════════════════════════════════════════════════════════════
# AUDIT HELPER
# ═══════════════════════════════════════════════════════════════════════

async def _audit(
    db: AsyncSession,
    user: User,
    action: str,
    doc_type: str,
    doc_id: Optional[UUID] = None,
    doc_number: Optional[str] = None,
    old_val: Optional[dict] = None,
    new_val: Optional[dict] = None,
    notes: Optional[str] = None,
    request: Optional[Request] = None,
):
    try:
        ip = ua = None
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
            is_test_data    = False,
            action          = action,
            module          = "masters",
            document_type   = doc_type,
            document_id     = doc_id,
            document_number = doc_number,
            old_value       = old_val,
            new_value       = new_val,
            ip_address      = ip,
            user_agent      = ua,
            notes           = notes,
        )
        db.add(log)
        await db.flush()
    except Exception:
        pass


# ═══════════════════════════════════════════════════════════════════════
# SERIALIZERS
# ═══════════════════════════════════════════════════════════════════════

def _ven(v: Vendor) -> dict:
    return {
        "id": str(v.id), "vendor_code": v.vendor_code, "name": v.name,
        "legal_name": v.legal_name, "vendor_type": v.vendor_type,
        "status": v.status, "gstin": v.gstin, "pan": v.pan,
        "msme_number": v.msme_number,
        "address_line1": v.address_line1, "address_line2": v.address_line2,
        "city": v.city, "state": v.state, "pincode": v.pincode,
        "country": v.country, "contact_person": v.contact_person,
        "phone": v.phone, "email": v.email, "website": v.website,
        "payment_terms_days": v.payment_terms_days,
        "credit_limit": float(v.credit_limit or 0),
        "rating": v.rating,
        "bank_account": v.bank_account, "bank_ifsc": v.bank_ifsc,
        "bank_name": v.bank_name, "bank_branch": v.bank_branch,
        "notes": v.notes, "is_active": v.is_active,
        "approved_by": str(v.approved_by) if v.approved_by else None,
        "approved_at": v.approved_at.isoformat() if v.approved_at else None,
        "rejection_reason": v.rejection_reason,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "updated_at": v.updated_at.isoformat() if v.updated_at else None,
    }


def _hsn(h: HsnCode) -> dict:
    return {
        "id": str(h.id), "code": h.code, "description": h.description,
        "code_type": h.code_type,
        "igst_rate": float(h.igst_rate), "cgst_rate": float(h.cgst_rate),
        "sgst_rate": float(h.sgst_rate), "cess_rate": float(h.cess_rate),
        "effective_from": str(h.effective_from) if h.effective_from else None,
        "effective_to": str(h.effective_to) if h.effective_to else None,
        "is_active": h.is_active,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def _pl(p: PriceList) -> dict:
    return {
        "id": str(p.id), "name": p.name, "list_type": p.list_type,
        "currency": p.currency, "applicable_to": p.applicable_to,
        "description": p.description,
        "effective_from": str(p.effective_from) if p.effective_from else None,
        "effective_to": str(p.effective_to) if p.effective_to else None,
        "is_default": p.is_default, "is_active": p.is_active,
        "party_id": str(p.party_id) if p.party_id else None,
        "party_name": p.party_name,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _pli(i: PriceListItem) -> dict:
    return {
        "id": str(i.id),
        "price_list_id": str(i.price_list_id),
        "product_id": str(i.product_id) if i.product_id else None,
        "product_code": i.product_code, "product_name": i.product_name,
        "unit": i.unit,
        "unit_price": float(i.unit_price),
        "min_qty": float(i.min_qty),
        "max_qty": float(i.max_qty) if i.max_qty else None,
        "discount_pct": float(i.discount_pct),
        "effective_from": str(i.effective_from) if i.effective_from else None,
        "effective_to": str(i.effective_to) if i.effective_to else None,
        "notes": i.notes,
    }


def _ph(h: PriceHistory) -> dict:
    return {
        "id": str(h.id),
        "product_id": str(h.product_id) if h.product_id else None,
        "product_code": h.product_code, "product_name": h.product_name,
        "price_list_id": str(h.price_list_id) if h.price_list_id else None,
        "price_list_name": h.price_list_name,
        "price_type": h.price_type,
        "old_price": float(h.old_price) if h.old_price else None,
        "new_price": float(h.new_price),
        "changed_by": str(h.changed_by) if h.changed_by else None,
        "changed_by_name": h.changed_by_name,
        "change_reason": h.change_reason,
        "effective_from": str(h.effective_from) if h.effective_from else None,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════
# SECTION 1 — VENDORS
# ═══════════════════════════════════════════════════════════════════════

class VendorCreate(BaseModel):
    name:               str
    legal_name:         Optional[str] = None
    vendor_type:        str = "material"
    gstin:              Optional[str] = None
    pan:                Optional[str] = None
    msme_number:        Optional[str] = None
    address_line1:      Optional[str] = None
    address_line2:      Optional[str] = None
    city:               Optional[str] = None
    state:              Optional[str] = None
    pincode:            Optional[str] = None
    country:            str = "India"
    contact_person:     Optional[str] = None
    phone:              Optional[str] = None
    email:              Optional[str] = None
    website:            Optional[str] = None
    payment_terms_days: int   = 30
    credit_limit:       float = 0.0
    rating:             int   = 0
    bank_account:       Optional[str] = None
    bank_ifsc:          Optional[str] = None
    bank_name:          Optional[str] = None
    bank_branch:        Optional[str] = None
    notes:              Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Vendor name cannot be empty")
        return v.strip()

    @field_validator("vendor_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in VENDOR_TYPES:
            raise ValueError(f"vendor_type must be one of {VENDOR_TYPES}")
        return v

    @field_validator("gstin")
    @classmethod
    def gstin_upper(cls, v: Optional[str]) -> Optional[str]:
        return v.upper().strip() if v else None

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v: int) -> int:
        if not 0 <= v <= 5:
            raise ValueError("Rating must be between 0 and 5")
        return v


class VendorUpdate(BaseModel):
    name:               Optional[str]   = None
    legal_name:         Optional[str]   = None
    vendor_type:        Optional[str]   = None
    gstin:              Optional[str]   = None
    pan:                Optional[str]   = None
    msme_number:        Optional[str]   = None
    address_line1:      Optional[str]   = None
    address_line2:      Optional[str]   = None
    city:               Optional[str]   = None
    state:              Optional[str]   = None
    pincode:            Optional[str]   = None
    country:            Optional[str]   = None
    contact_person:     Optional[str]   = None
    phone:              Optional[str]   = None
    email:              Optional[str]   = None
    website:            Optional[str]   = None
    payment_terms_days: Optional[int]   = None
    credit_limit:       Optional[float] = None
    rating:             Optional[int]   = None
    bank_account:       Optional[str]   = None
    bank_ifsc:          Optional[str]   = None
    bank_name:          Optional[str]   = None
    bank_branch:        Optional[str]   = None
    notes:              Optional[str]   = None


class RejectPayload(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Rejection reason is required")
        return v.strip()


@router.get("/vendors/stats")
async def vendor_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    rows = (await db.execute(
        select(Vendor.status, func.count(Vendor.id).label("cnt"))
        .where(Vendor.tenant_id == tid, Vendor.is_active == True)
        .group_by(Vendor.status)
    )).all()
    stats = {"PENDING": 0, "APPROVED": 0, "REJECTED": 0, "BLOCKED": 0, "total": 0}
    for row in rows:
        stats[row.status] = row.cnt
        stats["total"] += row.cnt
    return stats


@router.get("/vendors")
async def list_vendors(
    search:      Optional[str]  = Query(None),
    status:      Optional[str]  = Query(None),
    vendor_type: Optional[str]  = Query(None),
    page:        int            = Query(1, ge=1),
    page_size:   int            = Query(25, le=100),
    current_user: User          = Depends(get_current_active_user),
    db: AsyncSession            = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = select(Vendor).where(Vendor.tenant_id == tid, Vendor.is_active == True)
    if status:
        q = q.where(Vendor.status == status.upper())
    if vendor_type:
        q = q.where(Vendor.vendor_type == vendor_type)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            Vendor.name.ilike(t), Vendor.vendor_code.ilike(t),
            Vendor.gstin.ilike(t), Vendor.city.ilike(t),
            Vendor.contact_person.ilike(t),
        ))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(
        q.order_by(Vendor.name).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_ven(v) for v in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


@router.post("/vendors", status_code=201)
async def create_vendor(
    payload: VendorCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_create(current_user)
    tid = current_user.tenant_id
    code = await _next_number(tid, "vendor", "VEN", "vendors", db)
    v = Vendor(
        tenant_id          = tid,
        created_by         = current_user.id,
        vendor_code        = code,
        name               = payload.name,
        legal_name         = payload.legal_name,
        vendor_type        = payload.vendor_type,
        status             = VENDOR_STATUS_PENDING,
        gstin              = payload.gstin,
        pan                = payload.pan.upper() if payload.pan else None,
        msme_number        = payload.msme_number,
        address_line1      = payload.address_line1,
        address_line2      = payload.address_line2,
        city               = payload.city,
        state              = payload.state,
        pincode            = payload.pincode,
        country            = payload.country,
        contact_person     = payload.contact_person,
        phone              = payload.phone,
        email              = payload.email,
        website            = payload.website,
        payment_terms_days = payload.payment_terms_days,
        credit_limit       = payload.credit_limit,
        rating             = payload.rating,
        bank_account       = payload.bank_account,
        bank_ifsc          = payload.bank_ifsc.upper() if payload.bank_ifsc else None,
        bank_name          = payload.bank_name,
        bank_branch        = payload.bank_branch,
        notes              = payload.notes,
    )
    db.add(v)
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "create", "vendor", v.id, v.vendor_code,
                 new_val=_ven(v), request=request)
    return _ven(v)


@router.get("/vendors/{vendor_id}")
async def get_vendor(
    vendor_id: UUID,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    return _ven(v)


@router.put("/vendors/{vendor_id}")
async def update_vendor(
    vendor_id: UUID,
    payload:  VendorUpdate,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    old = _ven(v)
    for field, value in payload.model_dump(exclude_none=True).items():
        if field == "gstin" and value:
            value = value.upper().strip()
        if field == "bank_ifsc" and value:
            value = value.upper().strip()
        setattr(v, field, value)
    v.updated_by = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "update", "vendor", v.id, v.vendor_code,
                 old_val=old, new_val=_ven(v), request=request)
    return _ven(v)


@router.post("/vendors/{vendor_id}/approve")
async def approve_vendor(
    vendor_id: UUID,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_approve(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    if v.status == VENDOR_STATUS_APPROVED:
        raise HTTPException(400, f"{v.vendor_code} is already approved")
    old = _ven(v)
    v.status      = VENDOR_STATUS_APPROVED
    v.approved_by = current_user.id
    v.approved_at = datetime.now(timezone.utc)
    v.updated_by  = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "approve", "vendor", v.id, v.vendor_code,
                 old_val=old, new_val=_ven(v), request=request)
    return _ven(v)


@router.post("/vendors/{vendor_id}/reject")
async def reject_vendor(
    vendor_id: UUID,
    payload:  RejectPayload,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_approve(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    if v.status == VENDOR_STATUS_REJECTED:
        raise HTTPException(400, f"{v.vendor_code} is already rejected")
    old = _ven(v)
    v.status           = VENDOR_STATUS_REJECTED
    v.rejected_by      = current_user.id
    v.rejected_at      = datetime.now(timezone.utc)
    v.rejection_reason = payload.reason
    v.updated_by       = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "reject", "vendor", v.id, v.vendor_code,
                 old_val=old, new_val=_ven(v),
                 notes=f"Rejected: {payload.reason}", request=request)
    return _ven(v)


@router.post("/vendors/{vendor_id}/block")
async def block_vendor(
    vendor_id: UUID,
    payload:  RejectPayload,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    old = _ven(v)
    v.status           = VENDOR_STATUS_BLOCKED
    v.rejected_by      = current_user.id
    v.rejected_at      = datetime.now(timezone.utc)
    v.rejection_reason = payload.reason
    v.updated_by       = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "block", "vendor", v.id, v.vendor_code,
                 old_val=old, new_val=_ven(v),
                 notes=f"Blocked: {payload.reason}", request=request)
    return _ven(v)


@router.delete("/vendors/{vendor_id}")
async def delete_vendor(
    vendor_id: UUID,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    r = await db.execute(
        select(Vendor).where(
            Vendor.id == vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vendor not found")
    if v.status == VENDOR_STATUS_APPROVED:
        raise HTTPException(
            400,
            f"Cannot delete approved vendor {v.vendor_code}. Block it instead."
        )
    v.is_active  = False
    v.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "vendor", v.id, v.vendor_code,
                 request=request)
    return {"success": True, "message": f"{v.vendor_code} deleted"}


@router.get("/vendors/{vendor_id}/price-history")
async def vendor_price_history(
    vendor_id: UUID,
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = (select(PriceHistory)
         .where(PriceHistory.tenant_id == tid,
                PriceHistory.price_type == "purchase")
         .order_by(PriceHistory.created_at.desc()))
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    items = (await db.execute(
        q.offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_ph(h) for h in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2 — CUSTOMERS
# ═══════════════════════════════════════════════════════════════════════

class CustomerCreate(BaseModel):
    name:               str
    email:              Optional[str]  = None
    phone:              Optional[str]  = None
    gstin:              Optional[str]  = None
    pan:                Optional[str]  = None
    address:            Optional[str]  = None
    shipping_address:   Optional[str]  = None
    city:               Optional[str]  = None
    state:              Optional[str]  = None
    pincode:            Optional[str]  = None
    credit_limit:       float          = 0.0
    payment_terms_days: int            = 30
    customer_group:     Optional[str]  = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Customer name cannot be empty")
        return v.strip()

    @field_validator("gstin")
    @classmethod
    def gstin_upper(cls, v: Optional[str]) -> Optional[str]:
        return v.upper().strip() if v else None


class CustomerUpdate(BaseModel):
    name:               Optional[str]   = None
    email:              Optional[str]   = None
    phone:              Optional[str]   = None
    gstin:              Optional[str]   = None
    pan:                Optional[str]   = None
    address:            Optional[str]   = None
    shipping_address:   Optional[str]   = None
    city:               Optional[str]   = None
    state:              Optional[str]   = None
    pincode:            Optional[str]   = None
    credit_limit:       Optional[float] = None
    payment_terms_days: Optional[int]   = None
    customer_group:     Optional[str]   = None


@router.get("/customers/stats")
async def customer_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    rows = (await db.execute(text(
        "SELECT COALESCE(status, 'APPROVED') as status, COUNT(*) as cnt "
        "FROM customers WHERE tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now()) "
        "GROUP BY status"
    ), {"tid": tid})).fetchall()
    stats = {"PENDING": 0, "APPROVED": 0, "REJECTED": 0, "total": 0}
    for r in rows:
        key = r[0] if r[0] in stats else "APPROVED"
        stats[key] = r[1]
        stats["total"] += r[1]
    return stats


@router.get("/customers")
async def list_customers(
    search:    Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User       = Depends(get_current_active_user),
    db: AsyncSession         = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)

    where = "tenant_id = :tid AND (deleted_at IS NULL OR deleted_at > now())"
    params: dict = {"tid": tid}
    if status:
        where += " AND COALESCE(status, 'APPROVED') = :status"
        params["status"] = status.upper()
    if search:
        where += " AND (name ILIKE :s OR email ILIKE :s OR gstin ILIKE :s)"
        params["s"] = f"%{search}%"

    total = (await db.execute(
        text(f"SELECT COUNT(*) FROM customers WHERE {where}"), params
    )).scalar_one()

    offset = (page - 1) * page_size
    # FIX: only query columns that exist in the original customers table.
    # city/state/pincode/shipping_address/credit_used are added by migration 018.
    # Use COALESCE so this works both before and after migration 018 runs.
    rows = (await db.execute(text(
        f"SELECT id, name, email, phone, gstin, pan, address, "
        f"credit_limit, COALESCE(status,'APPROVED') as status, "
        f"COALESCE(payment_terms_days, 30) as payment_terms_days, "
        f"customer_group, customer_code, "
        f"is_active, created_at "
        f"FROM customers WHERE {where} "
        f"ORDER BY name LIMIT {page_size} OFFSET {offset}"
    ), params)).fetchall()

    items = [{
        "id": str(r[0]), "name": r[1], "email": r[2], "phone": r[3],
        "gstin": r[4], "pan": r[5], "address": r[6],
        "credit_limit": float(r[7] or 0),
        "status": r[8],
        "payment_terms_days": r[9],
        "customer_group": r[10], "customer_code": r[11],
        "is_active": r[12],
        "created_at": r[13].isoformat() if r[13] else None,
    } for r in rows]

    return {
        "items": items, "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


@router.post("/customers", status_code=201)
async def create_customer(
    payload: CustomerCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_create(current_user)
    tid = str(current_user.tenant_id)
    code = await _next_number(current_user.tenant_id, "customer", "CUST", "customers", db)

    await db.execute(text("""
        INSERT INTO customers (
            id, tenant_id, name, email, phone, gstin, pan, address,
            credit_limit, is_active, custom_data, created_at, updated_at,
            customer_code, status, payment_terms_days, shipping_address,
            customer_group, created_by
        ) VALUES (
            gen_random_uuid(), :tid, :name, :email, :phone, :gstin, :pan, :address,
            :credit_limit, true, '{}', now(), now(),
            :code, 'PENDING', :terms, :ship, :group, :created_by
        )
    """), {
        "tid":          tid,
        "name":         payload.name,
        "email":        payload.email,
        "phone":        payload.phone,
        "gstin":        payload.gstin,
        "pan":          payload.pan.upper() if payload.pan else None,
        "address":      payload.address,
        "credit_limit": payload.credit_limit,
        "code":         code,
        "terms":        payload.payment_terms_days,
        "ship":         payload.shipping_address,
        "group":        payload.customer_group,
        "created_by":   str(current_user.id),
    })

    row = (await db.execute(text(
        "SELECT id, name, email, phone, gstin, customer_code, status, "
        "credit_limit, COALESCE(payment_terms_days,30) as payment_terms_days, "
        "customer_group, created_at "
        "FROM customers WHERE tenant_id = :tid AND customer_code = :code"
    ), {"tid": tid, "code": code})).fetchone()

    result = {
        "id": str(row[0]), "name": row[1], "email": row[2], "phone": row[3],
        "gstin": row[4], "customer_code": row[5], "status": row[6],
        "credit_limit": float(row[7] or 0),
        "payment_terms_days": row[8],
        "customer_group": row[9],
        "created_at": row[10].isoformat() if row[10] else None,
    }
    await _audit(db, current_user, "create", "customer",
                 UUID(result["id"]), result["customer_code"],
                 new_val=result, request=request)
    return result


@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: UUID,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    # FIX: removed city, state, pincode, credit_used from SELECT —
    # those columns are added by migration 018. Use COALESCE for safety.
    row = (await db.execute(text(
        "SELECT id, name, email, phone, gstin, pan, address, "
        "COALESCE(shipping_address, '') as shipping_address, "
        "credit_limit, COALESCE(credit_used, 0) as credit_used, "
        "COALESCE(status,'APPROVED') as status, "
        "COALESCE(payment_terms_days, 30) as payment_terms_days, "
        "customer_group, customer_code, is_active, created_at, updated_at "
        "FROM customers WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(customer_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Customer not found")
    return {
        "id": str(row[0]), "name": row[1], "email": row[2], "phone": row[3],
        "gstin": row[4], "pan": row[5], "address": row[6],
        "shipping_address": row[7],
        # city/state/pincode available after migration 018 — return None until then
        "city": None, "state": None, "pincode": None,
        "credit_limit": float(row[8] or 0),
        "credit_used":  float(row[9] or 0),
        "status":             row[10],
        "payment_terms_days": row[11],
        "customer_group":     row[12],
        "customer_code":      row[13],
        "is_active":          row[14],
        "created_at": row[15].isoformat() if row[15] else None,
        "updated_at": row[16].isoformat() if row[16] else None,
    }


@router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: UUID,
    payload: CustomerUpdate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    tid = str(current_user.tenant_id)
    old_row = (await db.execute(text(
        "SELECT id, customer_code FROM customers "
        "WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(customer_id), "tid": tid})).fetchone()
    if not old_row:
        raise HTTPException(404, "Customer not found")

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        return await get_customer(customer_id, current_user, db)

    set_parts = ", ".join(f"{k} = :{k}" for k in updates)
    set_parts += ", updated_at = now(), updated_by = :updated_by"
    updates["id"]         = str(customer_id)
    updates["tid"]        = tid
    updates["updated_by"] = str(current_user.id)

    await db.execute(text(
        f"UPDATE customers SET {set_parts} WHERE id = :id AND tenant_id = :tid"
    ), updates)

    await _audit(db, current_user, "update", "customer",
                 customer_id, old_row[1], request=request)
    return await get_customer(customer_id, current_user, db)


@router.post("/customers/{customer_id}/approve")
async def approve_customer(
    customer_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_approve(current_user)
    tid = str(current_user.tenant_id)
    row = (await db.execute(text(
        "SELECT id, name, COALESCE(status,'PENDING') as status, customer_code "
        "FROM customers WHERE id = :id AND tenant_id = :tid"
    ), {"id": str(customer_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Customer not found")
    if row[2] == CUSTOMER_STATUS_APPROVED:
        raise HTTPException(400, f"{row[3]} is already approved")

    await db.execute(text(
        "UPDATE customers SET status='APPROVED', approved_by=:by, "
        "approved_at=now(), updated_at=now() "
        "WHERE id=:id AND tenant_id=:tid"
    ), {"by": str(current_user.id), "id": str(customer_id), "tid": tid})

    await _audit(db, current_user, "approve", "customer",
                 customer_id, row[3],
                 notes=f"Customer {row[1]} approved", request=request)
    return await get_customer(customer_id, current_user, db)


@router.post("/customers/{customer_id}/reject")
async def reject_customer(
    customer_id: UUID,
    payload: RejectPayload,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_approve(current_user)
    tid = str(current_user.tenant_id)
    row = (await db.execute(text(
        "SELECT id, name, customer_code FROM customers "
        "WHERE id = :id AND tenant_id = :tid"
    ), {"id": str(customer_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Customer not found")

    await db.execute(text(
        "UPDATE customers SET status='REJECTED', updated_at=now() "
        "WHERE id=:id AND tenant_id=:tid"
    ), {"id": str(customer_id), "tid": tid})

    await _audit(db, current_user, "reject", "customer",
                 customer_id, row[2],
                 notes=f"Rejected: {payload.reason}", request=request)
    return await get_customer(customer_id, current_user, db)


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    tid = str(current_user.tenant_id)
    row = (await db.execute(text(
        "SELECT id, customer_code, COALESCE(status,'APPROVED') as status "
        "FROM customers WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(customer_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Customer not found")
    if row[2] == CUSTOMER_STATUS_APPROVED:
        raise HTTPException(400, "Cannot delete approved customer. Deactivate instead.")

    await db.execute(text(
        "UPDATE customers SET deleted_at=now() WHERE id=:id AND tenant_id=:tid"
    ), {"id": str(customer_id), "tid": tid})

    await _audit(db, current_user, "delete", "customer",
                 customer_id, row[1], request=request)
    return {"success": True, "message": f"{row[1]} deleted"}


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3 — ITEMS / PRODUCTS / RAW MATERIALS
# ═══════════════════════════════════════════════════════════════════════

class ItemCreate(BaseModel):
    name:                str
    product_type:        str   = "finished_good"
    product_group:       Optional[str]  = None
    sku:                 Optional[str]  = None
    description:         Optional[str]  = None
    unit:                str   = "Pcs"
    hsn_code:            Optional[str]  = None
    gst_rate:            float = 18.0
    cost_price:          float = 0.0
    selling_price:       float = 0.0
    purchase_price:      float = 0.0
    reorder_point:       int   = 0
    preferred_vendor_id: Optional[str]  = None
    category:            Optional[str]  = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Item name cannot be empty")
        return v.strip()

    @field_validator("product_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in PRODUCT_TYPES:
            raise ValueError(f"product_type must be one of {PRODUCT_TYPES}")
        return v

    @field_validator("gst_rate")
    @classmethod
    def valid_gst(cls, v: float) -> float:
        valid_rates = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 9, 12, 18, 28]
        if v not in valid_rates:
            raise ValueError(f"GST rate must be one of {valid_rates}")
        return v


class ItemUpdate(BaseModel):
    name:                Optional[str]   = None
    product_type:        Optional[str]   = None
    product_group:       Optional[str]   = None
    description:         Optional[str]   = None
    unit:                Optional[str]   = None
    hsn_code:            Optional[str]   = None
    gst_rate:            Optional[float] = None
    cost_price:          Optional[float] = None
    selling_price:       Optional[float] = None
    purchase_price:      Optional[float] = None
    reorder_point:       Optional[int]   = None
    preferred_vendor_id: Optional[str]   = None
    category:            Optional[str]   = None
    status:              Optional[str]   = None


@router.get("/items/stats")
async def item_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    rows = (await db.execute(text(
        "SELECT COALESCE(product_type,'finished_good') as pt, COUNT(*) "
        "FROM inventory_products WHERE tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now()) GROUP BY pt"
    ), {"tid": tid})).fetchall()
    stats = {t: 0 for t in PRODUCT_TYPES}
    stats["total"] = 0
    for r in rows:
        stats[r[0]] = r[1]
        stats["total"] += r[1]
    return stats


@router.get("/items/search")
async def search_items(
    q:            Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    limit:        int           = Query(20, le=50),
    current_user: User          = Depends(get_current_active_user),
    db: AsyncSession            = Depends(get_db),
):
    """Lightweight search for PO/SO dropdowns."""
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    where = ("tenant_id = :tid AND status = 'active' "
             "AND (deleted_at IS NULL OR deleted_at > now())")
    params: dict = {"tid": tid}
    if product_type:
        where += " AND COALESCE(product_type,'finished_good') = :pt"
        params["pt"] = product_type
    if q:
        where += " AND (name ILIKE :s OR sku ILIKE :s OR product_code ILIKE :s)"
        params["s"] = f"%{q}%"

    rows = (await db.execute(text(
        f"SELECT id, name, sku, product_code, unit, cost_price, selling_price, "
        f"purchase_price, gst_rate, hsn_code, "
        f"COALESCE(product_type,'finished_good') as pt, stock "
        f"FROM inventory_products WHERE {where} ORDER BY name LIMIT {limit}"
    ), params)).fetchall()

    return {"items": [{
        "id": str(r[0]), "name": r[1], "sku": r[2], "product_code": r[3],
        "unit": r[4], "cost_price": float(r[5] or 0),
        "selling_price": float(r[6] or 0), "purchase_price": float(r[7] or 0),
        "gst_rate": float(r[8] or 18), "hsn_code": r[9],
        "product_type": r[10], "stock": r[11] or 0,
    } for r in rows]}


@router.get("/items")
async def list_items(
    search:       Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    page:         int           = Query(1, ge=1),
    page_size:    int           = Query(25, le=100),
    current_user: User          = Depends(get_current_active_user),
    db: AsyncSession            = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    where = "tenant_id = :tid AND (deleted_at IS NULL OR deleted_at > now())"
    params: dict = {"tid": tid}
    if product_type:
        where += " AND COALESCE(product_type,'finished_good') = :pt"
        params["pt"] = product_type
    if search:
        where += (" AND (name ILIKE :s OR sku ILIKE :s "
                  "OR product_code ILIKE :s OR category ILIKE :s)")
        params["s"] = f"%{search}%"

    total = (await db.execute(
        text(f"SELECT COUNT(*) FROM inventory_products WHERE {where}"), params
    )).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(text(
        f"SELECT id, name, sku, product_code, unit, cost_price, selling_price, "
        f"purchase_price, gst_rate, hsn_code, status, stock, reorder_point, "
        f"COALESCE(product_type,'finished_good') as pt, product_group, category, "
        f"description, created_at "
        f"FROM inventory_products WHERE {where} "
        f"ORDER BY name LIMIT {page_size} OFFSET {offset}"
    ), params)).fetchall()

    items = [{
        "id": str(r[0]), "name": r[1], "sku": r[2], "product_code": r[3],
        "unit": r[4], "cost_price": float(r[5] or 0),
        "selling_price": float(r[6] or 0), "purchase_price": float(r[7] or 0),
        "gst_rate": float(r[8] or 18), "hsn_code": r[9],
        "status": r[10], "stock": r[11] or 0,
        "reorder_point": r[12] or 0, "product_type": r[13],
        "product_group": r[14], "category": r[15], "description": r[16],
        "created_at": r[17].isoformat() if r[17] else None,
    } for r in rows]

    return {
        "items": items, "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


@router.post("/items", status_code=201)
async def create_item(
    payload: ItemCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_create(current_user)
    tid = str(current_user.tenant_id)
    code = await _next_number(current_user.tenant_id, "item", "ITM", "inventory_products", db)
    sku  = payload.sku or code

    await db.execute(text("""
        INSERT INTO inventory_products (
            id, tenant_id, name, sku, category, unit, description,
            cost_price, selling_price, stock, reorder_point, status, custom_data,
            created_at, updated_at,
            product_code, product_type, product_group,
            hsn_code, gst_rate, purchase_price, preferred_vendor_id,
            created_by
        ) VALUES (
            gen_random_uuid(), :tid, :name, :sku, :category, :unit, :description,
            :cost_price, :selling_price, 0, :reorder_point, 'active', '{}',
            now(), now(),
            :product_code, :product_type, :product_group,
            :hsn_code, :gst_rate, :purchase_price, :vendor_id,
            :created_by
        )
    """), {
        "tid":           tid,
        "name":          payload.name,
        "sku":           sku,
        "category":      payload.category or payload.product_group,
        "unit":          payload.unit,
        "description":   payload.description,
        "cost_price":    payload.cost_price,
        "selling_price": payload.selling_price,
        "reorder_point": payload.reorder_point,
        "product_code":  code,
        "product_type":  payload.product_type,
        "product_group": payload.product_group,
        "hsn_code":      payload.hsn_code,
        "gst_rate":      payload.gst_rate,
        "purchase_price":payload.purchase_price,
        "vendor_id":     payload.preferred_vendor_id,
        "created_by":    str(current_user.id),
    })

    row = (await db.execute(text(
        "SELECT id, name, sku, product_code, unit, cost_price, selling_price, "
        "purchase_price, gst_rate, hsn_code, product_type, product_group, "
        "status, stock, created_at "
        "FROM inventory_products WHERE tenant_id = :tid AND product_code = :code"
    ), {"tid": tid, "code": code})).fetchone()

    result = {
        "id": str(row[0]), "name": row[1], "sku": row[2], "product_code": row[3],
        "unit": row[4], "cost_price": float(row[5] or 0),
        "selling_price": float(row[6] or 0), "purchase_price": float(row[7] or 0),
        "gst_rate": float(row[8] or 18), "hsn_code": row[9],
        "product_type": row[10], "product_group": row[11],
        "status": row[12], "stock": row[13] or 0,
        "created_at": row[14].isoformat() if row[14] else None,
    }
    await _audit(db, current_user, "create", "item",
                 UUID(result["id"]), result["product_code"],
                 new_val=result, request=request)
    return result


@router.get("/items/{item_id}")
async def get_item(
    item_id: UUID,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = str(current_user.tenant_id)
    row = (await db.execute(text(
        "SELECT id, name, sku, product_code, unit, description, cost_price, "
        "selling_price, purchase_price, gst_rate, hsn_code, product_type, "
        "product_group, category, status, stock, reorder_point, "
        "preferred_vendor_id, created_at, updated_at "
        "FROM inventory_products WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(item_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Item not found")
    return {
        "id": str(row[0]), "name": row[1], "sku": row[2], "product_code": row[3],
        "unit": row[4], "description": row[5],
        "cost_price": float(row[6] or 0), "selling_price": float(row[7] or 0),
        "purchase_price": float(row[8] or 0), "gst_rate": float(row[9] or 18),
        "hsn_code": row[10], "product_type": row[11], "product_group": row[12],
        "category": row[13], "status": row[14], "stock": row[15] or 0,
        "reorder_point": row[16] or 0,
        "preferred_vendor_id": str(row[17]) if row[17] else None,
        "created_at": row[18].isoformat() if row[18] else None,
        "updated_at": row[19].isoformat() if row[19] else None,
    }


@router.put("/items/{item_id}")
async def update_item(
    item_id:  UUID,
    payload:  ItemUpdate,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    tid = str(current_user.tenant_id)
    old_row = (await db.execute(text(
        "SELECT id, product_code, name, cost_price, selling_price, purchase_price "
        "FROM inventory_products WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(item_id), "tid": tid})).fetchone()
    if not old_row:
        raise HTTPException(404, "Item not found")

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        return await get_item(item_id, current_user, db)

    old_sell = float(old_row[4] or 0)
    old_pur  = float(old_row[5] or 0)
    old_cost = float(old_row[3] or 0)

    if "selling_price" in updates and updates["selling_price"] != old_sell:
        db.add(PriceHistory(
            tenant_id=current_user.tenant_id, product_id=item_id,
            product_code=old_row[1], product_name=old_row[2],
            price_type="sales", old_price=old_sell,
            new_price=updates["selling_price"],
            changed_by=current_user.id, changed_by_name=current_user.name,
        ))

    if "purchase_price" in updates and updates["purchase_price"] != old_pur:
        db.add(PriceHistory(
            tenant_id=current_user.tenant_id, product_id=item_id,
            product_code=old_row[1], product_name=old_row[2],
            price_type="purchase", old_price=old_pur,
            new_price=updates["purchase_price"],
            changed_by=current_user.id, changed_by_name=current_user.name,
        ))

    if "cost_price" in updates and updates["cost_price"] != old_cost:
        db.add(PriceHistory(
            tenant_id=current_user.tenant_id, product_id=item_id,
            product_code=old_row[1], product_name=old_row[2],
            price_type="cost", old_price=old_cost,
            new_price=updates["cost_price"],
            changed_by=current_user.id, changed_by_name=current_user.name,
        ))

    set_parts = ", ".join(f"{k} = :{k}" for k in updates)
    set_parts += ", updated_at = now(), updated_by = :updated_by"
    updates["id"]         = str(item_id)
    updates["tid"]        = tid
    updates["updated_by"] = str(current_user.id)

    await db.execute(text(
        f"UPDATE inventory_products SET {set_parts} WHERE id = :id AND tenant_id = :tid"
    ), updates)

    await _audit(db, current_user, "update", "item",
                 item_id, old_row[1], request=request)
    return await get_item(item_id, current_user, db)


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    tid = str(current_user.tenant_id)
    row = (await db.execute(text(
        "SELECT id, product_code, stock FROM inventory_products "
        "WHERE id = :id AND tenant_id = :tid "
        "AND (deleted_at IS NULL OR deleted_at > now())"
    ), {"id": str(item_id), "tid": tid})).fetchone()
    if not row:
        raise HTTPException(404, "Item not found")
    if (row[2] or 0) > 0:
        raise HTTPException(
            400,
            f"Cannot delete {row[1]} — it has {row[2]} units in stock"
        )
    await db.execute(text(
        "UPDATE inventory_products SET deleted_at=now() "
        "WHERE id=:id AND tenant_id=:tid"
    ), {"id": str(item_id), "tid": tid})
    await _audit(db, current_user, "delete", "item", item_id, row[1], request=request)
    return {"success": True, "message": f"{row[1]} deleted"}


@router.get("/items/{item_id}/price-history")
async def item_price_history(
    item_id:   UUID,
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = (select(PriceHistory)
         .where(PriceHistory.tenant_id == tid, PriceHistory.product_id == item_id)
         .order_by(PriceHistory.created_at.desc()))
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    items = (await db.execute(
        q.offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_ph(h) for h in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4 — HSN / SAC CODES
# ═══════════════════════════════════════════════════════════════════════

class HsnCreate(BaseModel):
    code:          str
    description:   str
    code_type:     str   = "hsn"
    igst_rate:     float = 18.0
    cess_rate:     float = 0.0
    effective_from:Optional[str] = None
    effective_to:  Optional[str] = None

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str) -> str:
        return v.strip()

    @field_validator("code_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in ("hsn", "sac"):
            raise ValueError("code_type must be 'hsn' or 'sac'")
        return v

    @field_validator("igst_rate")
    @classmethod
    def valid_igst(cls, v: float) -> float:
        if not 0 <= v <= 100:
            raise ValueError("IGST rate must be between 0 and 100")
        return v


class HsnUpdate(BaseModel):
    description:   Optional[str]   = None
    igst_rate:     Optional[float] = None
    cess_rate:     Optional[float] = None
    effective_from:Optional[str]   = None
    effective_to:  Optional[str]   = None
    is_active:     Optional[bool]  = None


@router.get("/hsn")
async def list_hsn(
    search:    Optional[str] = Query(None),
    code_type: Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User       = Depends(get_current_active_user),
    db: AsyncSession         = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = select(HsnCode).where(HsnCode.tenant_id == tid, HsnCode.is_active == True)
    if code_type:
        q = q.where(HsnCode.code_type == code_type)
    if search:
        t = f"%{search}%"
        q = q.where(or_(HsnCode.code.ilike(t), HsnCode.description.ilike(t)))
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    items = (await db.execute(
        q.order_by(HsnCode.code).offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_hsn(h) for h in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


@router.post("/hsn", status_code=201)
async def create_hsn(
    payload: HsnCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    tid = current_user.tenant_id
    existing = (await db.execute(
        select(HsnCode).where(HsnCode.tenant_id == tid, HsnCode.code == payload.code)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, f"HSN code {payload.code!r} already exists")

    half = round(float(payload.igst_rate) / 2, 2)
    h = HsnCode(
        tenant_id      = tid,
        created_by     = current_user.id,
        code           = payload.code.strip(),
        description    = payload.description.strip(),
        code_type      = payload.code_type,
        igst_rate      = payload.igst_rate,
        cgst_rate      = half,
        sgst_rate      = half,
        cess_rate      = payload.cess_rate,
        effective_from = date_type.fromisoformat(payload.effective_from) if payload.effective_from else None,
        effective_to   = date_type.fromisoformat(payload.effective_to)   if payload.effective_to   else None,
    )
    db.add(h)
    await db.flush()
    await db.refresh(h)
    await _audit(db, current_user, "create", "hsn_code", h.id, h.code,
                 new_val=_hsn(h), request=request)
    return _hsn(h)


@router.get("/hsn/{hsn_id}")
async def get_hsn(
    hsn_id: UUID,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    h = (await db.execute(
        select(HsnCode).where(
            HsnCode.id == hsn_id,
            HsnCode.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not h:
        raise HTTPException(404, "HSN code not found")
    return _hsn(h)


@router.put("/hsn/{hsn_id}")
async def update_hsn(
    hsn_id:  UUID,
    payload: HsnUpdate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    h = (await db.execute(
        select(HsnCode).where(
            HsnCode.id == hsn_id,
            HsnCode.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not h:
        raise HTTPException(404, "HSN code not found")
    old = _hsn(h)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(h, field, value)
    if payload.igst_rate is not None:
        half = round(float(payload.igst_rate) / 2, 2)
        h.cgst_rate = half
        h.sgst_rate = half
    h.updated_by = current_user.id
    await db.flush()
    await db.refresh(h)
    await _audit(db, current_user, "update", "hsn_code", h.id, h.code,
                 old_val=old, new_val=_hsn(h), request=request)
    return _hsn(h)


@router.delete("/hsn/{hsn_id}")
async def delete_hsn(
    hsn_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    h = (await db.execute(
        select(HsnCode).where(
            HsnCode.id == hsn_id,
            HsnCode.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not h:
        raise HTTPException(404, "HSN code not found")
    h.is_active  = False
    h.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "hsn_code", h.id, h.code, request=request)
    return {"success": True, "message": f"HSN {h.code} deactivated"}


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5 — PRICE LISTS
# ═══════════════════════════════════════════════════════════════════════

class PriceListCreate(BaseModel):
    name:          str
    list_type:     str
    currency:      str  = "INR"
    applicable_to: str  = "all"
    description:   Optional[str] = None
    effective_from:str
    effective_to:  Optional[str] = None
    is_default:    bool = False
    party_id:      Optional[str] = None
    party_name:    Optional[str] = None

    @field_validator("list_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in LIST_TYPES:
            raise ValueError(f"list_type must be one of {LIST_TYPES}")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Price list name cannot be empty")
        return v.strip()


class PriceListUpdate(BaseModel):
    name:          Optional[str]  = None
    description:   Optional[str]  = None
    effective_from:Optional[str]  = None
    effective_to:  Optional[str]  = None
    is_default:    Optional[bool] = None
    is_active:     Optional[bool] = None


class PriceListItemCreate(BaseModel):
    product_id:    Optional[str]   = None
    product_code:  Optional[str]   = None
    product_name:  str
    unit:          str   = "Pcs"
    unit_price:    float
    min_qty:       float = 1.0
    max_qty:       Optional[float] = None
    discount_pct:  float = 0.0
    effective_from:Optional[str]   = None
    effective_to:  Optional[str]   = None
    notes:         Optional[str]   = None

    @field_validator("unit_price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Unit price cannot be negative")
        return v


class PriceListItemUpdate(BaseModel):
    unit_price:    Optional[float] = None
    min_qty:       Optional[float] = None
    max_qty:       Optional[float] = None
    discount_pct:  Optional[float] = None
    effective_from:Optional[str]   = None
    effective_to:  Optional[str]   = None
    notes:         Optional[str]   = None
    change_reason: Optional[str]   = None


@router.get("/price-lists")
async def list_price_lists(
    list_type:   Optional[str] = Query(None),
    active_only: bool          = Query(True),
    page:        int           = Query(1, ge=1),
    page_size:   int           = Query(25, le=100),
    current_user: User         = Depends(get_current_active_user),
    db: AsyncSession           = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = select(PriceList).where(PriceList.tenant_id == tid)
    if active_only:
        q = q.where(PriceList.is_active == True)
    if list_type:
        q = q.where(PriceList.list_type == list_type)
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    items = (await db.execute(
        q.order_by(PriceList.effective_from.desc())
        .offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_pl(p) for p in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }


@router.post("/price-lists", status_code=201)
async def create_price_list(
    payload: PriceListCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    tid = current_user.tenant_id
    if payload.is_default:
        await db.execute(
            sa.update(PriceList)
            .where(PriceList.tenant_id == tid,
                   PriceList.list_type == payload.list_type)
            .values(is_default=False)
        )
    pl = PriceList(
        tenant_id      = tid,
        created_by     = current_user.id,
        name           = payload.name,
        list_type      = payload.list_type,
        currency       = payload.currency,
        applicable_to  = payload.applicable_to,
        description    = payload.description,
        effective_from = date_type.fromisoformat(payload.effective_from),
        effective_to   = date_type.fromisoformat(payload.effective_to) if payload.effective_to else None,
        is_default     = payload.is_default,
        party_id       = UUID(payload.party_id) if payload.party_id else None,
        party_name     = payload.party_name,
    )
    db.add(pl)
    await db.flush()
    await db.refresh(pl)
    await _audit(db, current_user, "create", "price_list", pl.id, pl.name,
                 new_val=_pl(pl), request=request)
    return _pl(pl)


# NOTE: /price-lists/{list_id} must come AFTER /price-lists (no path param conflict)
@router.get("/price-lists/{list_id}")
async def get_price_list(
    list_id: UUID,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_view(current_user)
    pl = (await db.execute(
        select(PriceList).where(
            PriceList.id == list_id,
            PriceList.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Price list not found")
    items = (await db.execute(
        select(PriceListItem)
        .where(PriceListItem.price_list_id == list_id)
        .order_by(PriceListItem.product_name)
    )).scalars().all()
    result = _pl(pl)
    result["items"] = [_pli(i) for i in items]
    return result


@router.put("/price-lists/{list_id}")
async def update_price_list(
    list_id:  UUID,
    payload:  PriceListUpdate,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    pl = (await db.execute(
        select(PriceList).where(
            PriceList.id == list_id,
            PriceList.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Price list not found")
    old = _pl(pl)
    for field, value in payload.model_dump(exclude_none=True).items():
        if field in ("effective_from", "effective_to") and value:
            value = date_type.fromisoformat(value)
        setattr(pl, field, value)
    pl.updated_by = current_user.id
    await db.flush()
    await db.refresh(pl)
    await _audit(db, current_user, "update", "price_list", pl.id, pl.name,
                 old_val=old, new_val=_pl(pl), request=request)
    return _pl(pl)


@router.delete("/price-lists/{list_id}")
async def delete_price_list(
    list_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_admin(current_user)
    pl = (await db.execute(
        select(PriceList).where(
            PriceList.id == list_id,
            PriceList.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Price list not found")
    if pl.is_default:
        raise HTTPException(
            400,
            "Cannot delete the default price list. Set another as default first."
        )
    pl.is_active  = False
    pl.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "price_list", pl.id, pl.name,
                 request=request)
    return {"success": True, "message": f"Price list '{pl.name}' deactivated"}


@router.post("/price-lists/{list_id}/items", status_code=201)
async def add_price_list_item(
    list_id: UUID,
    payload: PriceListItemCreate,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    pl = (await db.execute(
        select(PriceList).where(
            PriceList.id == list_id,
            PriceList.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Price list not found")

    item = PriceListItem(
        price_list_id  = list_id,
        tenant_id      = current_user.tenant_id,
        product_id     = UUID(payload.product_id) if payload.product_id else None,
        product_code   = payload.product_code,
        product_name   = payload.product_name,
        unit           = payload.unit,
        unit_price     = payload.unit_price,
        min_qty        = payload.min_qty,
        max_qty        = payload.max_qty,
        discount_pct   = payload.discount_pct,
        effective_from = date_type.fromisoformat(payload.effective_from) if payload.effective_from else None,
        effective_to   = date_type.fromisoformat(payload.effective_to)   if payload.effective_to   else None,
        notes          = payload.notes,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    if payload.product_id:
        db.add(PriceHistory(
            tenant_id       = current_user.tenant_id,
            product_id      = UUID(payload.product_id),
            product_code    = payload.product_code,
            product_name    = payload.product_name,
            price_list_id   = list_id,
            price_list_name = pl.name,
            price_type      = pl.list_type,
            old_price       = None,
            new_price       = payload.unit_price,
            changed_by      = current_user.id,
            changed_by_name = current_user.name,
            effective_from  = item.effective_from or pl.effective_from,
        ))

    await _audit(db, current_user, "create", "price_list_item", item.id,
                 f"{pl.name} → {payload.product_name}", request=request)
    return _pli(item)


@router.put("/price-lists/{list_id}/items/{item_id}")
async def update_price_list_item(
    list_id:  UUID,
    item_id:  UUID,
    payload:  PriceListItemUpdate,
    request:  Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    item = (await db.execute(
        select(PriceListItem).where(
            PriceListItem.id == item_id,
            PriceListItem.price_list_id == list_id,
            PriceListItem.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Price list item not found")

    old_price = float(item.unit_price)
    old = _pli(item)

    if payload.unit_price is not None and payload.unit_price != old_price:
        pl = (await db.execute(
            select(PriceList).where(PriceList.id == list_id)
        )).scalar_one_or_none()
        db.add(PriceHistory(
            tenant_id       = current_user.tenant_id,
            product_id      = item.product_id,
            product_code    = item.product_code,
            product_name    = item.product_name,
            price_list_id   = list_id,
            price_list_name = pl.name if pl else None,
            price_type      = pl.list_type if pl else "sales",
            old_price       = old_price,
            new_price       = payload.unit_price,
            changed_by      = current_user.id,
            changed_by_name = current_user.name,
            change_reason   = payload.change_reason,
            effective_from  = (date_type.fromisoformat(payload.effective_from)
                               if payload.effective_from else item.effective_from),
        ))

    for field, value in payload.model_dump(exclude_none=True).items():
        if field == "change_reason":
            continue
        if field in ("effective_from", "effective_to") and value:
            value = date_type.fromisoformat(value)
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    await _audit(db, current_user, "update", "price_list_item", item.id,
                 item.product_name, old_val=old, new_val=_pli(item), request=request)
    return _pli(item)


@router.delete("/price-lists/{list_id}/items/{item_id}")
async def delete_price_list_item(
    list_id: UUID,
    item_id: UUID,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    _require_masters_edit(current_user)
    item = (await db.execute(
        select(PriceListItem).where(
            PriceListItem.id == item_id,
            PriceListItem.price_list_id == list_id,
            PriceListItem.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Price list item not found")
    name = item.product_name
    await db.execute(
        sa.delete(PriceListItem).where(PriceListItem.id == item_id)
    )
    await _audit(db, current_user, "delete", "price_list_item",
                 item_id, name, request=request)
    return {"success": True, "message": f"{name} removed from price list"}


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5B — PRICE RESOLVE
# FIX: moved to /masters/price-resolve to avoid conflict with
#      /masters/price-lists/{list_id} — FastAPI was matching "resolve"
#      as the {list_id} UUID parameter and returning 422.
# ═══════════════════════════════════════════════════════════════════════

@router.get("/price-resolve")
async def resolve_price(
    product_id:  Optional[str] = Query(None),
    list_type:   str           = Query("sales"),
    order_date:  Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today"),
    party_id:    Optional[str] = Query(None),
    qty:         float         = Query(1.0),
    current_user: User         = Depends(get_current_active_user),
    db: AsyncSession           = Depends(get_db),
):
    """
    Resolve effective price for a product on a given order date.

    RULE: uses order_date — not today — so that old order prices are
    never affected when the price list changes later.

    Priority:
      1. Party-specific list valid on order_date
      2. Default list valid on order_date
      3. Product's own cost_price / selling_price (fallback)
    """
    _require_masters_view(current_user)
    tid    = current_user.tenant_id
    ref_dt = date_type.fromisoformat(order_date) if order_date else date_type.today()

    if not product_id:
        return {"price": None, "source": "no_product"}

    pid = UUID(product_id)

    async def find_price_in_list(list_id: UUID) -> Optional[float]:
        items = (await db.execute(
            select(PriceListItem).where(
                PriceListItem.price_list_id == list_id,
                PriceListItem.product_id    == pid,
                PriceListItem.min_qty       <= qty,
            ).order_by(PriceListItem.min_qty.desc())
        )).scalars().all()
        for item in items:
            eff_from = item.effective_from
            eff_to   = item.effective_to
            if eff_from and ref_dt < eff_from:
                continue
            if eff_to and ref_dt > eff_to:
                continue
            if item.max_qty and qty > float(item.max_qty):
                continue
            return float(item.unit_price)
        return None

    # 1. Party-specific list
    if party_id:
        party_lists = (await db.execute(
            select(PriceList).where(
                PriceList.tenant_id      == tid,
                PriceList.list_type      == list_type,
                PriceList.is_active      == True,
                PriceList.party_id       == UUID(party_id),
                PriceList.effective_from <= ref_dt,
            ).order_by(PriceList.effective_from.desc())
        )).scalars().all()
        for pl in party_lists:
            if pl.effective_to and ref_dt > pl.effective_to:
                continue
            price = await find_price_in_list(pl.id)
            if price is not None:
                return {
                    "price": price,
                    "price_list_id": str(pl.id),
                    "price_list_name": pl.name,
                    "source": "party_list",
                    "resolved_on": str(ref_dt),
                }

    # 2. Default list
    default_lists = (await db.execute(
        select(PriceList).where(
            PriceList.tenant_id      == tid,
            PriceList.list_type      == list_type,
            PriceList.is_active      == True,
            PriceList.is_default     == True,
            PriceList.effective_from <= ref_dt,
        ).order_by(PriceList.effective_from.desc())
    )).scalars().all()
    for pl in default_lists:
        if pl.effective_to and ref_dt > pl.effective_to:
            continue
        price = await find_price_in_list(pl.id)
        if price is not None:
            return {
                "price": price,
                "price_list_id": str(pl.id),
                "price_list_name": pl.name,
                "source": "default_list",
                "resolved_on": str(ref_dt),
            }

    # 3. Fallback: product's own price field
    row = (await db.execute(text(
        "SELECT selling_price, purchase_price FROM inventory_products "
        "WHERE id = :id AND tenant_id = :tid"
    ), {"id": str(pid), "tid": str(tid)})).fetchone()
    if row:
        price = float(row[0] if list_type == "sales" else row[1] or 0)
        return {"price": price, "source": "product_default", "resolved_on": str(ref_dt)}

    return {"price": None, "source": "not_found", "resolved_on": str(ref_dt)}


# ═══════════════════════════════════════════════════════════════════════
# SECTION 6 — PRICE HISTORY (global)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/price-history")
async def list_price_history(
    product_id: Optional[str] = Query(None),
    price_type: Optional[str] = Query(None),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(25, le=100),
    current_user: User        = Depends(get_current_active_user),
    db: AsyncSession          = Depends(get_db),
):
    _require_masters_view(current_user)
    tid = current_user.tenant_id
    q = select(PriceHistory).where(PriceHistory.tenant_id == tid)
    if product_id:
        q = q.where(PriceHistory.product_id == UUID(product_id))
    if price_type:
        q = q.where(PriceHistory.price_type == price_type)
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()
    items = (await db.execute(
        q.order_by(PriceHistory.created_at.desc())
        .offset((page-1)*page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_ph(h) for h in items],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total else 1,
    }