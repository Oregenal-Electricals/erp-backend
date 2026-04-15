"""
FlowERP — Maintenance Module
==============================
Equipment/Machine Register, Preventive Maintenance, Breakdown Log.

Endpoints:
  GET/POST   /maintenance/machines
  GET/PUT    /maintenance/machines/{id}
  GET/POST   /maintenance/schedules          — PM schedules
  GET/POST   /maintenance/breakdowns         — breakdown incidents
  POST       /maintenance/breakdowns/{id}/resolve
  GET        /maintenance/due-today          — tasks due today/overdue
  GET        /maintenance/history/{machine_id}
"""
import math
from datetime import datetime, timezone, timedelta
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

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


# ── Models ─────────────────────────────────────────────────────────────
class Machine(Base):
    __tablename__ = "machines"
    tenant_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_code   = sa.Column(sa.String(50),  nullable=False)
    name           = sa.Column(sa.String(300), nullable=False)
    category       = sa.Column(sa.String(100), nullable=True)   # SMT, Wave Solder, Injection, etc.
    manufacturer   = sa.Column(sa.String(200), nullable=True)
    model_number   = sa.Column(sa.String(100), nullable=True)
    serial_number  = sa.Column(sa.String(100), nullable=True)
    location       = sa.Column(sa.String(200), nullable=True)   # Shop floor, line
    purchase_date  = sa.Column(sa.String(20),  nullable=True)
    warranty_until = sa.Column(sa.String(20),  nullable=True)
    status         = sa.Column(sa.String(30),  default="active", nullable=False, index=True)
    # active | under_maintenance | breakdown | retired
    last_service_date = sa.Column(sa.String(20), nullable=True)
    next_service_date = sa.Column(sa.String(20), nullable=True)
    notes          = sa.Column(sa.Text,        nullable=True)
    deleted_at     = sa.Column(sa.DateTime(timezone=True), nullable=True)


class PMSchedule(Base):
    """Preventive Maintenance schedule."""
    __tablename__ = "pm_schedules"
    tenant_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_name  = sa.Column(sa.String(300), nullable=False)
    task_name     = sa.Column(sa.String(300), nullable=False)
    frequency     = sa.Column(sa.String(30),  nullable=False)  # daily|weekly|monthly|quarterly|annual
    last_done     = sa.Column(sa.String(20),  nullable=True)
    next_due      = sa.Column(sa.String(20),  nullable=True)
    assigned_to   = sa.Column(sa.String(200), nullable=True)
    estimated_hrs = sa.Column(sa.Numeric(5,1), default=1, nullable=False)
    instructions  = sa.Column(sa.Text,        nullable=True)
    status        = sa.Column(sa.String(20),  default="active", nullable=False)
    deleted_at    = sa.Column(sa.DateTime(timezone=True), nullable=True)


class BreakdownLog(Base):
    """Unplanned breakdown / repair log."""
    __tablename__ = "breakdown_logs"
    tenant_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_name  = sa.Column(sa.String(300), nullable=False)
    breakdown_date= sa.Column(sa.String(20),  nullable=False)
    breakdown_time= sa.Column(sa.String(10),  nullable=True)
    reported_by   = sa.Column(sa.String(200), nullable=True)
    description   = sa.Column(sa.Text,        nullable=False)
    cause         = sa.Column(sa.Text,        nullable=True)
    action_taken  = sa.Column(sa.Text,        nullable=True)
    status        = sa.Column(sa.String(20),  default="open", nullable=False, index=True)
    # open | in_progress | resolved
    resolved_by   = sa.Column(sa.String(200), nullable=True)
    resolved_date = sa.Column(sa.String(20),  nullable=True)
    downtime_hrs  = sa.Column(sa.Numeric(6,2), nullable=True)
    repair_cost   = sa.Column(sa.Numeric(12,2), nullable=True)
    spare_parts   = sa.Column(JSON, default=list, nullable=False)


# ── Schemas ─────────────────────────────────────────────────────────────
class MachineCreate(BaseModel):
    name:           str
    machine_code:   str
    category:       Optional[str] = None
    manufacturer:   Optional[str] = None
    model_number:   Optional[str] = None
    serial_number:  Optional[str] = None
    location:       Optional[str] = None
    purchase_date:  Optional[str] = None
    warranty_until: Optional[str] = None
    next_service_date: Optional[str] = None
    notes:          Optional[str] = None

class MachineUpdate(BaseModel):
    name:           Optional[str] = None
    status:         Optional[str] = None
    location:       Optional[str] = None
    next_service_date: Optional[str] = None
    last_service_date: Optional[str] = None
    notes:          Optional[str] = None

class PMCreate(BaseModel):
    machine_id:     UUID
    machine_name:   str
    task_name:      str
    frequency:      str
    next_due:       Optional[str] = None
    assigned_to:    Optional[str] = None
    estimated_hrs:  float = 1.0
    instructions:   Optional[str] = None

class BreakdownCreate(BaseModel):
    machine_id:     UUID
    machine_name:   str
    breakdown_date: str
    breakdown_time: Optional[str] = None
    description:    str
    reported_by:    Optional[str] = None

class BreakdownResolve(BaseModel):
    action_taken:   str
    cause:          Optional[str] = None
    resolved_by:    Optional[str] = None
    downtime_hrs:   Optional[float] = None
    repair_cost:    Optional[float] = None
    spare_parts:    list = []


# ── Helpers ─────────────────────────────────────────────────────────────
def machine_out(m: Machine) -> dict:
    return {"id": str(m.id), "machine_code": m.machine_code, "name": m.name, "category": m.category,
            "manufacturer": m.manufacturer, "model_number": m.model_number, "serial_number": m.serial_number,
            "location": m.location, "status": m.status, "purchase_date": m.purchase_date,
            "warranty_until": m.warranty_until, "last_service_date": m.last_service_date,
            "next_service_date": m.next_service_date, "notes": m.notes,
            "created_at": m.created_at.isoformat() if m.created_at else ""}

def pm_out(p: PMSchedule) -> dict:
    return {"id": str(p.id), "machine_id": str(p.machine_id), "machine_name": p.machine_name,
            "task_name": p.task_name, "frequency": p.frequency, "last_done": p.last_done,
            "next_due": p.next_due, "assigned_to": p.assigned_to, "estimated_hrs": float(p.estimated_hrs),
            "instructions": p.instructions, "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else ""}

def bd_out(b: BreakdownLog) -> dict:
    return {"id": str(b.id), "machine_id": str(b.machine_id), "machine_name": b.machine_name,
            "breakdown_date": b.breakdown_date, "breakdown_time": b.breakdown_time,
            "reported_by": b.reported_by, "description": b.description, "cause": b.cause,
            "action_taken": b.action_taken, "status": b.status, "resolved_by": b.resolved_by,
            "resolved_date": b.resolved_date, "downtime_hrs": float(b.downtime_hrs) if b.downtime_hrs else None,
            "repair_cost": float(b.repair_cost) if b.repair_cost else None, "spare_parts": b.spare_parts or [],
            "created_at": b.created_at.isoformat() if b.created_at else ""}


# ── Machine routes ───────────────────────────────────────────────────────
@router.get("/machines")
async def list_machines(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(Machine).where(Machine.tenant_id == current_user.tenant_id, Machine.deleted_at.is_(None))
    if status: q = q.where(Machine.status == status)
    if search:
        t = f"%{search}%"
        q = q.where(or_(Machine.name.ilike(t), Machine.machine_code.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(Machine.name).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [machine_out(i) for i in items], "total": total}


@router.post("/machines", status_code=201)
async def create_machine(payload: MachineCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    m = Machine(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(m); await db.flush(); return machine_out(m)


@router.get("/machines/{mid}")
async def get_machine(mid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Machine).where(Machine.id == mid, Machine.tenant_id == current_user.tenant_id))
    m = r.scalar_one_or_none()
    if not m: raise HTTPException(404, "Machine not found")
    # Include open breakdowns count
    bd_count = (await db.execute(select(func.count(BreakdownLog.id)).where(BreakdownLog.machine_id == mid, BreakdownLog.status == "open"))).scalar_one()
    result = machine_out(m)
    result["open_breakdowns"] = bd_count
    return result


@router.put("/machines/{mid}")
async def update_machine(mid: UUID, payload: MachineUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Machine).where(Machine.id == mid, Machine.tenant_id == current_user.tenant_id))
    m = r.scalar_one_or_none()
    if not m: raise HTTPException(404)
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(m, k, v)
    return machine_out(m)


# ── PM Schedule routes ──────────────────────────────────────────────────
@router.get("/schedules")
async def list_schedules(
    machine_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(PMSchedule).where(PMSchedule.tenant_id == current_user.tenant_id, PMSchedule.deleted_at.is_(None))
    if machine_id: q = q.where(PMSchedule.machine_id == machine_id)
    items = (await db.execute(q.order_by(PMSchedule.next_due))).scalars().all()
    return {"items": [pm_out(i) for i in items], "total": len(items)}


@router.post("/schedules", status_code=201)
async def create_schedule(payload: PMCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    p = PMSchedule(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(p); await db.flush(); return pm_out(p)


@router.post("/schedules/{sid}/complete")
async def complete_pm(sid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PMSchedule).where(PMSchedule.id == sid, PMSchedule.tenant_id == current_user.tenant_id))
    p = r.scalar_one_or_none()
    if not p: raise HTTPException(404)
    today = datetime.now().strftime("%Y-%m-%d")
    p.last_done = today
    # Calculate next due based on frequency
    freq_days = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90, "annual": 365}
    days = freq_days.get(p.frequency, 30)
    p.next_due = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    # Update machine last service date
    await db.execute(sa.text(f"UPDATE machines SET last_service_date='{today}' WHERE id='{p.machine_id}'"))
    return pm_out(p)


# ── Breakdown routes ────────────────────────────────────────────────────
@router.get("/breakdowns")
async def list_breakdowns(
    status: Optional[str] = Query(None),
    machine_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(BreakdownLog).where(BreakdownLog.tenant_id == current_user.tenant_id)
    if status:     q = q.where(BreakdownLog.status == status)
    if machine_id: q = q.where(BreakdownLog.machine_id == machine_id)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(BreakdownLog.created_at.desc()).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [bd_out(i) for i in items], "total": total}


@router.post("/breakdowns", status_code=201)
async def log_breakdown(payload: BreakdownCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    b = BreakdownLog(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(b)
    # Mark machine as breakdown
    await db.execute(sa.text(f"UPDATE machines SET status='breakdown' WHERE id='{payload.machine_id}' AND tenant_id='{current_user.tenant_id}'"))
    await db.flush()
    return bd_out(b)


@router.post("/breakdowns/{bid}/resolve")
async def resolve_breakdown(bid: UUID, payload: BreakdownResolve, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(BreakdownLog).where(BreakdownLog.id == bid, BreakdownLog.tenant_id == current_user.tenant_id))
    b = r.scalar_one_or_none()
    if not b: raise HTTPException(404)
    b.status        = "resolved"
    b.action_taken  = payload.action_taken
    b.cause         = payload.cause
    b.resolved_by   = payload.resolved_by or current_user.name
    b.resolved_date = datetime.now().strftime("%Y-%m-%d")
    b.downtime_hrs  = payload.downtime_hrs
    b.repair_cost   = payload.repair_cost
    b.spare_parts   = payload.spare_parts
    # Restore machine to active
    await db.execute(sa.text(f"UPDATE machines SET status='active' WHERE id='{b.machine_id}' AND tenant_id='{current_user.tenant_id}'"))
    return bd_out(b)


@router.get("/due-today")
async def due_today(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    overdue = await db.execute(select(PMSchedule).where(PMSchedule.tenant_id == current_user.tenant_id, PMSchedule.next_due <= today, PMSchedule.status == "active", PMSchedule.deleted_at.is_(None)))
    open_bd = await db.execute(select(BreakdownLog).where(BreakdownLog.tenant_id == current_user.tenant_id, BreakdownLog.status.in_(["open", "in_progress"])))
    return {"overdue_pm": [pm_out(i) for i in overdue.scalars().all()], "open_breakdowns": [bd_out(i) for i in open_bd.scalars().all()]}
