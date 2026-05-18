"""
Oregenal ERP — Purchase Module Router  (app/modules/purchase/router.py)
========================================================================
Complete procurement cycle:
  PR -> RFQ -> Vendor Quotation -> Comparison Sheet
  -> Purchase Order -> Approval -> Lock -> GRN -> Return

49 endpoints across 7 resource groups.

Business rules enforced:
  1.  Only APPROVED vendors on PO
  2.  PR must be APPROVED before RFQ conversion
  3.  RFQ must be SENT to >=1 vendor before close
  4.  PO editable only in DRAFT
  5.  PO locks after first GRN posted
  6.  Locked PO requires amendment workflow
  7.  GRN received_qty <= ordered_qty - already_received
  8.  GRN post is atomic via stock_ledger (WAC, no neg stock)
  9.  Return dispatch posts return_to_vendor stock movement
  10. PO item prices immutable after PO approval
"""
from __future__ import annotations

import math
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, text, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.master import AuditLog
from app.models.purchase import (
    PurchaseRequisition, PurchaseRequisitionItem,
    RFQHeader, RFQItem, RFQVendor,
    VendorQuotation, VendorQuotationItem,
    PurchaseOrder, PurchaseOrderItem,
    GRNHeader, GRNItem,
    PurchaseReturn, PurchaseReturnItem,
    POMessage, POAmendment,
)
from app.models.masters import Vendor
from app.models.user import User
from app.modules.notifications.router import push_notification
from app.services.numbering import next_number

router = APIRouter(prefix="/purchase", tags=["Purchase"])


# ─────────────────────────────────────────────────────────────────────
# PERMISSION HELPERS
# ─────────────────────────────────────────────────────────────────────

def _perm_view(user: User):
    if user.role in ("super_admin", "admin"):
        return
    if "view" not in (user.permissions or {}).get("purchase", []):
        raise HTTPException(403, "Purchase: view permission required")


def _perm_create(user: User):
    if user.role in ("super_admin", "admin"):
        return
    if "create" not in (user.permissions or {}).get("purchase", []):
        raise HTTPException(403, "Purchase: create permission required")


def _perm_edit(user: User):
    if user.role in ("super_admin", "admin"):
        return
    perms = (user.permissions or {}).get("purchase", [])
    if "edit" not in perms and "create" not in perms:
        raise HTTPException(403, "Purchase: edit permission required")


def _perm_approve(user: User):
    if user.role in ("super_admin", "admin"):
        return
    if "approve" not in (user.permissions or {}).get("purchase", []):
        raise HTTPException(403, "Purchase: approve permission required")


def _perm_delete(user: User):
    if user.role in ("super_admin", "admin"):
        return
    if "delete" not in (user.permissions or {}).get("purchase", []):
        raise HTTPException(403, "Purchase: delete permission required")


# ─────────────────────────────────────────────────────────────────────
# AUDIT HELPER
# ─────────────────────────────────────────────────────────────────────

async def _audit(
    db:         AsyncSession,
    user:       User,
    action:     str,
    doc_type:   str,
    doc_id:     Optional[UUID] = None,
    doc_number: Optional[str]  = None,
    old_val:    Optional[dict] = None,
    new_val:    Optional[dict] = None,
    notes:      Optional[str]  = None,
    request:    Optional[Request] = None,
):
    """Append-only audit row. Silent on failure — never blocks business logic."""
    try:
        ip = ua = None
        if request:
            fwd = request.headers.get("X-Forwarded-For")
            ip  = fwd.split(",")[0].strip() if fwd else (
                  request.client.host if request.client else None)
            ua  = request.headers.get("User-Agent", "")[:500]
        db.add(AuditLog(
            tenant_id       = user.tenant_id,
            user_id         = user.id,
            user_name       = user.name,
            user_role       = user.role,
            is_test_data    = False,
            action          = action,
            module          = "purchase",
            document_type   = doc_type,
            document_id     = doc_id,
            document_number = doc_number,
            old_value       = old_val,
            new_value       = new_val,
            ip_address      = ip,
            user_agent      = ua,
            notes           = notes,
        ))
        await db.flush()
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────────────
# ATOMIC RECALC HELPERS
# ─────────────────────────────────────────────────────────────────────

async def _recalc_po(po_id: UUID, db: AsyncSession):
    """Single-statement atomic PO total recalculation. Race-condition safe."""
    await db.execute(text("""
        UPDATE purchase_orders SET
            items_count  = (SELECT COUNT(*)                       FROM purchase_order_items WHERE po_id = :pid),
            subtotal     = (SELECT COALESCE(SUM(subtotal),   0)   FROM purchase_order_items WHERE po_id = :pid),
            tax_amount   = (SELECT COALESCE(SUM(tax_amount), 0)   FROM purchase_order_items WHERE po_id = :pid),
            total_amount = (SELECT COALESCE(SUM(line_total), 0)   FROM purchase_order_items WHERE po_id = :pid),
            updated_at   = now()
        WHERE id = :pid
    """), {"pid": str(po_id)})


async def _recalc_vq(vq_id: UUID, db: AsyncSession):
    """Atomic quotation total recalculation."""
    await db.execute(text("""
        UPDATE vendor_quotations SET
            subtotal     = (SELECT COALESCE(SUM(subtotal),   0) FROM vendor_quotation_items WHERE quotation_id = :qid),
            tax_amount   = (SELECT COALESCE(SUM(tax_amount), 0) FROM vendor_quotation_items WHERE quotation_id = :qid),
            total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM vendor_quotation_items WHERE quotation_id = :qid),
            updated_at   = now()
        WHERE id = :qid
    """), {"qid": str(vq_id)})


# ─────────────────────────────────────────────────────────────────────
# SERIALIZERS
# ─────────────────────────────────────────────────────────────────────

def _s(v):
    """Safe string conversion of UUID/None."""
    return str(v) if v else None


def _dt(v):
    """Safe ISO datetime conversion."""
    return v.isoformat() if v else None


def _d(v):
    """Safe ISO date conversion."""
    return v.isoformat() if v else None


def _f(v, default=0.0):
    """Safe float conversion."""
    return float(v) if v is not None else default


def ser_pr(p: PurchaseRequisition) -> dict:
    return {
        "id": _s(p.id), "pr_number": p.pr_number, "title": p.title,
        "status": p.status, "priority": p.priority,
        "requested_by": _s(p.requested_by), "requested_by_name": p.requested_by_name,
        "department": p.department,
        "required_by_date": _d(p.required_by_date),
        "total_amount": _f(p.total_amount),
        "submitted_at": _dt(p.submitted_at),
        "approved_by": _s(p.approved_by), "approved_by_name": p.approved_by_name,
        "approved_at": _dt(p.approved_at),
        "rejected_by": _s(p.rejected_by), "rejected_at": _dt(p.rejected_at),
        "rejection_reason": p.rejection_reason,
        "converted_to_rfq_id": _s(p.converted_to_rfq_id),
        "converted_to_po_id":  _s(p.converted_to_po_id),
        "notes": p.notes, "is_test_data": p.is_test_data,
        "created_at": _dt(p.created_at), "updated_at": _dt(p.updated_at),
    }


def ser_pr_item(i: PurchaseRequisitionItem) -> dict:
    return {
        "id": _s(i.id), "pr_id": _s(i.pr_id),
        "product_id": _s(i.product_id), "product_name": i.product_name,
        "product_code": i.product_code, "hsn_code": i.hsn_code,
        "unit": i.unit, "quantity": _f(i.quantity),
        "estimated_unit_price": _f(i.estimated_unit_price),
        "estimated_total": _f(i.estimated_total),
        "gst_rate": _f(i.gst_rate, 18), "specifications": i.specifications, "notes": i.notes,
    }


def ser_rfq(r: RFQHeader) -> dict:
    return {
        "id": _s(r.id), "rfq_number": r.rfq_number, "title": r.title,
        "status": r.status, "pr_id": _s(r.pr_id),
        "sent_at": _dt(r.sent_at), "close_date": _d(r.close_date),
        "required_by": _d(r.required_by),
        "converted_to_po_id": _s(r.converted_to_po_id),
        "vendor_count": r.vendor_count, "quotation_count": r.quotation_count,
        "terms_and_conditions": r.terms_and_conditions, "notes": r.notes,
        "is_test_data": r.is_test_data,
        "created_at": _dt(r.created_at), "updated_at": _dt(r.updated_at),
    }


def ser_rfq_item(i: RFQItem) -> dict:
    return {
        "id": _s(i.id), "rfq_id": _s(i.rfq_id),
        "pr_item_id": _s(i.pr_item_id),
        "product_id": _s(i.product_id), "product_name": i.product_name,
        "product_code": i.product_code, "hsn_code": i.hsn_code,
        "unit": i.unit, "quantity": _f(i.quantity),
        "target_price": _f(i.target_price) if i.target_price is not None else None,
        "gst_rate": _f(i.gst_rate, 18), "specifications": i.specifications, "notes": i.notes,
    }


def ser_vq(q: VendorQuotation) -> dict:
    return {
        "id": _s(q.id), "quotation_number": q.quotation_number,
        "rfq_id": _s(q.rfq_id), "vendor_id": _s(q.vendor_id),
        "vendor_name": q.vendor_name, "vendor_ref": q.vendor_ref,
        "status": q.status,
        "received_date": _d(q.received_date), "validity_date": _d(q.validity_date),
        "delivery_days": q.delivery_days,
        "subtotal": _f(q.subtotal), "tax_amount": _f(q.tax_amount),
        "total_amount": _f(q.total_amount),
        "payment_terms": q.payment_terms, "notes": q.notes,
        "po_id": _s(q.po_id), "is_test_data": q.is_test_data,
        "created_at": _dt(q.created_at), "updated_at": _dt(q.updated_at),
    }


def ser_vqi(i: VendorQuotationItem) -> dict:
    return {
        "id": _s(i.id), "quotation_id": _s(i.quotation_id),
        "rfq_item_id": _s(i.rfq_item_id),
        "product_id": _s(i.product_id), "product_name": i.product_name,
        "unit": i.unit, "quantity": _f(i.quantity),
        "unit_price": _f(i.unit_price), "discount_pct": _f(i.discount_pct),
        "gst_rate": _f(i.gst_rate, 18),
        "subtotal": _f(i.subtotal), "tax_amount": _f(i.tax_amount),
        "line_total": _f(i.line_total),
        "delivery_days": i.delivery_days, "brand": i.brand, "notes": i.notes,
    }


def ser_po(o: PurchaseOrder) -> dict:
    return {
        "id": _s(o.id), "po_number": o.po_number, "order_number": o.po_number,
        "vendor_id": _s(o.vendor_id), "vendor_name": o.vendor_name,
        "vendor_email": o.vendor_email, "vendor_gstin": o.vendor_gstin,
        "status": o.status, "payment_status": o.payment_status,
        "pr_id": _s(o.pr_id), "rfq_id": _s(o.rfq_id), "quotation_id": _s(o.quotation_id),
        "order_date": _d(o.order_date), "delivery_date": _d(o.delivery_date),
        "payment_terms_days": o.payment_terms_days, "currency": o.currency,
        "subtotal": _f(o.subtotal), "discount_amount": _f(o.discount_amount),
        "tax_amount": _f(o.tax_amount), "total_amount": _f(o.total_amount),
        "items_count": o.items_count,
        "submitted_by": _s(o.submitted_by), "submitted_at": _dt(o.submitted_at),
        "approved_by": _s(o.approved_by), "approved_by_name": o.approved_by_name,
        "approved_at": _dt(o.approved_at),
        "rejected_by": _s(o.rejected_by), "rejected_at": _dt(o.rejected_at),
        "rejection_reason": o.rejection_reason,
        "sent_to_vendor_at": _dt(o.sent_to_vendor_at),
        "is_locked": o.is_locked, "amendment_count": o.amendment_count,
        "notes": o.notes, "terms_and_conditions": o.terms_and_conditions,
        "is_test_data": o.is_test_data, "created_by": _s(o.created_by),
        "created_at": _dt(o.created_at), "updated_at": _dt(o.updated_at),
    }


def ser_poi(i: PurchaseOrderItem) -> dict:
    qty = _f(i.quantity)
    recv = _f(i.received_qty)
    return {
        "id": _s(i.id), "po_id": _s(i.po_id),
        "product_id": _s(i.product_id), "product_name": i.product_name,
        "product_sku": i.product_sku, "product_code": i.product_code,
        "hsn_code": i.hsn_code, "quantity": qty, "unit": i.unit,
        "unit_price": _f(i.unit_price), "quoted_price": _f(i.quoted_price) if i.quoted_price is not None else None,
        "discount_pct": _f(i.discount_pct), "gst_rate": _f(i.gst_rate, 18),
        "subtotal": _f(i.subtotal), "tax_amount": _f(i.tax_amount),
        "line_total": _f(i.line_total),
        "received_qty": recv, "returned_qty": _f(i.returned_qty),
        "pending_qty": max(0.0, round(qty - recv, 3)),
        "notes": i.notes,
    }


def ser_grn(g: GRNHeader) -> dict:
    return {
        "id": _s(g.id), "grn_number": g.grn_number,
        "po_id": _s(g.po_id), "vendor_id": _s(g.vendor_id),
        "vendor_name": g.vendor_name, "po_number": g.po_number,
        "status": g.status,
        "received_date": _d(g.received_date),
        "vehicle_number": g.vehicle_number, "dc_number": g.dc_number,
        "invoice_number": g.invoice_number,
        "total_received_value": _f(g.total_received_value),
        "posted_by": _s(g.posted_by), "posted_at": _dt(g.posted_at),
        "notes": g.notes, "is_test_data": g.is_test_data,
        "created_at": _dt(g.created_at), "updated_at": _dt(g.updated_at),
    }


def ser_grn_item(i: GRNItem) -> dict:
    return {
        "id": _s(i.id), "grn_id": _s(i.grn_id), "po_item_id": _s(i.po_item_id),
        "product_id": _s(i.product_id), "product_name": i.product_name,
        "product_sku": i.product_sku, "unit": i.unit, "hsn_code": i.hsn_code,
        "ordered_qty": _f(i.ordered_qty), "received_qty": _f(i.received_qty),
        "accepted_qty": _f(i.accepted_qty), "rejected_qty": _f(i.rejected_qty),
        "unit_cost": _f(i.unit_cost), "total_cost": _f(i.total_cost),
        "batch_number": i.batch_number, "expiry_date": _d(i.expiry_date),
        "ledger_entry_id": _s(i.ledger_entry_id),
        "rejection_reason": i.rejection_reason, "notes": i.notes,
    }


def ser_msg(m: POMessage) -> dict:
    return {
        "id": _s(m.id), "po_id": _s(m.po_id),
        "message_type": m.message_type, "sender_name": m.sender_name,
        "sender_type": m.sender_type, "body": m.body,
        "is_private": m.is_private, "email_sent": m.email_sent,
        "created_by": _s(m.created_by),
        "created_at": _dt(m.created_at),
    }


def ser_amendment(a: POAmendment) -> dict:
    return {
        "id": _s(a.id), "po_id": _s(a.po_id),
        "version": a.version, "amended_by_name": a.amended_by_name,
        "reason": a.reason, "diff": a.diff, "status": a.status,
        "approved_by": _s(a.approved_by), "approved_at": _dt(a.approved_at),
        "created_at": _dt(a.created_at),
    }


def ser_return(r: PurchaseReturn) -> dict:
    return {
        "id": _s(r.id), "return_number": r.return_number,
        "po_id": _s(r.po_id), "grn_id": _s(r.grn_id), "vendor_id": _s(r.vendor_id),
        "vendor_name": r.vendor_name, "po_number": r.po_number, "grn_number": r.grn_number,
        "status": r.status, "return_reason": r.return_reason,
        "total_amount": _f(r.total_amount), "notes": r.notes,
        "approved_by": _s(r.approved_by), "approved_at": _dt(r.approved_at),
        "rejected_by": _s(r.rejected_by), "rejected_at": _dt(r.rejected_at),
        "rejection_reason": r.rejection_reason,
        "dispatched_by": _s(r.dispatched_by), "dispatched_at": _dt(r.dispatched_at),
        "is_test_data": r.is_test_data,
        "created_at": _dt(r.created_at), "updated_at": _dt(r.updated_at),
    }

# ─────────────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────────────────────────────

class PRItemIn(BaseModel):
    product_id:           Optional[UUID]  = None
    product_name:         str
    product_code:         Optional[str]   = None
    hsn_code:             Optional[str]   = None
    unit:                 str             = "Pcs"
    quantity:             float
    estimated_unit_price: float           = 0.0
    gst_rate:             float           = 18.0
    specifications:       Optional[str]   = None
    notes:                Optional[str]   = None

    @field_validator("quantity")
    @classmethod
    def qty_gt_zero(cls, v):
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v


class PRCreate(BaseModel):
    title:            str
    department:       Optional[str]  = None
    required_by_date: Optional[date] = None
    priority:         str            = "normal"
    notes:            Optional[str]  = None
    items:            list[PRItemIn] = []

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v not in ("normal", "urgent", "critical"):
            raise ValueError("priority must be normal | urgent | critical")
        return v


class PRUpdate(BaseModel):
    title:            Optional[str]  = None
    department:       Optional[str]  = None
    required_by_date: Optional[date] = None
    priority:         Optional[str]  = None
    notes:            Optional[str]  = None


class RFQItemIn(BaseModel):
    product_id:     Optional[UUID]  = None
    product_name:   str
    product_code:   Optional[str]   = None
    hsn_code:       Optional[str]   = None
    unit:           str             = "Pcs"
    quantity:       float
    target_price:   Optional[float] = None
    gst_rate:       float           = 18.0
    specifications: Optional[str]   = None
    notes:          Optional[str]   = None

    @field_validator("quantity")
    @classmethod
    def qty_gt_zero(cls, v):
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v


class RFQCreate(BaseModel):
    title:                str
    pr_id:                Optional[UUID]  = None
    close_date:           Optional[date]  = None
    required_by:          Optional[date]  = None
    terms_and_conditions: Optional[str]   = None
    notes:                Optional[str]   = None
    items:                list[RFQItemIn] = []
    vendor_ids:           list[UUID]      = []


class RFQUpdate(BaseModel):
    title:                Optional[str]  = None
    close_date:           Optional[date] = None
    required_by:          Optional[date] = None
    terms_and_conditions: Optional[str]  = None
    notes:                Optional[str]  = None


class VQItemIn(BaseModel):
    rfq_item_id:  Optional[UUID]  = None
    product_id:   Optional[UUID]  = None
    product_name: str
    product_code: Optional[str]   = None
    hsn_code:     Optional[str]   = None
    unit:         str             = "Pcs"
    quantity:     float
    unit_price:   float
    discount_pct: float           = 0.0
    gst_rate:     float           = 18.0
    delivery_days: Optional[int]  = None
    brand:        Optional[str]   = None
    notes:        Optional[str]   = None

    @field_validator("unit_price")
    @classmethod
    def price_nonneg(cls, v):
        if v < 0:
            raise ValueError("unit_price must be >= 0")
        return v


class VQCreate(BaseModel):
    rfq_id:        UUID
    vendor_id:     UUID
    vendor_ref:    Optional[str]  = None
    received_date: Optional[date] = None
    validity_date: Optional[date] = None
    delivery_days: Optional[int]  = None
    payment_terms: Optional[str]  = None
    notes:         Optional[str]  = None
    items:         list[VQItemIn] = []


class POItemIn(BaseModel):
    product_id:   Optional[UUID]  = None
    product_name: str
    product_sku:  Optional[str]   = None
    product_code: Optional[str]   = None
    hsn_code:     Optional[str]   = None
    quantity:     float
    unit:         str             = "Pcs"
    unit_price:   float
    discount_pct: float           = 0.0
    gst_rate:     float           = 18.0
    rfq_item_id:  Optional[UUID]  = None
    quoted_price: Optional[float] = None
    notes:        Optional[str]   = None

    @field_validator("quantity")
    @classmethod
    def qty_gt_zero(cls, v):
        if v <= 0:
            raise ValueError("quantity must be > 0")
        return v

    @field_validator("unit_price")
    @classmethod
    def price_nonneg(cls, v):
        if v < 0:
            raise ValueError("unit_price must be >= 0")
        return v


class POCreate(BaseModel):
    vendor_id:            Optional[UUID] = None
    vendor_name:          str
    pr_id:                Optional[UUID] = None
    rfq_id:               Optional[UUID] = None
    quotation_id:         Optional[UUID] = None
    order_date:           Optional[date] = None
    delivery_date:        Optional[date] = None
    payment_terms_days:   int            = 30
    notes:                Optional[str]  = None
    terms_and_conditions: Optional[str]  = None
    items:                list[POItemIn] = []


class POUpdate(BaseModel):
    vendor_id:            Optional[UUID] = None
    vendor_name:          Optional[str]  = None
    order_date:           Optional[date] = None
    delivery_date:        Optional[date] = None
    payment_terms_days:   Optional[int]  = None
    notes:                Optional[str]  = None
    terms_and_conditions: Optional[str]  = None


class RejectIn(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_required(cls, v):
        if not v or not v.strip():
            raise ValueError("rejection reason is required")
        return v.strip()


class SendToVendorIn(BaseModel):
    email:   Optional[str] = None
    message: Optional[str] = None


class AmendmentIn(BaseModel):
    reason:  str
    changes: dict = {}

    @field_validator("reason")
    @classmethod
    def reason_required(cls, v):
        if not v or not v.strip():
            raise ValueError("amendment reason is required")
        return v.strip()


class GRNItemIn(BaseModel):
    po_item_id:       UUID
    product_id:       Optional[UUID] = None
    received_qty:     float
    accepted_qty:     Optional[float] = None
    rejected_qty:     float           = 0.0
    unit_cost:        Optional[float] = None
    batch_number:     Optional[str]   = None
    expiry_date:      Optional[date]  = None
    rejection_reason: Optional[str]   = None
    notes:            Optional[str]   = None

    @field_validator("received_qty")
    @classmethod
    def recv_gt_zero(cls, v):
        if v <= 0:
            raise ValueError("received_qty must be > 0")
        return v


class GRNCreate(BaseModel):
    po_id:          UUID
    received_date:  Optional[date] = None
    vehicle_number: Optional[str]  = None
    dc_number:      Optional[str]  = None
    invoice_number: Optional[str]  = None
    notes:          Optional[str]  = None
    items:          list[GRNItemIn]


class ReturnItemIn(BaseModel):
    grn_item_id:  Optional[UUID] = None
    po_item_id:   Optional[UUID] = None
    product_id:   Optional[UUID] = None
    product_name: str
    unit:         str   = "Pcs"
    return_qty:   float
    unit_cost:    float
    return_reason: Optional[str] = None
    notes:         Optional[str] = None

    @field_validator("return_qty")
    @classmethod
    def qty_gt_zero(cls, v):
        if v <= 0:
            raise ValueError("return_qty must be > 0")
        return v


class ReturnCreate(BaseModel):
    po_id:         UUID
    grn_id:        Optional[UUID] = None
    return_reason: str
    notes:         Optional[str]  = None
    items:         list[ReturnItemIn]


class POMessageIn(BaseModel):
    message_type: str  = "internal_note"
    body:         str
    is_private:   bool = False

    @field_validator("message_type")
    @classmethod
    def valid_type(cls, v):
        allowed = {"internal_note", "vendor_sent", "vendor_reply",
                   "approval_comment", "amendment_note", "system"}
        if v not in allowed:
            raise ValueError(f"message_type must be one of {sorted(allowed)}")
        return v

    @field_validator("body")
    @classmethod
    def body_required(cls, v):
        if not v or not v.strip():
            raise ValueError("message body cannot be empty")
        return v.strip()

# =====================================================================
# PURCHASE REQUISITIONS  (8 endpoints)
# =====================================================================

@router.get("/requisitions")
async def list_prs(
    status:    Optional[str] = Query(None),
    priority:  Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(PurchaseRequisition).where(
        PurchaseRequisition.tenant_id == current_user.tenant_id,
        PurchaseRequisition.is_active == True,
    )
    if status:   q = q.where(PurchaseRequisition.status == status.upper())
    if priority: q = q.where(PurchaseRequisition.priority == priority.lower())
    if search:
        t = f"%{search}%"
        q = q.where(or_(PurchaseRequisition.pr_number.ilike(t),
                        PurchaseRequisition.title.ilike(t),
                        PurchaseRequisition.department.ilike(t)))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(PurchaseRequisition.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_pr(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/requisitions", status_code=201)
async def create_pr(
    payload: PRCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    pr_number = await next_number(db, current_user.tenant_id,
                                  "purchase_requisition", "PR", "purchase_requisitions")
    pr = PurchaseRequisition(
        tenant_id=current_user.tenant_id, created_by=current_user.id,
        updated_by=current_user.id, pr_number=pr_number,
        title=payload.title, status="DRAFT",
        requested_by=current_user.id, requested_by_name=current_user.name,
        department=payload.department, required_by_date=payload.required_by_date,
        priority=payload.priority, notes=payload.notes,
    )
    db.add(pr)
    await db.flush()

    total_est = Decimal("0")
    for it in payload.items:
        qty   = Decimal(str(it.quantity))
        price = Decimal(str(it.estimated_unit_price))
        est   = qty * price
        total_est += est
        db.add(PurchaseRequisitionItem(
            tenant_id=current_user.tenant_id, pr_id=pr.id,
            created_by=current_user.id, updated_by=current_user.id,
            product_id=it.product_id, product_name=it.product_name,
            product_code=it.product_code, hsn_code=it.hsn_code,
            unit=it.unit, quantity=qty,
            estimated_unit_price=price, estimated_total=est,
            gst_rate=Decimal(str(it.gst_rate)),
            specifications=it.specifications, notes=it.notes,
        ))
    pr.total_amount = total_est
    await db.flush()
    await _audit(db, current_user, "create", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number, request=request)
    return ser_pr(pr)


@router.get("/requisitions/{pr_id}")
async def get_pr(
    pr_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "Purchase Requisition not found")
    items = (await db.execute(
        select(PurchaseRequisitionItem).where(PurchaseRequisitionItem.pr_id == pr_id)
        .order_by(PurchaseRequisitionItem.created_at)
    )).scalars().all()
    result = ser_pr(pr)
    result["items"] = [ser_pr_item(i) for i in items]
    return result


@router.put("/requisitions/{pr_id}")
async def update_pr(
    pr_id: UUID, payload: PRUpdate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "PR not found")
    if pr.status != "DRAFT":
        raise HTTPException(400, f"Only DRAFT PRs can be edited. Current: {pr.status}")
    old = ser_pr(pr)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(pr, k, v)
    pr.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "update", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number, old_val=old, request=request)
    return ser_pr(pr)


@router.post("/requisitions/{pr_id}/submit")
async def submit_pr(
    pr_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "PR not found")
    if pr.status != "DRAFT":
        raise HTTPException(400, f"Only DRAFT PRs can be submitted. Current: {pr.status}")
    cnt = (await db.execute(select(func.count(PurchaseRequisitionItem.id)).where(
        PurchaseRequisitionItem.pr_id == pr_id
    ))).scalar_one()
    if cnt == 0:
        raise HTTPException(400, "Add at least one item before submitting")
    pr.status = "SUBMITTED"
    pr.submitted_at = datetime.now(timezone.utc)
    pr.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PR Submitted: {pr.pr_number}",
        message=f"{current_user.name} submitted {pr.pr_number} for approval",
        type="purchase", level="info", link=f"/purchase/requisitions/{pr_id}")
    await _audit(db, current_user, "submit", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number, request=request)
    return ser_pr(pr)


@router.post("/requisitions/{pr_id}/approve")
async def approve_pr(
    pr_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "PR not found")
    if pr.status != "SUBMITTED":
        raise HTTPException(400, f"Only SUBMITTED PRs can be approved. Current: {pr.status}")
    now = datetime.now(timezone.utc)
    pr.status = "APPROVED"
    pr.approved_by = current_user.id
    pr.approved_by_name = current_user.name
    pr.approved_at = now
    pr.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PR Approved: {pr.pr_number}",
        message=f"{current_user.name} approved {pr.pr_number}",
        type="purchase", level="success", link=f"/purchase/requisitions/{pr_id}")
    await _audit(db, current_user, "approve", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number, request=request)
    return ser_pr(pr)


@router.post("/requisitions/{pr_id}/reject")
async def reject_pr(
    pr_id: UUID, payload: RejectIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "PR not found")
    if pr.status != "SUBMITTED":
        raise HTTPException(400, f"Only SUBMITTED PRs can be rejected. Current: {pr.status}")
    now = datetime.now(timezone.utc)
    pr.status = "REJECTED"
    pr.rejected_by = current_user.id
    pr.rejected_at = now
    pr.rejection_reason = payload.reason
    pr.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "reject", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number, notes=payload.reason, request=request)
    return ser_pr(pr)


@router.post("/requisitions/{pr_id}/convert-to-rfq", status_code=201)
async def convert_pr_to_rfq(
    pr_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Convert an APPROVED PR to a DRAFT RFQ, copying all line items."""
    _perm_create(current_user)
    pr = (await db.execute(select(PurchaseRequisition).where(
        PurchaseRequisition.id == pr_id,
        PurchaseRequisition.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not pr:
        raise HTTPException(404, "PR not found")
    if pr.status != "APPROVED":
        raise HTTPException(400, f"Only APPROVED PRs can be converted. Current: {pr.status}")

    rfq_number = await next_number(db, current_user.tenant_id, "rfq", "RFQ", "rfq_headers")
    rfq = RFQHeader(
        tenant_id=current_user.tenant_id, created_by=current_user.id,
        updated_by=current_user.id, rfq_number=rfq_number,
        title=f"RFQ for {pr.pr_number}: {pr.title}",
        status="DRAFT", pr_id=pr.id, required_by=pr.required_by_date,
    )
    db.add(rfq)
    await db.flush()

    pr_items = (await db.execute(
        select(PurchaseRequisitionItem).where(PurchaseRequisitionItem.pr_id == pr_id)
    )).scalars().all()
    for it in pr_items:
        db.add(RFQItem(
            tenant_id=current_user.tenant_id, rfq_id=rfq.id, pr_item_id=it.id,
            created_by=current_user.id, updated_by=current_user.id,
            product_id=it.product_id, product_name=it.product_name,
            product_code=it.product_code, hsn_code=it.hsn_code,
            unit=it.unit, quantity=it.quantity,
            target_price=it.estimated_unit_price if it.estimated_unit_price else None,
            gst_rate=it.gst_rate, specifications=it.specifications,
        ))

    pr.status = "CONVERTED"
    pr.converted_to_rfq_id = rfq.id
    pr.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "convert_to_rfq", "purchase_requisition",
                 doc_id=pr.id, doc_number=pr.pr_number,
                 new_val={"rfq_number": rfq.rfq_number}, request=request)
    result = ser_rfq(rfq)
    result["pr_number"] = pr.pr_number
    return result

# =====================================================================
# RFQ  (9 endpoints)
# =====================================================================

@router.get("/rfq")
async def list_rfq(
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(RFQHeader).where(
        RFQHeader.tenant_id == current_user.tenant_id,
        RFQHeader.is_active == True,
    )
    if status: q = q.where(RFQHeader.status == status.upper())
    if search:
        t = f"%{search}%"
        q = q.where(or_(RFQHeader.rfq_number.ilike(t), RFQHeader.title.ilike(t)))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(RFQHeader.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_rfq(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/rfq", status_code=201)
async def create_rfq(
    payload: RFQCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    rfq_number = await next_number(db, current_user.tenant_id, "rfq", "RFQ", "rfq_headers")
    rfq = RFQHeader(
        tenant_id=current_user.tenant_id, created_by=current_user.id,
        updated_by=current_user.id, rfq_number=rfq_number,
        title=payload.title, status="DRAFT", pr_id=payload.pr_id,
        close_date=payload.close_date, required_by=payload.required_by,
        terms_and_conditions=payload.terms_and_conditions, notes=payload.notes,
    )
    db.add(rfq)
    await db.flush()

    for it in payload.items:
        db.add(RFQItem(
            tenant_id=current_user.tenant_id, rfq_id=rfq.id,
            created_by=current_user.id, updated_by=current_user.id,
            product_id=it.product_id, product_name=it.product_name,
            product_code=it.product_code, hsn_code=it.hsn_code,
            unit=it.unit, quantity=Decimal(str(it.quantity)),
            target_price=Decimal(str(it.target_price)) if it.target_price else None,
            gst_rate=Decimal(str(it.gst_rate)),
            specifications=it.specifications, notes=it.notes,
        ))

    vc = 0
    for vid in payload.vendor_ids:
        vendor = (await db.execute(select(Vendor).where(
            Vendor.id == vid, Vendor.tenant_id == current_user.tenant_id,
            Vendor.status == "APPROVED",
        ))).scalar_one_or_none()
        if vendor:
            db.add(RFQVendor(
                tenant_id=current_user.tenant_id, rfq_id=rfq.id,
                vendor_id=vendor.id, created_by=current_user.id, updated_by=current_user.id,
                vendor_name=vendor.name, vendor_email=vendor.email,
            ))
            vc += 1
    rfq.vendor_count = vc
    await db.flush()
    await _audit(db, current_user, "create", "rfq",
                 doc_id=rfq.id, doc_number=rfq.rfq_number, request=request)
    return ser_rfq(rfq)


@router.get("/rfq/{rfq_id}")
async def get_rfq(
    rfq_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    items = (await db.execute(
        select(RFQItem).where(RFQItem.rfq_id == rfq_id).order_by(RFQItem.created_at)
    )).scalars().all()
    vendors = (await db.execute(
        select(RFQVendor).where(RFQVendor.rfq_id == rfq_id)
    )).scalars().all()
    quotations = (await db.execute(
        select(VendorQuotation).where(VendorQuotation.rfq_id == rfq_id)
        .order_by(VendorQuotation.total_amount)
    )).scalars().all()
    result = ser_rfq(rfq)
    result["items"]      = [ser_rfq_item(i) for i in items]
    result["vendors"]    = [
        {"id": _s(v.id), "vendor_id": _s(v.vendor_id), "vendor_name": v.vendor_name,
         "vendor_email": v.vendor_email, "sent_at": _dt(v.sent_at),
         "email_sent": v.email_sent, "has_responded": v.has_responded}
        for v in vendors
    ]
    result["quotations"] = [ser_vq(q) for q in quotations]
    return result


@router.get("/rfq/{rfq_id}/comparison")
async def rfq_comparison(
    rfq_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Side-by-side vendor price comparison for all RFQ items."""
    _perm_view(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")

    rfq_items  = (await db.execute(
        select(RFQItem).where(RFQItem.rfq_id == rfq_id).order_by(RFQItem.created_at)
    )).scalars().all()
    quotations = (await db.execute(
        select(VendorQuotation).where(
            VendorQuotation.rfq_id == rfq_id,
            VendorQuotation.status.in_(["RECEIVED", "SHORTLISTED", "ACCEPTED"]),
        )
    )).scalars().all()

    vq_map = {q.id: q for q in quotations}
    matrix = []
    for ri in rfq_items:
        row = {
            "rfq_item_id": _s(ri.id), "product_name": ri.product_name,
            "product_code": ri.product_code, "quantity": _f(ri.quantity),
            "unit": ri.unit,
            "target_price": _f(ri.target_price) if ri.target_price is not None else None,
            "vendor_prices": [],
        }
        vq_items = (await db.execute(
            select(VendorQuotationItem).where(VendorQuotationItem.rfq_item_id == ri.id)
        )).scalars().all()
        for vqi in vq_items:
            vq = vq_map.get(vqi.quotation_id)
            if not vq:
                continue
            row["vendor_prices"].append({
                "quotation_id": _s(vqi.quotation_id),
                "vendor_id": _s(vq.vendor_id), "vendor_name": vq.vendor_name,
                "unit_price": _f(vqi.unit_price), "discount_pct": _f(vqi.discount_pct),
                "line_total": _f(vqi.line_total), "delivery_days": vqi.delivery_days,
                "brand": vqi.brand, "quotation_status": vq.status, "is_lowest": False,
            })
        if row["vendor_prices"]:
            min_p = min(v["unit_price"] for v in row["vendor_prices"])
            for v in row["vendor_prices"]:
                v["is_lowest"] = (v["unit_price"] == min_p)
        matrix.append(row)

    return {
        "rfq_id": _s(rfq.id), "rfq_number": rfq.rfq_number, "title": rfq.title,
        "vendors": [{"id": _s(q.id), "name": q.vendor_name, "total": _f(q.total_amount)}
                    for q in quotations],
        "matrix": matrix,
        "lowest_total_vendor": min(
            ({"name": q.vendor_name, "total": _f(q.total_amount)} for q in quotations),
            key=lambda x: x["total"], default=None,
        ),
    }


@router.get("/rfq/{rfq_id}/quotations")
async def list_rfq_quotations(
    rfq_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    rows = (await db.execute(
        select(VendorQuotation).where(VendorQuotation.rfq_id == rfq_id)
        .order_by(VendorQuotation.total_amount)
    )).scalars().all()
    return {"items": [ser_vq(r) for r in rows], "total": len(rows)}


@router.post("/rfq/{rfq_id}/send")
async def send_rfq(
    rfq_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Send RFQ to all invited vendors via in-ERP notification + email."""
    _perm_create(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    if rfq.status != "DRAFT":
        raise HTTPException(400, f"RFQ is already {rfq.status}")
    rfq_vendors = (await db.execute(
        select(RFQVendor).where(RFQVendor.rfq_id == rfq_id)
    )).scalars().all()
    if not rfq_vendors:
        raise HTTPException(400, "Add at least one vendor before sending")

    now = datetime.now(timezone.utc)
    rfq.status  = "SENT"
    rfq.sent_at = now
    rfq.updated_by = current_user.id

    emails_sent = 0
    for rv in rfq_vendors:
        rv.sent_at = now
        if rv.vendor_email:
            try:
                from app.modules.email.service import send_email, _wrap_html
                close_str = rfq.close_date.isoformat() if rfq.close_date else "as soon as possible"
                content = (
                    f"<p>Dear {rv.vendor_name},</p>"
                    f"<p>We invite you to quote for <strong>{rfq.rfq_number}: {rfq.title}</strong>.</p>"
                    f"<p>Please respond by <strong>{close_str}</strong>.</p>"
                    f"<p>Contact our purchase team to submit your quotation.</p>"
                )
                await send_email(
                    to=rv.vendor_email,
                    subject=f"RFQ {rfq.rfq_number} — Request for Quotation from Oregenal",
                    html=_wrap_html(content, f"RFQ {rfq.rfq_number}", "Oregenal Electrical India"),
                )
                rv.email_sent = True
                emails_sent  += 1
            except Exception:
                pass
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"RFQ Sent: {rfq.rfq_number}",
        message=f"Sent to {len(rfq_vendors)} vendor(s). {emails_sent} email(s) dispatched.",
        type="purchase", level="info", link=f"/purchase/rfq/{rfq_id}")
    await _audit(db, current_user, "send", "rfq", doc_id=rfq.id, doc_number=rfq.rfq_number,
                 notes=f"Vendors: {len(rfq_vendors)}, emails: {emails_sent}", request=request)
    return {**ser_rfq(rfq), "vendors_notified": len(rfq_vendors), "emails_sent": emails_sent}


@router.post("/rfq/{rfq_id}/close")
async def close_rfq(
    rfq_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    if rfq.status not in ("SENT", "PARTIALLY_RECEIVED"):
        raise HTTPException(400, f"Cannot close RFQ in status: {rfq.status}")
    rfq.status = "CLOSED"
    rfq.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "close", "rfq", doc_id=rfq.id, doc_number=rfq.rfq_number,
                 request=request)
    return ser_rfq(rfq)


@router.post("/rfq/{rfq_id}/convert-to-po", status_code=201)
async def convert_rfq_to_po(
    rfq_id: UUID, quotation_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a PO from the winning quotation on this RFQ."""
    _perm_create(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == rfq_id, RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    if rfq.status not in ("SENT", "CLOSED", "PARTIALLY_RECEIVED"):
        raise HTTPException(400, f"RFQ must be SENT or CLOSED to convert. Current: {rfq.status}")

    vq = (await db.execute(select(VendorQuotation).where(
        VendorQuotation.id == quotation_id,
        VendorQuotation.rfq_id == rfq_id,
        VendorQuotation.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not vq:
        raise HTTPException(404, "Vendor quotation not found on this RFQ")
    if vq.status not in ("RECEIVED", "SHORTLISTED", "ACCEPTED"):
        raise HTTPException(400, f"Quotation status must be RECEIVED or SHORTLISTED. Current: {vq.status}")

    vendor = (await db.execute(select(Vendor).where(Vendor.id == vq.vendor_id))).scalar_one_or_none()
    if not vendor or vendor.status != "APPROVED":
        raise HTTPException(400, "Vendor is not APPROVED in masters. Update vendor status first.")

    po_number = await next_number(db, current_user.tenant_id, "purchase_order", "PO", "purchase_orders")
    po = PurchaseOrder(
        tenant_id=current_user.tenant_id, created_by=current_user.id, updated_by=current_user.id,
        po_number=po_number, order_number=po_number,
        vendor_id=vendor.id, vendor_name=vendor.name,
        vendor_email=vendor.email, vendor_gstin=vendor.gstin,
        status="DRAFT", payment_status="PENDING",
        pr_id=rfq.pr_id, rfq_id=rfq_id, quotation_id=vq.id,
        order_date=date.today(),
        payment_terms_days=vendor.payment_terms_days or 30,
    )
    db.add(po)
    await db.flush()

    vq_items = (await db.execute(
        select(VendorQuotationItem).where(VendorQuotationItem.quotation_id == quotation_id)
    )).scalars().all()
    for vqi in vq_items:
        qty  = Decimal(str(vqi.quantity))
        price = Decimal(str(vqi.unit_price))
        disc  = Decimal(str(vqi.discount_pct or 0))
        gst   = Decimal(str(vqi.gst_rate or 18))
        sub   = qty * price * (1 - disc / 100)
        tax   = sub * gst / 100
        db.add(PurchaseOrderItem(
            tenant_id=current_user.tenant_id, po_id=po.id,
            created_by=current_user.id, updated_by=current_user.id,
            rfq_item_id=vqi.rfq_item_id,
            product_id=vqi.product_id, product_name=vqi.product_name,
            product_code=vqi.product_code, hsn_code=vqi.hsn_code,
            unit=vqi.unit, quantity=qty, unit_price=price, quoted_price=price,
            discount_pct=disc, gst_rate=gst,
            subtotal=round(sub, 2), tax_amount=round(tax, 2), line_total=round(sub + tax, 2),
        ))
    await db.flush()
    await _recalc_po(po.id, db)

    vq.status = "ACCEPTED"
    vq.accepted_by = current_user.id
    vq.accepted_at = datetime.now(timezone.utc)
    vq.po_id = po.id
    rfq.status = "CONVERTED"
    rfq.converted_to_po_id = po.id
    rfq.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PO Created from RFQ: {po.po_number}",
        message=f"{po.po_number} created from {rfq.rfq_number} — {vendor.name}",
        type="purchase", level="success", link=f"/purchase/orders/{po.id}")
    await _audit(db, current_user, "convert_to_po", "rfq",
                 doc_id=rfq.id, doc_number=rfq.rfq_number,
                 new_val={"po_number": po.po_number}, request=request)
    return ser_po(po)

# =====================================================================
# VENDOR QUOTATIONS  (5 endpoints)
# =====================================================================

@router.post("/quotations", status_code=201)
async def create_quotation(
    payload: VQCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    rfq = (await db.execute(select(RFQHeader).where(
        RFQHeader.id == payload.rfq_id,
        RFQHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    if rfq.status not in ("SENT", "PARTIALLY_RECEIVED", "CLOSED"):
        raise HTTPException(400, f"Quotations can only be entered for SENT/CLOSED RFQs. Current: {rfq.status}")

    vendor = (await db.execute(select(Vendor).where(
        Vendor.id == payload.vendor_id,
        Vendor.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    q_number = await next_number(db, current_user.tenant_id, "vendor_quotation", "VQ", "vendor_quotations")
    vq = VendorQuotation(
        tenant_id=current_user.tenant_id, created_by=current_user.id, updated_by=current_user.id,
        rfq_id=payload.rfq_id, vendor_id=payload.vendor_id,
        quotation_number=q_number, vendor_ref=payload.vendor_ref,
        status="RECEIVED",
        vendor_name=vendor.name, vendor_email=vendor.email, vendor_gstin=vendor.gstin,
        received_date=payload.received_date, validity_date=payload.validity_date,
        delivery_days=payload.delivery_days, payment_terms=payload.payment_terms,
        notes=payload.notes,
    )
    db.add(vq)
    await db.flush()

    for it in payload.items:
        qty   = Decimal(str(it.quantity))
        price = Decimal(str(it.unit_price))
        disc  = Decimal(str(it.discount_pct or 0))
        gst   = Decimal(str(it.gst_rate or 18))
        sub   = qty * price * (1 - disc / 100)
        tax   = sub * gst / 100
        db.add(VendorQuotationItem(
            tenant_id=current_user.tenant_id, quotation_id=vq.id,
            created_by=current_user.id, updated_by=current_user.id,
            rfq_item_id=it.rfq_item_id,
            product_id=it.product_id, product_name=it.product_name,
            product_code=it.product_code, hsn_code=it.hsn_code,
            unit=it.unit, quantity=qty, unit_price=price,
            discount_pct=disc, gst_rate=gst,
            subtotal=round(sub, 2), tax_amount=round(tax, 2), line_total=round(sub + tax, 2),
            delivery_days=it.delivery_days, brand=it.brand, notes=it.notes,
        ))
    await db.flush()
    await _recalc_vq(vq.id, db)

    rfq.quotation_count = (await db.execute(
        select(func.count(VendorQuotation.id)).where(VendorQuotation.rfq_id == rfq.id)
    )).scalar_one()
    if rfq.status == "SENT":
        rfq.status = "PARTIALLY_RECEIVED"
    await db.execute(text(
        "UPDATE rfq_vendors SET has_responded = true, updated_at = now() "
        "WHERE rfq_id = :rid AND vendor_id = :vid"
    ), {"rid": str(rfq.id), "vid": str(payload.vendor_id)})
    await db.flush()
    await _audit(db, current_user, "create", "vendor_quotation",
                 doc_id=vq.id, doc_number=vq.quotation_number, request=request)
    return ser_vq(vq)


@router.get("/quotations/{vq_id}")
async def get_quotation(
    vq_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    vq = (await db.execute(select(VendorQuotation).where(
        VendorQuotation.id == vq_id,
        VendorQuotation.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not vq:
        raise HTTPException(404, "Vendor quotation not found")
    items = (await db.execute(
        select(VendorQuotationItem).where(VendorQuotationItem.quotation_id == vq_id)
        .order_by(VendorQuotationItem.created_at)
    )).scalars().all()
    result = ser_vq(vq)
    result["items"] = [ser_vqi(i) for i in items]
    return result


@router.post("/quotations/{vq_id}/shortlist")
async def shortlist_quotation(
    vq_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    vq = (await db.execute(select(VendorQuotation).where(
        VendorQuotation.id == vq_id,
        VendorQuotation.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not vq:
        raise HTTPException(404, "Vendor quotation not found")
    if vq.status not in ("RECEIVED",):
        raise HTTPException(400, f"Only RECEIVED quotations can be shortlisted. Current: {vq.status}")
    vq.status = "SHORTLISTED"
    vq.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "shortlist", "vendor_quotation",
                 doc_id=vq.id, doc_number=vq.quotation_number, request=request)
    return ser_vq(vq)


@router.post("/quotations/{vq_id}/reject")
async def reject_quotation(
    vq_id: UUID, payload: RejectIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    vq = (await db.execute(select(VendorQuotation).where(
        VendorQuotation.id == vq_id,
        VendorQuotation.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not vq:
        raise HTTPException(404, "Vendor quotation not found")
    if vq.status == "ACCEPTED":
        raise HTTPException(400, "Cannot reject an ACCEPTED quotation")
    now = datetime.now(timezone.utc)
    vq.status = "REJECTED"
    vq.rejected_by = current_user.id
    vq.rejected_at = now
    vq.rejection_reason = payload.reason
    vq.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "reject", "vendor_quotation",
                 doc_id=vq.id, doc_number=vq.quotation_number,
                 notes=payload.reason, request=request)
    return ser_vq(vq)

# =====================================================================
# PURCHASE ORDERS  (14 endpoints)
# =====================================================================

@router.get("/orders/stats")
async def po_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    row = (await db.execute(text("""
        SELECT
            COUNT(*)                                                      AS total,
            SUM(CASE WHEN status='DRAFT'              THEN 1 ELSE 0 END)  AS draft,
            SUM(CASE WHEN status='SUBMITTED'          THEN 1 ELSE 0 END)  AS submitted,
            SUM(CASE WHEN status='APPROVED'           THEN 1 ELSE 0 END)  AS approved,
            SUM(CASE WHEN status='RECEIVED'           THEN 1 ELSE 0 END)  AS received,
            SUM(CASE WHEN status IN ('APPROVED','SENT_TO_VENDOR','PARTIALLY_RECEIVED')
                     THEN 1 ELSE 0 END)                                   AS pending_receipt,
            COALESCE(SUM(total_amount),0)                                 AS total_spend,
            COALESCE(SUM(CASE
                WHEN status NOT IN ('CANCELLED','REJECTED')
                 AND DATE_TRUNC('month',created_at)=DATE_TRUNC('month',now())
                THEN total_amount ELSE 0 END),0)                          AS this_month_spend
        FROM purchase_orders
        WHERE tenant_id = :tid AND deleted_at IS NULL
    """), {"tid": str(current_user.tenant_id)})).fetchone()
    return {
        "total": int(row[0] or 0), "draft": int(row[1] or 0),
        "submitted": int(row[2] or 0), "approved": int(row[3] or 0),
        "received": int(row[4] or 0), "pending_receipt": int(row[5] or 0),
        "total_spend": float(row[6] or 0), "this_month_spend": float(row[7] or 0),
    }


@router.get("/orders")
async def list_orders(
    status:    Optional[str]  = Query(None),
    vendor_id: Optional[UUID] = Query(None),
    search:    Optional[str]  = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(PurchaseOrder).where(
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    )
    if status:    q = q.where(PurchaseOrder.status == status.upper())
    if vendor_id: q = q.where(PurchaseOrder.vendor_id == vendor_id)
    if search:
        t = f"%{search}%"
        q = q.where(or_(PurchaseOrder.po_number.ilike(t), PurchaseOrder.vendor_name.ilike(t)))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(PurchaseOrder.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_po(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/orders", status_code=201)
async def create_order(
    payload: POCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    # RULE 1: vendor must be APPROVED
    vendor_email = vendor_gstin = None
    payment_terms = payload.payment_terms_days
    if payload.vendor_id:
        vendor = (await db.execute(select(Vendor).where(
            Vendor.id == payload.vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
        ))).scalar_one_or_none()
        if not vendor:
            raise HTTPException(404, f"Vendor not found in masters")
        if vendor.status != "APPROVED":
            raise HTTPException(400, f"Vendor '{vendor.name}' is not APPROVED (status: {vendor.status})")
        vendor_email  = vendor.email
        vendor_gstin  = vendor.gstin
        payment_terms = vendor.payment_terms_days or payload.payment_terms_days

    po_number = await next_number(db, current_user.tenant_id, "purchase_order", "PO", "purchase_orders")
    po = PurchaseOrder(
        tenant_id=current_user.tenant_id, created_by=current_user.id, updated_by=current_user.id,
        po_number=po_number, order_number=po_number,
        vendor_id=payload.vendor_id, vendor_name=payload.vendor_name,
        vendor_email=vendor_email, vendor_gstin=vendor_gstin,
        status="DRAFT", payment_status="PENDING",
        pr_id=payload.pr_id, rfq_id=payload.rfq_id, quotation_id=payload.quotation_id,
        order_date=payload.order_date or date.today(),
        delivery_date=payload.delivery_date,
        payment_terms_days=payment_terms,
        notes=payload.notes, terms_and_conditions=payload.terms_and_conditions,
    )
    db.add(po)
    await db.flush()

    for it in payload.items:
        qty  = Decimal(str(it.quantity))
        price = Decimal(str(it.unit_price))
        disc  = Decimal(str(it.discount_pct or 0))
        gst   = Decimal(str(it.gst_rate or 18))
        sub   = qty * price * (1 - disc / 100)
        tax   = sub * gst / 100
        db.add(PurchaseOrderItem(
            tenant_id=current_user.tenant_id, po_id=po.id,
            created_by=current_user.id, updated_by=current_user.id,
            rfq_item_id=it.rfq_item_id,
            product_id=it.product_id, product_name=it.product_name,
            product_sku=it.product_sku, product_code=it.product_code,
            hsn_code=it.hsn_code, quantity=qty, unit=it.unit,
            unit_price=price,
            quoted_price=Decimal(str(it.quoted_price)) if it.quoted_price is not None else None,
            discount_pct=disc, gst_rate=gst,
            subtotal=round(sub, 2), tax_amount=round(tax, 2), line_total=round(sub + tax, 2),
            notes=it.notes,
        ))
    await db.flush()
    await _recalc_po(po.id, db)
    await _audit(db, current_user, "create", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 new_val={"vendor": po.vendor_name, "total": float(po.total_amount or 0)},
                 request=request)
    return ser_po(po)


@router.get("/orders/{po_id}")
async def get_order(
    po_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase Order not found")
    items = (await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po_id)
        .order_by(PurchaseOrderItem.created_at)
    )).scalars().all()
    grns = (await db.execute(
        select(GRNHeader).where(GRNHeader.po_id == po_id).order_by(GRNHeader.created_at)
    )).scalars().all()
    # Only non-private messages visible to non-admin
    msg_q = select(POMessage).where(POMessage.po_id == po_id)
    if current_user.role not in ("super_admin", "admin"):
        msg_q = msg_q.where(or_(POMessage.is_private == False,
                                POMessage.created_by == current_user.id))
    messages = (await db.execute(
        msg_q.order_by(POMessage.created_at.desc()).limit(20)
    )).scalars().all()
    amendments = (await db.execute(
        select(POAmendment).where(POAmendment.po_id == po_id)
        .order_by(POAmendment.version.desc())
    )).scalars().all()
    result = ser_po(po)
    result["items"]      = [ser_poi(i) for i in items]
    result["grns"]       = [ser_grn(g) for g in grns]
    result["messages"]   = [ser_msg(m) for m in messages]
    result["amendments"] = [ser_amendment(a) for a in amendments]
    return result


@router.put("/orders/{po_id}")
async def update_order(
    po_id: UUID, payload: POUpdate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase Order not found")
    # RULE 4: editable only in DRAFT
    if po.status != "DRAFT":
        raise HTTPException(400, f"PO editable only in DRAFT. Current: {po.status}")
    old = ser_po(po)
    if payload.vendor_id and payload.vendor_id != po.vendor_id:
        vendor = (await db.execute(select(Vendor).where(
            Vendor.id == payload.vendor_id,
            Vendor.tenant_id == current_user.tenant_id,
            Vendor.status == "APPROVED",
        ))).scalar_one_or_none()
        if not vendor:
            raise HTTPException(400, "Vendor not found or not APPROVED")
        po.vendor_id    = vendor.id
        po.vendor_name  = payload.vendor_name or vendor.name
        po.vendor_email = vendor.email
        po.vendor_gstin = vendor.gstin
    for k, v in payload.model_dump(exclude_unset=True).items():
        if k != "vendor_id":
            setattr(po, k, v)
    po.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "update", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number, old_val=old, request=request)
    return ser_po(po)


@router.delete("/orders/{po_id}")
async def delete_order(
    po_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_delete(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase Order not found")
    if po.status not in ("DRAFT", "REJECTED", "CANCELLED"):
        raise HTTPException(400, f"Only DRAFT/REJECTED/CANCELLED POs can be deleted. Current: {po.status}")
    po.deleted_at = datetime.now(timezone.utc)
    po.is_active  = False
    po.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "delete", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number, request=request)
    return {"success": True, "message": f"PO {po.po_number} deleted"}


@router.post("/orders/{po_id}/items", status_code=201)
async def add_po_item(
    po_id: UUID, payload: POItemIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "DRAFT":
        raise HTTPException(400, "Items can only be added to DRAFT POs")
    if po.is_locked:
        raise HTTPException(400, "PO is locked. Use Amendment workflow.")
    qty  = Decimal(str(payload.quantity))
    price = Decimal(str(payload.unit_price))
    disc  = Decimal(str(payload.discount_pct or 0))
    gst   = Decimal(str(payload.gst_rate or 18))
    sub   = qty * price * (1 - disc / 100)
    tax   = sub * gst / 100
    item  = PurchaseOrderItem(
        tenant_id=current_user.tenant_id, po_id=po_id,
        created_by=current_user.id, updated_by=current_user.id,
        rfq_item_id=payload.rfq_item_id,
        product_id=payload.product_id, product_name=payload.product_name,
        product_sku=payload.product_sku, product_code=payload.product_code,
        hsn_code=payload.hsn_code, quantity=qty, unit=payload.unit,
        unit_price=price,
        quoted_price=Decimal(str(payload.quoted_price)) if payload.quoted_price is not None else None,
        discount_pct=disc, gst_rate=gst,
        subtotal=round(sub, 2), tax_amount=round(tax, 2), line_total=round(sub + tax, 2),
        notes=payload.notes,
    )
    db.add(item)
    await db.flush()
    await _recalc_po(po_id, db)
    await _audit(db, current_user, "add_item", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 new_val={"item": payload.product_name, "qty": float(qty)}, request=request)
    return ser_poi(item)


@router.delete("/orders/{po_id}/items/{item_id}")
async def delete_po_item(
    po_id: UUID, item_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "DRAFT":
        raise HTTPException(400, "Items can only be removed from DRAFT POs")
    item = (await db.execute(select(PurchaseOrderItem).where(
        PurchaseOrderItem.id == item_id, PurchaseOrderItem.po_id == po_id,
    ))).scalar_one_or_none()
    if not item:
        raise HTTPException(404, "PO item not found")
    if float(item.received_qty or 0) > 0:
        raise HTTPException(400, f"Cannot remove '{item.product_name}' — already partially received")
    await db.delete(item)
    await db.flush()
    await _recalc_po(po_id, db)
    await _audit(db, current_user, "remove_item", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 notes=f"Removed: {item.product_name}", request=request)
    return {"success": True}


@router.post("/orders/{po_id}/submit")
async def submit_po(
    po_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "DRAFT":
        raise HTTPException(400, f"Only DRAFT POs can be submitted. Current: {po.status}")
    if po.items_count == 0:
        raise HTTPException(400, "Add at least one line item before submitting")
    now = datetime.now(timezone.utc)
    po.status = "SUBMITTED"
    po.submitted_by = current_user.id
    po.submitted_at = now
    po.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PO Submitted: {po.po_number}",
        message=f"{current_user.name} submitted {po.po_number} (₹{float(po.total_amount or 0):,.0f}) for approval",
        type="purchase", level="warning", link=f"/purchase/orders/{po_id}")
    await _audit(db, current_user, "submit", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number, request=request)
    return ser_po(po)


@router.post("/orders/{po_id}/approve")
async def approve_po(
    po_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "SUBMITTED":
        raise HTTPException(400, f"Only SUBMITTED POs can be approved. Current: {po.status}")
    now = datetime.now(timezone.utc)
    po.status = "APPROVED"
    po.approved_by = current_user.id
    po.approved_by_name = current_user.name
    po.approved_at = now
    po.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PO Approved: {po.po_number}",
        message=f"{current_user.name} approved {po.po_number} — {po.vendor_name}",
        type="purchase", level="success", link=f"/purchase/orders/{po_id}")
    await _audit(db, current_user, "approve", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 new_val={"approved_by": current_user.name}, request=request)
    return ser_po(po)


@router.post("/orders/{po_id}/reject")
async def reject_po(
    po_id: UUID, payload: RejectIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status != "SUBMITTED":
        raise HTTPException(400, f"Only SUBMITTED POs can be rejected. Current: {po.status}")
    now = datetime.now(timezone.utc)
    po.status = "REJECTED"
    po.rejected_by = current_user.id
    po.rejected_at = now
    po.rejection_reason = payload.reason
    po.updated_by = current_user.id
    await db.flush()
    await push_notification(db, current_user.tenant_id,
        title=f"PO Rejected: {po.po_number}",
        message=f"{po.po_number} rejected: {payload.reason[:80]}",
        type="purchase", level="error", link=f"/purchase/orders/{po_id}")
    await _audit(db, current_user, "reject", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 notes=payload.reason, request=request)
    return ser_po(po)


@router.post("/orders/{po_id}/send-to-vendor")
async def send_po_to_vendor_endpoint(
    po_id: UUID, payload: SendToVendorIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Email PO to vendor and log message in the communication thread."""
    _perm_edit(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status not in ("APPROVED", "SENT_TO_VENDOR"):
        raise HTTPException(400, f"Only APPROVED POs can be sent to vendor. Current: {po.status}")

    email_to = payload.email or po.vendor_email
    email_sent = False
    if email_to:
        try:
            items_data = (await db.execute(
                select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po_id)
            )).scalars().all()
            from app.modules.email.service import send_po_to_vendor as _send_po_email
            email_sent = await _send_po_email(
                to=email_to, vendor_name=po.vendor_name, po_number=po.po_number,
                items=[{"name": i.product_name, "quantity": float(i.quantity),
                        "unit_price": float(i.unit_price), "total": float(i.line_total or 0)}
                       for i in items_data],
                total=float(po.total_amount or 0), company_name="Oregenal Electrical India",
                delivery_date=po.delivery_date.isoformat() if po.delivery_date else None,
            )
        except Exception:
            pass

    po.status = "SENT_TO_VENDOR"
    po.sent_to_vendor_at = datetime.now(timezone.utc)
    po.updated_by = current_user.id
    body = payload.message or f"Purchase Order {po.po_number} sent to {po.vendor_name}."
    db.add(POMessage(
        tenant_id=current_user.tenant_id, po_id=po_id,
        created_by=current_user.id, updated_by=current_user.id,
        message_type="vendor_sent", sender_name=current_user.name,
        sender_type="user", body=body, email_sent=email_sent,
    ))
    await db.flush()
    await _audit(db, current_user, "send_to_vendor", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 notes=f"To: {email_to}, email_sent: {email_sent}", request=request)
    return {**ser_po(po), "email_sent": email_sent, "email_to": email_to}


@router.post("/orders/{po_id}/amend")
async def amend_po(
    po_id: UUID, payload: AmendmentIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a change to an approved/locked PO. Records full audit diff."""
    _perm_edit(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    if po.status not in ("APPROVED", "SENT_TO_VENDOR"):
        raise HTTPException(400, f"Amendments only for APPROVED/SENT_TO_VENDOR POs. Current: {po.status}")

    AMENDABLE = {"delivery_date", "notes", "terms_and_conditions", "payment_terms_days"}
    old_vals, new_vals = {}, {}
    for field, new_val in payload.changes.items():
        if field not in AMENDABLE:
            raise HTTPException(400, f"'{field}' cannot be amended. Allowed: {sorted(AMENDABLE)}")
        cur = getattr(po, field, None)
        old_vals[field] = cur.isoformat() if hasattr(cur, "isoformat") else cur
        setattr(po, field, new_val)
        new_vals[field] = new_val

    po.amendment_count += 1
    po.updated_by = current_user.id
    is_admin = current_user.role in ("super_admin", "admin")
    amend = POAmendment(
        tenant_id=current_user.tenant_id, po_id=po_id,
        created_by=current_user.id, is_test_data=False,
        version=po.amendment_count, amended_by_name=current_user.name,
        reason=payload.reason, diff={"old": old_vals, "new": new_vals},
        status="APPROVED" if is_admin else "PENDING",
        approved_by=current_user.id if is_admin else None,
        approved_at=datetime.now(timezone.utc) if is_admin else None,
    )
    db.add(amend)
    db.add(POMessage(
        tenant_id=current_user.tenant_id, po_id=po_id,
        created_by=current_user.id, updated_by=current_user.id,
        message_type="amendment_note", sender_name=current_user.name,
        sender_type="user", body=f"Amendment #{po.amendment_count}: {payload.reason}",
        is_private=True,
    ))
    await db.flush()
    await _audit(db, current_user, "amend", "purchase_order",
                 doc_id=po.id, doc_number=po.po_number,
                 old_val=old_vals, new_val=new_vals, notes=payload.reason, request=request)
    return {**ser_po(po), "amendment": ser_amendment(amend)}


@router.get("/orders/{po_id}/messages")
async def get_po_messages(
    po_id: UUID,
    page:      int = Query(1, ge=1),
    page_size: int = Query(50, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    q = select(POMessage).where(POMessage.po_id == po_id)
    if current_user.role not in ("super_admin", "admin"):
        q = q.where(or_(POMessage.is_private == False,
                        POMessage.created_by == current_user.id))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(POMessage.created_at.asc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_msg(m) for m in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/orders/{po_id}/messages", status_code=201)
async def add_po_message(
    po_id: UUID, payload: POMessageIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "PO not found")
    msg = POMessage(
        tenant_id=current_user.tenant_id, po_id=po_id,
        created_by=current_user.id, updated_by=current_user.id,
        message_type=payload.message_type, sender_name=current_user.name,
        sender_type="user", body=payload.body,
        is_private=payload.is_private, email_sent=False,
    )
    db.add(msg)
    await db.flush()
    return ser_msg(msg)

# =====================================================================
# GRN  (7 endpoints)
# =====================================================================

@router.get("/grn/pending")
async def pending_grn(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """POs awaiting receipt (APPROVED / SENT_TO_VENDOR / PARTIALLY_RECEIVED)."""
    _perm_view(current_user)
    rows = (await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.tenant_id == current_user.tenant_id,
            PurchaseOrder.status.in_(["APPROVED", "SENT_TO_VENDOR", "PARTIALLY_RECEIVED"]),
            PurchaseOrder.deleted_at.is_(None),
        ).order_by(PurchaseOrder.delivery_date.asc().nullslast(),
                   PurchaseOrder.created_at.desc()).limit(50)
    )).scalars().all()
    return {"items": [ser_po(r) for r in rows], "total": len(rows)}


@router.get("/grn")
async def list_grn(
    status:    Optional[str]  = Query(None),
    po_id:     Optional[UUID] = Query(None),
    search:    Optional[str]  = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(GRNHeader).where(GRNHeader.tenant_id == current_user.tenant_id)
    if status: q = q.where(GRNHeader.status == status.upper())
    if po_id:  q = q.where(GRNHeader.po_id == po_id)
    if search:
        t = f"%{search}%"
        q = q.where(or_(GRNHeader.grn_number.ilike(t), GRNHeader.po_number.ilike(t)))
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(GRNHeader.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_grn(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/grn", status_code=201)
async def create_grn(
    payload: GRNCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == payload.po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase Order not found")
    # RULE 3: PO must be APPROVED before GRN
    if po.status not in ("APPROVED", "SENT_TO_VENDOR", "PARTIALLY_RECEIVED"):
        raise HTTPException(400,
            f"GRN requires APPROVED/SENT/PARTIALLY_RECEIVED PO. Current: {po.status}")

    grn_number = await next_number(db, current_user.tenant_id, "grn", "GRN", "grn_headers")
    grn = GRNHeader(
        tenant_id=current_user.tenant_id, created_by=current_user.id, updated_by=current_user.id,
        po_id=po.id, vendor_id=po.vendor_id,
        grn_number=grn_number, status="DRAFT",
        received_date=payload.received_date or date.today(),
        vehicle_number=payload.vehicle_number, dc_number=payload.dc_number,
        invoice_number=payload.invoice_number,
        vendor_name=po.vendor_name, po_number=po.po_number, notes=payload.notes,
    )
    db.add(grn)
    await db.flush()

    total_val = Decimal("0")
    for git in payload.items:
        po_item = (await db.execute(select(PurchaseOrderItem).where(
            PurchaseOrderItem.id == git.po_item_id,
            PurchaseOrderItem.po_id == po.id,
        ))).scalar_one_or_none()
        if not po_item:
            raise HTTPException(404, f"PO item {git.po_item_id} not found on this PO")

        ordered_qty  = float(po_item.quantity)
        already_recv = float(po_item.received_qty or 0)
        pending      = ordered_qty - already_recv

        # RULE 7: over-receipt block
        if git.received_qty > pending + 0.001:
            raise HTTPException(400,
                f"Over-receipt blocked for '{po_item.product_name}': "
                f"ordered={ordered_qty}, received={already_recv}, "
                f"attempted={git.received_qty}, remaining={round(pending,3)}")

        accepted_qty = git.accepted_qty if git.accepted_qty is not None else git.received_qty
        unit_cost    = Decimal(str(git.unit_cost if git.unit_cost is not None else po_item.unit_price))
        total_cost   = Decimal(str(accepted_qty)) * unit_cost
        total_val   += total_cost

        db.add(GRNItem(
            tenant_id=current_user.tenant_id, grn_id=grn.id,
            po_item_id=git.po_item_id, created_by=current_user.id, updated_by=current_user.id,
            product_id=po_item.product_id, product_name=po_item.product_name,
            product_sku=po_item.product_sku, unit=po_item.unit, hsn_code=po_item.hsn_code,
            ordered_qty=Decimal(str(ordered_qty)),
            received_qty=Decimal(str(git.received_qty)),
            accepted_qty=Decimal(str(accepted_qty)),
            rejected_qty=Decimal(str(git.rejected_qty or 0)),
            unit_cost=unit_cost, total_cost=round(total_cost, 2),
            batch_number=git.batch_number, expiry_date=git.expiry_date,
            rejection_reason=git.rejection_reason, notes=git.notes,
        ))

    grn.total_received_value = total_val
    await db.flush()
    await _audit(db, current_user, "create", "grn",
                 doc_id=grn.id, doc_number=grn.grn_number,
                 new_val={"po": po.po_number, "value": float(total_val)}, request=request)
    return ser_grn(grn)


@router.get("/grn/{grn_id}")
async def get_grn(
    grn_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    grn = (await db.execute(select(GRNHeader).where(
        GRNHeader.id == grn_id, GRNHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not grn:
        raise HTTPException(404, "GRN not found")
    items = (await db.execute(
        select(GRNItem).where(GRNItem.grn_id == grn_id).order_by(GRNItem.created_at)
    )).scalars().all()
    result = ser_grn(grn)
    result["items"] = [ser_grn_item(i) for i in items]
    return result


@router.post("/grn/{grn_id}/post")
async def post_grn(
    grn_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Post GRN: atomic stock IN via ledger engine.
    RULE 5: PO locks after first GRN posted.
    RULE 8: WAC recalc, no negative stock enforcement by ledger engine.
    """
    _perm_edit(current_user)
    grn = (await db.execute(select(GRNHeader).where(
        GRNHeader.id == grn_id, GRNHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not grn:
        raise HTTPException(404, "GRN not found")
    if grn.status != "DRAFT":
        raise HTTPException(400, f"Only DRAFT GRNs can be posted. Current: {grn.status}")
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == grn.po_id
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Associated PO not found")

    grn_items = (await db.execute(
        select(GRNItem).where(GRNItem.grn_id == grn_id)
    )).scalars().all()

    from app.engines.stock_ledger import post_stock_movement, StockProductNotFound, StockInsufficientError

    stock_entries = []
    for item in grn_items:
        if not item.product_id or float(item.accepted_qty) <= 0:
            continue
        try:
            entry = await post_stock_movement(
                db=db, tenant_id=current_user.tenant_id,
                product_id=item.product_id,
                movement_type="purchase_receipt",
                quantity=int(item.accepted_qty),
                direction="in",
                unit_cost=item.unit_cost,
                reference_type="grn",
                reference_id=str(grn.id),
                reference_number=grn.grn_number,
                notes=f"GRN {grn.grn_number} — PO {grn.po_number}",
                created_by=current_user.name,
            )
            item.ledger_entry_id = entry.id
            stock_entries.append({
                "product_name": item.product_name,
                "qty_accepted": int(item.accepted_qty),
                "stock_after":  entry.stock_after,
                "wac_after":    float(entry.wac_after or 0),
            })
        except StockProductNotFound as e:
            raise HTTPException(404, str(e))
        except StockInsufficientError as e:
            raise HTTPException(400, str(e))
        except Exception as e:
            raise HTTPException(500, f"Stock ledger error for '{item.product_name}': {e}")

    # Update PO item received quantities
    for item in grn_items:
        await db.execute(text("""
            UPDATE purchase_order_items
            SET received_qty = received_qty + :r, updated_at = now()
            WHERE id = :iid
        """), {"r": float(item.received_qty), "iid": str(item.po_item_id)})

    now = datetime.now(timezone.utc)
    grn.status    = "POSTED"
    grn.posted_by = current_user.id
    grn.posted_at = now
    grn.updated_by = current_user.id

    # RULE 5: Lock PO on first GRN post
    if not po.is_locked:
        po.is_locked  = True
        po.updated_by = current_user.id

    # Update PO status
    remaining = (await db.execute(text("""
        SELECT COALESCE(SUM(quantity - received_qty), 0)
        FROM purchase_order_items WHERE po_id = :pid
    """), {"pid": str(po.id)})).scalar_one()
    po.status = "RECEIVED" if float(remaining) <= 0 else "PARTIALLY_RECEIVED"
    await db.flush()

    await push_notification(db, current_user.tenant_id,
        title=f"GRN Posted: {grn.grn_number}",
        message=f"Stock received for {po.po_number} — {len(stock_entries)} product(s) updated",
        type="purchase", level="success", link=f"/purchase/grn/{grn_id}")
    await _audit(db, current_user, "post", "grn",
                 doc_id=grn.id, doc_number=grn.grn_number,
                 new_val={"po_status": po.status, "items_posted": len(stock_entries)},
                 request=request)
    return {
        **ser_grn(grn),
        "stock_entries": stock_entries,
        "po_status": po.status,
        "message": f"GRN posted — {len(stock_entries)} product(s) received into stock",
    }


@router.post("/grn/{grn_id}/cancel")
async def cancel_grn(
    grn_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_edit(current_user)
    grn = (await db.execute(select(GRNHeader).where(
        GRNHeader.id == grn_id, GRNHeader.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not grn:
        raise HTTPException(404, "GRN not found")
    # RULE 8: Cannot cancel POSTED GRN — creates Purchase Return instead
    if grn.status == "POSTED":
        raise HTTPException(400, "Cannot cancel a POSTED GRN. Create a Purchase Return to reverse stock.")
    if grn.status == "CANCELLED":
        raise HTTPException(400, "GRN already cancelled")
    grn.status    = "CANCELLED"
    grn.is_active = False
    grn.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "cancel", "grn",
                 doc_id=grn.id, doc_number=grn.grn_number, request=request)
    return {"success": True, "grn_number": grn.grn_number}

# =====================================================================
# PURCHASE RETURNS  (6 endpoints)
# =====================================================================

@router.get("/returns")
async def list_returns(
    status:    Optional[str]  = Query(None),
    po_id:     Optional[UUID] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(PurchaseReturn).where(PurchaseReturn.tenant_id == current_user.tenant_id)
    if status: q = q.where(PurchaseReturn.status == status.upper())
    if po_id:  q = q.where(PurchaseReturn.po_id == po_id)
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(PurchaseReturn.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_return(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


@router.post("/returns", status_code=201)
async def create_return(
    payload: ReturnCreate, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_create(current_user)
    po = (await db.execute(select(PurchaseOrder).where(
        PurchaseOrder.id == payload.po_id,
        PurchaseOrder.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase Order not found")
    if po.status not in ("PARTIALLY_RECEIVED", "RECEIVED"):
        raise HTTPException(400,
            f"Returns only allowed on PARTIALLY_RECEIVED/RECEIVED POs. Current: {po.status}")

    grn_number = None
    if payload.grn_id:
        grn = (await db.execute(select(GRNHeader).where(GRNHeader.id == payload.grn_id))).scalar_one_or_none()
        grn_number = grn.grn_number if grn else None

    ret_number = await next_number(db, current_user.tenant_id,
                                   "purchase_return", "PRN", "purchase_returns")
    ret = PurchaseReturn(
        tenant_id=current_user.tenant_id, created_by=current_user.id, updated_by=current_user.id,
        po_id=payload.po_id, grn_id=payload.grn_id, vendor_id=po.vendor_id,
        return_number=ret_number, status="DRAFT",
        vendor_name=po.vendor_name, po_number=po.po_number, grn_number=grn_number,
        return_reason=payload.return_reason, notes=payload.notes,
    )
    db.add(ret)
    await db.flush()

    total = Decimal("0")
    for it in payload.items:
        tc = Decimal(str(it.return_qty)) * Decimal(str(it.unit_cost))
        total += tc
        db.add(PurchaseReturnItem(
            tenant_id=current_user.tenant_id, return_id=ret.id,
            created_by=current_user.id, updated_by=current_user.id,
            grn_item_id=it.grn_item_id, po_item_id=it.po_item_id,
            product_id=it.product_id, product_name=it.product_name,
            unit=it.unit, return_qty=Decimal(str(it.return_qty)),
            unit_cost=Decimal(str(it.unit_cost)), total_cost=round(tc, 2),
            return_reason=it.return_reason, notes=it.notes,
        ))
    ret.total_amount = total
    await db.flush()
    await _audit(db, current_user, "create", "purchase_return",
                 doc_id=ret.id, doc_number=ret.return_number, request=request)
    return ser_return(ret)


@router.get("/returns/{ret_id}")
async def get_return(
    ret_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    ret = (await db.execute(select(PurchaseReturn).where(
        PurchaseReturn.id == ret_id,
        PurchaseReturn.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not ret:
        raise HTTPException(404, "Purchase return not found")
    items = (await db.execute(
        select(PurchaseReturnItem).where(PurchaseReturnItem.return_id == ret_id)
        .order_by(PurchaseReturnItem.created_at)
    )).scalars().all()
    result = ser_return(ret)
    result["items"] = [
        {"id": _s(i.id), "product_name": i.product_name, "unit": i.unit,
         "return_qty": _f(i.return_qty), "unit_cost": _f(i.unit_cost),
         "total_cost": _f(i.total_cost), "return_reason": i.return_reason,
         "ledger_entry_id": _s(i.ledger_entry_id)}
        for i in items
    ]
    return result


@router.post("/returns/{ret_id}/approve")
async def approve_return(
    ret_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    ret = (await db.execute(select(PurchaseReturn).where(
        PurchaseReturn.id == ret_id,
        PurchaseReturn.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not ret:
        raise HTTPException(404, "Purchase return not found")
    if ret.status != "DRAFT":
        raise HTTPException(400, f"Only DRAFT returns can be approved. Current: {ret.status}")
    ret.status = "APPROVED"
    ret.approved_by = current_user.id
    ret.approved_at = datetime.now(timezone.utc)
    ret.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "approve", "purchase_return",
                 doc_id=ret.id, doc_number=ret.return_number, request=request)
    return ser_return(ret)


@router.post("/returns/{ret_id}/reject")
async def reject_return(
    ret_id: UUID, payload: RejectIn, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_approve(current_user)
    ret = (await db.execute(select(PurchaseReturn).where(
        PurchaseReturn.id == ret_id,
        PurchaseReturn.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not ret:
        raise HTTPException(404, "Purchase return not found")
    if ret.status not in ("DRAFT", "APPROVED"):
        raise HTTPException(400, f"Cannot reject return in status: {ret.status}")
    ret.status = "REJECTED"
    ret.rejected_by = current_user.id
    ret.rejected_at = datetime.now(timezone.utc)
    ret.rejection_reason = payload.reason
    ret.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "reject", "purchase_return",
                 doc_id=ret.id, doc_number=ret.return_number,
                 notes=payload.reason, request=request)
    return ser_return(ret)


@router.post("/returns/{ret_id}/dispatch")
async def dispatch_return(
    ret_id: UUID, request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dispatch return: post stock OUT (return_to_vendor) via ledger engine.
    RULE 9: stock is decremented atomically per item.
    """
    _perm_edit(current_user)
    ret = (await db.execute(select(PurchaseReturn).where(
        PurchaseReturn.id == ret_id,
        PurchaseReturn.tenant_id == current_user.tenant_id,
    ))).scalar_one_or_none()
    if not ret:
        raise HTTPException(404, "Purchase return not found")
    if ret.status != "APPROVED":
        raise HTTPException(400, f"Only APPROVED returns can be dispatched. Current: {ret.status}")

    ret_items = (await db.execute(
        select(PurchaseReturnItem).where(PurchaseReturnItem.return_id == ret_id)
    )).scalars().all()

    from app.engines.stock_ledger import post_stock_movement, StockInsufficientError

    stock_entries = []
    for item in ret_items:
        if not item.product_id or float(item.return_qty) <= 0:
            continue
        try:
            entry = await post_stock_movement(
                db=db, tenant_id=current_user.tenant_id,
                product_id=item.product_id,
                movement_type="return_to_vendor",
                quantity=int(item.return_qty),
                direction="out",
                unit_cost=item.unit_cost,
                reference_type="purchase_return",
                reference_id=str(ret.id),
                reference_number=ret.return_number,
                notes=f"Return {ret.return_number} — {ret.return_reason}",
                created_by=current_user.name,
            )
            item.ledger_entry_id = entry.id
            stock_entries.append({
                "product_name": item.product_name,
                "qty_returned": int(item.return_qty),
                "stock_after":  entry.stock_after,
            })
        except StockInsufficientError as e:
            raise HTTPException(400, str(e))
        except Exception as e:
            raise HTTPException(500, f"Stock ledger error: {e}")

    ret.status = "DISPATCHED"
    ret.dispatched_by = current_user.id
    ret.dispatched_at = datetime.now(timezone.utc)
    ret.updated_by = current_user.id
    await db.flush()
    await _audit(db, current_user, "dispatch", "purchase_return",
                 doc_id=ret.id, doc_number=ret.return_number,
                 new_val={"items_dispatched": len(stock_entries)}, request=request)
    return {
        **ser_return(ret),
        "stock_entries": stock_entries,
        "message": f"Dispatched — {len(stock_entries)} product(s) removed from stock",
    }


# =====================================================================
# REPORTS  (3 endpoints)
# =====================================================================

@router.get("/reports/po-register")
async def po_register(
    date_from:  Optional[str]  = Query(None),
    date_to:    Optional[str]  = Query(None),
    status:     Optional[str]  = Query(None),
    vendor_id:  Optional[UUID] = Query(None),
    page:       int = Query(1, ge=1),
    page_size:  int = Query(50, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(PurchaseOrder).where(
        PurchaseOrder.tenant_id == current_user.tenant_id,
        PurchaseOrder.deleted_at.is_(None),
    )
    if status:    q = q.where(PurchaseOrder.status == status.upper())
    if vendor_id: q = q.where(PurchaseOrder.vendor_id == vendor_id)
    if date_from:
        try:
            df = date.fromisoformat(date_from)
            q  = q.where(PurchaseOrder.order_date >= df)
        except ValueError:
            raise HTTPException(400, f"Invalid date_from: {date_from}. Use YYYY-MM-DD.")
    if date_to:
        try:
            dt = date.fromisoformat(date_to)
            q  = q.where(PurchaseOrder.order_date <= dt)
        except ValueError:
            raise HTTPException(400, f"Invalid date_to: {date_to}. Use YYYY-MM-DD.")
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    total_val = (await db.execute(
        select(func.sum(PurchaseOrder.total_amount)).select_from(q.subquery())
    )).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(PurchaseOrder.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {
        "items": [ser_po(r) for r in rows], "total": total,
        "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
        "summary": {"total_pos": total, "total_value": float(total_val or 0)},
    }


@router.get("/reports/vendor-spend")
async def vendor_spend(
    date_from:  Optional[str] = Query(None),
    date_to:    Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Vendor-wise spend analysis — top 50 vendors by total PO value."""
    _perm_view(current_user)
    where = "tenant_id = :tid AND deleted_at IS NULL AND status NOT IN ('CANCELLED','REJECTED')"
    params: dict = {"tid": str(current_user.tenant_id)}
    if date_from:
        where += " AND order_date >= :df::date"
        params["df"] = date_from
    if date_to:
        where += " AND order_date <= :dt::date"
        params["dt"] = date_to
    rows = (await db.execute(text(f"""
        SELECT vendor_id, vendor_name,
               COUNT(*) AS po_count,
               SUM(total_amount) AS total_spend,
               AVG(total_amount) AS avg_po_value,
               MAX(created_at)   AS last_po_date
        FROM purchase_orders WHERE {where}
        GROUP BY vendor_id, vendor_name
        ORDER BY total_spend DESC LIMIT 50
    """), params)).fetchall()
    return {"items": [
        {"vendor_id": _s(r[0]), "vendor_name": r[1], "po_count": int(r[2]),
         "total_spend": float(r[3] or 0), "avg_po_value": round(float(r[4] or 0), 2),
         "last_po_date": r[5].isoformat() if r[5] else None}
        for r in rows
    ]}


@router.get("/reports/grn-register")
async def grn_register(
    date_from:  Optional[str] = Query(None),
    date_to:    Optional[str] = Query(None),
    status:     Optional[str] = Query(None),
    page:       int = Query(1, ge=1),
    page_size:  int = Query(50, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _perm_view(current_user)
    q = select(GRNHeader).where(GRNHeader.tenant_id == current_user.tenant_id)
    if status: q = q.where(GRNHeader.status == status.upper())
    if date_from:
        try:
            q = q.where(GRNHeader.received_date >= date.fromisoformat(date_from))
        except ValueError:
            raise HTTPException(400, f"Invalid date_from: {date_from}")
    if date_to:
        try:
            q = q.where(GRNHeader.received_date <= date.fromisoformat(date_to))
        except ValueError:
            raise HTTPException(400, f"Invalid date_to: {date_to}")
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(GRNHeader.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()
    return {"items": [ser_grn(r) for r in rows], "total": total,
            "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}
