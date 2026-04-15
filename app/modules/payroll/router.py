"""
FlowERP — Payroll Module
==========================
Endpoints:
  GET/POST   /payroll/salary-structures
  GET/POST   /payroll/run              — run monthly payroll
  GET        /payroll/runs             — list all payroll runs
  GET        /payroll/runs/{id}        — run details with payslips
  GET        /payroll/payslips/{emp_id} — employee payslip history
  POST       /payroll/runs/{id}/approve
  POST       /payroll/runs/{id}/disburse
"""
import math
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/payroll", tags=["Payroll"])


# ── Models ─────────────────────────────────────────────────────────────
class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id     = sa.Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    employee_name   = sa.Column(sa.String(300), nullable=False)
    effective_from  = sa.Column(sa.String(20), nullable=False)
    # CTC components
    basic           = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    hra             = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    special_allowance = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    conveyance      = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    pf_employee     = sa.Column(sa.Numeric(12,2), default=0, nullable=False)   # 12% of basic
    pf_employer     = sa.Column(sa.Numeric(12,2), default=0, nullable=False)   # 12% of basic
    esi_employee    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)   # 0.75% of gross
    esi_employer    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)   # 3.25% of gross
    pt              = sa.Column(sa.Numeric(12,2), default=200, nullable=False) # Professional Tax
    gross_salary    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    net_salary      = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    is_active       = sa.Column(sa.Boolean, default=True, nullable=False)


class PayrollRun(Base):
    __tablename__ = "payroll_runs"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    month           = sa.Column(sa.Integer, nullable=False)
    year            = sa.Column(sa.Integer, nullable=False)
    status          = sa.Column(sa.String(20), default="draft", nullable=False)
    # draft → approved → disbursed
    total_employees = sa.Column(sa.Integer, default=0, nullable=False)
    total_gross     = sa.Column(sa.Numeric(14,2), default=0, nullable=False)
    total_net       = sa.Column(sa.Numeric(14,2), default=0, nullable=False)
    total_pf        = sa.Column(sa.Numeric(14,2), default=0, nullable=False)
    total_esi       = sa.Column(sa.Numeric(14,2), default=0, nullable=False)
    approved_by     = sa.Column(sa.String(200), nullable=True)
    disbursed_date  = sa.Column(sa.String(20), nullable=True)
    notes           = sa.Column(sa.Text, nullable=True)


class Payslip(Base):
    __tablename__ = "payslips"
    tenant_id       = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id          = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id     = sa.Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    employee_name   = sa.Column(sa.String(300), nullable=False)
    month           = sa.Column(sa.Integer, nullable=False)
    year            = sa.Column(sa.Integer, nullable=False)
    working_days    = sa.Column(sa.Integer, default=26, nullable=False)
    present_days    = sa.Column(sa.Integer, default=26, nullable=False)
    lop_days        = sa.Column(sa.Integer, default=0, nullable=False)  # Loss of Pay
    # Earnings
    basic           = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    hra             = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    special_allowance = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    conveyance      = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    overtime        = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    bonus           = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    gross_earned    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    # Deductions
    pf_deduction    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    esi_deduction   = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    pt_deduction    = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    tds             = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    other_deduction = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    total_deductions= sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    net_pay         = sa.Column(sa.Numeric(12,2), default=0, nullable=False)
    bank_account    = sa.Column(sa.String(50), nullable=True)
    status          = sa.Column(sa.String(20), default="pending", nullable=False)


# ── Schemas ─────────────────────────────────────────────────────────────
class SalaryStructureCreate(BaseModel):
    employee_id:    UUID
    employee_name:  str
    effective_from: str
    basic:          float
    hra:            Optional[float] = None        # default 40% of basic
    special_allowance: float = 0
    conveyance:     float = 1600
    pt:             float = 200

class PayrollRunCreate(BaseModel):
    month:  int
    year:   int
    notes:  Optional[str] = None

class PayslipAdjust(BaseModel):
    employee_id:    UUID
    lop_days:       int = 0
    overtime:       float = 0
    bonus:          float = 0
    other_deduction:float = 0
    tds:            float = 0


def _compute_structure(basic: float, hra: Optional[float], special: float, conv: float, pt: float) -> dict:
    basic = Decimal(str(basic))
    if hra is None:
        hra = basic * Decimal("0.4")   # 40% of basic
    else:
        hra = Decimal(str(hra))
    special   = Decimal(str(special))
    conv      = Decimal(str(conv))
    pt        = Decimal(str(pt))
    gross     = basic + hra + special + conv
    pf_emp    = (basic * Decimal("0.12")).quantize(Decimal("0.01"))
    pf_er     = pf_emp
    esi_emp   = (gross * Decimal("0.0075")).quantize(Decimal("0.01"))
    esi_er    = (gross * Decimal("0.0325")).quantize(Decimal("0.01"))
    net       = gross - pf_emp - esi_emp - pt
    return {
        "basic": float(basic), "hra": float(hra), "special_allowance": float(special),
        "conveyance": float(conv), "pt": float(pt),
        "pf_employee": float(pf_emp), "pf_employer": float(pf_er),
        "esi_employee": float(esi_emp), "esi_employer": float(esi_er),
        "gross_salary": float(gross), "net_salary": float(net),
    }


def ss_out(s: SalaryStructure) -> dict:
    return {"id": str(s.id), "employee_id": str(s.employee_id), "employee_name": s.employee_name,
            "effective_from": s.effective_from, "basic": float(s.basic), "hra": float(s.hra),
            "special_allowance": float(s.special_allowance), "conveyance": float(s.conveyance),
            "pf_employee": float(s.pf_employee), "pf_employer": float(s.pf_employer),
            "esi_employee": float(s.esi_employee), "esi_employer": float(s.esi_employer),
            "pt": float(s.pt), "gross_salary": float(s.gross_salary), "net_salary": float(s.net_salary),
            "is_active": s.is_active}

def run_out(r: PayrollRun) -> dict:
    return {"id": str(r.id), "month": r.month, "year": r.year, "status": r.status,
            "total_employees": r.total_employees, "total_gross": float(r.total_gross),
            "total_net": float(r.total_net), "total_pf": float(r.total_pf),
            "total_esi": float(r.total_esi), "approved_by": r.approved_by,
            "disbursed_date": r.disbursed_date, "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else ""}

def payslip_out(p: Payslip) -> dict:
    return {"id": str(p.id), "run_id": str(p.run_id), "employee_id": str(p.employee_id),
            "employee_name": p.employee_name, "month": p.month, "year": p.year,
            "working_days": p.working_days, "present_days": p.present_days, "lop_days": p.lop_days,
            "basic": float(p.basic), "hra": float(p.hra), "special_allowance": float(p.special_allowance),
            "conveyance": float(p.conveyance), "overtime": float(p.overtime), "bonus": float(p.bonus),
            "gross_earned": float(p.gross_earned), "pf_deduction": float(p.pf_deduction),
            "esi_deduction": float(p.esi_deduction), "pt_deduction": float(p.pt_deduction),
            "tds": float(p.tds), "other_deduction": float(p.other_deduction),
            "total_deductions": float(p.total_deductions), "net_pay": float(p.net_pay),
            "status": p.status}


# ── Salary Structure ────────────────────────────────────────────────────
@router.get("/salary-structures")
async def list_structures(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    q = select(SalaryStructure).where(SalaryStructure.tenant_id == current_user.tenant_id, SalaryStructure.is_active == True)
    items = (await db.execute(q.order_by(SalaryStructure.employee_name))).scalars().all()
    return {"items": [ss_out(i) for i in items], "total": len(items)}


@router.post("/salary-structures", status_code=201)
async def create_structure(payload: SalaryStructureCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    computed = _compute_structure(payload.basic, payload.hra, payload.special_allowance, payload.conveyance, payload.pt)
    # Deactivate old structure for same employee
    await db.execute(sa.text(f"UPDATE salary_structures SET is_active=false WHERE employee_id='{payload.employee_id}' AND tenant_id='{current_user.tenant_id}'"))
    ss = SalaryStructure(tenant_id=current_user.tenant_id, employee_id=payload.employee_id, employee_name=payload.employee_name, effective_from=payload.effective_from, **computed)
    db.add(ss); await db.flush()
    return ss_out(ss)


# ── Payroll Run ─────────────────────────────────────────────────────────
@router.get("/runs")
async def list_runs(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    items = (await db.execute(select(PayrollRun).where(PayrollRun.tenant_id == current_user.tenant_id).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()))).scalars().all()
    return {"items": [run_out(i) for i in items], "total": len(items)}


@router.post("/run", status_code=201)
async def run_payroll(payload: PayrollRunCreate, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Generate payroll for all employees with active salary structures."""
    # Check no duplicate run
    existing = await db.execute(select(PayrollRun).where(PayrollRun.tenant_id == current_user.tenant_id, PayrollRun.month == payload.month, PayrollRun.year == payload.year))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Payroll for {payload.month}/{payload.year} already exists")

    # Create run
    run = PayrollRun(tenant_id=current_user.tenant_id, month=payload.month, year=payload.year, notes=payload.notes)
    db.add(run); await db.flush()

    # Fetch all active structures
    structures = (await db.execute(select(SalaryStructure).where(SalaryStructure.tenant_id == current_user.tenant_id, SalaryStructure.is_active == True))).scalars().all()

    total_gross = Decimal("0"); total_net = Decimal("0"); total_pf = Decimal("0"); total_esi = Decimal("0")
    import calendar; working_days = len([d for d in range(1, calendar.monthrange(payload.year, payload.month)[1]+1) if datetime(payload.year, payload.month, d).weekday() < 5])

    for ss in structures:
        gross   = Decimal(str(ss.gross_salary))
        pf_ded  = Decimal(str(ss.pf_employee))
        esi_ded = Decimal(str(ss.esi_employee))
        pt_ded  = Decimal(str(ss.pt))
        total_ded = pf_ded + esi_ded + pt_ded
        net     = gross - total_ded

        slip = Payslip(
            tenant_id=current_user.tenant_id, run_id=run.id,
            employee_id=ss.employee_id, employee_name=ss.employee_name,
            month=payload.month, year=payload.year, working_days=working_days, present_days=working_days,
            basic=ss.basic, hra=ss.hra, special_allowance=ss.special_allowance, conveyance=ss.conveyance,
            gross_earned=gross, pf_deduction=pf_ded, esi_deduction=esi_ded, pt_deduction=pt_ded,
            total_deductions=total_ded, net_pay=net,
        )
        db.add(slip)
        total_gross += gross; total_net += net; total_pf += pf_ded; total_esi += esi_ded

    run.total_employees = len(structures)
    run.total_gross     = total_gross
    run.total_net       = total_net
    run.total_pf        = total_pf
    run.total_esi       = total_esi
    await db.flush()
    return run_out(run)


@router.get("/runs/{run_id}")
async def get_run(run_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id, PayrollRun.tenant_id == current_user.tenant_id))
    run = r.scalar_one_or_none()
    if not run: raise HTTPException(404)
    slips = (await db.execute(select(Payslip).where(Payslip.run_id == run_id).order_by(Payslip.employee_name))).scalars().all()
    result = run_out(run)
    result["payslips"] = [payslip_out(s) for s in slips]
    return result


@router.post("/runs/{run_id}/approve")
async def approve_run(run_id: UUID, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id, PayrollRun.tenant_id == current_user.tenant_id))
    run = r.scalar_one_or_none()
    if not run: raise HTTPException(404)
    run.status      = "approved"
    run.approved_by = current_user.name
    return run_out(run)


@router.post("/runs/{run_id}/disburse")
async def disburse_run(run_id: UUID, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id, PayrollRun.tenant_id == current_user.tenant_id))
    run = r.scalar_one_or_none()
    if not run: raise HTTPException(404)
    if run.status != "approved": raise HTTPException(409, "Payroll must be approved before disbursement")
    run.status         = "disbursed"
    run.disbursed_date = datetime.now().strftime("%Y-%m-%d")
    # Mark all payslips as paid
    await db.execute(sa.text(f"UPDATE payslips SET status='paid' WHERE run_id='{run_id}'"))
    return run_out(run)


@router.get("/payslips/employee/{emp_id}")
async def employee_payslips(emp_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    items = (await db.execute(select(Payslip).where(Payslip.employee_id == emp_id, Payslip.tenant_id == current_user.tenant_id).order_by(Payslip.year.desc(), Payslip.month.desc()))).scalars().all()
    return {"items": [payslip_out(i) for i in items], "total": len(items)}
