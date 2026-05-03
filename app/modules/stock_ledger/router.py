"""
FlowERP — Stock Ledger API
===========================
GET  /stock-ledger/products/{id}/history      — ledger for one product
GET  /stock-ledger/summary                    — all products with current stock + WAC
POST /stock-ledger/adjust                     — manual stock adjustment
POST /stock-ledger/transfer                   — warehouse transfer
GET  /stock-ledger/valuation                  — total inventory value at WAC
GET  /stock-ledger/low-stock                  — items below reorder point
"""
import math
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.engines.stock_ledger import (
    post_stock_movement, get_product_ledger,
    StockInsufficientError, StockProductNotFound,
)
from app.modules.inventory.router import InventoryProduct

router = APIRouter(prefix="/stock-ledger", tags=["Stock Ledger"])


# ── Schemas ─────────────────────────────────────────────────────────
class AdjustmentRequest(BaseModel):
    product_id:  UUID
    quantity:    int               # positive
    direction:   str               # 'in' | 'out'
    unit_cost:   Optional[float] = None
    reason:      str               # required for adjustments
    reference:   Optional[str] = None


class TransferRequest(BaseModel):
    product_id:  UUID
    quantity:    int
    from_warehouse: str
    to_warehouse:   str
    notes: Optional[str] = None


# ── Product ledger history ───────────────────────────────────────────
@router.get("/products/{product_id}/history")
async def product_ledger_history(
    product_id:   UUID,
    limit:        int = Query(100, le=500),
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    from app.engines.stock_ledger import StockLedger
    # Verify product belongs to tenant
    p = await db.execute(
        select(InventoryProduct)
        .where(InventoryProduct.id == product_id, InventoryProduct.tenant_id == current_user.tenant_id)
    )
    product = p.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    entries = await get_product_ledger(db, current_user.tenant_id, product_id, limit)
    return {
        "product_id":   str(product_id),
        "product_name": product.name,
        "product_sku":  product.sku,
        "current_stock":product.stock,
        "current_wac":  float(product.cost_price or 0),
        "entries":      entries,
        "total":        len(entries),
    }


# ── Inventory summary (all products) ────────────────────────────────
@router.get("/summary")
async def inventory_summary(
    page:         int = Query(1, ge=1),
    page_size:    int = Query(50, le=200),
    search:       Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    q = select(InventoryProduct).where(
        InventoryProduct.tenant_id == current_user.tenant_id,
        InventoryProduct.deleted_at.is_(None),
    )
    if search:
        t = f"%{search}%"
        q = q.where(InventoryProduct.name.ilike(t) | InventoryProduct.sku.ilike(t))
    if low_stock_only:
        q = q.where(InventoryProduct.stock <= InventoryProduct.reorder_point)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q = q.order_by(InventoryProduct.name).offset((page-1)*page_size).limit(page_size)
    products = (await db.execute(q)).scalars().all()

    items = []
    for p in products:
        stock     = int(p.stock or 0)
        wac       = float(p.cost_price or 0)
        low       = stock <= int(p.reorder_point or 0)
        items.append({
            "id":            str(p.id),
            "name":          p.name,
            "sku":           p.sku,
            "category":      p.category,
            "unit":          p.unit,
            "stock":         stock,
            "reorder_point": int(p.reorder_point or 0),
            "wac":           wac,
            "stock_value":   round(stock * wac, 2),
            "selling_price": float(p.selling_price or 0),
            "status":        p.status,
            "is_low_stock":  low,
        })

    total_value = sum(i["stock_value"] for i in items)
    return {
        "items":       items,
        "total":       total,
        "page":        page,
        "page_size":   page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
        "total_value": total_value,
    }


# ── Manual adjustment ────────────────────────────────────────────────
@router.post("/adjust")
async def manual_adjustment(
    payload:      AdjustmentRequest,
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    if not payload.reason or len(payload.reason.strip()) < 3:
        raise HTTPException(400, "Reason is required for manual adjustments (min 3 chars)")

    try:
        entry = await post_stock_movement(
            db             = db,
            tenant_id      = current_user.tenant_id,
            product_id     = payload.product_id,
            movement_type  = "stock_adjustment",
            quantity       = payload.quantity,
            direction      = payload.direction,
            unit_cost      = Decimal(str(payload.unit_cost or 0)),
            reference_type = "manual_adjustment",
            notes          = payload.reason,
            created_by     = current_user.name,
        )
        await db.commit()
        return {
            "success": True,
            "entry":   {
                "id":          str(entry.id),
                "stock_after": entry.stock_after,
                "wac_after":   float(entry.wac_after or 0),
                "total_cost":  float(entry.total_cost or 0),
            },
        }
    except StockInsufficientError as e:
        raise HTTPException(422, f"Insufficient stock: available {e.available}, requested {e.requested}")
    except StockProductNotFound:
        raise HTTPException(404, "Product not found")
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, str(e))


# ── Warehouse transfer ───────────────────────────────────────────────
@router.post("/transfer")
async def warehouse_transfer(
    payload:      TransferRequest,
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    try:
        # Issue from source
        await post_stock_movement(
            db             = db,
            tenant_id      = current_user.tenant_id,
            product_id     = payload.product_id,
            movement_type  = "transfer_out",
            quantity       = payload.quantity,
            direction      = "out",
            notes          = f"Transfer to {payload.to_warehouse}. {payload.notes or ''}",
            created_by     = current_user.name,
        )
        # Receive at destination (same product — no physical warehouse split yet)
        entry = await post_stock_movement(
            db             = db,
            tenant_id      = current_user.tenant_id,
            product_id     = payload.product_id,
            movement_type  = "transfer_in",
            quantity       = payload.quantity,
            direction      = "in",
            notes          = f"Transfer from {payload.from_warehouse}. {payload.notes or ''}",
            created_by     = current_user.name,
        )
        await db.commit()
        return {"success": True, "stock_after": entry.stock_after}
    except StockInsufficientError as e:
        raise HTTPException(422, f"Insufficient stock in {payload.from_warehouse}: {e.available} available")
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, str(e))


# ── Inventory valuation report ───────────────────────────────────────
@router.get("/valuation")
async def inventory_valuation(
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            InventoryProduct.category,
            func.count(InventoryProduct.id).label("count"),
            func.sum(InventoryProduct.stock).label("total_units"),
            func.sum(InventoryProduct.stock * InventoryProduct.cost_price).label("total_value"),
        )
        .where(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.deleted_at.is_(None),
            InventoryProduct.status == "active",
        )
        .group_by(InventoryProduct.category)
        .order_by(func.sum(InventoryProduct.stock * InventoryProduct.cost_price).desc())
    )
    rows = result.fetchall()

    by_category = [
        {
            "category":    row[0] or "Uncategorized",
            "count":       int(row[1] or 0),
            "total_units": int(row[2] or 0),
            "total_value": round(float(row[3] or 0), 2),
        }
        for row in rows
    ]
    grand_total = sum(r["total_value"] for r in by_category)

    return {
        "by_category": by_category,
        "grand_total": round(grand_total, 2),
        "as_of":       __import__("datetime").datetime.now().isoformat(),
    }


# ── Low stock alerts ─────────────────────────────────────────────────
@router.get("/low-stock")
async def low_stock_items(
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    q = select(InventoryProduct).where(
        InventoryProduct.tenant_id == current_user.tenant_id,
        InventoryProduct.deleted_at.is_(None),
        InventoryProduct.status == "active",
        InventoryProduct.stock <= InventoryProduct.reorder_point,
    ).order_by(InventoryProduct.stock)

    products = (await db.execute(q)).scalars().all()
    items = [
        {
            "id":            str(p.id),
            "name":          p.name,
            "sku":           p.sku,
            "stock":         int(p.stock or 0),
            "reorder_point": int(p.reorder_point or 0),
            "shortage":      max(0, int(p.reorder_point or 0) - int(p.stock or 0)),
            "unit":          p.unit,
        }
        for p in products
    ]
    return {"items": items, "total": len(items)}


# ── Opening Stock ─────────────────────────────────────────────────────
class OpeningStockItem(BaseModel):
    product_id: UUID
    quantity:   int
    unit_cost:  float

class OpeningStockRequest(BaseModel):
    items:    list[OpeningStockItem]
    as_of:    Optional[str] = None  # date string
    notes:    Optional[str] = "Opening stock entry"


@router.post("/opening-stock")
async def post_opening_stock(
    payload:      OpeningStockRequest,
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    """
    Post opening stock for all products at once.
    Used during initial setup or financial year start.
    Only valid if the product has no existing ledger entries.
    """
    from decimal import Decimal
    from app.engines.stock_ledger import StockLedger

    results = []
    skipped = []

    for item in payload.items:
        # Check if product already has ledger entries
        existing = await db.execute(
            select(StockLedger).where(
                StockLedger.product_id == item.product_id,
                StockLedger.tenant_id  == current_user.tenant_id,
            ).limit(1)
        )
        if existing.scalar_one_or_none():
            skipped.append(str(item.product_id))
            continue

        try:
            entry = await post_stock_movement(
                db               = db,
                tenant_id        = current_user.tenant_id,
                product_id       = item.product_id,
                movement_type    = "opening_stock",
                quantity         = item.quantity,
                direction        = "in",
                unit_cost        = Decimal(str(item.unit_cost)),
                reference_type   = "opening_stock",
                notes            = payload.notes or "Opening stock entry",
                created_by       = current_user.name,
            )
            results.append({
                "product_id":  str(item.product_id),
                "quantity":    item.quantity,
                "unit_cost":   item.unit_cost,
                "stock_after": entry.stock_after,
                "wac_after":   float(entry.wac_after or 0),
            })
        except Exception as e:
            skipped.append(f"{item.product_id}: {str(e)}")

    await db.commit()
    return {
        "success":       True,
        "posted":        len(results),
        "skipped":       len(skipped),
        "skipped_ids":   skipped,
        "entries":       results,
        "message":       f"Opening stock posted for {len(results)} product(s)",
    }


# ── GET /stock-ledger/entries — full movement log (required by movements page) ──
@router.get("/entries")
async def list_entries(
    page:          int = Query(1, ge=1),
    page_size:     int = Query(50, le=200),
    movement_type: Optional[str] = Query(None),
    product_id:    Optional[UUID] = Query(None),
    search:        Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """All stock ledger entries — used by Inventory → Movements page."""
    from sqlalchemy import select, func, or_, text
    q = select(StockLedger).where(StockLedger.tenant_id == current_user.tenant_id)
    if movement_type: q = q.where(StockLedger.movement_type == movement_type)
    if product_id:    q = q.where(StockLedger.product_id == product_id)
    if search:
        t = f"%{search}%"
        q = q.where(or_(StockLedger.product_name.ilike(t), StockLedger.reference.ilike(t)))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows  = (await db.execute(q.order_by(StockLedger.created_at.desc()).offset((page-1)*page_size).limit(page_size))).scalars().all()

    def entry_out(e):
        return {
            "id":            str(e.id),
            "movement_type": e.movement_type,
            "direction":     e.direction,
            "product_id":    str(e.product_id) if e.product_id else None,
            "product_name":  e.product_name,
            "product_sku":   getattr(e, 'product_sku', None),
            "quantity":      float(e.quantity or 0),
            "unit_cost":     float(e.unit_cost or 0),
            "total_cost":    float(e.total_cost or 0),
            "stock_after":   float(e.stock_after or 0),
            "reference":     e.reference,
            "notes":         e.notes,
            "created_at":    e.created_at.isoformat() if e.created_at else "",
        }

    import math
    return {
        "entries":     [entry_out(e) for e in rows],
        "items":       [entry_out(e) for e in rows],
        "total":       total,
        "page":        page,
        "page_size":   page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }
