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


# ── QC Defect Tracking ────────────────────────────────────────────────
class QCDefect(Base):
    __tablename__ = "qc_defects"
    tenant_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("qc_inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    category       = sa.Column(sa.String(100), nullable=False)   # visual, dimensional, functional, packaging
    description    = sa.Column(sa.Text, nullable=False)
    severity       = sa.Column(sa.String(20), default="minor", nullable=False)  # minor|major|critical
    quantity       = sa.Column(sa.Integer, default=1, nullable=False)
    disposition    = sa.Column(sa.String(30), default="rework", nullable=False)  # rework|scrap|accept
    image_url      = sa.Column(sa.String(500), nullable=True)


class DefectCreate(BaseModel):
    category:    str
    description: str
    severity:    str = "minor"
    quantity:    int = 1
    disposition: str = "rework"


def defect_out(d: QCDefect) -> dict:
    return {"id": str(d.id), "category": d.category, "description": d.description,
            "severity": d.severity, "quantity": d.quantity, "disposition": d.disposition,
            "created_at": d.created_at.isoformat() if d.created_at else ""}


@router.get("/inspections/{iid}")
async def get_inspection(iid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select as sel
    r = await db.execute(sel(QCInspection).where(QCInspection.id == iid, QCInspection.tenant_id == current_user.tenant_id))
    insp = r.scalar_one_or_none()
    if not insp: raise HTTPException(404)
    defects_r = await db.execute(sel(QCDefect).where(QCDefect.inspection_id == iid))
    defects = defects_r.scalars().all()
    result = qc_out(insp)
    result["defects"] = [defect_out(d) for d in defects]
    return result


@router.post("/inspections/{iid}/defects", status_code=201)
async def add_defect(iid: UUID, payload: DefectCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    d = QCDefect(tenant_id=current_user.tenant_id, inspection_id=iid, **payload.model_dump())
    db.add(d); await db.flush(); return defect_out(d)


@router.post("/inspections/{iid}/pass")
async def pass_inspection(iid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select as sel
    r = await db.execute(sel(QCInspection).where(QCInspection.id == iid, QCInspection.tenant_id == current_user.tenant_id))
    insp = r.scalar_one_or_none()
    if not insp: raise HTTPException(404)
    insp.status = "passed"; insp.result = "pass"
    return qc_out(insp)


@router.post("/inspections/{iid}/fail")
async def fail_inspection(iid: UUID, remarks: Optional[str] = None, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select as sel
    r = await db.execute(sel(QCInspection).where(QCInspection.id == iid, QCInspection.tenant_id == current_user.tenant_id))
    insp = r.scalar_one_or_none()
    if not insp: raise HTTPException(404)
    insp.status = "failed"; insp.result = "fail"
    if remarks: insp.remarks = remarks
    return qc_out(insp)


@router.get("/stats")
async def qc_stats(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, select as sel
    total  = (await db.execute(sel(func.count(QCInspection.id)).where(QCInspection.tenant_id == current_user.tenant_id))).scalar_one()
    passed = (await db.execute(sel(func.count(QCInspection.id)).where(QCInspection.tenant_id == current_user.tenant_id, QCInspection.result == "pass"))).scalar_one()
    failed = (await db.execute(sel(func.count(QCInspection.id)).where(QCInspection.tenant_id == current_user.tenant_id, QCInspection.result == "fail"))).scalar_one()
    pending = (await db.execute(sel(func.count(QCInspection.id)).where(QCInspection.tenant_id == current_user.tenant_id, QCInspection.status == "pending"))).scalar_one()
    rate   = round(passed / total * 100, 1) if total > 0 else 0
    return {"total": total, "passed": passed, "failed": failed, "pending": pending, "pass_rate": rate}
