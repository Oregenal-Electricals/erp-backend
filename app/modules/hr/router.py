import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel, EmailStr
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/hr", tags=["HR"])

class Employee(Base):
    __tablename__ = "hr_employees"
    tenant_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = sa.Column(sa.String(200), nullable=False)
    email       = sa.Column(sa.String(254), nullable=False)
    phone       = sa.Column(sa.String(30), nullable=True)
    department  = sa.Column(sa.String(100), nullable=True)
    designation = sa.Column(sa.String(200), nullable=True)
    role        = sa.Column(sa.String(50), default="staff", nullable=False)
    join_date   = sa.Column(sa.String(20), nullable=True)
    status      = sa.Column(sa.String(30), default="active", nullable=False, index=True)
    notes       = sa.Column(sa.Text, nullable=True)
    custom_data = sa.Column(JSON, default=dict, nullable=False)
    deleted_at  = sa.Column(sa.DateTime(timezone=True), nullable=True)

class EmpCreate(BaseModel):
    name: str; email: str; phone: Optional[str]=None
    department: Optional[str]=None; designation: Optional[str]=None
    role: str="staff"; join_date: Optional[str]=None
    status: str="active"; notes: Optional[str]=None; custom_data: dict={}

class EmpUpdate(BaseModel):
    name: Optional[str]=None; email: Optional[str]=None; phone: Optional[str]=None
    department: Optional[str]=None; designation: Optional[str]=None
    role: Optional[str]=None; join_date: Optional[str]=None
    status: Optional[str]=None; notes: Optional[str]=None; custom_data: Optional[dict]=None

def emp_out(e):
    return {"id":str(e.id),"name":e.name,"email":e.email,"phone":e.phone,"department":e.department,"designation":e.designation,"role":e.role,"join_date":e.join_date,"status":e.status,"notes":e.notes,"custom_data":e.custom_data or {},"created_at":e.created_at.isoformat() if e.created_at else ""}

@router.get("/employees")
async def list_employees(status: Optional[str]=Query(None), search: Optional[str]=Query(None), current_user: User=Depends(get_current_active_user), pagination: PaginationParams=Depends(get_pagination), db: AsyncSession=Depends(get_db)):
    q=select(Employee).where(Employee.tenant_id==current_user.tenant_id, Employee.deleted_at.is_(None))
    if status: q=q.where(Employee.status==status)
    if search: t=f"%{search}%"; q=q.where(or_(Employee.name.ilike(t), Employee.email.ilike(t), Employee.department.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(Employee.name.asc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[emp_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/employees", status_code=201)
async def create_employee(payload: EmpCreate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    e=Employee(tenant_id=current_user.tenant_id, **payload.model_dump()); db.add(e); await db.flush(); return emp_out(e)

@router.put("/employees/{eid}")
async def update_employee(eid: UUID, payload: EmpUpdate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(Employee).where(Employee.id==eid, Employee.tenant_id==current_user.tenant_id))
    e=result.scalar_one_or_none()
    if not e: raise HTTPException(404,"Employee not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(e,k,v)
    return emp_out(e)

@router.delete("/employees/{eid}")
async def delete_employee(eid: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(Employee).where(Employee.id==eid, Employee.tenant_id==current_user.tenant_id))
    e=result.scalar_one_or_none()
    if not e: raise HTTPException(404,"Employee not found")
    from datetime import datetime,timezone; e.deleted_at=datetime.now(timezone.utc); return {"success":True}
