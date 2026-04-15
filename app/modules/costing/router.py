"""
FlowERP — Job Costing Module
==============================
Actual cost per work order = Material + Labour + Overhead.
Compare with standard (BOM-based) cost.

Endpoints:
  GET        /costing/work-orders           — all work orders with cost summary
  GET        /costing/work-orders/{id}      — detailed cost sheet
  POST       /costing/work-orders/{id}/labour   — log labour cost
  POST       /costing/work-orders/{id}/overhead  — log overhead
  GET        /costing/products/{id}/cost-sheet   — standard vs actual
  GET        /costing/summary                    — plant cost summary
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/costing", tags=["Costing"])


# ── Models ─────────────────────────────────────────────────────────────
class JobLabour(Base):
    """Labour cost entries for a work order."""
    __tablename__ = "job_labour"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    work_order_id= sa.Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    employee_name= sa.Column(sa.String(200), nullable=False)
    date         = sa.Column(sa.String(20), nullable=False)
    hours        = sa.Column(sa.Numeric(6,2), nullable=False)
    rate_per_hr  = sa.Column(sa.Numeric(10,2), nullable=False)
    amount       = sa.Column(sa.Numeric(12,2), nullable=False)
    notes        = sa.Column(sa.Text, nullable=True)


class JobOverhead(Base):
    """Overhead cost entries for a work order."""
    __tablename__ = "job_overhead"
    tenant_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    work_order_id= sa.Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    category     = sa.Column(sa.String(100), nullable=False)  # electricity|depreciation|rent|misc
    description  = sa.Column(sa.String(300), nullable=True)
    amount       = sa.Column(sa.Numeric(12,2), nullable=False)
    date         = sa.Column(sa.String(20), nullable=False)


# ── Schemas ─────────────────────────────────────────────────────────────
class LabourCreate(BaseModel):
    employee_name: str
    date:          str
    hours:         float
    rate_per_hr:   float
    notes:         Optional[str] = None

class OverheadCreate(BaseModel):
    category:    str
    description: Optional[str] = None
    amount:      float
    date:        str


# ── Cost calculation helper ───────────────────────────────────────────────
async def _get_wo_costs(wo_id: UUID, tenant_id, db: AsyncSession) -> dict:
    """Aggregate all costs for a work order."""
    # Material cost from stock ledger
    mat_result = await db.execute(text(f"""
        SELECT COALESCE(SUM(total_cost), 0) as material_cost
        FROM stock_ledger
        WHERE reference_id = '{wo_id}'
          AND direction = 'out'
          AND movement_type = 'production_issue'
          AND tenant_id = '{tenant_id}'
    """))
    material_cost = float(mat_result.scalar() or 0)

    # Labour cost
    lab_result = await db.execute(select(func.sum(JobLabour.amount)).where(JobLabour.work_order_id == wo_id, JobLabour.tenant_id == tenant_id))
    labour_cost = float(lab_result.scalar() or 0)

    # Overhead
    ovh_result = await db.execute(select(func.sum(JobOverhead.amount)).where(JobOverhead.work_order_id == wo_id, JobOverhead.tenant_id == tenant_id))
    overhead_cost = float(ovh_result.scalar() or 0)

    total_cost = material_cost + labour_cost + overhead_cost
    return {
        "material_cost": round(material_cost, 2),
        "labour_cost":   round(labour_cost, 2),
        "overhead_cost": round(overhead_cost, 2),
        "total_cost":    round(total_cost, 2),
    }


# ── Routes ─────────────────────────────────────────────────────────────
@router.get("/work-orders")
async def list_wo_costs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List work orders with their actual costs."""
    from app.modules.manufacturing.router import WorkOrder
    wos = (await db.execute(
        select(WorkOrder)
        .where(WorkOrder.tenant_id == current_user.tenant_id, WorkOrder.deleted_at.is_(None))
        .order_by(WorkOrder.created_at.desc()).limit(50)
    )).scalars().all()

    result = []
    for wo in wos:
        costs = await _get_wo_costs(wo.id, current_user.tenant_id, db)
        unit_cost = round(costs["total_cost"] / max(wo.quantity, 1), 2) if costs["total_cost"] > 0 else 0
        result.append({
            "id": str(wo.id), "product_name": wo.product_name, "quantity": wo.quantity,
            "unit": wo.unit, "status": wo.status, **costs, "unit_cost": unit_cost,
        })
    return {"items": result, "total": len(result)}


@router.get("/work-orders/{wo_id}")
async def get_wo_cost_sheet(
    wo_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Full cost sheet — BOM standard vs actual incurred."""
    from app.modules.manufacturing.router import WorkOrder
    wo_result = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.tenant_id == current_user.tenant_id))
    wo = wo_result.scalar_one_or_none()
    if not wo: raise HTTPException(404, "Work order not found")

    # Material detail from ledger
    mat_result = await db.execute(text(f"""
        SELECT sl.product_id, ip.name, sl.quantity, sl.unit_cost, sl.total_cost
        FROM stock_ledger sl
        JOIN inventory_products ip ON ip.id = sl.product_id
        WHERE sl.reference_id = '{wo_id}'
          AND sl.direction = 'out'
          AND sl.movement_type = 'production_issue'
          AND sl.tenant_id = '{current_user.tenant_id}'
    """))
    materials = [{"product_id": str(r[0]), "name": r[1], "quantity": r[2], "unit_cost": float(r[3] or 0), "total_cost": float(r[4] or 0)} for r in mat_result.fetchall()]

    # Labour detail
    lab = (await db.execute(select(JobLabour).where(JobLabour.work_order_id == wo_id, JobLabour.tenant_id == current_user.tenant_id))).scalars().all()
    labour = [{"employee_name": l.employee_name, "date": l.date, "hours": float(l.hours), "rate_per_hr": float(l.rate_per_hr), "amount": float(l.amount)} for l in lab]

    # Overhead detail
    ovh = (await db.execute(select(JobOverhead).where(JobOverhead.work_order_id == wo_id, JobOverhead.tenant_id == current_user.tenant_id))).scalars().all()
    overhead = [{"category": o.category, "description": o.description, "amount": float(o.amount), "date": o.date} for o in ovh]

    costs = await _get_wo_costs(wo_id, current_user.tenant_id, db)
    unit_cost = round(costs["total_cost"] / max(wo.quantity, 1), 2)

    # BOM standard cost
    bom_result = await db.execute(text(f"""
        SELECT COALESCE(SUM(bc.quantity * ip.cost_price), 0)
        FROM bom_components bc
        JOIN boms b ON b.id = bc.bom_id
        JOIN inventory_products ip ON ip.id = bc.product_id
        WHERE b.tenant_id = '{current_user.tenant_id}'
          AND b.status = 'active'
          AND b.product_name ILIKE '%{wo.product_name.split("(")[0].strip()}%'
    """))
    bom_standard = float(bom_result.scalar() or 0)
    variance = round(costs["material_cost"] - bom_standard, 2)

    return {
        "work_order": {"id": str(wo.id), "product_name": wo.product_name, "quantity": wo.quantity, "unit": wo.unit, "status": wo.status},
        "costs": costs,
        "unit_cost": unit_cost,
        "materials": materials,
        "labour":    labour,
        "overhead":  overhead,
        "bom_standard_cost": round(bom_standard, 2),
        "material_variance": variance,
        "variance_pct": round((variance / bom_standard * 100) if bom_standard > 0 else 0, 1),
    }


@router.post("/work-orders/{wo_id}/labour", status_code=201)
async def add_labour(wo_id: UUID, payload: LabourCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    amount = Decimal(str(payload.hours)) * Decimal(str(payload.rate_per_hr))
    entry = JobLabour(tenant_id=current_user.tenant_id, work_order_id=wo_id, amount=amount, **payload.model_dump())
    db.add(entry); await db.flush()
    return {"id": str(entry.id), "amount": float(amount), **payload.model_dump()}


@router.post("/work-orders/{wo_id}/overhead", status_code=201)
async def add_overhead(wo_id: UUID, payload: OverheadCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    entry = JobOverhead(tenant_id=current_user.tenant_id, work_order_id=wo_id, **payload.model_dump())
    db.add(entry); await db.flush()
    return {"id": str(entry.id), **payload.model_dump()}


@router.get("/summary")
async def cost_summary(
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Plant-level cost summary by month."""
    result = await db.execute(text(f"""
        SELECT
            EXTRACT(MONTH FROM sl.created_at)::int AS month,
            SUM(CASE WHEN sl.movement_type='production_issue' THEN sl.total_cost ELSE 0 END) AS material_cost,
            COUNT(DISTINCT sl.reference_id) AS work_orders
        FROM stock_ledger sl
        WHERE sl.tenant_id = '{current_user.tenant_id}'
          AND EXTRACT(YEAR FROM sl.created_at) = {year}
          AND sl.direction = 'out'
        GROUP BY 1 ORDER BY 1
    """))
    monthly = [{"month": r[0], "material_cost": float(r[1] or 0), "work_orders": int(r[2] or 0)} for r in result.fetchall()]

    labour_total = (await db.execute(select(func.sum(JobLabour.amount)).where(JobLabour.tenant_id == current_user.tenant_id))).scalar()
    overhead_total = (await db.execute(select(func.sum(JobOverhead.amount)).where(JobOverhead.tenant_id == current_user.tenant_id))).scalar()

    return {
        "year": year,
        "monthly_material": monthly,
        "total_labour":     round(float(labour_total or 0), 2),
        "total_overhead":   round(float(overhead_total or 0), 2),
    }
