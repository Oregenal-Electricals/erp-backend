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

router = APIRouter(prefix="/inventory", tags=["Inventory"])


class InventoryProduct(Base):
    __tablename__ = "inventory_products"
    tenant_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name          = sa.Column(sa.String(300), nullable=False)
    sku           = sa.Column(sa.String(100), nullable=False)
    category      = sa.Column(sa.String(100), nullable=True)
    unit          = sa.Column(sa.String(30), default="Pcs", nullable=False)
    description   = sa.Column(sa.Text, nullable=True)
    cost_price    = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    selling_price = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    stock         = sa.Column(sa.Integer, default=0, nullable=False)
    reorder_point = sa.Column(sa.Integer, default=0, nullable=False)
    status        = sa.Column(sa.String(20), default="active", nullable=False)
    custom_data   = sa.Column(JSON, default=dict, nullable=False)
    deleted_at    = sa.Column(sa.DateTime(timezone=True), nullable=True)


class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    unit: str = "Pcs"
    description: Optional[str] = None
    cost_price: float = 0
    selling_price: float = 0
    stock: int = 0
    reorder_point: int = 0
    status: str = "active"
    custom_data: dict = {}


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    reorder_point: Optional[int] = None
    status: Optional[str] = None
    custom_data: Optional[dict] = None


def product_out(p):
    return {
        "id": str(p.id), "name": p.name, "sku": p.sku, "category": p.category,
        "unit": p.unit, "description": p.description,
        "cost_price": float(p.cost_price or 0), "selling_price": float(p.selling_price or 0),
        "stock": p.stock, "reorder_point": p.reorder_point,
        "status": p.status, "custom_data": p.custom_data or {},
        "created_at": p.created_at.isoformat() if p.created_at else "",
    }


@router.get("/products")
async def list_products(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    out_of_stock: bool = Query(False),
    sort_by: str = Query("name"),
    sort_dir: str = Query("asc"),
    current_user: User = Depends(get_current_active_user),
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db),
):
    q = select(InventoryProduct).where(InventoryProduct.tenant_id == current_user.tenant_id, InventoryProduct.deleted_at.is_(None))
    if status: q = q.where(InventoryProduct.status == status)
    if out_of_stock: q = q.where(InventoryProduct.stock == 0)
    elif low_stock: q = q.where(InventoryProduct.stock > 0, InventoryProduct.stock <= InventoryProduct.reorder_point)
    if search:
        t = f"%{search}%"
        q = q.where(or_(InventoryProduct.name.ilike(t), InventoryProduct.sku.ilike(t), InventoryProduct.category.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    col = getattr(InventoryProduct, sort_by, InventoryProduct.name)
    q = q.order_by(col.desc() if sort_dir == "desc" else col.asc()).offset(pagination.offset).limit(pagination.limit)
    items = (await db.execute(q)).scalars().all()
    return {"items": [product_out(i) for i in items], "total": total, "page": pagination.page, "page_size": pagination.page_size, "total_pages": math.ceil(total / pagination.page_size) if pagination.page_size else 1}


@router.post("/products", status_code=201)
async def create_product(payload: ProductCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(InventoryProduct).where(InventoryProduct.tenant_id == current_user.tenant_id, InventoryProduct.sku == payload.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"SKU '{payload.sku}' already exists")
    p = InventoryProduct(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(p); await db.flush()
    return product_out(p)


@router.put("/products/{product_id}")
async def update_product(product_id: UUID, payload: ProductUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryProduct).where(InventoryProduct.id == product_id, InventoryProduct.tenant_id == current_user.tenant_id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Product not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    return product_out(p)


@router.delete("/products/{product_id}")
async def delete_product(product_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryProduct).where(InventoryProduct.id == product_id, InventoryProduct.tenant_id == current_user.tenant_id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Product not found")
    from datetime import datetime, timezone
    p.deleted_at = datetime.now(timezone.utc)
    return {"success": True}


@router.post("/products/{product_id}/adjust-stock")
async def adjust_stock(product_id: UUID, adjustment: int, note: Optional[str] = None, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryProduct).where(InventoryProduct.id == product_id, InventoryProduct.tenant_id == current_user.tenant_id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Product not found")
    old_stock = p.stock
    p.stock = max(0, p.stock + adjustment)
    return {"old_stock": old_stock, "new_stock": p.stock, "adjustment": adjustment}


@router.get("/stock-alerts")
async def stock_alerts(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    q = select(InventoryProduct).where(InventoryProduct.tenant_id == current_user.tenant_id, InventoryProduct.deleted_at.is_(None), InventoryProduct.stock <= InventoryProduct.reorder_point)
    result = await db.execute(q)
    items = result.scalars().all()
    return {"items": [product_out(i) for i in items], "total": len(items)}
