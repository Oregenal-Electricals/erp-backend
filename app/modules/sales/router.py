"""
Sales Module — Complete Router
==============================
Endpoints:
  GET/POST   /sales/orders
  GET/PUT/DELETE /sales/orders/{id}
  POST       /sales/orders/{id}/line-items
  PUT/DELETE /sales/orders/{id}/line-items/{item_id}
  POST       /sales/orders/{id}/submit          (submit for approval)
  POST       /sales/orders/{id}/approve         (approve)
  POST       /sales/orders/{id}/reject          (reject)
  POST       /sales/orders/{id}/payments        (record payment)
  GET        /sales/orders/{id}/pdf             (generate PDF)
  GET        /sales/customers
  POST/PUT/DELETE /sales/customers/{id}
"""

import math
from decimal import Decimal
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update
from pydantic import BaseModel, field_validator
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/sales", tags=["Sales"])


# ── Database Models ───────────────────────────────────────────────────

class Customer(Base):
    __tablename__ = "customers"

    tenant_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = sa.Column(sa.String(300), nullable=False)
    email       = sa.Column(sa.String(254), nullable=True)
    phone       = sa.Column(sa.String(30),  nullable=True)
    address     = sa.Column(sa.Text, nullable=True)
    gstin       = sa.Column(sa.String(20), nullable=True)
    pan         = sa.Column(sa.String(20), nullable=True)
    credit_limit= sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    is_active   = sa.Column(sa.Boolean, default=True, nullable=False)
    custom_data = sa.Column(JSON, default=dict, nullable=False)
    deleted_at  = sa.Column(sa.DateTime(timezone=True), nullable=True)


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    tenant_id        = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_number     = sa.Column(sa.String(50), nullable=False, unique=False)
    customer_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name    = sa.Column(sa.String(300), nullable=False)
    customer_email   = sa.Column(sa.String(254), nullable=True)
    customer_phone   = sa.Column(sa.String(30),  nullable=True)
    customer_address = sa.Column(sa.Text, nullable=True)
    customer_gstin   = sa.Column(sa.String(20), nullable=True)

    # Amounts
    subtotal         = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    discount_amount  = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    tax_amount       = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    total_amount     = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    paid_amount      = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    balance_due      = sa.Column(sa.Numeric(15,2), default=0, nullable=False)

    # Status
    status           = sa.Column(sa.String(50), default="draft",   nullable=False, index=True)
    payment_status   = sa.Column(sa.String(50), default="unpaid",  nullable=False)
    approval_status  = sa.Column(sa.String(50), default="none",    nullable=False)

    # Dates
    order_date       = sa.Column(sa.String(20), nullable=True)
    delivery_date    = sa.Column(sa.String(20), nullable=True)
    valid_until      = sa.Column(sa.String(20), nullable=True)

    # Meta
    reference_number = sa.Column(sa.String(100), nullable=True)
    terms            = sa.Column(sa.Text, nullable=True)
    notes            = sa.Column(sa.Text, nullable=True)
    internal_notes   = sa.Column(sa.Text, nullable=True)
    assigned_to_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    custom_data      = sa.Column(JSON, default=dict, nullable=False)
    deleted_at       = sa.Column(sa.DateTime(timezone=True), nullable=True)


class OrderItem(Base):
    __tablename__ = "order_items"

    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id   = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    product_name = sa.Column(sa.String(300), nullable=False)
    product_sku  = sa.Column(sa.String(100), nullable=True)
    description  = sa.Column(sa.Text, nullable=True)
    quantity     = sa.Column(sa.Numeric(15,3), default=1, nullable=False)
    unit         = sa.Column(sa.String(30), default="Pcs", nullable=False)
    unit_price   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    discount_pct = sa.Column(sa.Numeric(5,2), default=0, nullable=False)
    tax_pct      = sa.Column(sa.Numeric(5,2), default=18, nullable=False)
    line_total   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    sort_order   = sa.Column(sa.Integer, default=0, nullable=False)


# ── Helper: recalculate order totals ──────────────────────────────────

async def recalculate_order(order: SalesOrder, db: AsyncSession):
    """Recalculate subtotal, tax, total from line items."""
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    subtotal = Decimal("0")
    tax_total = Decimal("0")

    for item in items:
        qty       = Decimal(str(item.quantity))
        price     = Decimal(str(item.unit_price))
        disc_pct  = Decimal(str(item.discount_pct)) / 100
        tax_pct   = Decimal(str(item.tax_pct)) / 100

        line_pre_disc = qty * price
        line_disc     = line_pre_disc * disc_pct
        line_net      = line_pre_disc - line_disc
        line_tax      = line_net * tax_pct
        line_total    = line_net + line_tax

        # Update item total
        item.line_total = line_total
        subtotal  += line_net
        tax_total += line_tax

    order.subtotal      = subtotal
    order.tax_amount    = tax_total
    order.total_amount  = subtotal - Decimal(str(order.discount_amount)) + tax_total
    order.balance_due   = order.total_amount - Decimal(str(order.paid_amount))

    # Update payment status
    if order.balance_due <= 0:
        order.payment_status = "paid"
    elif order.paid_amount > 0:
        order.payment_status = "partial"
    else:
        order.payment_status = "unpaid"


# ── Serializers ───────────────────────────────────────────────────────

def item_out(i: OrderItem) -> dict:
    return {
        "id": str(i.id),
        "product_id": str(i.product_id) if i.product_id else None,
        "product_name": i.product_name,
        "product_sku": i.product_sku,
        "description": i.description,
        "quantity": float(i.quantity),
        "unit": i.unit,
        "unit_price": float(i.unit_price),
        "discount_pct": float(i.discount_pct),
        "tax_pct": float(i.tax_pct),
        "line_total": float(i.line_total),
        "sort_order": i.sort_order,
    }


async def order_out(order: SalesOrder, db: AsyncSession, include_items: bool = True) -> dict:
    data = {
        "id": str(order.id),
        "order_number": order.order_number,
        "customer_id": str(order.customer_id) if order.customer_id else None,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "customer_address": order.customer_address,
        "customer_gstin": order.customer_gstin,
        "subtotal": float(order.subtotal),
        "discount_amount": float(order.discount_amount),
        "tax_amount": float(order.tax_amount),
        "total_amount": float(order.total_amount),
        "paid_amount": float(order.paid_amount),
        "balance_due": float(order.balance_due),
        "status": order.status,
        "payment_status": order.payment_status,
        "approval_status": order.approval_status,
        "order_date": order.order_date,
        "delivery_date": order.delivery_date,
        "valid_until": order.valid_until,
        "reference_number": order.reference_number,
        "terms": order.terms,
        "notes": order.notes,
        "internal_notes": order.internal_notes,
        "custom_data": order.custom_data or {},
        "created_at": order.created_at.isoformat() if order.created_at else "",
        "items": [],
        "items_count": 0,
    }

    if include_items:
        items_result = await db.execute(
            select(OrderItem)
            .where(OrderItem.order_id == order.id)
            .order_by(OrderItem.sort_order, OrderItem.created_at)
        )
        items = items_result.scalars().all()
        data["items"] = [item_out(i) for i in items]
        data["items_count"] = len(items)
    return data


def customer_out(c: Customer) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "address": c.address,
        "gstin": c.gstin,
        "pan": c.pan,
        "credit_limit": float(c.credit_limit),
        "is_active": c.is_active,
        "custom_data": c.custom_data or {},
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }


# ── Pydantic Schemas ──────────────────────────────────────────────────

class LineItemCreate(BaseModel):
    product_id:   Optional[str] = None
    product_name: str
    product_sku:  Optional[str] = None
    description:  Optional[str] = None
    quantity:     float = 1
    unit:         str = "Pcs"
    unit_price:   float = 0
    discount_pct: float = 0
    tax_pct:      float = 18
    sort_order:   int = 0


class LineItemUpdate(BaseModel):
    product_name: Optional[str] = None
    product_sku:  Optional[str] = None
    description:  Optional[str] = None
    quantity:     Optional[float] = None
    unit:         Optional[str] = None
    unit_price:   Optional[float] = None
    discount_pct: Optional[float] = None
    tax_pct:      Optional[float] = None
    sort_order:   Optional[int] = None


class OrderCreate(BaseModel):
    customer_name:    str
    customer_id:      Optional[str] = None
    customer_email:   Optional[str] = None
    customer_phone:   Optional[str] = None
    customer_address: Optional[str] = None
    customer_gstin:   Optional[str] = None
    order_date:       Optional[str] = None
    delivery_date:    Optional[str] = None
    valid_until:      Optional[str] = None
    reference_number: Optional[str] = None
    terms:            Optional[str] = None
    notes:            Optional[str] = None
    internal_notes:   Optional[str] = None
    status:           str = "draft"
    custom_data:      dict = {}
    items:            List[LineItemCreate] = []


class OrderUpdate(BaseModel):
    customer_name:    Optional[str] = None
    customer_email:   Optional[str] = None
    customer_phone:   Optional[str] = None
    customer_address: Optional[str] = None
    customer_gstin:   Optional[str] = None
    order_date:       Optional[str] = None
    delivery_date:    Optional[str] = None
    valid_until:      Optional[str] = None
    reference_number: Optional[str] = None
    terms:            Optional[str] = None
    notes:            Optional[str] = None
    internal_notes:   Optional[str] = None
    status:           Optional[str] = None
    discount_amount:  Optional[float] = None
    custom_data:      Optional[dict] = None


class PaymentCreate(BaseModel):
    amount:       float
    payment_date: Optional[str] = None
    method:       str = "bank_transfer"
    reference:    Optional[str] = None
    notes:        Optional[str] = None


class CustomerCreate(BaseModel):
    name:         str
    email:        Optional[str] = None
    phone:        Optional[str] = None
    address:      Optional[str] = None
    gstin:        Optional[str] = None
    pan:          Optional[str] = None
    credit_limit: float = 0
    custom_data:  dict = {}


# ── Auto-generate order number ─────────────────────────────────────────

async def generate_order_number(db: AsyncSession, tenant_id) -> str:
    count_result = await db.execute(
        select(func.count()).where(SalesOrder.tenant_id == tenant_id)
    )
    count = count_result.scalar_one() or 0
    return f"SO-{str(count + 1).zfill(4)}"


# ════════════════════════════════════════════════════════════════════
# SALES ORDER ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@router.get("/orders")
async def list_orders(
    status:  Optional[str] = Query(None),
    search:  Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir:str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(SalesOrder).where(
        SalesOrder.tenant_id == current_user.tenant_id,
        SalesOrder.deleted_at.is_(None)
    )
    if status:
        q = q.where(SalesOrder.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(
            SalesOrder.customer_name.ilike(t),
            SalesOrder.order_number.ilike(t),
            SalesOrder.reference_number.ilike(t),
        ))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()

    sort_col = getattr(SalesOrder, sort_by, SalesOrder.created_at)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())
    q = q.offset(pagination.offset).limit(pagination.limit)

    orders = (await db.execute(q)).scalars().all()

    # Build lightweight list (no items)
    items = []
    for o in orders:
        # Get item count efficiently
        cnt = (await db.execute(
            select(func.count()).where(OrderItem.order_id == o.id)
        )).scalar_one()
        d = await order_out(o, db, include_items=False)
        d["items_count"] = cnt
        items.append(d)

    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1,
    }


@router.get("/orders/{order_id}")
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Sales order not found")
    return await order_out(order, db, include_items=True)


@router.post("/orders", status_code=201)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order_number = await generate_order_number(db, current_user.tenant_id)

    order = SalesOrder(
        tenant_id=current_user.tenant_id,
        order_number=order_number,
        assigned_to_id=current_user.id,
        **{k: v for k, v in payload.model_dump(exclude={"items"}).items()},
    )
    db.add(order)
    await db.flush()

    # Add line items
    for i, item_data in enumerate(payload.items):
        item = OrderItem(
            tenant_id=current_user.tenant_id,
            order_id=order.id,
            sort_order=i,
            **item_data.model_dump(),
        )
        db.add(item)

    await db.flush()
    await recalculate_order(order, db)

    return await order_out(order, db, include_items=True)


@router.put("/orders/{order_id}")
async def update_order(
    order_id: UUID,
    payload: OrderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Sales order not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(order, k, v)

    await recalculate_order(order, db)
    return await order_out(order, db, include_items=True)


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Sales order not found")
    if order.status not in ("draft", "cancelled"):
        raise HTTPException(400, "Only draft or cancelled orders can be deleted")

    order.deleted_at = datetime.now(timezone.utc)
    return {"success": True, "message": "Order deleted"}


# ── Line Items ────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/line-items", status_code=201)
async def add_line_item(
    order_id: UUID,
    payload: LineItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    item = OrderItem(
        tenant_id=current_user.tenant_id,
        order_id=order_id,
        **payload.model_dump(),
    )
    db.add(item)
    await db.flush()
    await recalculate_order(order, db)
    return await order_out(order, db, include_items=True)


@router.put("/orders/{order_id}/line-items/{item_id}")
async def update_line_item(
    order_id: UUID,
    item_id:  UUID,
    payload:  LineItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order_result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    item_result = await db.execute(
        select(OrderItem).where(OrderItem.id == item_id, OrderItem.order_id == order_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Line item not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)

    await db.flush()
    await recalculate_order(order, db)
    return await order_out(order, db, include_items=True)


@router.delete("/orders/{order_id}/line-items/{item_id}")
async def delete_line_item(
    order_id: UUID,
    item_id:  UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order_result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    item_result = await db.execute(
        select(OrderItem).where(OrderItem.id == item_id, OrderItem.order_id == order_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Line item not found")

    await db.delete(item)
    await db.flush()
    await recalculate_order(order, db)
    return await order_out(order, db, include_items=True)


# ── Approval Actions ──────────────────────────────────────────────────

@router.post("/orders/{order_id}/submit")
async def submit_for_approval(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "draft":
        raise HTTPException(400, "Only draft orders can be submitted")

    order.status          = "pending"
    order.approval_status = "pending"
    return {"success": True, "status": "pending", "message": "Order submitted for approval"}


@router.post("/orders/{order_id}/approve")
async def approve_order(
    order_id: UUID,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in ("pending",):
        raise HTTPException(400, "Only pending orders can be approved")
    if current_user.role not in ("super_admin", "admin", "manager"):
        raise HTTPException(403, "You don't have permission to approve orders")

    order.status          = "approved"
    order.approval_status = "approved"
    return {
        "success": True,
        "status": "approved",
        "approved_by": current_user.name,
        "message": f"Order {order.order_number} approved",
    }


@router.post("/orders/{order_id}/reject")
async def reject_order(
    order_id: UUID,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in ("pending",):
        raise HTTPException(400, "Only pending orders can be rejected")
    if current_user.role not in ("super_admin", "admin", "manager"):
        raise HTTPException(403, "You don't have permission to reject orders")

    order.status          = "rejected"
    order.approval_status = "rejected"
    if reason:
        order.internal_notes = (order.internal_notes or "") + f"\n[REJECTION REASON] {reason}"

    return {"success": True, "status": "rejected", "message": f"Order {order.order_number} rejected"}


@router.post("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status in ("completed", "cancelled"):
        raise HTTPException(400, f"Cannot cancel a {order.status} order")

    order.status = "cancelled"
    return {"success": True, "status": "cancelled"}


# ── Payments ──────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/payments", status_code=201)
async def record_payment(
    order_id: UUID,
    payload: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    if payload.amount <= 0:
        raise HTTPException(422, "Payment amount must be positive")
    if payload.amount > float(order.balance_due):
        raise HTTPException(422, f"Payment {payload.amount} exceeds balance due {float(order.balance_due)}")

    payment = PaymentRecord(
        tenant_id=current_user.tenant_id,
        order_id=order_id,
        recorded_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(payment)

    # Update order
    order.paid_amount = Decimal(str(order.paid_amount)) + Decimal(str(payload.amount))
    order.balance_due = Decimal(str(order.total_amount)) - Decimal(str(order.paid_amount))

    if order.balance_due <= 0:
        order.payment_status = "paid"
    else:
        order.payment_status = "partial"

    await db.flush()
    return {
        "success": True,
        "payment_id": str(payment.id),
        "paid_amount": float(order.paid_amount),
        "balance_due": float(order.balance_due),
        "payment_status": order.payment_status,
    }


@router.get("/orders/{order_id}/payments")
async def list_payments(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PaymentRecord)
        .where(PaymentRecord.order_id == order_id, PaymentRecord.tenant_id == current_user.tenant_id)
        .order_by(PaymentRecord.created_at.desc())
    )
    payments = result.scalars().all()
    return {
        "items": [
            {
                "id": str(p.id),
                "amount": float(p.amount),
                "payment_date": p.payment_date,
                "method": p.method,
                "reference": p.reference,
                "notes": p.notes,
                "created_at": p.created_at.isoformat() if p.created_at else "",
            }
            for p in payments
        ],
        "total": len(payments),
    }


# ── PDF Generation ────────────────────────────────────────────────────

@router.get("/orders/{order_id}/pdf")
async def generate_order_pdf(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a PDF for the sales order / invoice.
    Uses WeasyPrint + Jinja2 template.
    Returns PDF bytes with correct content-type header.
    """
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    order_data = await order_out(order, db, include_items=True)

    try:
        from jinja2 import Environment, BaseLoader
        from weasyprint import HTML

        html_content = _render_invoice_html(order_data)
        pdf_bytes    = HTML(string=html_content).write_pdf()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{order.order_number}.pdf"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except ImportError:
        # WeasyPrint not installed — return HTML for preview
        html_content = _render_invoice_html(order_data)
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f'inline; filename="{order.order_number}.html"'},
        )


def _render_invoice_html(order: dict) -> str:
    """Render invoice HTML from order data."""
    items_rows = "".join([
        f"""<tr>
          <td>{i+1}</td>
          <td><strong>{item['product_name']}</strong>
            {'<br><small>' + item['description'] + '</small>' if item.get('description') else ''}</td>
          <td style="text-align:center">{item['quantity']} {item['unit']}</td>
          <td style="text-align:right">₹{item['unit_price']:,.2f}</td>
          <td style="text-align:center">{item['discount_pct']}%</td>
          <td style="text-align:center">{item['tax_pct']}%</td>
          <td style="text-align:right">₹{item['line_total']:,.2f}</td>
        </tr>"""
        for i, item in enumerate(order.get("items", []))
    ])

    return f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: white; padding: 40px; }}
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #4F46E5; padding-bottom: 24px; }}
  .company-name {{ font-size: 24px; font-weight: 700; color: #4F46E5; }}
  .invoice-label {{ font-size: 28px; font-weight: 700; color: #1a1a2e; }}
  .invoice-meta {{ font-size: 12px; color: #666; margin-top: 8px; }}
  .billing-section {{ display: flex; gap: 60px; margin-bottom: 32px; }}
  .billing-block h4 {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; }}
  .billing-block p {{ font-size: 13px; line-height: 1.6; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
  th {{ background: #4F46E5; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }}
  tr:nth-child(even) td {{ background: #fafafa; }}
  .totals-table {{ width: 280px; margin-left: auto; }}
  .totals-table td {{ font-size: 13px; }}
  .totals-table .grand-total td {{ font-size: 15px; font-weight: 700; color: #4F46E5; border-top: 2px solid #4F46E5; padding-top: 12px; }}
  .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }}
  .status-badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #ECFDF5; color: #059669; }}
</style>
</head><body>
<div class="header">
  <div>
    <div class="company-name">FlowERP</div>
    <div class="invoice-meta">Your Company Name · GST: 27AABCU9603R1ZX</div>
    <div class="invoice-meta">123 Industrial Area, Mumbai, Maharashtra 400001</div>
  </div>
  <div style="text-align:right">
    <div class="invoice-label">INVOICE</div>
    <div class="invoice-meta" style="font-size:16px;font-weight:600;margin-top:4px">{order['order_number']}</div>
    <div class="invoice-meta">Date: {order.get('order_date','—')}</div>
    {f'<div class="invoice-meta">Due: {order["delivery_date"]}</div>' if order.get('delivery_date') else ''}
    <span class="status-badge" style="margin-top:8px">{order['status'].upper()}</span>
  </div>
</div>

<div class="billing-section">
  <div class="billing-block">
    <h4>Bill To</h4>
    <p><strong>{order['customer_name']}</strong></p>
    {f'<p>{order["customer_address"]}</p>' if order.get('customer_address') else ''}
    {f'<p>GSTIN: {order["customer_gstin"]}</p>' if order.get('customer_gstin') else ''}
    {f'<p>Email: {order["customer_email"]}</p>' if order.get('customer_email') else ''}
    {f'<p>Phone: {order["customer_phone"]}</p>' if order.get('customer_phone') else ''}
  </div>
  {f'<div class="billing-block"><h4>Reference</h4><p>{order["reference_number"]}</p></div>' if order.get('reference_number') else ''}
</div>

<table>
  <thead>
    <tr>
      <th>#</th><th>Item / Description</th><th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th><th style="text-align:center">Disc%</th>
      <th style="text-align:center">GST%</th><th style="text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>{items_rows}</tbody>
</table>

<table class="totals-table">
  <tr><td>Subtotal</td><td style="text-align:right">₹{order['subtotal']:,.2f}</td></tr>
  {f'<tr><td>Discount</td><td style="text-align:right">- ₹{order["discount_amount"]:,.2f}</td></tr>' if order.get('discount_amount',0) > 0 else ''}
  <tr><td>GST</td><td style="text-align:right">₹{order['tax_amount']:,.2f}</td></tr>
  <tr class="grand-total">
    <td><strong>Total</strong></td>
    <td style="text-align:right"><strong>₹{order['total_amount']:,.2f}</strong></td>
  </tr>
  {f'<tr><td>Paid</td><td style="text-align:right;color:#059669">₹{order["paid_amount"]:,.2f}</td></tr>' if order.get('paid_amount',0) > 0 else ''}
  {f'<tr><td><strong>Balance Due</strong></td><td style="text-align:right;color:#DC2626"><strong>₹{order["balance_due"]:,.2f}</strong></td></tr>' if order.get('balance_due',0) > 0 else ''}
</table>

{f'<div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:12px"><strong>Terms &amp; Conditions:</strong><br>{order["terms"]}</div>' if order.get('terms') else ''}
{f'<div style="margin-top:12px;font-size:12px;color:#666"><strong>Notes:</strong> {order["notes"]}</div>' if order.get('notes') else ''}

<div class="footer">
  <p>Thank you for your business · Generated by FlowERP · {datetime.now().strftime('%d %B %Y')}</p>
</div>
</body></html>"""


# ════════════════════════════════════════════════════════════════════
# CUSTOMER ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@router.get("/customers")
async def list_customers(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(Customer).where(
        Customer.tenant_id == current_user.tenant_id,
        Customer.deleted_at.is_(None),
    )
    if search:
        t = f"%{search}%"
        q = q.where(or_(Customer.name.ilike(t), Customer.email.ilike(t)))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q = q.order_by(Customer.name.asc()).offset(pagination.offset).limit(pagination.limit)
    items = (await db.execute(q)).scalars().all()

    return {
        "items": [customer_out(c) for c in items],
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
    }


@router.post("/customers", status_code=201)
async def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    customer = Customer(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(customer)
    await db.flush()
    return customer_out(customer)


@router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: UUID,
    payload: CustomerCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == current_user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(404, "Customer not found")

    for k, v in payload.model_dump().items():
        setattr(customer, k, v)
    return customer_out(customer)


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == current_user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(404, "Customer not found")
    customer.deleted_at = datetime.now(timezone.utc)
    return {"success": True}
