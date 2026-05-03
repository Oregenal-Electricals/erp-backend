"""
FlowERP — Dashboard Module (Live Data)
========================================
Pulls real KPIs from every module in real-time.

GET /dashboard/summary      — main KPI cards
GET /dashboard/alerts       — low stock + overdue invoices + pending approvals
GET /dashboard/revenue      — monthly revenue trend (12 months)
GET /dashboard/modules      — per-module record counts
GET /dashboard/recent-orders— latest 5 sales orders
"""
from datetime import datetime, date
from typing import Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def _scalar(db, sql: str) -> float:
    try:
        result = await db.execute(text(sql))
        return float(result.scalar() or 0)
    except Exception:
        return 0.0


async def _int(db, sql: str) -> int:
    try:
        result = await db.execute(text(sql))
        return int(result.scalar() or 0)
    except Exception:
        return 0


@router.get("/summary")
async def dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    tid = str(current_user.tenant_id)
    now = datetime.now()
    this_month_start = f"{now.year}-{now.month:02d}-01"
    last_month_end   = f"{now.year}-{now.month - 1 if now.month > 1 else 12:02d}-{28}"
    last_month_start = f"{now.year if now.month > 1 else now.year - 1}-{now.month - 1 if now.month > 1 else 12:02d}-01"

    # ── Revenue ──────────────────────────────────────────────────────
    this_rev = await _scalar(db, f"""
        SELECT COALESCE(SUM(total_amount),0) FROM sales_orders
        WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
        AND order_date >= '{this_month_start}'
        AND deleted_at IS NULL
    """)
    last_rev = await _scalar(db, f"""
        SELECT COALESCE(SUM(total_amount),0) FROM sales_orders
        WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
        AND order_date >= '{last_month_start}' AND order_date <= '{last_month_end}'
        AND deleted_at IS NULL
    """)
    rev_change = round((this_rev - last_rev) / last_rev * 100, 1) if last_rev > 0 else 0

    # ── Orders ───────────────────────────────────────────────────────
    this_orders = await _int(db, f"""
        SELECT COUNT(*) FROM sales_orders
        WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
        AND order_date >= '{this_month_start}' AND deleted_at IS NULL
    """)
    last_orders = await _int(db, f"""
        SELECT COUNT(*) FROM sales_orders
        WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
        AND order_date >= '{last_month_start}' AND order_date <= '{last_month_end}'
        AND deleted_at IS NULL
    """)
    orders_change = round((this_orders - last_orders) / last_orders * 100, 1) if last_orders > 0 else 0

    # ── Inventory ────────────────────────────────────────────────────
    active_products  = await _int(db, f"SELECT COUNT(*) FROM inventory_products WHERE tenant_id='{tid}' AND status='active' AND deleted_at IS NULL")
    low_stock        = await _int(db, f"SELECT COUNT(*) FROM inventory_products WHERE tenant_id='{tid}' AND stock <= reorder_point AND status='active' AND deleted_at IS NULL")

    # ── Manufacturing ────────────────────────────────────────────────
    open_work_orders = await _int(db, f"SELECT COUNT(*) FROM work_orders WHERE tenant_id='{tid}' AND status NOT IN ('completed','cancelled')")
    qc_pending       = await _int(db, f"SELECT COUNT(*) FROM work_orders WHERE tenant_id='{tid}' AND status='qc_pending'")

    # ── AR Outstanding ────────────────────────────────────────────────
    ar_outstanding = await _scalar(db, f"""
        SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount,0)), 0)
        FROM sales_orders WHERE tenant_id='{tid}'
        AND status NOT IN ('draft','cancelled')
        AND total_amount > COALESCE(paid_amount,0)
        AND deleted_at IS NULL
    """)

    # ── Pending leaves ────────────────────────────────────────────────
    pending_leaves = await _int(db, f"SELECT COUNT(*) FROM leave_requests WHERE tenant_id='{tid}' AND status='pending'")

    # ── CRM ───────────────────────────────────────────────────────────
    active_leads   = await _int(db, f"SELECT COUNT(*) FROM crm_leads WHERE tenant_id='{tid}' AND stage NOT IN ('won','lost') AND deleted_at IS NULL")
    pipeline_value = await _scalar(db, f"SELECT COALESCE(SUM(estimated_value * probability / 100.0),0) FROM crm_leads WHERE tenant_id='{tid}' AND stage NOT IN ('won','lost') AND deleted_at IS NULL")

    return {
        # Revenue
        "monthly_revenue":     round(this_rev, 2),
        "revenue_change":      rev_change,
        # Orders
        "total_orders":        this_orders,
        "orders_change":       orders_change,
        # Inventory
        "active_products":     active_products,
        "low_stock_count":     low_stock,
        "stock_change":        round(-low_stock / active_products * 100, 1) if active_products > 0 else 0,
        # Manufacturing
        "work_orders":         open_work_orders,
        "qc_pending":          qc_pending,
        # Finance
        "ar_outstanding":      round(ar_outstanding, 2),
        # HR
        "pending_leaves":      pending_leaves,
        # CRM
        "active_leads":        active_leads,
        "pipeline_value":      round(pipeline_value, 2),
    }


@router.get("/alerts")
async def dashboard_alerts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    tid   = str(current_user.tenant_id)
    today = date.today().isoformat()
    alerts = []

    # Low stock products
    try:
        result = await db.execute(text(f"""
            SELECT name, stock, reorder_point FROM inventory_products
            WHERE tenant_id='{tid}' AND stock <= reorder_point AND status='active' AND deleted_at IS NULL
            ORDER BY (reorder_point - stock) DESC LIMIT 5
        """))
        for row in result.fetchall():
            alerts.append({
                "id": f"ls_{row[0]}", "type": "warning",
                "message": f"Low stock: {row[0]} ({int(row[1] or 0)} left, reorder at {int(row[2] or 0)})",
                "link": "/inventory", "time": "now",
            })
    except Exception:
        pass

    # Overdue invoices
    try:
        result = await db.execute(text(f"""
            SELECT customer_name, order_number, total_amount - COALESCE(paid_amount,0) as balance
            FROM sales_orders
            WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
            AND total_amount > COALESCE(paid_amount,0)
            AND delivery_date < '{today}' AND deleted_at IS NULL
            ORDER BY delivery_date ASC LIMIT 3
        """))
        for row in result.fetchall():
            alerts.append({
                "id": f"od_{row[1]}", "type": "danger",
                "message": f"Overdue: {row[1]} from {row[0]} — ₹{int(row[2] or 0):,}",
                "link": "/accounts", "time": "overdue",
            })
    except Exception:
        pass

    # Pending PO approvals
    try:
        result = await db.execute(text(f"""
            SELECT order_number, vendor_name, total_amount FROM purchase_orders
            WHERE tenant_id='{tid}' AND status='draft' AND deleted_at IS NULL
            ORDER BY created_at DESC LIMIT 3
        """))
        for row in result.fetchall():
            alerts.append({
                "id": f"po_{row[0]}", "type": "info",
                "message": f"PO {row[0]} from {row[1]} needs approval — ₹{int(row[2] or 0):,}",
                "link": "/purchase", "time": "pending",
            })
    except Exception:
        pass

    # QC failures
    try:
        result = await db.execute(text(f"""
            SELECT COUNT(*) FROM qc_inspections
            WHERE tenant_id='{tid}' AND result='fail' AND created_at::date = '{today}'
        """))
        count = int(result.scalar() or 0)
        if count > 0:
            alerts.append({
                "id": "qc_fail", "type": "danger",
                "message": f"{count} QC inspection(s) failed today",
                "link": "/qc", "time": "today",
            })
    except Exception:
        pass

    # Pending leave requests
    try:
        count = await _int(db, f"SELECT COUNT(*) FROM leave_requests WHERE tenant_id='{tid}' AND status='pending'")
        if count > 0:
            alerts.append({
                "id": "leaves", "type": "info",
                "message": f"{count} leave request(s) pending approval",
                "link": "/hr/leaves", "time": "pending",
            })
    except Exception:
        pass

    return {"items": alerts, "total": len(alerts)}


@router.get("/revenue")
async def revenue_trend(
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Monthly revenue + order count for the full year."""
    tid = str(current_user.tenant_id)
    months = []
    for m in range(1, 13):
        import calendar as cal
        last_day = cal.monthrange(year, m)[1]
        start = f"{year}-{m:02d}-01"
        end   = f"{year}-{m:02d}-{last_day}"
        rev = await _scalar(db, f"""
            SELECT COALESCE(SUM(total_amount),0) FROM sales_orders
            WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
            AND order_date >= '{start}' AND order_date <= '{end}' AND deleted_at IS NULL
        """)
        orders = await _int(db, f"""
            SELECT COUNT(*) FROM sales_orders
            WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
            AND order_date >= '{start}' AND order_date <= '{end}' AND deleted_at IS NULL
        """)
        purchases = await _scalar(db, f"""
            SELECT COALESCE(SUM(total_amount),0) FROM purchase_orders
            WHERE tenant_id='{tid}' AND status NOT IN ('draft','cancelled')
            AND order_date >= '{start}' AND order_date <= '{end}' AND deleted_at IS NULL
        """)
        months.append({
            "month":        m,
            "month_name":   datetime(year, m, 1).strftime("%b"),
            "revenue":      round(rev, 2),
            "orders":       orders,
            "purchases":    round(purchases, 2),
            "gross_profit": round(rev * 0.40, 2),  # 40% gross margin estimate
        })
    return {"year": year, "months": months}


@router.get("/modules")
async def module_counts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Record counts per module for the module overview widget."""
    tid = str(current_user.tenant_id)
    tables = [
        ("crm_leads",          "CRM Leads",        "/crm"),
        ("sales_orders",       "Sales Orders",      "/sales"),
        ("purchase_orders",    "Purchase Orders",   "/purchase"),
        ("inventory_products", "Products",          "/inventory"),
        ("work_orders",        "Work Orders",       "/manufacturing"),
        ("qc_inspections",     "QC Inspections",    "/qc"),
        ("hr_employees",       "Employees",         "/hr"),
        ("customers",          "Customers",         "/sales/customers"),
        ("vendors",            "Vendors",           "/purchase/vendors"),
        ("delivery_challans",  "Deliveries",        "/dispatch"),
    ]
    counts = []
    for table, label, link in tables:
        try:
            n = await _int(db, f"SELECT COUNT(*) FROM {table} WHERE tenant_id='{tid}'")
            counts.append({"module": label, "count": n, "link": link})
        except Exception:
            counts.append({"module": label, "count": 0, "link": link})
    return {"modules": counts}


@router.get("/recent-orders")
async def recent_orders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Latest 5 sales orders for the dashboard widget."""
    tid = str(current_user.tenant_id)
    try:
        result = await db.execute(text(f"""
            SELECT id, order_number, customer_name, total_amount, status, created_at
            FROM sales_orders WHERE tenant_id='{tid}' AND deleted_at IS NULL
            ORDER BY created_at DESC LIMIT 5
        """))
        rows = result.fetchall()
        return {
            "items": [{
                "id": str(r[0]), "order_number": r[1], "customer_name": r[2],
                "total_amount": float(r[3] or 0), "status": r[4],
                "created_at": r[5].isoformat() if r[5] else "",
            } for r in rows],
            "total": len(rows),
        }
    except Exception:
        return {"items": [], "total": 0}
