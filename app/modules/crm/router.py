"""
FlowERP — CRM Module (Deep)
============================
Leads, Contacts, Activities, Pipeline, Tasks, Conversion
"""
import math
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User

router = APIRouter(prefix="/crm", tags=["CRM"])


# ── Models ─────────────────────────────────────────────────────────────
class CRMLead(Base):
    __tablename__ = "crm_leads"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name    = sa.Column(sa.String(300), nullable=False)
    contact_name    = sa.Column(sa.String(200), nullable=True)
    email           = sa.Column(sa.String(254), nullable=True)
    phone           = sa.Column(sa.String(30),  nullable=True)
    designation     = sa.Column(sa.String(200), nullable=True)
    website         = sa.Column(sa.String(300), nullable=True)
    stage           = sa.Column(sa.String(50),  default="new",    nullable=False, index=True)
    # new|contacted|qualified|proposal|negotiation|won|lost
    segment         = sa.Column(sa.String(50),  nullable=True)
    source          = sa.Column(sa.String(50),  nullable=True)   # website|referral|cold_call|exhibition
    estimated_value = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    probability     = sa.Column(sa.Integer, default=20, nullable=False)  # 0-100%
    expected_close  = sa.Column(sa.String(20), nullable=True)
    assigned_to     = sa.Column(sa.String(200), nullable=True)
    notes           = sa.Column(sa.Text, nullable=True)
    lost_reason     = sa.Column(sa.String(300), nullable=True)
    converted_so_id = sa.Column(PG_UUID(as_uuid=True), nullable=True)  # linked SO after conversion
    custom_data     = sa.Column(JSON, default=dict, nullable=False)
    deleted_at      = sa.Column(sa.DateTime(timezone=True), nullable=True)


class CRMActivity(Base):
    """Activity log — calls, emails, meetings, notes per lead."""
    __tablename__ = "crm_activities"
    tenant_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("crm_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    type        = sa.Column(sa.String(30), nullable=False)  # call|email|meeting|note|whatsapp
    subject     = sa.Column(sa.String(300), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    outcome     = sa.Column(sa.String(100), nullable=True)  # interested|not_interested|follow_up|demo_scheduled
    activity_date = sa.Column(sa.String(20), nullable=True)
    duration_min  = sa.Column(sa.Integer, nullable=True)    # minutes
    created_by  = sa.Column(sa.String(200), nullable=True)
    next_action = sa.Column(sa.String(300), nullable=True)
    next_date   = sa.Column(sa.String(20), nullable=True)


class CRMTask(Base):
    """Follow-up tasks for leads."""
    __tablename__ = "crm_tasks"
    tenant_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("crm_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    title       = sa.Column(sa.String(300), nullable=False)
    due_date    = sa.Column(sa.String(20), nullable=True)
    priority    = sa.Column(sa.String(20), default="normal", nullable=False)
    status      = sa.Column(sa.String(20), default="open", nullable=False)  # open|done|cancelled
    assigned_to = sa.Column(sa.String(200), nullable=True)
    notes       = sa.Column(sa.Text, nullable=True)


class CRMContact(Base):
    __tablename__ = "crm_contacts"
    tenant_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = sa.Column(sa.String(200), nullable=False)
    company     = sa.Column(sa.String(300), nullable=True)
    email       = sa.Column(sa.String(254), nullable=True)
    phone       = sa.Column(sa.String(30),  nullable=True)
    designation = sa.Column(sa.String(200), nullable=True)
    city        = sa.Column(sa.String(100), nullable=True)
    linkedin    = sa.Column(sa.String(300), nullable=True)
    notes       = sa.Column(sa.Text, nullable=True)
    tags        = sa.Column(JSON, default=list, nullable=False)
    is_active   = sa.Column(sa.Boolean, default=True, nullable=False)
    deleted_at  = sa.Column(sa.DateTime(timezone=True), nullable=True)


# ── Schemas ─────────────────────────────────────────────────────────────
class LeadCreate(BaseModel):
    company_name:    str
    contact_name:    Optional[str] = None
    email:           Optional[str] = None
    phone:           Optional[str] = None
    designation:     Optional[str] = None
    stage:           str = "new"
    segment:         Optional[str] = None
    source:          Optional[str] = None
    estimated_value: float = 0
    probability:     int = 20
    expected_close:  Optional[str] = None
    assigned_to:     Optional[str] = None
    notes:           Optional[str] = None

class LeadUpdate(BaseModel):
    company_name:    Optional[str] = None
    contact_name:    Optional[str] = None
    email:           Optional[str] = None
    phone:           Optional[str] = None
    stage:           Optional[str] = None
    estimated_value: Optional[float] = None
    probability:     Optional[int] = None
    expected_close:  Optional[str] = None
    assigned_to:     Optional[str] = None
    notes:           Optional[str] = None
    lost_reason:     Optional[str] = None

class ActivityCreate(BaseModel):
    type:         str
    subject:      str
    description:  Optional[str] = None
    outcome:      Optional[str] = None
    activity_date:Optional[str] = None
    duration_min: Optional[int] = None
    next_action:  Optional[str] = None
    next_date:    Optional[str] = None

class TaskCreate(BaseModel):
    title:       str
    due_date:    Optional[str] = None
    priority:    str = "normal"
    assigned_to: Optional[str] = None
    notes:       Optional[str] = None

class ContactCreate(BaseModel):
    name:        str
    company:     Optional[str] = None
    email:       Optional[str] = None
    phone:       Optional[str] = None
    designation: Optional[str] = None
    city:        Optional[str] = None
    linkedin:    Optional[str] = None
    notes:       Optional[str] = None
    tags:        list = []

class ContactUpdate(BaseModel):
    name:        Optional[str] = None
    company:     Optional[str] = None
    email:       Optional[str] = None
    phone:       Optional[str] = None
    designation: Optional[str] = None
    city:        Optional[str] = None
    notes:       Optional[str] = None
    tags:        Optional[list] = None
    is_active:   Optional[bool] = None


# ── Helpers ─────────────────────────────────────────────────────────────
STAGE_PROBABILITY = {"new":10,"contacted":20,"qualified":40,"proposal":60,"negotiation":80,"won":100,"lost":0}

def lead_out(l: CRMLead) -> dict:
    return {
        "id": str(l.id), "company_name": l.company_name,
        "contact_name": l.contact_name, "email": l.email, "phone": l.phone,
        "designation": l.designation, "website": l.website,
        "stage": l.stage, "segment": l.segment, "source": l.source,
        "estimated_value": float(l.estimated_value or 0),
        "probability": l.probability,
        "expected_close": l.expected_close,
        "assigned_to": l.assigned_to, "notes": l.notes,
        "lost_reason": l.lost_reason,
        "converted_so_id": str(l.converted_so_id) if l.converted_so_id else None,
        "custom_data": l.custom_data or {},
        "created_at": l.created_at.isoformat() if l.created_at else "",
    }

def activity_out(a: CRMActivity) -> dict:
    return {
        "id": str(a.id), "lead_id": str(a.lead_id), "type": a.type,
        "subject": a.subject, "description": a.description,
        "outcome": a.outcome, "activity_date": a.activity_date,
        "duration_min": a.duration_min, "created_by": a.created_by,
        "next_action": a.next_action, "next_date": a.next_date,
        "created_at": a.created_at.isoformat() if a.created_at else "",
    }

def task_out(t: CRMTask) -> dict:
    return {
        "id": str(t.id), "lead_id": str(t.lead_id), "title": t.title,
        "due_date": t.due_date, "priority": t.priority, "status": t.status,
        "assigned_to": t.assigned_to, "notes": t.notes,
        "created_at": t.created_at.isoformat() if t.created_at else "",
    }

def contact_out(c: CRMContact) -> dict:
    return {
        "id": str(c.id), "name": c.name, "company": c.company,
        "email": c.email, "phone": c.phone, "designation": c.designation,
        "city": c.city, "linkedin": c.linkedin, "notes": c.notes,
        "tags": c.tags or [], "is_active": c.is_active,
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }


# ── Lead routes ──────────────────────────────────────────────────────────
@router.get("/leads")
async def list_leads(
    stage:  Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(CRMLead).where(CRMLead.tenant_id == current_user.tenant_id, CRMLead.deleted_at.is_(None))
    if stage:  q = q.where(CRMLead.stage == stage)
    if search:
        t = f"%{search}%"
        q = q.where(or_(CRMLead.company_name.ilike(t), CRMLead.contact_name.ilike(t), CRMLead.email.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(CRMLead.created_at.desc()).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [lead_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size, "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1}


@router.post("/leads", status_code=201)
async def create_lead(payload: LeadCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    data = payload.model_dump()
    if data.get("stage"):
        data["probability"] = data.get("probability") or STAGE_PROBABILITY.get(data["stage"], 20)
    l = CRMLead(tenant_id=current_user.tenant_id, **data)
    db.add(l); await db.flush(); return lead_out(l)


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404, "Lead not found")
    result = lead_out(l)
    # Include activities and tasks
    acts = (await db.execute(select(CRMActivity).where(CRMActivity.lead_id == lead_id).order_by(CRMActivity.created_at.desc()).limit(50))).scalars().all()
    tasks = (await db.execute(select(CRMTask).where(CRMTask.lead_id == lead_id, CRMTask.status != "cancelled").order_by(CRMTask.due_date))).scalars().all()
    result["activities"] = [activity_out(a) for a in acts]
    result["tasks"] = [task_out(t) for t in tasks]
    return result


@router.put("/leads/{lead_id}")
async def update_lead(lead_id: UUID, payload: LeadUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    data = payload.model_dump(exclude_unset=True)
    if "stage" in data:
        data.setdefault("probability", STAGE_PROBABILITY.get(data["stage"], l.probability))
    for k, v in data.items(): setattr(l, k, v)
    return lead_out(l)


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    l.deleted_at = datetime.now(timezone.utc); return {"success": True}


@router.post("/leads/{lead_id}/stage")
async def change_stage(lead_id: UUID, stage: str, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    l.stage = stage
    l.probability = STAGE_PROBABILITY.get(stage, l.probability)
    return lead_out(l)


@router.post("/leads/{lead_id}/convert")
async def convert_to_order(lead_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    """Mark lead as won and create a draft Sales Order."""
    r = await db.execute(select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id))
    l = r.scalar_one_or_none()
    if not l: raise HTTPException(404)
    import random, string
    order_num = f"SO-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
    await db.execute(text(f"""
        INSERT INTO sales_orders (id, tenant_id, order_number, customer_name, customer_email, customer_phone, status, subtotal, tax_amount, total_amount, order_date)
        VALUES (gen_random_uuid(), '{current_user.tenant_id}', '{order_num}', '{l.company_name}',
                '{l.email or ""}', '{l.phone or ""}', 'draft', 0, 0, 0, '{datetime.now().strftime("%Y-%m-%d")}')
    """))
    l.stage = "won"
    l.probability = 100
    return {"success": True, "order_number": order_num, "message": f"Lead converted — Draft SO {order_num} created"}


# ── Activity routes ─────────────────────────────────────────────────────
@router.post("/leads/{lead_id}/activities", status_code=201)
async def log_activity(lead_id: UUID, payload: ActivityCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    a = CRMActivity(
        tenant_id=current_user.tenant_id, lead_id=lead_id,
        created_by=current_user.name,
        activity_date=payload.activity_date or datetime.now().strftime("%Y-%m-%d"),
        **payload.model_dump(exclude={"activity_date"}),
    )
    if not a.activity_date:
        a.activity_date = datetime.now().strftime("%Y-%m-%d")
    db.add(a); await db.flush(); return activity_out(a)


@router.get("/leads/{lead_id}/activities")
async def get_activities(lead_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    acts = (await db.execute(select(CRMActivity).where(CRMActivity.lead_id == lead_id).order_by(CRMActivity.created_at.desc()))).scalars().all()
    return {"items": [activity_out(a) for a in acts], "total": len(acts)}


# ── Task routes ─────────────────────────────────────────────────────────
@router.post("/leads/{lead_id}/tasks", status_code=201)
async def create_task(lead_id: UUID, payload: TaskCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    t = CRMTask(tenant_id=current_user.tenant_id, lead_id=lead_id, **payload.model_dump())
    db.add(t); await db.flush(); return task_out(t)


@router.post("/tasks/{task_id}/done")
async def complete_task(task_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMTask).where(CRMTask.id == task_id, CRMTask.tenant_id == current_user.tenant_id))
    t = r.scalar_one_or_none()
    if not t: raise HTTPException(404)
    t.status = "done"; return task_out(t)


@router.get("/tasks/upcoming")
async def upcoming_tasks(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    tasks = (await db.execute(select(CRMTask).where(CRMTask.tenant_id == current_user.tenant_id, CRMTask.status == "open").order_by(CRMTask.due_date).limit(20))).scalars().all()
    return {"items": [task_out(t) for t in tasks], "total": len(tasks)}


# ── Pipeline stats ─────────────────────────────────────────────────────
@router.get("/pipeline/stats")
async def pipeline_stats(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CRMLead.stage, func.count(CRMLead.id).label("count"), func.sum(CRMLead.estimated_value).label("value"))
        .where(CRMLead.tenant_id == current_user.tenant_id, CRMLead.deleted_at.is_(None))
        .group_by(CRMLead.stage)
    )
    rows = result.fetchall()
    stages = ["new","contacted","qualified","proposal","negotiation","won","lost"]
    stats = {s: {"count": 0, "value": 0} for s in stages}
    for row in rows:
        if row[0] in stats:
            stats[row[0]] = {"count": int(row[1] or 0), "value": float(row[2] or 0)}
    weighted = sum(stats[s]["value"] * STAGE_PROBABILITY[s] / 100 for s in stages)
    return {"by_stage": stats, "weighted_pipeline": round(weighted, 2)}


# ── Contact routes ─────────────────────────────────────────────────────
@router.get("/contacts")
async def list_contacts(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(CRMContact).where(CRMContact.tenant_id == current_user.tenant_id, CRMContact.deleted_at.is_(None))
    if search:
        t = f"%{search}%"
        q = q.where(or_(CRMContact.name.ilike(t), CRMContact.company.ilike(t), CRMContact.email.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(CRMContact.name).offset(pagination.offset).limit(pagination.limit))).scalars().all()
    return {"items": [contact_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size}


@router.post("/contacts", status_code=201)
async def create_contact(payload: ContactCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    c = CRMContact(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(c); await db.flush(); return contact_out(c)


@router.put("/contacts/{cid}")
async def update_contact(cid: UUID, payload: ContactUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMContact).where(CRMContact.id == cid, CRMContact.tenant_id == current_user.tenant_id))
    c = r.scalar_one_or_none()
    if not c: raise HTTPException(404)
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(c, k, v)
    return contact_out(c)


@router.delete("/contacts/{cid}")
async def delete_contact(cid: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(CRMContact).where(CRMContact.id == cid, CRMContact.tenant_id == current_user.tenant_id))
    c = r.scalar_one_or_none()
    if not c: raise HTTPException(404)
    c.deleted_at = datetime.now(timezone.utc); return {"success": True}
