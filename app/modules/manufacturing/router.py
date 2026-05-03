"""
FlowERP — Manufacturing Module (Phase 14 deep)
================================================
Work orders with full lifecycle, BOM tracking, production scheduling
"""
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])


# ── Model ───────────────────────────────────────────────────────────────
class WorkOrder(Base):
    __tablename__ = "work_orders"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_number = sa.Column(sa.String(50), nullable=True, index=True)
    product_name = sa.Column(sa.String(300), nullable=False)
    product_id   = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    quantity     = sa.Column(sa.Numeric(12, 3), default=1, nullable=False)
    produced_qty = sa.Column(sa.Numeric(12, 3), default=0, nullable=False)
    unit         = sa.Column(sa.String(30), default="Pcs", nullable=False)
    status       = sa.Column(sa.String(30), default="planned", nullable=False, index=True)
    # planned | in_production | qc_pending | qc_passed | completed | cancelled
    priority     = sa.Column(sa.String(20), default="normal", nullable=False)
    planned_date = sa.Column(sa.String(20), nullable=True)
    start_date   = sa.Column(sa.String(20), nullable=True)
    end_date     = sa.Column(sa.String(20), nullable=True)
    assigned_to  = sa.Column(sa.String(200), nullable=True)
    machine_id   = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    machine_name = sa.Column(sa.String(200), nullable=True)
    notes        = sa.Column(sa.Text, nullable=True)
    bom_consumed = sa.Column(sa.Boolean, default=False, nullable=False)
    rejection_qty= sa.Column(sa.Numeric(12,3), default=0, nullable=False)
    deleted_at   = sa.Column(sa.DateTime(timezone=True), nullable=True)


# ── Schemas ─────────────────────────────────────────────────────────────
class WOCreate(BaseModel):
    product_name: str
    product_id:   Optional[UUID] = None
    quantity:     float = 1
    unit:         str = "Pcs"
    status:       str = "planned"
    priority:     str = "normal"
    planned_date: Optional[str] = None
    assigned_to:  Optional[str] = None
    machine_name: Optional[str] = None
    notes:        Optional[str] = None


class WOUpdate(BaseModel):
    product_name: Optional[str] = None
    quantity:     Optional[float] = None
    status:       Optional[str] = None
    priority:     Optional[str] = None
    planned_date: Optional[str] = None
    start_date:   Optional[str] = None
    end_date:     Optional[str] = None
    assigned_to:  Optional[str] = None
    machine_name: Optional[str] = None
    notes:        Optional[str] = None
    produced_qty: Optional[float] = None
    rejection_qty:Optional[float] = None


# ── Helper ──────────────────────────────────────────────────────────────
def wo_out(w: WorkOrder) -> dict:
    return {
        "id":           str(w.id),
        "order_number": w.order_number,
        "product_name": w.product_name,
        "product_id":   str(w.product_id) if w.product_id else None,
        "quantity":     float(w.quantity or 0),
        "produced_qty": float(w.produced_qty or 0),
        "rejection_qty":float(w.rejection_qty or 0),
        "unit":         w.unit,
        "status":       w.status,
        "priority":     w.priority,
        "planned_date": w.planned_date,
        "start_date":   w.start_date,
        "end_date":     w.end_date,
        "assigned_to":  w.assigned_to,
        "machine_name": w.machine_name,
        "notes":        w.notes,
        "bom_consumed": w.bom_consumed,
        "created_at":   w.created_at.isoformat() if w.created_at else "",
    }


async def _next_wo_number(tenant_id, db: AsyncSession) -> str:
    count = (await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.tenant_id == tenant_id)
    )).scalar_one()
    return f"WO-{str(count + 1).zfill(4)}"


# ── Routes ──────────────────────────────────────────────────────────────
@router.get("/orders")
async def list_orders(
    status:   Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(WorkOrder).where(WorkOrder.tenant_id == current_user.tenant_id, WorkOrder.deleted_at.is_(None))
    if status:   q = q.where(WorkOrder.status == status)
    if priority: q = q.where(WorkOrder.priority == priority)
    if search:
        t = f"%{search}%"
        q = q.where(or_(WorkOrder.product_name.ilike(t), WorkOrder.order_number.ilike(t), WorkOrder.assigned_to.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(WorkOrder.created_at.desc()).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {
        "items": [wo_out(i) for i in items],
        "total": total, "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1,
    }


@router.post("/orders", status_code=201)
async def create_order(
    payload: WOCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order_number = await _next_wo_number(current_user.tenant_id, db)
    w = WorkOrder(
        tenant_id=current_user.tenant_id,
        order_number=order_number,
        **payload.model_dump(),
    )
    db.add(w); await db.flush()
    return wo_out(w)


@router.get("/orders/{order_id}")
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id, WorkOrder.tenant_id == current_user.tenant_id))
    wo = r.scalar_one_or_none()
    if not wo: raise HTTPException(status_code=404, detail="Work order not found")
    return wo_out(wo)


@router.put("/orders/{order_id}")
async def update_order(
    order_id: UUID,
    payload: WOUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id, WorkOrder.tenant_id == current_user.tenant_id))
    wo = r.scalar_one_or_none()
    if not wo: raise HTTPException(404)
    data = payload.model_dump(exclude_unset=True)
    # Auto-set dates on status changes
    if "status" in data:
        if data["status"] == "in_production" and not wo.start_date:
            data["start_date"] = datetime.now().strftime("%Y-%m-%d")
        if data["status"] == "completed" and not wo.end_date:
            data["end_date"] = datetime.now().strftime("%Y-%m-%d")
    for k, v in data.items(): setattr(wo, k, v)
    return wo_out(wo)


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id, WorkOrder.tenant_id == current_user.tenant_id))
    wo = r.scalar_one_or_none()
    if not wo: raise HTTPException(404)
    wo.deleted_at = datetime.now(timezone.utc)
    return {"success": True}


@router.post("/orders/{order_id}/status")
async def change_status(
    order_id: UUID,
    new_status: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id, WorkOrder.tenant_id == current_user.tenant_id))
    wo = r.scalar_one_or_none()
    if not wo: raise HTTPException(404)
    valid = ["planned", "in_production", "qc_pending", "qc_passed", "completed", "cancelled"]
    if new_status not in valid:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid}")
    wo.status = new_status
    if new_status == "in_production" and not wo.start_date:
        wo.start_date = datetime.now().strftime("%Y-%m-%d")
    if new_status == "completed" and not wo.end_date:
        wo.end_date = datetime.now().strftime("%Y-%m-%d")
    return wo_out(wo)


@router.get("/dashboard")
async def manufacturing_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """KPIs for manufacturing overview."""
    tid = current_user.tenant_id
    counts = {}
    for status in ["planned", "in_production", "qc_pending", "qc_passed", "completed"]:
        n = (await db.execute(
            select(func.count(WorkOrder.id)).where(
                WorkOrder.tenant_id == tid,
                WorkOrder.status == status,
                WorkOrder.deleted_at.is_(None),
            )
        )).scalar_one()
        counts[status] = n

    # Today's planned work
    today = datetime.now().strftime("%Y-%m-%d")
    due_today = (await db.execute(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.tenant_id == tid,
            WorkOrder.planned_date == today,
            WorkOrder.status.in_(["planned", "in_production"]),
        )
    )).scalar_one()

    # Production efficiency (completed with no rejection)
    total_completed = counts["completed"]
    return {
        "by_status": counts,
        "due_today": due_today,
        "total_active": counts["planned"] + counts["in_production"] + counts["qc_pending"],
        "total_completed": total_completed,
    }
