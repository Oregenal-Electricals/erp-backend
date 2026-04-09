import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/purchase", tags=["Purchase"])

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    tenant_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_name    = sa.Column(sa.String(300), nullable=False)
    order_number   = sa.Column(sa.String(50), nullable=True)
    status         = sa.Column(sa.String(50), default="draft", nullable=False, index=True)
    payment_status = sa.Column(sa.String(50), default="pending", nullable=False)
    total_amount   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    items_count    = sa.Column(sa.Integer, default=0, nullable=False)
    order_date     = sa.Column(sa.String(20), nullable=True)
    expected_date  = sa.Column(sa.String(20), nullable=True)
    notes          = sa.Column(sa.Text, nullable=True)
    custom_data    = sa.Column(JSON, default=dict, nullable=False)
    deleted_at     = sa.Column(sa.DateTime(timezone=True), nullable=True)

class POCreate(BaseModel):
    vendor_name: str
    status: str = "draft"
    order_date: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: dict = {}

class POUpdate(BaseModel):
    vendor_name: Optional[str] = None
    status: Optional[str] = None
    order_date: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: Optional[dict] = None

def po_out(o):
    return {"id": str(o.id), "vendor_name": o.vendor_name, "order_number": o.order_number, "status": o.status, "payment_status": o.payment_status, "total_amount": float(o.total_amount or 0), "items_count": o.items_count, "order_date": o.order_date, "expected_date": o.expected_date, "notes": o.notes, "custom_data": o.custom_data or {}, "created_at": o.created_at.isoformat() if o.created_at else ""}

@router.get("/orders")
async def list_orders(status: Optional[str]=Query(None), search: Optional[str]=Query(None), current_user: User=Depends(get_current_active_user), pagination: PaginationParams=Depends(get_pagination), db: AsyncSession=Depends(get_db)):
    q = select(PurchaseOrder).where(PurchaseOrder.tenant_id==current_user.tenant_id, PurchaseOrder.deleted_at.is_(None))
    if status: q=q.where(PurchaseOrder.status==status)
    if search:
        t=f"%{search}%"; q=q.where(or_(PurchaseOrder.vendor_name.ilike(t), PurchaseOrder.order_number.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(PurchaseOrder.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[po_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/orders", status_code=201)
async def create_order(payload: POCreate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    import shortuuid
    o = PurchaseOrder(tenant_id=current_user.tenant_id, order_number=f"PO-{shortuuid.ShortUUID().random(length=6).upper()}", **payload.model_dump())
    db.add(o); await db.flush(); return po_out(o)

@router.put("/orders/{order_id}")
async def update_order(order_id: UUID, payload: POUpdate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(PurchaseOrder).where(PurchaseOrder.id==order_id, PurchaseOrder.tenant_id==current_user.tenant_id))
    o=result.scalar_one_or_none()
    if not o: raise HTTPException(404,"Order not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(o,k,v)
    return po_out(o)

@router.delete("/orders/{order_id}")
async def delete_order(order_id: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(PurchaseOrder).where(PurchaseOrder.id==order_id, PurchaseOrder.tenant_id==current_user.tenant_id))
    o=result.scalar_one_or_none()
    if not o: raise HTTPException(404,"Order not found")
    from datetime import datetime,timezone; o.deleted_at=datetime.now(timezone.utc)
    return {"success":True}
