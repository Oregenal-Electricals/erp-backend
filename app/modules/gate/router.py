"""
Gate Guard / Security Module — Router
=======================================
Covers:
  Visitors       POST/GET /gate/visitors  + /{id}/exit
  Vehicles       POST/GET /gate/vehicles  + /{id}/exit
  Inward (GE)    POST/GET /gate/entries   + /{id} + approve/reject/hold
  Outward (GP)   POST/GET /gate/passes    + /{id} + exit/return/close
  Reports        GET /gate/reports/*

Permission model (module: 'gate'):
  gate_guard      — view, create          (log entries, record exit)
  store_manager   — view, create, edit, approve (full gate control)
  iqc_inspector   — view only
  admin/super_admin — all

Locking rules:
  GateEntry: editable only while status == PENDING
  GatePass:  editable only while status == OPEN

Inventory is NEVER updated here — that happens at GRN stage.
"""
import math
from datetime import datetime, timezone, date as date_type
from typing import Optional, List, Any
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.gate import (
    VisitorEntry, VehicleLog, GateEntry, GateEntryItem, GatePass
)
from app.models.master import AuditLog

router = APIRouter(prefix="/gate", tags=["Gate Guard / Security"])

# ═══════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════

GE_PENDING  = "PENDING"
GE_APPROVED = "APPROVED"
GE_REJECTED = "REJECTED"
GE_HOLD     = "HOLD"
GE_LOCKED   = {GE_APPROVED, GE_REJECTED, GE_HOLD}

GP_OPEN     = "OPEN"
GP_RETURNED = "RETURNED"
GP_PARTIAL  = "PARTIAL"
GP_CLOSED   = "CLOSED"

# Roles that can approve / reject / hold gate entries
APPROVER_ROLES = {"super_admin", "admin", "store_manager"}
# Roles that can create gate passes
PASS_CREATOR_ROLES = {"super_admin", "admin", "store_manager"}

VEHICLE_TYPES   = ["truck", "tempo", "car", "bike", "auto", "tractor", "other"]
TRANSPORT_MODES = ["road", "rail", "air", "sea", "courier", "hand_delivery"]
PASS_TYPES      = ["returnable", "non_returnable"]
ID_PROOF_TYPES  = ["aadhar", "pan", "passport", "driving_licence", "voter_id", "other"]
VEHICLE_PURPOSES= ["delivery", "pickup", "visit", "job_work", "scrap", "other"]
REF_TYPES       = ["sales_order", "delivery_challan", "job_work", "scrap", "sample", "other"]
UNITS           = ["pcs", "kg", "g", "ltr", "mtr", "box", "roll", "set", "nos", "pair"]


# ═══════════════════════════════════════════════════════════════════════
# PERMISSION HELPERS
# ═══════════════════════════════════════════════════════════════════════

def _require_gate_view(user: User):
    """Any role with gate:view can call this."""
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("gate", [])
    if "view" not in perms:
        raise HTTPException(403, "Gate module: view permission required")


def _require_gate_create(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("gate", [])
    if "create" not in perms:
        raise HTTPException(403, "Gate module: create permission required")


def _require_gate_approve(user: User):
    if user.role not in APPROVER_ROLES:
        raise HTTPException(
            403,
            f"Only Store Manager, Admin, or Super Admin can approve/reject/hold. "
            f"Your role: {user.role}"
        )


def _require_pass_create(user: User):
    if user.role not in PASS_CREATOR_ROLES:
        raise HTTPException(
            403,
            "Only Store Manager, Admin, or Super Admin can create gate passes"
        )


def _require_gate_edit(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("gate", [])
    if "edit" not in perms and "create" not in perms:
        raise HTTPException(403, "Gate module: edit permission required")


# ═══════════════════════════════════════════════════════════════════════
# NUMBER GENERATION (uses number_series table if exists, else fallback)
# ═══════════════════════════════════════════════════════════════════════

async def _next_number(
    tenant_id: UUID,
    doc_type: str,
    fallback_prefix: str,
    db: AsyncSession,
) -> str:
    """
    Generate next document number.
    Reads from number_series table (set in Master Setup).
    Falls back to simple counter if number_series not found.
    """
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
        # Fallback: count existing rows + 1
        table_map = {
            "visitor_entry":    "visitor_entries",
            "vehicle_log":      "vehicle_logs",
            "gate_entry":       "gate_entries",
            "gate_pass_r":      "gate_passes",
            "gate_pass_nr":     "gate_passes",
        }
        tbl = table_map.get(doc_type, "gate_entries")
        cnt = (await db.execute(
            text(f"SELECT COUNT(*) FROM {tbl} WHERE tenant_id = :tid"),
            {"tid": tenant_id}
        )).scalar_one()
        return f"{fallback_prefix}-{str(cnt + 1).zfill(4)}"

    # Build number from series config
    next_num = (ns.current_number or 0) + 1
    parts = []
    if ns.prefix:
        parts.append(ns.prefix)
    if ns.include_year:
        today = datetime.now()
        yr = today.year
        if today.month >= 4:
            fy_start, fy_end = yr, yr + 1
        else:
            fy_start, fy_end = yr - 1, yr
        fmt = ns.year_format or "YY-YY"
        if fmt == "YY-YY":
            year_str = f"{str(fy_start)[-2:]}-{str(fy_end)[-2:]}"
        elif fmt == "YYYY":
            year_str = str(fy_start)
        else:
            year_str = str(fy_start)[-2:]
        parts.append(year_str)
    parts.append(str(next_num).zfill(ns.padding_digits or 4))
    if ns.suffix:
        parts.append(ns.suffix)
    sep = ns.separator if ns.separator is not None else "-"
    number = sep.join(parts)

    # Increment current_number
    await db.execute(
        text("UPDATE number_series SET current_number = :n WHERE id = :id"),
        {"n": next_num, "id": ns.id}
    )
    return number


# ═══════════════════════════════════════════════════════════════════════
# AUDIT LOG HELPER
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
            action          = action,
            module          = "gate",
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
        pass   # audit never blocks business logic


# ═══════════════════════════════════════════════════════════════════════
# SERIALIZERS
# ═══════════════════════════════════════════════════════════════════════

def _vis(v: VisitorEntry) -> dict:
    return {
        "id": str(v.id), "entry_number": v.entry_number,
        "visitor_name": v.visitor_name, "visitor_phone": v.visitor_phone,
        "visitor_company": v.visitor_company,
        "id_proof_type": v.id_proof_type, "id_proof_number": v.id_proof_number,
        "purpose": v.purpose,
        "meeting_with_name": v.meeting_with_name, "meeting_with_dept": v.meeting_with_dept,
        "badge_number": v.badge_number,
        "gate_in":  v.gate_in.isoformat()  if v.gate_in  else None,
        "gate_out": v.gate_out.isoformat() if v.gate_out else None,
        "status": v.status, "remarks": v.remarks,
        "created_by_name": v.created_by_name,
        "is_test_data": v.is_test_data,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "updated_at": v.updated_at.isoformat() if v.updated_at else None,
    }


def _veh(v: VehicleLog) -> dict:
    return {
        "id": str(v.id), "log_number": v.log_number,
        "vehicle_number": v.vehicle_number, "vehicle_type": v.vehicle_type,
        "driver_name": v.driver_name, "driver_phone": v.driver_phone,
        "driver_licence": v.driver_licence,
        "from_location": v.from_location, "to_location": v.to_location,
        "purpose": v.purpose,
        "gate_in":  v.gate_in.isoformat()  if v.gate_in  else None,
        "gate_out": v.gate_out.isoformat() if v.gate_out else None,
        "status": v.status,
        "linked_entry_type": v.linked_entry_type,
        "linked_entry_id": str(v.linked_entry_id) if v.linked_entry_id else None,
        "remarks": v.remarks, "created_by_name": v.created_by_name,
        "is_test_data": v.is_test_data,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


def _item(i: GateEntryItem) -> dict:
    return {
        "id": str(i.id), "item_name": i.item_name, "item_code": i.item_code,
        "description": i.description,
        "qty_received": float(i.qty_received), "unit": i.unit,
        "po_qty": float(i.po_qty) if i.po_qty else None,
        "sort_order": i.sort_order, "remarks": i.remarks,
    }


def _ge(g: GateEntry, items: list = None) -> dict:
    return {
        "id": str(g.id), "entry_number": g.entry_number,
        "status": g.status,
        "is_locked": g.status in GE_LOCKED,
        "vendor_name": g.vendor_name, "vendor_gstin": g.vendor_gstin,
        "vehicle_number": g.vehicle_number, "driver_name": g.driver_name,
        "driver_phone": g.driver_phone, "transport_mode": g.transport_mode,
        "vendor_invoice_no": g.vendor_invoice_no,
        "vendor_invoice_date": g.vendor_invoice_date.isoformat() if g.vendor_invoice_date else None,
        "vendor_invoice_amount": float(g.vendor_invoice_amount) if g.vendor_invoice_amount else None,
        "po_id": str(g.po_id) if g.po_id else None,
        "po_number": g.po_number,
        "gate_in":  g.gate_in.isoformat()  if g.gate_in  else None,
        "gate_out": g.gate_out.isoformat() if g.gate_out else None,
        "remarks": g.remarks, "attachment_url": g.attachment_url,
        "approved_by_id": str(g.approved_by_id) if g.approved_by_id else None,
        "approved_at": g.approved_at.isoformat() if g.approved_at else None,
        "rejected_by_id": str(g.rejected_by_id) if g.rejected_by_id else None,
        "rejected_at": g.rejected_at.isoformat() if g.rejected_at else None,
        "rejection_reason": g.rejection_reason,
        "held_by_id": str(g.held_by_id) if g.held_by_id else None,
        "held_at": g.held_at.isoformat() if g.held_at else None,
        "hold_reason": g.hold_reason,
        "grn_id": str(g.grn_id) if g.grn_id else None,
        "grn_number": g.grn_number,
        "created_by_name": g.created_by_name,
        "is_test_data": g.is_test_data,
        "created_at": g.created_at.isoformat() if g.created_at else None,
        "updated_at": g.updated_at.isoformat() if g.updated_at else None,
        "items": [_item(i) for i in (items or [])],
    }


def _gp(p: GatePass) -> dict:
    return {
        "id": str(p.id), "pass_number": p.pass_number,
        "pass_type": p.pass_type, "status": p.status,
        "party_name": p.party_name, "party_address": p.party_address,
        "party_phone": p.party_phone,
        "vehicle_number": p.vehicle_number, "driver_name": p.driver_name,
        "driver_phone": p.driver_phone,
        "purpose": p.purpose,
        "reference_type": p.reference_type,
        "reference_id": str(p.reference_id) if p.reference_id else None,
        "reference_number": p.reference_number,
        "expected_return_date": p.expected_return_date.isoformat() if p.expected_return_date else None,
        "actual_return_date": p.actual_return_date.isoformat() if p.actual_return_date else None,
        "gate_out": p.gate_out.isoformat() if p.gate_out else None,
        "gate_in_return": p.gate_in_return.isoformat() if p.gate_in_return else None,
        "approved_by_id": str(p.approved_by_id) if p.approved_by_id else None,
        "approved_at": p.approved_at.isoformat() if p.approved_at else None,
        "items": p.items or [],
        "remarks": p.remarks, "attachment_url": p.attachment_url,
        "created_by_name": p.created_by_name,
        "is_test_data": p.is_test_data,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class VisitorCreate(BaseModel):
    visitor_name:      str
    visitor_phone:     Optional[str] = None
    visitor_company:   Optional[str] = None
    id_proof_type:     Optional[str] = None
    id_proof_number:   Optional[str] = None
    purpose:           Optional[str] = None
    meeting_with_name: Optional[str] = None
    meeting_with_dept: Optional[str] = None
    badge_number:      Optional[str] = None
    gate_in:           Optional[str] = None   # ISO datetime string
    remarks:           Optional[str] = None

    @field_validator("visitor_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Visitor name cannot be empty")
        return v.strip()


class VisitorUpdate(BaseModel):
    visitor_phone:     Optional[str] = None
    visitor_company:   Optional[str] = None
    purpose:           Optional[str] = None
    meeting_with_name: Optional[str] = None
    badge_number:      Optional[str] = None
    remarks:           Optional[str] = None


class VehicleCreate(BaseModel):
    vehicle_number:   str
    vehicle_type:     str             = "truck"
    driver_name:      Optional[str]   = None
    driver_phone:     Optional[str]   = None
    driver_licence:   Optional[str]   = None
    from_location:    Optional[str]   = None
    to_location:      Optional[str]   = None
    purpose:          str             = "delivery"
    gate_in:          Optional[str]   = None
    linked_entry_type:Optional[str]   = None
    linked_entry_id:  Optional[UUID]  = None
    remarks:          Optional[str]   = None

    @field_validator("vehicle_number")
    @classmethod
    def veh_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Vehicle number cannot be empty")
        return v.strip().upper()


class VehicleUpdate(BaseModel):
    vehicle_type:     Optional[str] = None
    driver_name:      Optional[str] = None
    driver_phone:     Optional[str] = None
    from_location:    Optional[str] = None
    to_location:      Optional[str] = None
    purpose:          Optional[str] = None
    remarks:          Optional[str] = None


class GateEntryItemSchema(BaseModel):
    item_name:    str
    item_code:    Optional[str]   = None
    description:  Optional[str]   = None
    qty_received: float           = 0
    unit:         str             = "pcs"
    po_qty:       Optional[float] = None
    sort_order:   int             = 0
    remarks:      Optional[str]   = None

    @field_validator("item_name")
    @classmethod
    def item_name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Item name cannot be empty")
        return v.strip()

    @field_validator("qty_received")
    @classmethod
    def qty_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class GateEntryCreate(BaseModel):
    vendor_name:            str
    vendor_gstin:           Optional[str]   = None
    vehicle_number:         Optional[str]   = None
    driver_name:            Optional[str]   = None
    driver_phone:           Optional[str]   = None
    transport_mode:         str             = "road"
    vendor_invoice_no:      Optional[str]   = None
    vendor_invoice_date:    Optional[str]   = None   # YYYY-MM-DD
    vendor_invoice_amount:  Optional[float] = None
    po_id:                  Optional[UUID]  = None
    po_number:              Optional[str]   = None
    gate_in:                Optional[str]   = None
    remarks:                Optional[str]   = None
    attachment_url:         Optional[str]   = None
    items:                  List[GateEntryItemSchema] = []

    @field_validator("vendor_name")
    @classmethod
    def vendor_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Vendor name cannot be empty")
        return v.strip()

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Gate entry must have at least one item")
        return v


class GateEntryUpdate(BaseModel):
    vendor_name:           Optional[str]   = None
    vendor_gstin:          Optional[str]   = None
    vehicle_number:        Optional[str]   = None
    driver_name:           Optional[str]   = None
    driver_phone:          Optional[str]   = None
    transport_mode:        Optional[str]   = None
    vendor_invoice_no:     Optional[str]   = None
    vendor_invoice_date:   Optional[str]   = None
    vendor_invoice_amount: Optional[float] = None
    po_id:                 Optional[UUID]  = None
    po_number:             Optional[str]   = None
    gate_in:               Optional[str]   = None
    gate_out:              Optional[str]   = None
    remarks:               Optional[str]   = None
    attachment_url:        Optional[str]   = None
    items:                 Optional[List[GateEntryItemSchema]] = None


class ActionPayload(BaseModel):
    reason: Optional[str] = None


class GatePassItemSchema(BaseModel):
    item_name:    str
    item_code:    Optional[str]   = None
    qty:          float
    unit:         str             = "pcs"
    qty_returned: float           = 0

    @field_validator("qty")
    @classmethod
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class GatePassCreate(BaseModel):
    pass_type:            str   = "returnable"
    party_name:           str
    party_address:        Optional[str]   = None
    party_phone:          Optional[str]   = None
    vehicle_number:       Optional[str]   = None
    driver_name:          Optional[str]   = None
    driver_phone:         Optional[str]   = None
    purpose:              Optional[str]   = None
    reference_type:       Optional[str]   = None
    reference_id:         Optional[UUID]  = None
    reference_number:     Optional[str]   = None
    expected_return_date: Optional[str]   = None   # YYYY-MM-DD
    remarks:              Optional[str]   = None
    attachment_url:       Optional[str]   = None
    items:                List[GatePassItemSchema] = []

    @field_validator("party_name")
    @classmethod
    def party_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Party name cannot be empty")
        return v.strip()

    @field_validator("pass_type")
    @classmethod
    def valid_pass_type(cls, v):
        if v not in PASS_TYPES:
            raise ValueError(f"pass_type must be one of {PASS_TYPES}")
        return v

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Gate pass must have at least one item")
        return v


class GatePassUpdate(BaseModel):
    party_name:           Optional[str]   = None
    party_address:        Optional[str]   = None
    party_phone:          Optional[str]   = None
    vehicle_number:       Optional[str]   = None
    driver_name:          Optional[str]   = None
    driver_phone:         Optional[str]   = None
    purpose:              Optional[str]   = None
    reference_type:       Optional[str]   = None
    reference_number:     Optional[str]   = None
    expected_return_date: Optional[str]   = None
    remarks:              Optional[str]   = None
    attachment_url:       Optional[str]   = None


class ReturnPayload(BaseModel):
    items:             List[GatePassItemSchema]
    actual_return_date:Optional[str] = None
    remarks:           Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════
# HELPER — get items for a gate entry
# ═══════════════════════════════════════════════════════════════════════

async def _get_entry_items(entry_id: UUID, db: AsyncSession) -> list:
    r = await db.execute(
        select(GateEntryItem)
        .where(GateEntryItem.gate_entry_id == entry_id)
        .order_by(GateEntryItem.sort_order, GateEntryItem.created_at)
    )
    return r.scalars().all()


async def _replace_items(
    entry_id: UUID,
    tenant_id: UUID,
    items_data: List[GateEntryItemSchema],
    db: AsyncSession,
) -> list:
    """Delete all existing items for entry and insert new ones."""
    await db.execute(
        sa.delete(GateEntryItem).where(GateEntryItem.gate_entry_id == entry_id)
    )
    new_items = []
    for idx, it in enumerate(items_data):
        obj = GateEntryItem(
            gate_entry_id = entry_id,
            tenant_id     = tenant_id,
            item_name     = it.item_name,
            item_code     = it.item_code,
            description   = it.description,
            qty_received  = it.qty_received,
            unit          = it.unit,
            po_qty        = it.po_qty,
            sort_order    = it.sort_order if it.sort_order else idx,
            remarks       = it.remarks,
        )
        db.add(obj)
        new_items.append(obj)
    await db.flush()
    return new_items


# ═══════════════════════════════════════════════════════════════════════
# SECTION 1 — VISITOR ENTRIES
# ═══════════════════════════════════════════════════════════════════════

@router.get("/visitors")
async def list_visitors(
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    q = select(VisitorEntry).where(VisitorEntry.tenant_id == current_user.tenant_id, VisitorEntry.is_active == True)
    if status:
        q = q.where(VisitorEntry.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            VisitorEntry.visitor_name.ilike(t),
            VisitorEntry.visitor_phone.ilike(t),
            VisitorEntry.entry_number.ilike(t),
            VisitorEntry.visitor_company.ilike(t),
        ))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(VisitorEntry.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {
        "items": [_vis(v) for v in rows], "total": total,
        "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


@router.post("/visitors", status_code=201)
async def create_visitor(
    payload: VisitorCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_create(current_user)
    num = await _next_number(current_user.tenant_id, "visitor_entry", "VIS", db)
    now = datetime.now(timezone.utc)
    gate_in = datetime.fromisoformat(payload.gate_in) if payload.gate_in else now

    v = VisitorEntry(
        tenant_id         = current_user.tenant_id,
        created_by        = current_user.id,
        updated_by        = current_user.id,
        entry_number      = num,
        visitor_name      = payload.visitor_name,
        visitor_phone     = payload.visitor_phone,
        visitor_company   = payload.visitor_company,
        id_proof_type     = payload.id_proof_type,
        id_proof_number   = payload.id_proof_number,
        purpose           = payload.purpose,
        meeting_with_name = payload.meeting_with_name,
        meeting_with_dept = payload.meeting_with_dept,
        badge_number      = payload.badge_number,
        gate_in           = gate_in,
        status            = "inside",
        remarks           = payload.remarks,
        created_by_name   = current_user.name,
    )
    db.add(v)
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "create", "visitor_entry",
                 v.id, v.entry_number, new_val=_vis(v), request=request)
    return _vis(v)


@router.get("/visitors/{visitor_id}")
async def get_visitor(
    visitor_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    r = await db.execute(
        select(VisitorEntry).where(
            VisitorEntry.id == visitor_id,
            VisitorEntry.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Visitor entry not found")
    return _vis(v)


@router.patch("/visitors/{visitor_id}/exit")
async def visitor_exit(
    visitor_id: UUID,
    request:    Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Record gate-out time for a visitor."""
    _require_gate_create(current_user)
    r = await db.execute(
        select(VisitorEntry).where(
            VisitorEntry.id == visitor_id,
            VisitorEntry.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Visitor entry not found")
    if v.status == "exited":
        raise HTTPException(400, f"{v.entry_number} has already exited")

    old = _vis(v)
    v.gate_out  = datetime.now(timezone.utc)
    v.status    = "exited"
    v.updated_by = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "update", "visitor_entry",
                 v.id, v.entry_number, old_val=old, new_val=_vis(v),
                 notes="Gate exit recorded", request=request)
    return _vis(v)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2 — VEHICLE LOGS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/vehicles")
async def list_vehicles(
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    q = select(VehicleLog).where(VehicleLog.tenant_id == current_user.tenant_id, VehicleLog.is_active == True)
    if status:
        q = q.where(VehicleLog.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            VehicleLog.vehicle_number.ilike(t),
            VehicleLog.driver_name.ilike(t),
            VehicleLog.log_number.ilike(t),
        ))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(VehicleLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {
        "items": [_veh(v) for v in rows], "total": total,
        "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


@router.post("/vehicles", status_code=201)
async def create_vehicle(
    payload: VehicleCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_create(current_user)
    num = await _next_number(current_user.tenant_id, "vehicle_log", "VEH", db)
    now = datetime.now(timezone.utc)
    gate_in = datetime.fromisoformat(payload.gate_in) if payload.gate_in else now

    v = VehicleLog(
        tenant_id         = current_user.tenant_id,
        created_by        = current_user.id,
        updated_by        = current_user.id,
        log_number        = num,
        vehicle_number    = payload.vehicle_number,
        vehicle_type      = payload.vehicle_type,
        driver_name       = payload.driver_name,
        driver_phone      = payload.driver_phone,
        driver_licence    = payload.driver_licence,
        from_location     = payload.from_location,
        to_location       = payload.to_location,
        purpose           = payload.purpose,
        gate_in           = gate_in,
        status            = "inside",
        linked_entry_type = payload.linked_entry_type,
        linked_entry_id   = payload.linked_entry_id,
        remarks           = payload.remarks,
        created_by_name   = current_user.name,
    )
    db.add(v)
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "create", "vehicle_log",
                 v.id, v.log_number, new_val=_veh(v), request=request)
    return _veh(v)


@router.get("/vehicles/{vehicle_id}")
async def get_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    r = await db.execute(
        select(VehicleLog).where(
            VehicleLog.id == vehicle_id,
            VehicleLog.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehicle log not found")
    return _veh(v)


@router.patch("/vehicles/{vehicle_id}/exit")
async def vehicle_exit(
    vehicle_id: UUID,
    request:    Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Record gate-out time for a vehicle."""
    _require_gate_create(current_user)
    r = await db.execute(
        select(VehicleLog).where(
            VehicleLog.id == vehicle_id,
            VehicleLog.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehicle log not found")
    if v.status == "exited":
        raise HTTPException(400, f"{v.log_number} has already exited")

    old = _veh(v)
    v.gate_out   = datetime.now(timezone.utc)
    v.status     = "exited"
    v.updated_by = current_user.id
    await db.flush()
    await db.refresh(v)
    await _audit(db, current_user, "update", "vehicle_log",
                 v.id, v.log_number, old_val=old, new_val=_veh(v),
                 notes="Vehicle exit recorded", request=request)
    return _veh(v)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3 — GATE ENTRIES (Material Inward)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/entries/stats")
async def gate_entry_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Summary counts by status. Used for dashboard cards."""
    _require_gate_view(current_user)
    rows = (await db.execute(
        select(GateEntry.status, func.count(GateEntry.id).label("cnt"))
        .where(GateEntry.tenant_id == current_user.tenant_id)
        .group_by(GateEntry.status)
    )).all()
    stats = {r.status: r.cnt for r in rows}
    return {
        "total":    sum(stats.values()),
        "pending":  stats.get(GE_PENDING, 0),
        "approved": stats.get(GE_APPROVED, 0),
        "rejected": stats.get(GE_REJECTED, 0),
        "on_hold":  stats.get(GE_HOLD, 0),
    }


@router.get("/entries")
async def list_gate_entries(
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    q = select(GateEntry).where(GateEntry.tenant_id == current_user.tenant_id, GateEntry.is_active == True)
    if status:
        q = q.where(GateEntry.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            GateEntry.entry_number.ilike(t),
            GateEntry.vendor_name.ilike(t),
            GateEntry.vehicle_number.ilike(t),
            GateEntry.vendor_invoice_no.ilike(t),
            GateEntry.po_number.ilike(t),
        ))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(GateEntry.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    # Attach item count per entry without loading all items
    result = []
    for g in rows:
        cnt = (await db.execute(
            select(func.count(GateEntryItem.id))
            .where(GateEntryItem.gate_entry_id == g.id)
        )).scalar_one()
        d = _ge(g, [])
        d["items_count"] = cnt
        result.append(d)

    return {
        "items": result, "total": total,
        "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


@router.post("/entries", status_code=201)
async def create_gate_entry(
    payload: GateEntryCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Gate Guard creates a material inward entry. Status starts as PENDING."""
    _require_gate_create(current_user)
    num = await _next_number(current_user.tenant_id, "gate_entry", "GE", db)
    now = datetime.now(timezone.utc)
    gate_in = datetime.fromisoformat(payload.gate_in) if payload.gate_in else now

    inv_date = None
    if payload.vendor_invoice_date:
        try:
            inv_date = date_type.fromisoformat(payload.vendor_invoice_date)
        except ValueError:
            pass

    ge = GateEntry(
        tenant_id             = current_user.tenant_id,
        created_by            = current_user.id,
        updated_by            = current_user.id,
        entry_number          = num,
        status                = GE_PENDING,
        vendor_name           = payload.vendor_name,
        vendor_gstin          = payload.vendor_gstin,
        vehicle_number        = payload.vehicle_number,
        driver_name           = payload.driver_name,
        driver_phone          = payload.driver_phone,
        transport_mode        = payload.transport_mode,
        vendor_invoice_no     = payload.vendor_invoice_no,
        vendor_invoice_date   = inv_date,
        vendor_invoice_amount = payload.vendor_invoice_amount,
        po_id                 = payload.po_id,
        po_number             = payload.po_number,
        gate_in               = gate_in,
        remarks               = payload.remarks,
        attachment_url        = payload.attachment_url,
        created_by_name       = current_user.name,
    )
    db.add(ge)
    await db.flush()

    # Line items
    new_items = await _replace_items(ge.id, current_user.tenant_id, payload.items, db)
    await db.refresh(ge)
    await _audit(db, current_user, "create", "gate_entry",
                 ge.id, ge.entry_number, new_val=_ge(ge), request=request)
    return _ge(ge, new_items)


@router.get("/entries/{entry_id}")
async def get_gate_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    items = await _get_entry_items(entry_id, db)
    return _ge(ge, items)


@router.put("/entries/{entry_id}")
async def update_gate_entry(
    entry_id: UUID,
    payload:  GateEntryUpdate,
    request:  Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Edit a gate entry.
    LOCKED once status moves away from PENDING.
    Once approved/rejected/held — cannot be changed.
    """
    _require_gate_edit(current_user)
    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    if ge.status in GE_LOCKED:
        raise HTTPException(
            400,
            f"Gate entry {ge.entry_number} is locked (status: {ge.status}). "
            f"Cannot be edited after approval, rejection, or hold."
        )

    old = _ge(ge)
    for field in [
        "vendor_name", "vendor_gstin", "vehicle_number", "driver_name",
        "driver_phone", "transport_mode", "vendor_invoice_no",
        "vendor_invoice_amount", "po_id", "po_number",
        "gate_in", "gate_out", "remarks", "attachment_url",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(ge, field, val)

    if payload.vendor_invoice_date is not None:
        try:
            ge.vendor_invoice_date = date_type.fromisoformat(payload.vendor_invoice_date)
        except ValueError:
            pass

    ge.updated_by = current_user.id

    if payload.items is not None:
        if len(payload.items) == 0:
            raise HTTPException(400, "Gate entry must have at least one item")
        new_items = await _replace_items(entry_id, current_user.tenant_id, payload.items, db)
        await db.flush()
        await db.refresh(ge)
        await _audit(db, current_user, "update", "gate_entry",
                     ge.id, ge.entry_number, old_val=old, new_val=_ge(ge), request=request)
        return _ge(ge, new_items)

    await db.flush()
    await db.refresh(ge)
    items = await _get_entry_items(entry_id, db)
    await _audit(db, current_user, "update", "gate_entry",
                 ge.id, ge.entry_number, old_val=old, new_val=_ge(ge), request=request)
    return _ge(ge, items)


@router.post("/entries/{entry_id}/approve")
async def approve_gate_entry(
    entry_id: UUID,
    request:  Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve → status becomes APPROVED. Ready for IQC / GRN.
    INVENTORY IS NOT UPDATED HERE.
    Only Store Manager / Admin / Super Admin.
    """
    _require_gate_approve(current_user)
    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    if ge.status != GE_PENDING:
        raise HTTPException(400, f"Only PENDING entries can be approved. Current: {ge.status}")

    old = _ge(ge)
    ge.status         = GE_APPROVED
    ge.approved_by_id = current_user.id
    ge.approved_at    = datetime.now(timezone.utc)
    ge.updated_by     = current_user.id

    await db.flush()
    await db.refresh(ge)
    items = await _get_entry_items(entry_id, db)
    await _audit(db, current_user, "approve", "gate_entry",
                 ge.id, ge.entry_number, old_val=old, new_val=_ge(ge),
                 notes=f"Approved by {current_user.name}", request=request)
    return _ge(ge, items)


@router.post("/entries/{entry_id}/reject")
async def reject_gate_entry(
    entry_id: UUID,
    payload:  ActionPayload,
    request:  Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Rejection reason is mandatory."""
    _require_gate_approve(current_user)
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(422, "Rejection reason is required")

    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    if ge.status != GE_PENDING:
        raise HTTPException(400, f"Only PENDING entries can be rejected. Current: {ge.status}")

    old = _ge(ge)
    ge.status           = GE_REJECTED
    ge.rejected_by_id   = current_user.id
    ge.rejected_at      = datetime.now(timezone.utc)
    ge.rejection_reason = payload.reason.strip()
    ge.updated_by       = current_user.id

    await db.flush()
    await db.refresh(ge)
    items = await _get_entry_items(entry_id, db)
    await _audit(db, current_user, "reject", "gate_entry",
                 ge.id, ge.entry_number, old_val=old, new_val=_ge(ge),
                 notes=f"Rejected: {payload.reason.strip()}", request=request)
    return _ge(ge, items)


@router.post("/entries/{entry_id}/hold")
async def hold_gate_entry(
    entry_id: UUID,
    payload:  ActionPayload,
    request:  Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Hold for further review."""
    _require_gate_approve(current_user)
    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    if ge.status != GE_PENDING:
        raise HTTPException(400, f"Only PENDING entries can be held. Current: {ge.status}")

    old = _ge(ge)
    ge.status      = GE_HOLD
    ge.held_by_id  = current_user.id
    ge.held_at     = datetime.now(timezone.utc)
    ge.hold_reason = payload.reason.strip() if payload.reason else None
    ge.updated_by  = current_user.id

    await db.flush()
    await db.refresh(ge)
    items = await _get_entry_items(entry_id, db)
    await _audit(db, current_user, "hold", "gate_entry",
                 ge.id, ge.entry_number, old_val=old, new_val=_ge(ge),
                 notes=f"Held: {ge.hold_reason or 'no reason'}", request=request)
    return _ge(ge, items)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4 — GATE PASSES (Material Outward)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/passes")
async def list_gate_passes(
    pass_type: Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    q = select(GatePass).where(GatePass.tenant_id == current_user.tenant_id, GatePass.is_active == True)
    if pass_type:
        q = q.where(GatePass.pass_type == pass_type)
    if status:
        q = q.where(GatePass.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            GatePass.pass_number.ilike(t),
            GatePass.party_name.ilike(t),
            GatePass.vehicle_number.ilike(t),
            GatePass.reference_number.ilike(t),
        ))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(GatePass.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {
        "items": [_gp(p) for p in rows], "total": total,
        "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


@router.post("/passes", status_code=201)
async def create_gate_pass(
    payload: GatePassCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store Manager / Admin creates a gate pass.
    Returnable → material expected back.
    Non-returnable → material gone permanently.
    """
    _require_pass_create(current_user)

    # Generate number — RGP for returnable, NRGP for non-returnable
    if payload.pass_type == "returnable":
        doc_type = "gate_pass_r"
        fallback = "RGP"
    else:
        doc_type = "gate_pass_nr"
        fallback = "NRGP"

    num = await _next_number(current_user.tenant_id, doc_type, fallback, db)

    exp_return = None
    if payload.expected_return_date:
        try:
            exp_return = date_type.fromisoformat(payload.expected_return_date)
        except ValueError:
            pass

    items_data = [it.model_dump() for it in payload.items]

    gp = GatePass(
        tenant_id            = current_user.tenant_id,
        created_by           = current_user.id,
        updated_by           = current_user.id,
        pass_number          = num,
        pass_type            = payload.pass_type,
        status               = GP_OPEN,
        party_name           = payload.party_name,
        party_address        = payload.party_address,
        party_phone          = payload.party_phone,
        vehicle_number       = payload.vehicle_number,
        driver_name          = payload.driver_name,
        driver_phone         = payload.driver_phone,
        purpose              = payload.purpose,
        reference_type       = payload.reference_type,
        reference_id         = payload.reference_id,
        reference_number     = payload.reference_number,
        expected_return_date = exp_return,
        remarks              = payload.remarks,
        attachment_url       = payload.attachment_url,
        items                = items_data,
        created_by_name      = current_user.name,
        approved_by_id       = current_user.id,
        approved_at          = datetime.now(timezone.utc),
    )
    db.add(gp)
    await db.flush()
    await db.refresh(gp)
    await _audit(db, current_user, "create", "gate_pass",
                 gp.id, gp.pass_number, new_val=_gp(gp), request=request)
    return _gp(gp)


@router.get("/passes/{pass_id}")
async def get_gate_pass(
    pass_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _require_gate_view(current_user)
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    return _gp(gp)


@router.put("/passes/{pass_id}")
async def update_gate_pass(
    pass_id: UUID,
    payload: GatePassUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a gate pass — only while status is OPEN."""
    _require_pass_create(current_user)
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    if gp.status != GP_OPEN:
        raise HTTPException(400, f"Gate pass {gp.pass_number} is {gp.status} — cannot be edited")

    old = _gp(gp)
    for field in [
        "party_name", "party_address", "party_phone",
        "vehicle_number", "driver_name", "driver_phone",
        "purpose", "reference_type", "reference_number",
        "remarks", "attachment_url",
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(gp, field, val)
    if payload.expected_return_date is not None:
        try:
            gp.expected_return_date = date_type.fromisoformat(payload.expected_return_date)
        except ValueError:
            pass
    gp.updated_by = current_user.id

    await db.flush()
    await db.refresh(gp)
    await _audit(db, current_user, "update", "gate_pass",
                 gp.id, gp.pass_number, old_val=old, new_val=_gp(gp), request=request)
    return _gp(gp)


@router.post("/passes/{pass_id}/exit")
async def gate_pass_exit(
    pass_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Gate Guard records the gate-out time.
    This is the moment material physically leaves the gate.
    """
    _require_gate_create(current_user)
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    if gp.gate_out:
        raise HTTPException(400, f"{gp.pass_number}: exit already recorded")

    old = _gp(gp)
    gp.gate_out   = datetime.now(timezone.utc)
    gp.updated_by = current_user.id

    await db.flush()
    await db.refresh(gp)
    await _audit(db, current_user, "exit", "gate_pass",
                 gp.id, gp.pass_number, old_val=old, new_val=_gp(gp),
                 notes="Material exit recorded at gate", request=request)
    return _gp(gp)


@router.post("/passes/{pass_id}/return")
async def gate_pass_return(
    pass_id: UUID,
    payload: ReturnPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record material return for a RETURNABLE gate pass.
    Updates qty_returned per item.
    Status → RETURNED if all qty back, PARTIAL if some remaining.
    """
    _require_gate_create(current_user)
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    if gp.pass_type != "returnable":
        raise HTTPException(400, "Return can only be recorded on returnable gate passes")
    if gp.status == GP_CLOSED:
        raise HTTPException(400, f"{gp.pass_number} is already closed")

    old = _gp(gp)

    # Merge returned quantities into items JSONB
    return_map = {it.item_name: it.qty_returned for it in payload.items}
    updated_items = []
    total_qty = 0.0
    total_returned = 0.0
    for item in (gp.items or []):
        ret = return_map.get(item.get("item_name"), 0)
        new_returned = (item.get("qty_returned") or 0) + ret
        item = {**item, "qty_returned": new_returned}
        updated_items.append(item)
        total_qty     += float(item.get("qty", 0))
        total_returned += float(new_returned)

    gp.items = updated_items
    gp.gate_in_return = datetime.now(timezone.utc)
    gp.updated_by = current_user.id

    if payload.actual_return_date:
        try:
            gp.actual_return_date = date_type.fromisoformat(payload.actual_return_date)
        except ValueError:
            pass
    else:
        gp.actual_return_date = datetime.now(timezone.utc).date()

    # Determine new status
    if total_returned >= total_qty:
        gp.status = GP_RETURNED
    else:
        gp.status = GP_PARTIAL

    await db.flush()
    await db.refresh(gp)
    await _audit(db, current_user, "return", "gate_pass",
                 gp.id, gp.pass_number, old_val=old, new_val=_gp(gp),
                 notes=f"Return recorded — {total_returned}/{total_qty} units back",
                 request=request)
    return _gp(gp)


@router.post("/passes/{pass_id}/close")
async def close_gate_pass(
    pass_id: UUID,
    payload: ActionPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store Manager / Admin closes a gate pass.
    For non-returnable: close directly.
    For returnable: close even if not fully returned (write off remaining).
    """
    _require_pass_create(current_user)
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    if gp.status == GP_CLOSED:
        raise HTTPException(400, f"{gp.pass_number} is already closed")

    old = _gp(gp)
    gp.status     = GP_CLOSED
    gp.updated_by = current_user.id
    if payload.reason:
        gp.remarks = (gp.remarks or "") + f" | Closed: {payload.reason.strip()}"

    await db.flush()
    await db.refresh(gp)
    await _audit(db, current_user, "close", "gate_pass",
                 gp.id, gp.pass_number, old_val=old, new_val=_gp(gp),
                 notes=f"Closed by {current_user.name}", request=request)
    return _gp(gp)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4B — SOFT DELETE (Admin+ only)
# ═══════════════════════════════════════════════════════════════════════

@router.delete("/visitors/{visitor_id}")
async def delete_visitor(
    visitor_id: UUID,
    request:    Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a visitor entry. Admin+ only."""
    if current_user.role not in ("super_admin", "admin"):
        raise HTTPException(403, "Only Admin or Super Admin can delete entries")
    r = await db.execute(
        select(VisitorEntry).where(
            VisitorEntry.id == visitor_id,
            VisitorEntry.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Visitor entry not found")
    v.is_active = False
    v.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "visitor_entry",
                 v.id, v.entry_number, request=request)
    return {"success": True, "message": f"{v.entry_number} deleted"}


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: UUID,
    request:    Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a vehicle log. Admin+ only."""
    if current_user.role not in ("super_admin", "admin"):
        raise HTTPException(403, "Only Admin or Super Admin can delete entries")
    r = await db.execute(
        select(VehicleLog).where(
            VehicleLog.id == vehicle_id,
            VehicleLog.tenant_id == current_user.tenant_id,
        )
    )
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Vehicle log not found")
    v.is_active = False
    v.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "vehicle_log",
                 v.id, v.log_number, request=request)
    return {"success": True, "message": f"{v.log_number} deleted"}


@router.delete("/entries/{entry_id}")
async def delete_gate_entry(
    entry_id: UUID,
    request:  Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Soft-delete a gate entry. Admin+ only.
    Cannot delete APPROVED entries linked to a GRN.
    """
    if current_user.role not in ("super_admin", "admin"):
        raise HTTPException(403, "Only Admin or Super Admin can delete gate entries")
    r = await db.execute(
        select(GateEntry).where(
            GateEntry.id == entry_id,
            GateEntry.tenant_id == current_user.tenant_id,
        )
    )
    ge = r.scalar_one_or_none()
    if not ge:
        raise HTTPException(404, "Gate entry not found")
    if ge.status == GE_APPROVED and ge.grn_id:
        raise HTTPException(
            400,
            f"Cannot delete {ge.entry_number} — it is linked to GRN {ge.grn_number}"
        )
    ge.is_active = False
    ge.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "gate_entry",
                 ge.id, ge.entry_number, request=request)
    return {"success": True, "message": f"{ge.entry_number} deleted"}


@router.delete("/passes/{pass_id}")
async def delete_gate_pass(
    pass_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a gate pass. Admin+ only. Cannot delete OPEN passes."""
    if current_user.role not in ("super_admin", "admin"):
        raise HTTPException(403, "Only Admin or Super Admin can delete gate passes")
    r = await db.execute(
        select(GatePass).where(
            GatePass.id == pass_id,
            GatePass.tenant_id == current_user.tenant_id,
        )
    )
    gp = r.scalar_one_or_none()
    if not gp:
        raise HTTPException(404, "Gate pass not found")
    if gp.status == GP_OPEN:
        raise HTTPException(
            400,
            f"Cannot delete {gp.pass_number} while status is OPEN. Close it first."
        )
    gp.is_active = False
    gp.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "gate_pass",
                 gp.id, gp.pass_number, request=request)
    return {"success": True, "message": f"{gp.pass_number} deleted"}



# ═══════════════════════════════════════════════════════════════════════
# SECTION 5 — REPORTS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/reports/stats")
async def gate_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Overall gate module statistics. Admin / Store Manager."""
    _require_gate_approve(current_user)
    today = datetime.now(timezone.utc).date()

    # Today's visitors
    v_today = (await db.execute(
        select(func.count(VisitorEntry.id)).where(
            VisitorEntry.tenant_id == current_user.tenant_id,
            func.date(VisitorEntry.gate_in) == today,
        )
    )).scalar_one()

    # Visitors currently inside
    v_inside = (await db.execute(
        select(func.count(VisitorEntry.id)).where(
            VisitorEntry.tenant_id == current_user.tenant_id,
            VisitorEntry.status == "inside",
        )
    )).scalar_one()

    # Vehicles currently inside
    vh_inside = (await db.execute(
        select(func.count(VehicleLog.id)).where(
            VehicleLog.tenant_id == current_user.tenant_id,
            VehicleLog.status == "inside",
        )
    )).scalar_one()

    # Gate entry stats
    ge_rows = (await db.execute(
        select(GateEntry.status, func.count(GateEntry.id).label("cnt"))
        .where(GateEntry.tenant_id == current_user.tenant_id)
        .group_by(GateEntry.status)
    )).all()
    ge_stats = {r.status: r.cnt for r in ge_rows}

    # Overdue returnable passes
    overdue = (await db.execute(
        select(func.count(GatePass.id)).where(
            GatePass.tenant_id == current_user.tenant_id,
            GatePass.pass_type == "returnable",
            GatePass.status.in_([GP_OPEN, GP_PARTIAL]),
            GatePass.expected_return_date < today,
        )
    )).scalar_one()

    return {
        "visitors": {"today": v_today, "inside": v_inside},
        "vehicles": {"inside": vh_inside},
        "gate_entries": {
            "total":    sum(ge_stats.values()),
            "pending":  ge_stats.get(GE_PENDING, 0),
            "approved": ge_stats.get(GE_APPROVED, 0),
            "rejected": ge_stats.get(GE_REJECTED, 0),
            "on_hold":  ge_stats.get(GE_HOLD, 0),
        },
        "gate_passes": {"overdue_returns": overdue},
    }


@router.get("/reports/visitors-inside")
async def visitors_inside(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Live list of visitors currently inside the premises."""
    _require_gate_view(current_user)
    rows = (await db.execute(
        select(VisitorEntry).where(
            VisitorEntry.tenant_id == current_user.tenant_id,
            VisitorEntry.status == "inside",
        ).order_by(VisitorEntry.gate_in.desc()).limit(200)
    )).scalars().all()
    return {"items": [_vis(v) for v in rows], "total": len(rows)}


@router.get("/reports/vehicles-inside")
async def vehicles_inside(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Live list of vehicles currently inside the premises."""
    _require_gate_view(current_user)
    rows = (await db.execute(
        select(VehicleLog).where(
            VehicleLog.tenant_id == current_user.tenant_id,
            VehicleLog.status == "inside",
        ).order_by(VehicleLog.gate_in.desc()).limit(200)
    )).scalars().all()
    return {"items": [_veh(v) for v in rows], "total": len(rows)}


@router.get("/reports/pending-returns")
async def pending_returns(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returnable gate passes that are overdue or pending return."""
    _require_gate_approve(current_user)
    today = datetime.now(timezone.utc).date()
    rows = (await db.execute(
        select(GatePass).where(
            GatePass.tenant_id == current_user.tenant_id,
            GatePass.pass_type == "returnable",
            GatePass.status.in_([GP_OPEN, GP_PARTIAL]),
        ).order_by(GatePass.expected_return_date.asc().nulls_last()).limit(200)
    )).scalars().all()

    result = []
    for p in rows:
        d = _gp(p)
        d["is_overdue"] = (
            p.expected_return_date is not None
            and p.expected_return_date < today
        )
        result.append(d)

    return {"items": result, "total": len(result)}


@router.get("/reports/daily-register")
async def daily_register(
    date:      Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today"),
    entry_type:Optional[str] = Query(None, description="visitor|vehicle|inward|outward"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Full daily gate register — all movements on a given date.
    Only Store Manager / Admin can view this.
    """
    _require_gate_approve(current_user)

    if date:
        try:
            filter_date = date_type.fromisoformat(date)
        except ValueError:
            raise HTTPException(400, "Date must be in YYYY-MM-DD format")
    else:
        filter_date = datetime.now(timezone.utc).date()

    result = {"date": filter_date.isoformat(), "visitors": [], "vehicles": [], "inward": [], "outward": []}

    if not entry_type or entry_type == "visitor":
        rows = (await db.execute(
            select(VisitorEntry).where(
                VisitorEntry.tenant_id == current_user.tenant_id,
                func.date(VisitorEntry.gate_in) == filter_date,
            ).order_by(VisitorEntry.gate_in)
        )).scalars().all()
        result["visitors"] = [_vis(v) for v in rows]

    if not entry_type or entry_type == "vehicle":
        rows = (await db.execute(
            select(VehicleLog).where(
                VehicleLog.tenant_id == current_user.tenant_id,
                func.date(VehicleLog.gate_in) == filter_date,
            ).order_by(VehicleLog.gate_in)
        )).scalars().all()
        result["vehicles"] = [_veh(v) for v in rows]

    if not entry_type or entry_type == "inward":
        rows = (await db.execute(
            select(GateEntry).where(
                GateEntry.tenant_id == current_user.tenant_id,
                func.date(GateEntry.gate_in) == filter_date,
            ).order_by(GateEntry.gate_in)
        )).scalars().all()
        result["inward"] = [_ge(g) for g in rows]

    if not entry_type or entry_type == "outward":
        rows = (await db.execute(
            select(GatePass).where(
                GatePass.tenant_id == current_user.tenant_id,
                func.date(GatePass.gate_out) == filter_date,
            ).order_by(GatePass.gate_out)
        )).scalars().all()
        result["outward"] = [_gp(p) for p in rows]

    return result
