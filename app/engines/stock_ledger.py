"""
FlowERP — Stock Ledger Engine
==============================
Core rules:
  1. IMMUTABLE — ledger entries are never updated or deleted
  2. NO NEGATIVE STOCK — raises StockInsufficientError before posting
  3. WAC COSTING — Weighted Average Cost recalculated on every receipt
  4. ATOMIC — all DB writes happen in one transaction

Movement types:
  purchase_receipt  — goods received from vendor (GRN)
  sales_issue       — goods issued for a sales order
  production_issue  — raw materials consumed by work order
  production_receipt— finished goods added from work order
  stock_adjustment  — manual correction (requires reason)
  transfer_out      — moved from this warehouse
  transfer_in       — moved to this warehouse
  opening_stock     — initial stock entry
  return_to_vendor  — goods returned to supplier
  customer_return   — goods returned by customer
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import Base


# ── Model ─────────────────────────────────────────────────────────────
class StockLedger(Base):
    """Immutable double-entry stock journal."""
    __tablename__ = "stock_ledger"

    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id   = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("inventory_products.id", ondelete="CASCADE"), nullable=False, index=True)

    # Movement direction & quantity
    movement_type = sa.Column(sa.String(50),    nullable=False, index=True)
    quantity      = sa.Column(sa.Integer,        nullable=False)  # always positive; direction from movement_type
    direction     = sa.Column(sa.String(4),      nullable=False)  # 'in' | 'out'

    # Costing
    unit_cost        = sa.Column(sa.Numeric(15,4), default=0, nullable=False)
    total_cost       = sa.Column(sa.Numeric(15,4), default=0, nullable=False)
    wac_after        = sa.Column(sa.Numeric(15,4), default=0, nullable=False)  # WAC after this entry
    stock_after      = sa.Column(sa.Integer,       nullable=False)              # running balance

    # Reference
    reference_type   = sa.Column(sa.String(50), nullable=True)   # 'sales_order','work_order','purchase_order'
    reference_id     = sa.Column(sa.String(50), nullable=True)    # UUID as string
    reference_number = sa.Column(sa.String(100), nullable=True)   # human-readable e.g. SO-0041

    # Audit
    notes            = sa.Column(sa.Text, nullable=True)
    created_by       = sa.Column(sa.String(200), nullable=True)


# ── Exceptions ────────────────────────────────────────────────────────
class StockInsufficientError(Exception):
    def __init__(self, product_name: str, available: int, requested: int):
        self.product_name = product_name
        self.available    = available
        self.requested    = requested
        super().__init__(
            f"Insufficient stock for '{product_name}': "
            f"available={available}, requested={requested}"
        )


class StockProductNotFound(Exception):
    pass


# ── Core engine ───────────────────────────────────────────────────────
async def post_stock_movement(
    db:              AsyncSession,
    tenant_id:       UUID,
    product_id:      UUID,
    movement_type:   str,
    quantity:        int,
    direction:       str,           # 'in' | 'out'
    unit_cost:       Decimal = Decimal("0"),
    reference_type:  Optional[str] = None,
    reference_id:    Optional[str] = None,
    reference_number:Optional[str] = None,
    notes:           Optional[str] = None,
    created_by:      Optional[str] = None,
    allow_negative:  bool = False,
) -> StockLedger:
    """
    Post a stock movement atomically.
    - Fetches current product stock/WAC inside the same transaction (FOR UPDATE)
    - Enforces no-negative-stock unless allow_negative=True
    - Recalculates WAC on receipts
    - Appends immutable ledger entry
    - Updates inventory_products.stock and cost_price (WAC)
    """
    from sqlalchemy import text

    if quantity <= 0:
        raise ValueError(f"Quantity must be positive, got {quantity}")
    if direction not in ("in", "out"):
        raise ValueError(f"Direction must be 'in' or 'out', got {direction}")

    # Lock the product row to prevent race conditions
    result = await db.execute(
        text("SELECT id, name, stock, cost_price FROM inventory_products "
             "WHERE id = :pid AND tenant_id = :tid AND deleted_at IS NULL "
             "FOR UPDATE"),
        {"pid": str(product_id), "tid": str(tenant_id)},
    )
    row = result.fetchone()
    if not row:
        raise StockProductNotFound(f"Product {product_id} not found")

    product_name    = row[1]
    current_stock   = int(row[2] or 0)
    current_wac     = Decimal(str(row[3] or "0"))

    # ── No-negative check ──────────────────────────────────────────────
    if direction == "out" and not allow_negative:
        if current_stock < quantity:
            raise StockInsufficientError(product_name, current_stock, quantity)

    # ── WAC recalculation (only on receipts) ──────────────────────────
    if direction == "in" and unit_cost > 0:
        old_value = current_wac * Decimal(str(current_stock))
        new_value = unit_cost   * Decimal(str(quantity))
        new_stock = current_stock + quantity
        new_wac   = (old_value + new_value) / Decimal(str(new_stock)) if new_stock > 0 else unit_cost
    else:
        new_wac   = current_wac
        if unit_cost == 0:
            unit_cost = current_wac  # use WAC for outgoing costing

    # ── New stock balance ──────────────────────────────────────────────
    if direction == "in":
        stock_after = current_stock + quantity
    else:
        stock_after = current_stock - quantity

    total_cost = unit_cost * Decimal(str(quantity))

    # ── Write ledger entry ─────────────────────────────────────────────
    entry = StockLedger(
        tenant_id        = tenant_id,
        product_id       = product_id,
        movement_type    = movement_type,
        quantity         = quantity,
        direction        = direction,
        unit_cost        = unit_cost,
        total_cost       = total_cost,
        wac_after        = new_wac,
        stock_after      = stock_after,
        reference_type   = reference_type,
        reference_id     = reference_id,
        reference_number = reference_number,
        notes            = notes,
        created_by       = created_by,
    )
    db.add(entry)

    # ── Update inventory_products stock + WAC ─────────────────────────
    await db.execute(
        text("""
            UPDATE inventory_products
            SET    stock      = :new_stock,
                   cost_price = :new_wac,
                   updated_at = now()
            WHERE  id = :pid AND tenant_id = :tid
        """),
        {
            "new_stock": stock_after,
            "new_wac":   float(new_wac),
            "pid":       str(product_id),
            "tid":       str(tenant_id),
        },
    )

    return entry


async def post_bom_consumption(
    db:             AsyncSession,
    tenant_id:      UUID,
    bom_items:      list[dict],   # [{"product_id": UUID, "quantity": int}, ...]
    work_order_id:  str,
    work_order_ref: str,
    created_by:     str,
) -> list[StockLedger]:
    """
    Consume all BOM components for a work order completion.
    Checks ALL items for sufficient stock first, then posts all movements.
    If any item is insufficient → raises StockInsufficientError with no DB changes.
    """
    from sqlalchemy import text

    # Pre-flight: check every component has enough stock
    for item in bom_items:
        result = await db.execute(
            text("SELECT name, stock FROM inventory_products WHERE id = :pid AND tenant_id = :tid"),
            {"pid": str(item["product_id"]), "tid": str(tenant_id)},
        )
        row = result.fetchone()
        if not row:
            raise StockProductNotFound(f"Product {item['product_id']} not found in BOM")
        if row[1] < item["quantity"]:
            raise StockInsufficientError(row[0], row[1], item["quantity"])

    # Post all movements
    entries = []
    for item in bom_items:
        entry = await post_stock_movement(
            db             = db,
            tenant_id      = tenant_id,
            product_id     = item["product_id"],
            movement_type  = "production_issue",
            quantity       = item["quantity"],
            direction      = "out",
            reference_type = "work_order",
            reference_id   = work_order_id,
            reference_number = work_order_ref,
            notes          = f"BOM consumption for {work_order_ref}",
            created_by     = created_by,
        )
        entries.append(entry)

    return entries


async def get_product_ledger(
    db:         AsyncSession,
    tenant_id:  UUID,
    product_id: UUID,
    limit:      int = 100,
) -> list[dict]:
    """Fetch ledger history for a single product, newest first."""
    result = await db.execute(
        select(StockLedger)
        .where(StockLedger.tenant_id == tenant_id, StockLedger.product_id == product_id)
        .order_by(StockLedger.created_at.desc())
        .limit(limit)
    )
    entries = result.scalars().all()
    return [_ledger_out(e) for e in entries]


def _ledger_out(e: StockLedger) -> dict:
    return {
        "id":               str(e.id),
        "movement_type":    e.movement_type,
        "direction":        e.direction,
        "quantity":         e.quantity,
        "unit_cost":        float(e.unit_cost or 0),
        "total_cost":       float(e.total_cost or 0),
        "wac_after":        float(e.wac_after or 0),
        "stock_after":      e.stock_after,
        "reference_type":   e.reference_type,
        "reference_id":     e.reference_id,
        "reference_number": e.reference_number,
        "notes":            e.notes,
        "created_by":       e.created_by,
        "created_at":       e.created_at.isoformat() if e.created_at else "",
    }
