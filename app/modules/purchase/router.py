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

router = APIRouter(prefix="/purchase", tags=["Purchase"])

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    tenant_id      = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_name    = sa.Column(sa.String(300), nullable=False)
    order_number   = sa.Column(sa.String(50), nullable=True)
    status         = sa.Column(sa.String(50), default="draft", nullable=False, index=True)
    payment_status = sa.Column(sa.String(50), default="pending", nullable=False)
    total_amount   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    items_count    = sa.Column(sa.Integer, default=0, nullable=False)
    order_date     = sa.Column(sa.String(20), nullable=True)
    expected_date  = sa.Column(sa.String(20), nullable=True)
    notes          = sa.Column(sa.Text, nullable=True)
    custom_data    = sa.Column(JSON, default=dict, nullable=False)
    deleted_at     = sa.Column(sa.DateTime(timezone=True), nullable=True)

class POCreate(BaseModel):
    vendor_name: str
    status: str = "draft"
    order_date: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: dict = {}

class POUpdate(BaseModel):
    vendor_name: Optional[str] = None
    status: Optional[str] = None
    order_date: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    custom_data: Optional[dict] = None

def po_out(o):
    return {"id": str(o.id), "vendor_name": o.vendor_name, "order_number": o.order_number, "status": o.status, "payment_status": o.payment_status, "total_amount": float(o.total_amount or 0), "items_count": o.items_count, "order_date": o.order_date, "expected_date": o.expected_date, "notes": o.notes, "custom_data": o.custom_data or {}, "created_at": o.created_at.isoformat() if o.created_at else ""}

@router.get("/orders")
async def list_orders(status: Optional[str]=Query(None), search: Optional[str]=Query(None), current_user: User=Depends(get_current_active_user), pagination: PaginationParams=Depends(get_pagination), db: AsyncSession=Depends(get_db)):
    q = select(PurchaseOrder).where(PurchaseOrder.tenant_id==current_user.tenant_id, PurchaseOrder.deleted_at.is_(None))
    if status: q=q.where(PurchaseOrder.status==status)
    if search:
        t=f"%{search}%"; q=q.where(or_(PurchaseOrder.vendor_name.ilike(t), PurchaseOrder.order_number.ilike(t)))
    total=(await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    q=q.order_by(PurchaseOrder.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[po_out(i) for i in items],"total":total,"page":pagination.page,"page_size":pagination.page_size,"total_pages":math.ceil(total/pagination.page_size) if pagination.page_size else 1}

@router.post("/orders", status_code=201)
async def create_order(payload: POCreate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    import shortuuid
    o = PurchaseOrder(tenant_id=current_user.tenant_id, order_number=f"PO-{shortuuid.ShortUUID().random(length=6).upper()}", **payload.model_dump())
    db.add(o); await db.flush(); return po_out(o)

@router.put("/orders/{order_id}")
async def update_order(order_id: UUID, payload: POUpdate, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(PurchaseOrder).where(PurchaseOrder.id==order_id, PurchaseOrder.tenant_id==current_user.tenant_id))
    o=result.scalar_one_or_none()
    if not o: raise HTTPException(404,"Order not found")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(o,k,v)
    return po_out(o)

@router.delete("/orders/{order_id}")
async def delete_order(order_id: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    result=await db.execute(select(PurchaseOrder).where(PurchaseOrder.id==order_id, PurchaseOrder.tenant_id==current_user.tenant_id))
    o=result.scalar_one_or_none()
    if not o: raise HTTPException(404,"Order not found")
    from datetime import datetime,timezone; o.deleted_at=datetime.now(timezone.utc)
    return {"success":True}


# ── GRN (Goods Receipt Note) — receive PO into stock ─────────────────
class GRNItem(BaseModel):
    product_id:   UUID
    product_name: str
    quantity:     int
    unit_cost:    float = 0.0

class GRNRequest(BaseModel):
    items:  list[GRNItem]
    notes:  Optional[str] = None


@router.post("/orders/{order_id}/receive")
async def receive_purchase_order(
    order_id: UUID,
    payload:  GRNRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GRN — Goods Receipt Note.
    Marks PO as received and posts stock IN entries via the stock ledger.
    Each line item is posted as a 'purchase_receipt' movement with WAC recalculation.
    """
    from decimal import Decimal
    from app.engines.stock_ledger import post_stock_movement, StockProductNotFound

    result = await db.execute(
        select(PurchaseOrder).where(
            PurchaseOrder.id == order_id,
            PurchaseOrder.tenant_id == current_user.tenant_id,
        )
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase order not found")
    if po.status == "received":
        raise HTTPException(409, "Purchase order already received")

    po_ref = po.order_number or f"PO-{str(order_id)[:8].upper()}"
    entries = []

    try:
        for item in payload.items:
            entry = await post_stock_movement(
                db               = db,
                tenant_id        = current_user.tenant_id,
                product_id       = item.product_id,
                movement_type    = "purchase_receipt",
                quantity         = item.quantity,
                direction        = "in",
                unit_cost        = Decimal(str(item.unit_cost)),
                reference_type   = "purchase_order",
                reference_id     = str(order_id),
                reference_number = po_ref,
                notes            = payload.notes or f"GRN for {po_ref}",
                created_by       = current_user.name,
            )
            entries.append({
                "product_id":   str(item.product_id),
                "product_name": item.product_name,
                "quantity":     item.quantity,
                "stock_after":  entry.stock_after,
                "wac_after":    float(entry.wac_after or 0),
            })

        # Mark PO as received
        po.status = "received"
        await db.commit()

        return {
            "success":   True,
            "po_ref":    po_ref,
            "items_received": len(entries),
            "entries":   entries,
            "message":   f"GRN posted — {len(entries)} item(s) received into stock",
        }
    except StockProductNotFound as e:
        await db.rollback()
        raise HTTPException(404, str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"GRN failed: {str(e)}")


@router.post("/orders/{order_id}/approve")
async def approve_po(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == order_id, PurchaseOrder.tenant_id == current_user.tenant_id)
    )
    po = result.scalar_one_or_none()
    if not po: raise HTTPException(404, "PO not found")
    po.status = "approved"
    return po_out(po)


# ── Purchase Order Line Items ─────────────────────────────────────────
class POItem(Base):
    __tablename__ = "purchase_order_items"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    po_id        = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id   = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    product_name = sa.Column(sa.String(300), nullable=False)
    product_sku  = sa.Column(sa.String(100), nullable=True)
    quantity     = sa.Column(sa.Numeric(12,3), default=1, nullable=False)
    unit         = sa.Column(sa.String(30), default="Pcs", nullable=False)
    unit_price   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    tax_pct      = sa.Column(sa.Numeric(5,2), default=18, nullable=False)
    discount_pct = sa.Column(sa.Numeric(5,2), default=0, nullable=False)
    line_total   = sa.Column(sa.Numeric(15,2), default=0, nullable=False)
    hsn_code     = sa.Column(sa.String(20), nullable=True)
    received_qty = sa.Column(sa.Numeric(12,3), default=0, nullable=False)
    notes        = sa.Column(sa.Text, nullable=True)


class POItemCreate(BaseModel):
    product_name: str
    product_sku:  Optional[str] = None
    product_id:   Optional[UUID] = None
    quantity:     float = 1
    unit:         str = "Pcs"
    unit_price:   float = 0
    tax_pct:      float = 18
    discount_pct: float = 0
    hsn_code:     Optional[str] = None
    notes:        Optional[str] = None


def poi_out(i: POItem) -> dict:
    qty  = float(i.quantity or 1)
    up   = float(i.unit_price or 0)
    disc = float(i.discount_pct or 0)
    tax  = float(i.tax_pct or 0)
    sub  = qty * up * (1 - disc / 100)
    tax_amt = sub * tax / 100
    return {
        "id": str(i.id), "po_id": str(i.po_id),
        "product_id": str(i.product_id) if i.product_id else None,
        "product_name": i.product_name, "product_sku": i.product_sku,
        "quantity": qty, "unit": i.unit, "unit_price": float(i.unit_price or 0),
        "tax_pct": tax, "discount_pct": disc, "line_total": float(i.line_total or 0),
        "subtotal": round(sub, 2), "tax_amount": round(tax_amt, 2),
        "hsn_code": i.hsn_code, "received_qty": float(i.received_qty or 0),
        "notes": i.notes,
    }


async def _recalc_po(po_id: UUID, db: AsyncSession):
    result = await db.execute(select(POItem).where(POItem.po_id == po_id))
    items  = result.scalars().all()
    total  = sum(float(i.line_total or 0) for i in items)
    await db.execute(sa.text(
        f"UPDATE purchase_orders SET total_amount={total}, items_count={len(items)} WHERE id='{po_id}'"
    ))


@router.get("/orders/{po_id}")
async def get_po(po_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == current_user.tenant_id))
    po = r.scalar_one_or_none()
    if not po: raise HTTPException(404, "PO not found")
    items_r = await db.execute(select(POItem).where(POItem.po_id == po_id).order_by(POItem.created_at))
    items = items_r.scalars().all()
    result = po_out(po)
    result["items"] = [poi_out(i) for i in items]
    return result


@router.post("/orders/{po_id}/items", status_code=201)
async def add_po_item(po_id: UUID, payload: POItemCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == current_user.tenant_id))
    po = r.scalar_one_or_none()
    if not po: raise HTTPException(404)
    qty  = payload.quantity
    sub  = qty * payload.unit_price * (1 - payload.discount_pct / 100)
    tax  = sub * payload.tax_pct / 100
    item = POItem(
        tenant_id=current_user.tenant_id, po_id=po_id,
        product_name=payload.product_name, product_sku=payload.product_sku,
        product_id=payload.product_id, quantity=qty, unit=payload.unit,
        unit_price=payload.unit_price, tax_pct=payload.tax_pct,
        discount_pct=payload.discount_pct, line_total=round(sub + tax, 2),
        hsn_code=payload.hsn_code, notes=payload.notes,
    )
    db.add(item)
    await db.flush()
    await _recalc_po(po_id, db)
    return poi_out(item)


@router.delete("/orders/{po_id}/items/{item_id}")
async def delete_po_item(po_id: UUID, item_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(POItem).where(POItem.id == item_id, POItem.po_id == po_id))
    item = r.scalar_one_or_none()
    if not item: raise HTTPException(404)
    await db.delete(item)
    await db.flush()
    await _recalc_po(po_id, db)
    return {"success": True}
