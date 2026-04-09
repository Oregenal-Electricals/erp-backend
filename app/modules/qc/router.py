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

router = APIRouter(prefix="/qc", tags=["Quality Control"])

class QCInspection(Base):
    __tablename__ = "qc_inspections"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    work_order_id   = sa.Column(sa.String(50), nullable=True)
    product_name    = sa.Column(sa.String(300), nullable=False)
    batch_size      = sa.Column(sa.Integer, default=0, nullable=False)
    passed          = sa.Column(sa.Integer, default=0, nullable=False)
    failed          = sa.Column(sa.Integer, default=0, nullable=False)
    status          = sa.Column(sa.String(20), default="pending", nullable=False, index=True)
    inspector       = sa.Column(sa.String(200), nullable=True)
    inspection_date = sa.Column(sa.String(20), nullable=True)
    notes           = sa.Column(sa.Text, nullable=True)
    custom_data     = sa.Column(JSON, default=dict, nullable=False)
    deleted_at      = sa.Column(sa.DateTime(timezone=True), nullable=True)

class QCCreate(BaseModel):
    work_order_id: Optional[str] = None
    product_name: str
    batch_size: int = 0
    passed: int = 0
    failed: int = 0
    status: str = "pending"
    inspector: Optional[str] = None
    inspection_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: dict = {}

class QCUpdate(BaseModel):
    work_order_id: Optional[str] = None
    product_name: Optional[str] = None
    batch_size: Optional[int] = None
    passed: Optional[int] = None
    failed: Optional[int] = None
    status: Optional[str] = None
    inspector: Optional[str] = None
    inspection_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: Optional[dict] = None

def qc_out(i):
    return {"id": str(i.id), "work_order_id": i.work_order_id, "product_name": i.product_name, "batch_size": i.batch_size, "passed": i.passed, "failed": i.failed, "status": i.status, "inspector": i.inspector, "inspection_date": i.inspection_date, "notes": i.notes, "custom_data": i.custom_data or {}, "created_at": i.created_at.isoformat() if i.created_at else ""}

@router.get("/inspections")
async def list_inspections(status: Optional[str]=Query(None), search: Optional[str]=Query(None), current_user: User=Depends(get_current_active_user), pagination: PaginationParams=Depends(get_pagination), db: AsyncSession=Depends(get_db)):
    q = select(QCInspection).where(QCInspection.tenant_id==current_user.tenant_id, QCInspection.deleted_at.is_(None))
    if status: q=q.where(QCInspection.status==status)
    if search: t=f"%{search}%"; q=q.where(or_(QCInspection.product_name.ilike(t), QCInspection.work_order_id.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(QCInspection.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[qc_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/inspections", status_code=201)
async def create_inspection(payload: QCCreate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    i = QCInspection(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(i); await db.flush(); return qc_out(i)

@router.put("/inspections/{iid}")
async def update_inspection(iid: UUID, payload: QCUpdate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(QCInspection).where(QCInspection.id==iid, QCInspection.tenant_id==current_user.tenant_id))
    i=result.scalar_one_or_none()
    if not i: raise HTTPException(404, "Inspection not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(i,k,v)
    return qc_out(i)

@router.delete("/inspections/{iid}")
async def delete_inspection(iid: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(QCInspection).where(QCInspection.id==iid, QCInspection.tenant_id==current_user.tenant_id))
    i=result.scalar_one_or_none()
    if not i: raise HTTPException(404, "Inspection not found")
    from datetime import datetime, timezone
    i.deleted_at = datetime.now(timezone.utc)
    return {"success": True}
