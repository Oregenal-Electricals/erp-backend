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

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])

class WorkOrder(Base):
    __tablename__ = "work_orders"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = sa.Column(sa.String(300), nullable=False)
    quantity     = sa.Column(sa.Integer, default=1, nullable=False)
    unit         = sa.Column(sa.String(30), default="Pcs", nullable=False)
    status       = sa.Column(sa.String(50), default="planned", nullable=False, index=True)
    priority     = sa.Column(sa.String(20), default="normal", nullable=False)
    planned_date = sa.Column(sa.String(20), nullable=True)
    assigned_to  = sa.Column(sa.String(200), nullable=True)
    notes        = sa.Column(sa.Text, nullable=True)
    custom_data  = sa.Column(JSON, default=dict, nullable=False)
    deleted_at   = sa.Column(sa.DateTime(timezone=True), nullable=True)

class WOCreate(BaseModel):
    product_name: str
    quantity: int = 1
    unit: str = "Pcs"
    status: str = "planned"
    priority: str = "normal"
    planned_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: dict = {}

class WOUpdate(BaseModel):
    product_name: Optional[str]=None; quantity: Optional[int]=None
    unit: Optional[str]=None; status: Optional[str]=None
    priority: Optional[str]=None; planned_date: Optional[str]=None
    notes: Optional[str]=None; custom_data: Optional[dict]=None

def wo_out(w):
    return {"id":str(w.id),"product_name":w.product_name,"quantity":w.quantity,"unit":w.unit,"status":w.status,"priority":w.priority,"planned_date":w.planned_date,"assigned_to":w.assigned_to,"notes":w.notes,"custom_data":w.custom_data or {},"created_at":w.created_at.isoformat() if w.created_at else ""}

@router.get("/orders")
async def list_orders(status:Optional[str]=Query(None),search:Optional[str]=Query(None),current_user:User=Depends(get_current_active_user),pagination:PaginationParams=Depends(get_pagination),db:AsyncSession=Depends(get_db)):
    q=select(WorkOrder).where(WorkOrder.tenant_id==current_user.tenant_id,WorkOrder.deleted_at.is_(None))
    if status: q=q.where(WorkOrder.status==status)
    if search: t=f"%{search}%";q=q.where(or_(WorkOrder.product_name.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(WorkOrder.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[wo_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/orders",status_code=201)
async def create_order(payload:WOCreate,current_user:User=Depends(get_current_active_user),db:AsyncSession=Depends(get_db)):
    w=WorkOrder(tenant_id=current_user.tenant_id,**payload.model_dump()); db.add(w); await db.flush(); return wo_out(w)

@router.put("/orders/{order_id}")
async def update_order(order_id:UUID,payload:WOUpdate,current_user:User=Depends(get_current_active_user),db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(WorkOrder).where(WorkOrder.id==order_id,WorkOrder.tenant_id==current_user.tenant_id))
    w=result.scalar_one_or_none()
    if not w: raise HTTPException(404,"Work order not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(w,k,v)
    return wo_out(w)

@router.delete("/orders/{order_id}")
async def delete_order(order_id:UUID,current_user:User=Depends(get_current_active_user),db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(WorkOrder).where(WorkOrder.id==order_id,WorkOrder.tenant_id==current_user.tenant_id))
    w=result.scalar_one_or_none()
    if not w: raise HTTPException(404,"Work order not found")
    from datetime import datetime,timezone; w.deleted_at=datetime.now(timezone.utc); return {"success":True}

@router.post("/orders/{order_id}/status")
async def change_status(order_id:UUID,new_status:str,current_user:User=Depends(get_current_active_user),db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(WorkOrder).where(WorkOrder.id==order_id,WorkOrder.tenant_id==current_user.tenant_id))
    w=result.scalar_one_or_none()
    if not w: raise HTTPException(404,"Work order not found")
    old=w.status; w.status=new_status; return {"success":True,"old_status":old,"new_status":new_status}
