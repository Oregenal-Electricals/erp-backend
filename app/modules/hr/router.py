"""
FlowERP — HR Module (Deep)
============================
Employees, Attendance, Leaves, Documents, Performance
"""
import math
from datetime import datetime, timezone, date
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

router = APIRouter(prefix="/hr", tags=["HR"])


# ── Models ─────────────────────────────────────────────────────────────
class Employee(Base):
    __tablename__ = "hr_employees"
    tenant_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_code = sa.Column(sa.String(30), nullable=True)
    name          = sa.Column(sa.String(300), nullable=False)
    email         = sa.Column(sa.String(254), nullable=True)
    phone         = sa.Column(sa.String(30),  nullable=True)
    department    = sa.Column(sa.String(100), nullable=True, index=True)
    designation   = sa.Column(sa.String(200), nullable=True)
    joining_date  = sa.Column(sa.String(20),  nullable=True)
    date_of_birth = sa.Column(sa.String(20),  nullable=True)
    gender        = sa.Column(sa.String(20),  nullable=True)
    address       = sa.Column(sa.Text,        nullable=True)
    emergency_contact = sa.Column(sa.String(200), nullable=True)
    blood_group   = sa.Column(sa.String(10),  nullable=True)
    pan_number    = sa.Column(sa.String(20),  nullable=True)
    aadhaar       = sa.Column(sa.String(20),  nullable=True)
    bank_account  = sa.Column(sa.String(30),  nullable=True)
    bank_ifsc     = sa.Column(sa.String(15),  nullable=True)
    bank_name     = sa.Column(sa.String(100), nullable=True)
    basic_salary  = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    status        = sa.Column(sa.String(20),  default="active", nullable=False, index=True)
    reports_to    = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    custom_data   = sa.Column(JSON, default=dict, nullable=False)
    deleted_at    = sa.Column(sa.DateTime(timezone=True), nullable=True)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_name= sa.Column(sa.String(300), nullable=False)
    leave_type   = sa.Column(sa.String(50), nullable=False)  # casual|sick|earned|maternity|unpaid
    from_date    = sa.Column(sa.String(20), nullable=False)
    to_date      = sa.Column(sa.String(20), nullable=False)
    days         = sa.Column(sa.Integer, default=1, nullable=False)
    reason       = sa.Column(sa.Text, nullable=True)
    status       = sa.Column(sa.String(20), default="pending", nullable=False, index=True)
    approved_by  = sa.Column(sa.String(200), nullable=True)
    approved_at  = sa.Column(sa.DateTime(timezone=True), nullable=True)
    rejection_reason = sa.Column(sa.Text, nullable=True)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_name= sa.Column(sa.String(300), nullable=False)
    date         = sa.Column(sa.String(20), nullable=False, index=True)
    check_in     = sa.Column(sa.String(10), nullable=True)   # HH:MM
    check_out    = sa.Column(sa.String(10), nullable=True)
    status       = sa.Column(sa.String(20), default="present", nullable=False)
    # present|absent|half_day|late|on_leave|holiday
    hours_worked = sa.Column(sa.Numeric(4,2), nullable=True)
    notes        = sa.Column(sa.Text, nullable=True)


class PerformanceNote(Base):
    __tablename__ = "performance_notes"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("hr_employees.id", ondelete="CASCADE"), nullable=False, index=True)
    note_date    = sa.Column(sa.String(20), nullable=False)
    category     = sa.Column(sa.String(50), nullable=False)  # commendation|warning|review|goal
    title        = sa.Column(sa.String(300), nullable=False)
    description  = sa.Column(sa.Text, nullable=True)
    recorded_by  = sa.Column(sa.String(200), nullable=True)
    rating       = sa.Column(sa.Integer, nullable=True)  # 1-5


# ── Schemas ─────────────────────────────────────────────────────────────
class EmpCreate(BaseModel):
    name:          str
    employee_code: Optional[str] = None
    email:         Optional[str] = None
    phone:         Optional[str] = None
    department:    Optional[str] = None
    designation:   Optional[str] = None
    joining_date:  Optional[str] = None
    date_of_birth: Optional[str] = None
    gender:        Optional[str] = None
    address:       Optional[str] = None
    basic_salary:  float = 0
    bank_account:  Optional[str] = None
    bank_ifsc:     Optional[str] = None
    bank_name:     Optional[str] = None
    pan_number:    Optional[str] = None
    blood_group:   Optional[str] = None

class EmpUpdate(BaseModel):
    name:          Optional[str] = None
    email:         Optional[str] = None
    phone:         Optional[str] = None
    department:    Optional[str] = None
    designation:   Optional[str] = None
    status:        Optional[str] = None
    basic_salary:  Optional[float] = None
    address:       Optional[str] = None
    bank_account:  Optional[str] = None
    bank_ifsc:     Optional[str] = None
    bank_name:     Optional[str] = None

class LeaveCreate(BaseModel):
    employee_id:  UUID
    employee_name:str
    leave_type:   str
    from_date:    str
    to_date:      str
    days:         int = 1
    reason:       Optional[str] = None

class AttendanceCreate(BaseModel):
    employee_id:   UUID
    employee_name: str
    date:          str
    check_in:      Optional[str] = None
    check_out:     Optional[str] = None
    status:        str = "present"
    hours_worked:  Optional[float] = None
    notes:         Optional[str] = None

class BulkAttendance(BaseModel):
    date:    str
    records: list[dict]  # [{employee_id, employee_name, status, check_in, check_out}]

class PerfNoteCreate(BaseModel):
    note_date:   str
    category:    str
    title:       str
    description: Optional[str] = None
    rating:      Optional[int] = None


# ── Helpers ─────────────────────────────────────────────────────────────
def emp_out(e: Employee) -> dict:
    return {
        "id": str(e.id), "employee_code": e.employee_code, "name": e.name,
        "email": e.email, "phone": e.phone, "department": e.department,
        "designation": e.designation, "joining_date": e.joining_date,
        "date_of_birth": e.date_of_birth, "gender": e.gender,
        "address": e.address, "emergency_contact": e.emergency_contact,
        "blood_group": e.blood_group, "pan_number": e.pan_number,
        "bank_account": e.bank_account, "bank_ifsc": e.bank_ifsc, "bank_name": e.bank_name,
        "basic_salary": float(e.basic_salary or 0), "status": e.status,
        "reports_to": str(e.reports_to) if e.reports_to else None,
        "custom_data": e.custom_data or {},
        "created_at": e.created_at.isoformat() if e.created_at else "",
    }

def leave_out(l: LeaveRequest) -> dict:
    return {
        "id": str(l.id), "employee_id": str(l.employee_id),
        "employee_name": l.employee_name, "leave_type": l.leave_type,
        "from_date": l.from_date, "to_date": l.to_date, "days": l.days,
        "reason": l.reason, "status": l.status, "approved_by": l.approved_by,
        "rejection_reason": l.rejection_reason,
        "created_at": l.created_at.isoformat() if l.created_at else "",
    }

def att_out(a: AttendanceRecord) -> dict:
    return {
        "id": str(a.id), "employee_id": str(a.employee_id),
        "employee_name": a.employee_name, "date": a.date,
        "check_in": a.check_in, "check_out": a.check_out,
        "status": a.status, "hours_worked": float(a.hours_worked or 0),
        "notes": a.notes,
    }

def perf_out(p: PerformanceNote) -> dict:
    return {
        "id": str(p.id), "employee_id": str(p.employee_id),
        "note_date": p.note_date, "category": p.category,
        "title": p.title, "description": p.description,
        "recorded_by": p.recorded_by, "rating": p.rating,
        "created_at": p.created_at.isoformat() if p.created_at else "",
    }


# ── Employee routes ──────────────────────────────────────────────────────
@router.get("/employees")
async def list_employees(
    status:     Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(Employee).where(Employee.tenant_id == current_user.tenant_id, Employee.deleted_at.is_(None))
    if status:     q = q.where(Employee.status == status)
    if department: q = q.where(Employee.department == department)
    if search:
        t = f"%{search}%"
        q = q.where(or_(Employee.name.ilike(t), Employee.designation.ilike(t), Employee.email.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(Employee.name).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [emp_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size, "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1}


@router.post("/employees", status_code=201)
async def create_employee(payload: EmpCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    # Auto-generate employee code
    count = (await db.execute(select(func.count(Employee.id)).where(Employee.tenant_id == current_user.tenant_id))).scalar_one()
    code = payload.employee_code or f"EMP-{str(count + 1).zfill(4)}"
    e = Employee(tenant_id=current_user.tenant_id, employee_code=code, **{k: v for k, v in payload.model_dump().items() if k != "employee_code"})
    e.employee_code = code
    db.add(e); await db.flush(); return emp_out(e)


@router.get("/employees/{eid}")
async def get_employee(eid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Employee).where(Employee.id == eid, Employee.tenant_id == current_user.tenant_id))
    e = r.scalar_one_or_none()
    if not e: raise HTTPException(404)
    result = emp_out(e)
    # Leave balance
    approved_leaves = (await db.execute(
        select(func.sum(LeaveRequest.days)).where(
            LeaveRequest.employee_id == eid,
            LeaveRequest.status == "approved",
            LeaveRequest.from_date >= f"{date.today().year}-01-01",
        )
    )).scalar() or 0
    result["leaves_taken_ytd"] = int(approved_leaves)
    result["leave_balance"] = max(0, 24 - int(approved_leaves))  # 24 days annual
    # Attendance this month
    today = date.today()
    att_count = (await db.execute(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.employee_id == eid,
            AttendanceRecord.date >= f"{today.year}-{today.month:02d}-01",
            AttendanceRecord.status == "present",
        )
    )).scalar_one()
    result["present_days_this_month"] = att_count
    # Recent performance notes
    notes = (await db.execute(
        select(PerformanceNote).where(PerformanceNote.employee_id == eid).order_by(PerformanceNote.note_date.desc()).limit(5)
    )).scalars().all()
    result["performance_notes"] = [perf_out(n) for n in notes]
    return result


@router.put("/employees/{eid}")
async def update_employee(eid: UUID, payload: EmpUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Employee).where(Employee.id == eid, Employee.tenant_id == current_user.tenant_id))
    e = r.scalar_one_or_none()
    if not e: raise HTTPException(404)
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(e, k, v)
    return emp_out(e)


@router.delete("/employees/{eid}")
async def delete_employee(eid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Employee).where(Employee.id == eid, Employee.tenant_id == current_user.tenant_id))
    e = r.scalar_one_or_none()
    if not e: raise HTTPException(404)
    e.deleted_at = datetime.now(timezone.utc); return {"success": True}


@router.get("/departments")
async def get_departments(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Employee.department, func.count(Employee.id).label("count"))
        .where(Employee.tenant_id == current_user.tenant_id, Employee.deleted_at.is_(None), Employee.status == "active")
        .group_by(Employee.department).order_by(Employee.department)
    )
    return {"departments": [{"name": r[0] or "Unassigned", "count": r[1]} for r in result.fetchall()]}


# ── Leave routes ─────────────────────────────────────────────────────────
@router.get("/leaves")
async def list_leaves(
    status:      Optional[str] = Query(None),
    employee_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(LeaveRequest).where(LeaveRequest.tenant_id == current_user.tenant_id)
    if status:      q = q.where(LeaveRequest.status == status)
    if employee_id: q = q.where(LeaveRequest.employee_id == employee_id)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(LeaveRequest.created_at.desc()).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [leave_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size}


@router.post("/leaves", status_code=201)
async def apply_leave(payload: LeaveCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    l = LeaveRequest(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(l); await db.flush(); return leave_out(l)


@router.post("/leaves/{lid}/approve")
async def approve_leave(lid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(LeaveRequest).where(LeaveRequest.id == lid, LeaveRequest.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    l.status = "approved"; l.approved_by = current_user.name; l.approved_at = datetime.now(timezone.utc)
    return leave_out(l)


@router.post("/leaves/{lid}/reject")
async def reject_leave(lid: UUID, reason: Optional[str] = None, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(LeaveRequest).where(LeaveRequest.id == lid, LeaveRequest.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    l.status = "rejected"; l.rejection_reason = reason; l.approved_by = current_user.name
    return leave_out(l)


# ── Attendance routes ────────────────────────────────────────────────────
@router.get("/attendance")
async def get_attendance(
    date_str:    Optional[str] = Query(None, alias="date"),
    employee_id: Optional[UUID] = Query(None),
    month:       Optional[int]  = Query(None),
    year:        Optional[int]  = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(AttendanceRecord).where(AttendanceRecord.tenant_id == current_user.tenant_id)
    if date_str:    q = q.where(AttendanceRecord.date == date_str)
    if employee_id: q = q.where(AttendanceRecord.employee_id == employee_id)
    if month and year:
        import calendar
        last = calendar.monthrange(year, month)[1]
        q = q.where(AttendanceRecord.date >= f"{year}-{month:02d}-01", AttendanceRecord.date <= f"{year}-{month:02d}-{last}")
    items = (await db.execute(q.order_by(AttendanceRecord.date.desc()).limit(500))).scalars().all()
    return {"items": [att_out(i) for i in items], "total": len(items)}


@router.post("/attendance", status_code=201)
async def mark_attendance(payload: AttendanceCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    # Upsert — if record exists for this employee+date, update it
    existing = await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.employee_id == payload.employee_id,
        AttendanceRecord.date == payload.date,
        AttendanceRecord.tenant_id == current_user.tenant_id,
    ))
    a = existing.scalar_one_or_none()
    if a:
        for k, v in payload.model_dump(exclude_unset=True).items(): setattr(a, k, v)
    else:
        a = AttendanceRecord(tenant_id=current_user.tenant_id, **payload.model_dump())
        db.add(a)
    await db.flush(); return att_out(a)


@router.post("/attendance/bulk")
async def bulk_attendance(payload: BulkAttendance, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    results = []
    for rec in payload.records:
        a = AttendanceRecord(
            tenant_id=current_user.tenant_id,
            date=payload.date,
            employee_id=rec["employee_id"],
            employee_name=rec.get("employee_name", ""),
            status=rec.get("status", "present"),
            check_in=rec.get("check_in"),
            check_out=rec.get("check_out"),
        )
        db.add(a)
        results.append(rec.get("employee_name"))
    await db.flush()
    return {"success": True, "recorded": len(results)}


# ── Performance notes ────────────────────────────────────────────────────
@router.post("/employees/{eid}/performance", status_code=201)
async def add_performance_note(eid: UUID, payload: PerfNoteCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    n = PerformanceNote(tenant_id=current_user.tenant_id, employee_id=eid, recorded_by=current_user.name, **payload.model_dump())
    db.add(n); await db.flush(); return perf_out(n)


# ── HR Dashboard ─────────────────────────────────────────────────────────
@router.get("/dashboard")
async def hr_dashboard(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    today = date.today().isoformat()
    total = (await db.execute(select(func.count(Employee.id)).where(Employee.tenant_id == current_user.tenant_id, Employee.status == "active", Employee.deleted_at.is_(None)))).scalar_one()
    pending_leaves = (await db.execute(select(func.count(LeaveRequest.id)).where(LeaveRequest.tenant_id == current_user.tenant_id, LeaveRequest.status == "pending"))).scalar_one()
    on_leave_today = (await db.execute(select(func.count(LeaveRequest.id)).where(LeaveRequest.tenant_id == current_user.tenant_id, LeaveRequest.status == "approved", LeaveRequest.from_date <= today, LeaveRequest.to_date >= today))).scalar_one()
    dept_result = await db.execute(select(Employee.department, func.count(Employee.id)).where(Employee.tenant_id == current_user.tenant_id, Employee.status == "active", Employee.deleted_at.is_(None)).group_by(Employee.department))
    by_dept = [{"department": r[0] or "Other", "count": r[1]} for r in dept_result.fetchall()]
    return {"total_employees": total, "pending_leaves": pending_leaves, "on_leave_today": on_leave_today, "by_department": by_dept}
