from typing import Optional, List
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update
from pydantic import BaseModel, EmailStr

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, get_pagination, PaginationParams
from app.models.user import User
from app.core.database import Base
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON

router = APIRouter(prefix="/crm", tags=["CRM"])


# ── Inline model (no separate file needed yet) ────────────────────────
class CRMLead(Base):
    __tablename__ = "crm_leads"

    tenant_id        = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name             = sa.Column(sa.String(300), nullable=False)
    contact_name     = sa.Column(sa.String(200), nullable=True)
    email            = sa.Column(sa.String(254), nullable=True)
    phone            = sa.Column(sa.String(30),  nullable=True)
    source           = sa.Column(sa.String(100), nullable=True)
    status           = sa.Column(sa.String(50),  default="new", nullable=False, index=True)
    estimated_value  = sa.Column(sa.Numeric(15, 2), nullable=True)
    notes            = sa.Column(sa.Text, nullable=True)
    assigned_to_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    custom_data      = sa.Column(JSON, default=dict, nullable=False)
    deleted_at       = sa.Column(sa.DateTime(timezone=True), nullable=True)


# ── Schemas ───────────────────────────────────────────────────────────
class LeadCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: str = "new"
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    custom_data: dict = {}


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    custom_data: Optional[dict] = None


class LeadOut(BaseModel):
    id: UUID
    name: str
    contact_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    source: Optional[str]
    status: str
    estimated_value: Optional[float]
    notes: Optional[str]
    custom_data: dict
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_safe(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            contact_name=obj.contact_name,
            email=obj.email,
            phone=obj.phone,
            source=obj.source,
            status=obj.status,
            estimated_value=float(obj.estimated_value) if obj.estimated_value else None,
            notes=obj.notes,
            custom_data=obj.custom_data or {},
            created_at=obj.created_at.isoformat() if obj.created_at else "",
        )


# ── Endpoints ─────────────────────────────────────────────────────────
@router.get("/leads")
async def list_leads(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(CRMLead).where(
        CRMLead.tenant_id == current_user.tenant_id,
        CRMLead.deleted_at.is_(None),
    )

    if status:
        q = q.where(CRMLead.status == status)

    if search:
        term = f"%{search}%"
        q = q.where(or_(
            CRMLead.name.ilike(term),
            CRMLead.contact_name.ilike(term),
            CRMLead.email.ilike(term),
        ))

    # Count total
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Sort
    sort_col = getattr(CRMLead, sort_by, CRMLead.created_at)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    # Paginate
    q = q.offset(pagination.offset).limit(pagination.limit)

    result = await db.execute(q)
    items = result.scalars().all()

    return {
        "items": [LeadOut.from_orm_safe(i) for i in items],
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1,
    }


@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut.from_orm_safe(lead)


@router.post("/leads", status_code=201)
async def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    lead = CRMLead(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(lead)
    await db.flush()
    return LeadOut.from_orm_safe(lead)


@router.put("/leads/{lead_id}")
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)

    return LeadOut.from_orm_safe(lead)


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    from datetime import datetime, timezone
    lead.deleted_at = datetime.now(timezone.utc)  # soft delete
    return {"success": True, "message": "Lead deleted"}


@router.post("/leads/{lead_id}/status")
async def change_lead_status(
    lead_id: UUID,
    new_status: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CRMLead).where(CRMLead.id == lead_id, CRMLead.tenant_id == current_user.tenant_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_status = lead.status
    lead.status = new_status
    return {"success": True, "old_status": old_status, "new_status": new_status}
