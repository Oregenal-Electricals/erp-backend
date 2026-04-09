from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.models.customization import FieldDefinition, FormConfig, StatusConfig

router = APIRouter(prefix="/config", tags=["Configuration"])


# ── Field Schemas ─────────────────────────────────────────────────────
class FieldCreate(BaseModel):
    module: str
    field_key: str
    field_type: str
    label: str
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    options: List[str] = []
    is_required: bool = False
    sort_order: int = 0
    validation_rules: dict = {}


class FieldUpdate(BaseModel):
    label: Optional[str] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    options: Optional[List[str]] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class FieldOut(BaseModel):
    id: UUID
    module: str
    field_key: str
    field_type: str
    label: str
    placeholder: Optional[str]
    help_text: Optional[str]
    options: List[str]
    is_required: bool
    is_active: bool
    sort_order: int

    model_config = {"from_attributes": True}


# ── Field Endpoints ───────────────────────────────────────────────────
@router.get("/fields", response_model=List[FieldOut])
async def list_fields(
    module: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(FieldDefinition).where(FieldDefinition.tenant_id == current_user.tenant_id)
    if module:
        q = q.where(FieldDefinition.module == module)
    if active_only:
        q = q.where(FieldDefinition.is_active == True)
    q = q.order_by(FieldDefinition.module, FieldDefinition.sort_order, FieldDefinition.created_at)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/fields", response_model=FieldOut, status_code=201)
async def create_field(
    payload: FieldCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    # Check uniqueness of key within module + tenant
    existing = await db.execute(
        select(FieldDefinition).where(
            FieldDefinition.tenant_id == current_user.tenant_id,
            FieldDefinition.module == payload.module,
            FieldDefinition.field_key == payload.field_key,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Field key '{payload.field_key}' already exists in {payload.module}")

    field = FieldDefinition(
        tenant_id=current_user.tenant_id,
        **payload.model_dump()
    )
    db.add(field)
    await db.flush()
    return field


@router.put("/fields/{field_id}", response_model=FieldOut)
async def update_field(
    field_id: UUID,
    payload: FieldUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FieldDefinition).where(
            FieldDefinition.id == field_id,
            FieldDefinition.tenant_id == current_user.tenant_id,
        )
    )
    field = result.scalar_one_or_none()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(field, k, v)

    return field


@router.delete("/fields/{field_id}")
async def delete_field(
    field_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FieldDefinition).where(
            FieldDefinition.id == field_id,
            FieldDefinition.tenant_id == current_user.tenant_id,
        )
    )
    field = result.scalar_one_or_none()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    await db.delete(field)
    return {"success": True, "message": "Field deleted"}


# ── Status Config Schemas ─────────────────────────────────────────────
class StatusCreate(BaseModel):
    module: str
    name: str
    slug: str
    color: str = "#6366F1"
    bg_color: str = "#EEF2FF"
    icon: Optional[str] = None
    sort_order: int = 0
    is_initial: bool = False
    is_terminal: bool = False
    allowed_transitions: List[str] = []


class StatusOut(BaseModel):
    id: UUID
    module: str
    name: str
    slug: str
    color: str
    bg_color: str
    icon: Optional[str]
    sort_order: int
    is_initial: bool
    is_terminal: bool
    allowed_transitions: List[str]

    model_config = {"from_attributes": True}


# ── Status Endpoints ──────────────────────────────────────────────────
@router.get("/statuses", response_model=List[StatusOut])
async def list_statuses(
    module: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(StatusConfig).where(StatusConfig.tenant_id == current_user.tenant_id)
    if module:
        q = q.where(StatusConfig.module == module)
    q = q.order_by(StatusConfig.module, StatusConfig.sort_order)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/statuses", response_model=StatusOut, status_code=201)
async def create_status(
    payload: StatusCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    status_obj = StatusConfig(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(status_obj)
    await db.flush()
    return status_obj


@router.put("/statuses/{status_id}", response_model=StatusOut)
async def update_status(
    status_id: UUID,
    payload: dict,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StatusConfig).where(
            StatusConfig.id == status_id,
            StatusConfig.tenant_id == current_user.tenant_id,
        )
    )
    status_obj = result.scalar_one_or_none()
    if not status_obj:
        raise HTTPException(status_code=404, detail="Status not found")

    for k, v in payload.items():
        if hasattr(status_obj, k):
            setattr(status_obj, k, v)

    return status_obj


@router.delete("/statuses/{status_id}")
async def delete_status(
    status_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StatusConfig).where(
            StatusConfig.id == status_id,
            StatusConfig.tenant_id == current_user.tenant_id,
        )
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Status not found")
    await db.delete(obj)
    return {"success": True}
