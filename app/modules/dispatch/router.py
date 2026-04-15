"""
FlowERP — Dispatch & Delivery Module
======================================
Covers:
  - Delivery Challans (DC) linked to Sales Orders
  - Shipment tracking (courier, transport, own vehicle)
  - E-way bill number recording
  - Dispatch register (daily log)
  - Pending dispatch dashboard

Endpoints:
  GET/POST   /dispatch/challans
  GET/PUT    /dispatch/challans/{id}
  POST       /dispatch/challans/{id}/dispatch   — mark as dispatched
  POST       /dispatch/challans/{id}/deliver    — mark as delivered
  GET        /dispatch/pending                  — items awaiting dispatch
  GET        /dispatch/register                 — daily dispatch log
"""
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])


# ── Models ─────────────────────────────────────────────────────────────
class DeliveryChallan(Base):
    __tablename__ = "delivery_challans"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    challan_number  = sa.Column(sa.String(50), nullable=False)
    order_id        = sa.Column(PG_UUID(as_uuid=True), nullable=True)        # FK to sales_orders
    order_number    = sa.Column(sa.String(50), nullable=True)
    customer_name   = sa.Column(sa.String(300), nullable=False)
    customer_address= sa.Column(sa.Text, nullable=True)
    customer_gstin  = sa.Column(sa.String(20), nullable=True)

    # Dispatch details
    status          = sa.Column(sa.String(30), default="draft", nullable=False, index=True)
    # draft → ready → dispatched → delivered | returned
    dispatch_date   = sa.Column(sa.String(20), nullable=True)
    delivery_date   = sa.Column(sa.String(20), nullable=True)
    expected_delivery = sa.Column(sa.String(20), nullable=True)

    # Transport
    transport_mode  = sa.Column(sa.String(30), default="road", nullable=False)  # road|rail|air|sea|courier
    transporter     = sa.Column(sa.String(200), nullable=True)
    vehicle_number  = sa.Column(sa.String(30), nullable=True)
    lr_number       = sa.Column(sa.String(100), nullable=True)   # Lorry Receipt
    eway_bill       = sa.Column(sa.String(50), nullable=True)
    courier_tracking= sa.Column(sa.String(100), nullable=True)

    # Items (JSON array for flexibility)
    items           = sa.Column(JSON, default=list, nullable=False)
    total_quantity  = sa.Column(sa.Integer, default=0, nullable=False)
    total_weight_kg = sa.Column(sa.Numeric(10,2), nullable=True)
    no_of_boxes     = sa.Column(sa.Integer, default=1, nullable=False)

    notes           = sa.Column(sa.Text, nullable=True)
    prepared_by     = sa.Column(sa.String(200), nullable=True)
    deleted_at      = sa.Column(sa.DateTime(timezone=True), nullable=True)


# ── Schemas ─────────────────────────────────────────────────────────────
class DCCreate(BaseModel):
    customer_name:    str
    customer_address: Optional[str] = None
    customer_gstin:   Optional[str] = None
    order_number:     Optional[str] = None
    expected_delivery:Optional[str] = None
    transport_mode:   str = "road"
    transporter:      Optional[str] = None
    vehicle_number:   Optional[str] = None
    lr_number:        Optional[str] = None
    eway_bill:        Optional[str] = None
    items:            list = []
    total_quantity:   int = 0
    total_weight_kg:  Optional[float] = None
    no_of_boxes:      int = 1
    notes:            Optional[str] = None


class DCUpdate(BaseModel):
    status:           Optional[str] = None
    transport_mode:   Optional[str] = None
    transporter:      Optional[str] = None
    vehicle_number:   Optional[str] = None
    lr_number:        Optional[str] = None
    eway_bill:        Optional[str] = None
    courier_tracking: Optional[str] = None
    dispatch_date:    Optional[str] = None
    delivery_date:    Optional[str] = None
    notes:            Optional[str] = None
    no_of_boxes:      Optional[int] = None
    total_weight_kg:  Optional[float] = None


def dc_out(d: DeliveryChallan) -> dict:
    return {
        "id":               str(d.id),
        "challan_number":   d.challan_number,
        "order_number":     d.order_number,
        "customer_name":    d.customer_name,
        "customer_address": d.customer_address,
        "customer_gstin":   d.customer_gstin,
        "status":           d.status,
        "dispatch_date":    d.dispatch_date,
        "delivery_date":    d.delivery_date,
        "expected_delivery":d.expected_delivery,
        "transport_mode":   d.transport_mode,
        "transporter":      d.transporter,
        "vehicle_number":   d.vehicle_number,
        "lr_number":        d.lr_number,
        "eway_bill":        d.eway_bill,
        "courier_tracking": d.courier_tracking,
        "items":            d.items or [],
        "total_quantity":   d.total_quantity,
        "total_weight_kg":  float(d.total_weight_kg) if d.total_weight_kg else None,
        "no_of_boxes":      d.no_of_boxes,
        "notes":            d.notes,
        "prepared_by":      d.prepared_by,
        "created_at":       d.created_at.isoformat() if d.created_at else "",
    }


async def _next_challan_number(tenant_id, db: AsyncSession) -> str:
    count = (await db.execute(
        select(func.count(DeliveryChallan.id))
        .where(DeliveryChallan.tenant_id == tenant_id)
    )).scalar_one()
    return f"DC-{str(count + 1).zfill(4)}"


# ── Routes ──────────────────────────────────────────────────────────────
@router.get("/challans")
async def list_challans(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(DeliveryChallan).where(
        DeliveryChallan.tenant_id == current_user.tenant_id,
        DeliveryChallan.deleted_at.is_(None),
    )
    if status: q = q.where(DeliveryChallan.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(DeliveryChallan.challan_number.ilike(t), DeliveryChallan.customer_name.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(DeliveryChallan.created_at.desc()).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [dc_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size, "total_pages": math.ceil(total / pagination.page_size)}


@router.post("/challans", status_code=201)
async def create_challan(
    payload: DCCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    num = await _next_challan_number(current_user.tenant_id, db)
    dc = DeliveryChallan(
        tenant_id    = current_user.tenant_id,
        challan_number = num,
        prepared_by  = current_user.name,
        **payload.model_dump(),
    )
    db.add(dc); await db.flush()
    return dc_out(dc)


@router.get("/challans/{dc_id}")
async def get_challan(dc_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DeliveryChallan).where(DeliveryChallan.id == dc_id, DeliveryChallan.tenant_id == current_user.tenant_id))
    dc = r.scalar_one_or_none()
    if not dc: raise HTTPException(404, "Challan not found")
    return dc_out(dc)


@router.put("/challans/{dc_id}")
async def update_challan(dc_id: UUID, payload: DCUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DeliveryChallan).where(DeliveryChallan.id == dc_id, DeliveryChallan.tenant_id == current_user.tenant_id))
    dc = r.scalar_one_or_none()
    if not dc: raise HTTPException(404, "Challan not found")
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(dc, k, v)
    return dc_out(dc)


@router.post("/challans/{dc_id}/dispatch")
async def dispatch_challan(dc_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DeliveryChallan).where(DeliveryChallan.id == dc_id, DeliveryChallan.tenant_id == current_user.tenant_id))
    dc = r.scalar_one_or_none()
    if not dc: raise HTTPException(404)
    dc.status = "dispatched"
    dc.dispatch_date = datetime.now().strftime("%Y-%m-%d")
    return dc_out(dc)


@router.post("/challans/{dc_id}/deliver")
async def deliver_challan(dc_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DeliveryChallan).where(DeliveryChallan.id == dc_id, DeliveryChallan.tenant_id == current_user.tenant_id))
    dc = r.scalar_one_or_none()
    if not dc: raise HTTPException(404)
    dc.status = "delivered"
    dc.delivery_date = datetime.now().strftime("%Y-%m-%d")
    return dc_out(dc)


@router.get("/pending")
async def pending_dispatch(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    """Sales orders approved but not yet dispatched."""
    from sqlalchemy import text
    result = await db.execute(text(f"""
        SELECT id, order_number, customer_name, total_amount, order_date, delivery_date
        FROM sales_orders
        WHERE tenant_id = '{current_user.tenant_id}'
          AND status IN ('approved','completed')
          AND deleted_at IS NULL
        ORDER BY delivery_date ASC NULLS LAST
        LIMIT 50
    """))
    rows = result.fetchall()
    return {
        "items": [{"id": str(r[0]), "order_number": r[1], "customer_name": r[2], "total_amount": float(r[3] or 0), "order_date": r[4], "delivery_date": r[5]} for r in rows],
        "total": len(rows),
    }


@router.get("/register")
async def dispatch_register(
    date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily dispatch register — challans dispatched on a given date."""
    q = select(DeliveryChallan).where(
        DeliveryChallan.tenant_id == current_user.tenant_id,
        DeliveryChallan.status.in_(["dispatched", "delivered"]),
        DeliveryChallan.deleted_at.is_(None),
    )
    if date:
        q = q.where(DeliveryChallan.dispatch_date == date)
    items = (await db.execute(q.order_by(DeliveryChallan.dispatch_date.desc()).limit(100))).scalars().all()
    return {"items": [dc_out(i) for i in items], "total": len(items), "date": date}
