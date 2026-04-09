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

router = APIRouter(prefix="/accounts", tags=["Accounts"])

class Invoice(Base):
    __tablename__ = "invoices"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_name   = sa.Column(sa.String(300), nullable=False)
    sales_order_id  = sa.Column(sa.String(50), nullable=True)
    amount          = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    paid            = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    due             = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    status          = sa.Column(sa.String(30), default="draft", nullable=False, index=True)
    issue_date      = sa.Column(sa.String(20), nullable=True)
    due_date        = sa.Column(sa.String(20), nullable=True)
    notes           = sa.Column(sa.Text, nullable=True)
    custom_data     = sa.Column(JSON, default=dict, nullable=False)
    deleted_at      = sa.Column(sa.DateTime(timezone=True), nullable=True)

class InvoiceCreate(BaseModel):
    customer_name: str; amount: float; status: str = "draft"
    sales_order_id: Optional[str]=None; issue_date: Optional[str]=None
    due_date: Optional[str]=None; notes: Optional[str]=None; custom_data: dict={}

class InvoiceUpdate(BaseModel):
    customer_name: Optional[str]=None; amount: Optional[float]=None
    paid: Optional[float]=None; due: Optional[float]=None; status: Optional[str]=None
    issue_date: Optional[str]=None; due_date: Optional[str]=None
    notes: Optional[str]=None; custom_data: Optional[dict]=None

def inv_out(i):
    return {"id":str(i.id),"customer_name":i.customer_name,"sales_order_id":i.sales_order_id,"amount":float(i.amount or 0),"paid":float(i.paid or 0),"due":float(i.due or 0),"status":i.status,"issue_date":i.issue_date,"due_date":i.due_date,"notes":i.notes,"custom_data":i.custom_data or {},"created_at":i.created_at.isoformat() if i.created_at else ""}

@router.get("/invoices")
async def list_invoices(status: Optional[str]=Query(None), search: Optional[str]=Query(None), current_user: User=Depends(get_current_active_user), pagination: PaginationParams=Depends(get_pagination), db: AsyncSession=Depends(get_db)):
    q=select(Invoice).where(Invoice.tenant_id==current_user.tenant_id, Invoice.deleted_at.is_(None))
    if status: q=q.where(Invoice.status==status)
    if search: t=f"%{search}%"; q=q.where(or_(Invoice.customer_name.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(Invoice.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[inv_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/invoices", status_code=201)
async def create_invoice(payload: InvoiceCreate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    data = payload.model_dump(); data["due"] = data["amount"]
    i=Invoice(tenant_id=current_user.tenant_id, **data); db.add(i); await db.flush(); return inv_out(i)

@router.put("/invoices/{iid}")
async def update_invoice(iid: UUID, payload: InvoiceUpdate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(Invoice).where(Invoice.id==iid, Invoice.tenant_id==current_user.tenant_id))
    i=result.scalar_one_or_none()
    if not i: raise HTTPException(404,"Invoice not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(i,k,v)
    return inv_out(i)

@router.delete("/invoices/{iid}")
async def delete_invoice(iid: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(Invoice).where(Invoice.id==iid, Invoice.tenant_id==current_user.tenant_id))
    i=result.scalar_one_or_none()
    if not i: raise HTTPException(404,"Invoice not found")
    from datetime import datetime,timezone; i.deleted_at=datetime.now(timezone.utc); return {"success":True}
