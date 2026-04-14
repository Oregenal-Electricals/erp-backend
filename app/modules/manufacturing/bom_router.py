"""
FlowERP — BOM (Bill of Materials) Engine
==========================================
GET  /bom                           — list all BOMs
POST /bom                           — create BOM
GET  /bom/{id}                      — get BOM with components
PUT  /bom/{id}                      — update BOM
DELETE /bom/{id}                    — archive BOM
POST /bom/{id}/components           — add component
DELETE /bom/{id}/components/{cid}   — remove component
POST /work-orders/{id}/complete     — complete work order + auto-consume BOM
GET  /work-orders/{id}/consumption-preview — what will be consumed
"""
import math
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.engines.stock_ledger import (
    post_bom_consumption, post_stock_movement,
    StockInsufficientError, StockProductNotFound,
)
from app.modules.inventory.router import InventoryProduct
from app.modules.manufacturing.router import WorkOrder

router = APIRouter(prefix="/bom", tags=["BOM"])


# ── Models ────────────────────────────────────────────────────────────
class BOM(Base):
    """Bill of Materials header — one per finished product."""
    __tablename__ = "boms"

    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name    = sa.Column(sa.String(300), nullable=False)
    product_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("inventory_products.id", ondelete="SET NULL"), nullable=True)
    version         = sa.Column(sa.String(20),  default="v1.0", nullable=False)
    description     = sa.Column(sa.Text, nullable=True)
    status          = sa.Column(sa.String(20),  default="active", nullable=False)
    yield_qty       = sa.Column(sa.Integer,     default=1,    nullable=False)   # units produced per BOM run
    yield_unit      = sa.Column(sa.String(30),  default="Pcs", nullable=False)
    notes           = sa.Column(sa.Text, nullable=True)
    deleted_at      = sa.Column(sa.DateTime(timezone=True), nullable=True)


class BOMComponent(Base):
    """Individual component line in a BOM."""
    __tablename__ = "bom_components"

    bom_id          = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("boms.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    product_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("inventory_products.id", ondelete="CASCADE"), nullable=False)
    product_name    = sa.Column(sa.String(300), nullable=False)   # denormalized for speed
    product_sku     = sa.Column(sa.String(100), nullable=True)
    quantity        = sa.Column(sa.Numeric(12,4), nullable=False)  # decimal for partial units
    unit            = sa.Column(sa.String(30), default="Pcs", nullable=False)
    unit_cost       = sa.Column(sa.Numeric(15,4), default=0, nullable=False)  # cached cost
    notes           = sa.Column(sa.Text, nullable=True)


# ── Schemas ───────────────────────────────────────────────────────────
class BOMCreate(BaseModel):
    product_name: str
    product_id:   Optional[UUID] = None
    version:      str = "v1.0"
    description:  Optional[str] = None
    yield_qty:    int = 1
    yield_unit:   str = "Pcs"
    notes:        Optional[str] = None


class BOMUpdate(BaseModel):
    product_name: Optional[str] = None
    version:      Optional[str] = None
    description:  Optional[str] = None
    status:       Optional[str] = None
    yield_qty:    Optional[int] = None
    notes:        Optional[str] = None


class ComponentCreate(BaseModel):
    product_id:  UUID
    quantity:    float
    unit:        str = "Pcs"
    notes:       Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────
def _bom_out(b: BOM) -> dict:
    return {
        "id":           str(b.id),
        "product_name": b.product_name,
        "product_id":   str(b.product_id) if b.product_id else None,
        "version":      b.version,
        "description":  b.description,
        "status":       b.status,
        "yield_qty":    b.yield_qty,
        "yield_unit":   b.yield_unit,
        "notes":        b.notes,
        "created_at":   b.created_at.isoformat() if b.created_at else "",
    }


def _comp_out(c: BOMComponent) -> dict:
    return {
        "id":           str(c.id),
        "product_id":   str(c.product_id),
        "product_name": c.product_name,
        "product_sku":  c.product_sku,
        "quantity":     float(c.quantity),
        "unit":         c.unit,
        "unit_cost":    float(c.unit_cost or 0),
        "line_cost":    round(float(c.quantity) * float(c.unit_cost or 0), 2),
        "notes":        c.notes,
    }


async def _get_bom_with_components(bom_id: UUID, tenant_id: UUID, db: AsyncSession):
    b_result = await db.execute(
        select(BOM).where(BOM.id == bom_id, BOM.tenant_id == tenant_id, BOM.deleted_at.is_(None))
    )
    bom = b_result.scalar_one_or_none()
    if not bom:
        raise HTTPException(404, "BOM not found")

    c_result = await db.execute(
        select(BOMComponent).where(BOMComponent.bom_id == bom_id).order_by(BOMComponent.created_at)
    )
    components = c_result.scalars().all()
    return bom, components


# ── BOM CRUD ──────────────────────────────────────────────────────────
@router.get("")
async def list_boms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(BOM).where(BOM.tenant_id == current_user.tenant_id, BOM.deleted_at.is_(None))
    if search:
        q = q.where(BOM.product_name.ilike(f"%{search}%"))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(BOM.product_name).offset((page-1)*page_size).limit(page_size))).scalars().all()

    # Attach component counts
    result = []
    for b in items:
        cnt = (await db.execute(select(func.count(BOMComponent.id)).where(BOMComponent.bom_id == b.id))).scalar_one()
        d = _bom_out(b)
        d["component_count"] = cnt
        result.append(d)

    return {"items": result, "total": total, "page": page, "page_size": page_size}


@router.post("", status_code=201)
async def create_bom(
    payload: BOMCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    bom = BOM(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(bom)
    await db.flush()
    return _bom_out(bom)


@router.get("/{bom_id}")
async def get_bom(
    bom_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    bom, components = await _get_bom_with_components(bom_id, current_user.tenant_id, db)
    result = _bom_out(bom)
    result["components"] = [_comp_out(c) for c in components]
    result["total_cost"] = round(sum(float(c.quantity) * float(c.unit_cost or 0) for c in components), 2)
    return result


@router.put("/{bom_id}")
async def update_bom(
    bom_id: UUID,
    payload: BOMUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    bom, _ = await _get_bom_with_components(bom_id, current_user.tenant_id, db)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(bom, k, v)
    return _bom_out(bom)


@router.delete("/{bom_id}")
async def delete_bom(
    bom_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    bom, _ = await _get_bom_with_components(bom_id, current_user.tenant_id, db)
    bom.deleted_at = datetime.now(timezone.utc)
    return {"success": True}


# ── Component management ──────────────────────────────────────────────
@router.post("/{bom_id}/components", status_code=201)
async def add_component(
    bom_id: UUID,
    payload: ComponentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    bom, _ = await _get_bom_with_components(bom_id, current_user.tenant_id, db)

    # Fetch product info
    p = await db.execute(
        select(InventoryProduct)
        .where(InventoryProduct.id == payload.product_id, InventoryProduct.tenant_id == current_user.tenant_id)
    )
    product = p.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    comp = BOMComponent(
        bom_id       = bom_id,
        tenant_id    = current_user.tenant_id,
        product_id   = payload.product_id,
        product_name = product.name,
        product_sku  = product.sku,
        quantity     = Decimal(str(payload.quantity)),
        unit         = payload.unit or product.unit,
        unit_cost    = product.cost_price or Decimal("0"),
        notes        = payload.notes,
    )
    db.add(comp)
    await db.flush()
    return _comp_out(comp)


@router.delete("/{bom_id}/components/{component_id}")
async def remove_component(
    bom_id: UUID, component_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BOMComponent).where(BOMComponent.id == component_id, BOMComponent.bom_id == bom_id)
    )
    comp = result.scalar_one_or_none()
    if not comp:
        raise HTTPException(404, "Component not found")
    await db.delete(comp)
    return {"success": True}


# ── Work Order completion with BOM auto-consume ───────────────────────
work_router = APIRouter(prefix="/work-orders", tags=["BOM"])


@work_router.get("/{wo_id}/consumption-preview")
async def consumption_preview(
    wo_id: UUID,
    bom_id: Optional[UUID] = Query(None, description="Specify BOM or auto-detect by product name"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Preview what stock will be consumed — without actually doing it."""
    wo_result = await db.execute(
        select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.tenant_id == current_user.tenant_id)
    )
    wo = wo_result.scalar_one_or_none()
    if not wo:
        raise HTTPException(404, "Work order not found")

    # Find BOM
    bom = await _find_bom(db, current_user.tenant_id, wo.product_name, bom_id)
    if not bom:
        return {"bom_found": False, "message": f"No active BOM found for '{wo.product_name}'"}

    c_result = await db.execute(
        select(BOMComponent).where(BOMComponent.bom_id == bom.id)
    )
    components = c_result.scalars().all()

    # Scale by work order quantity vs BOM yield
    scale = wo.quantity / (bom.yield_qty or 1)
    items = []
    all_ok = True

    for c in components:
        needed = math.ceil(float(c.quantity) * scale)
        # Get current stock
        p = await db.execute(
            select(InventoryProduct.name, InventoryProduct.stock)
            .where(InventoryProduct.id == c.product_id)
        )
        row = p.fetchone()
        available = int(row[1]) if row else 0
        ok = available >= needed

        if not ok:
            all_ok = False

        items.append({
            "product_id":   str(c.product_id),
            "product_name": c.product_name,
            "product_sku":  c.product_sku,
            "quantity_needed":  needed,
            "quantity_available": available,
            "shortage":     max(0, needed - available),
            "can_proceed":  ok,
        })

    return {
        "bom_found":       True,
        "bom_id":          str(bom.id),
        "bom_version":     bom.version,
        "work_order_qty":  wo.quantity,
        "bom_yield":       bom.yield_qty,
        "scale_factor":    scale,
        "can_proceed":     all_ok,
        "components":      items,
    }


@work_router.post("/{wo_id}/complete")
async def complete_work_order(
    wo_id:  UUID,
    bom_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db:     AsyncSession = Depends(get_db),
):
    """
    Complete a work order:
    1. Find BOM matching the product
    2. Check all components have sufficient stock
    3. Issue (OUT) all components via stock ledger
    4. Receive (IN) finished goods via stock ledger
    5. Mark work order as completed
    """
    wo_result = await db.execute(
        select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.tenant_id == current_user.tenant_id)
    )
    wo = wo_result.scalar_one_or_none()
    if not wo:
        raise HTTPException(404, "Work order not found")
    if wo.status == "completed":
        raise HTTPException(409, "Work order is already completed")

    # Find matching BOM
    bom = await _find_bom(db, current_user.tenant_id, wo.product_name, bom_id)

    wo_ref = f"WO-{str(wo.id)[:8].upper()}"

    if bom:
        c_result = await db.execute(
            select(BOMComponent).where(BOMComponent.bom_id == bom.id)
        )
        components = c_result.scalars().all()
        scale = wo.quantity / (bom.yield_qty or 1)

        bom_items = [
            {
                "product_id": c.product_id,
                "quantity":   math.ceil(float(c.quantity) * scale),
            }
            for c in components
        ]

        try:
            await post_bom_consumption(
                db             = db,
                tenant_id      = current_user.tenant_id,
                bom_items      = bom_items,
                work_order_id  = str(wo_id),
                work_order_ref = wo_ref,
                created_by     = current_user.name,
            )
        except StockInsufficientError as e:
            raise HTTPException(
                422,
                f"Cannot complete: insufficient stock for '{e.product_name}' "
                f"(available: {e.available}, needed: {e.requested})"
            )

    # Add finished goods to inventory (if product_id is linked)
    fg_entry = None
    if hasattr(wo, 'product_id') and wo.product_id:
        fg_entry = await post_stock_movement(
            db             = db,
            tenant_id      = current_user.tenant_id,
            product_id     = wo.product_id,
            movement_type  = "production_receipt",
            quantity       = wo.quantity,
            direction      = "in",
            reference_type = "work_order",
            reference_id   = str(wo_id),
            reference_number = wo_ref,
            notes          = f"Finished goods from {wo_ref}",
            created_by     = current_user.name,
        )

    # Mark work order completed
    wo.status = "completed"
    await db.commit()

    return {
        "success":          True,
        "work_order_id":    str(wo_id),
        "work_order_ref":   wo_ref,
        "bom_consumed":     bom is not None,
        "components_count": len(bom_items) if bom else 0,
        "finished_goods_posted": fg_entry is not None,
        "message":          f"Work order {wo_ref} completed successfully",
    }


async def _find_bom(db: AsyncSession, tenant_id: UUID, product_name: str, bom_id: Optional[UUID]) -> Optional[BOM]:
    """Find BOM by explicit ID or by matching product name."""
    if bom_id:
        result = await db.execute(
            select(BOM).where(BOM.id == bom_id, BOM.tenant_id == tenant_id, BOM.status == "active")
        )
        return result.scalar_one_or_none()
    # Auto-detect by product name (case-insensitive)
    result = await db.execute(
        select(BOM).where(
            BOM.tenant_id == tenant_id,
            BOM.status == "active",
            BOM.product_name.ilike(f"%{product_name.split('(')[0].strip()}%"),
            BOM.deleted_at.is_(None),
        ).limit(1)
    )
    return result.scalar_one_or_none()
