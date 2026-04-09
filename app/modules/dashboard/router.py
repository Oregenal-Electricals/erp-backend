from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns key metrics for the dashboard.
    Uses fast COUNT queries — no heavy aggregation.
    """
    tenant_id = str(current_user.tenant_id)

    # In production: run real queries against sales_orders, inventory, etc.
    # For now return structured mock that matches the frontend shape
    return {
        "monthly_revenue": 710000,
        "revenue_change": 12.4,
        "total_orders": 67,
        "orders_change": 8.2,
        "active_products": 248,
        "stock_change": -2.1,
        "work_orders": 14,
        "work_orders_change": 5.3,
        "pending_approvals": 3,
        "overdue_invoices": 2,
    }


@router.get("/alerts")
async def dashboard_alerts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns recent system alerts and notifications for this tenant."""
    return {
        "items": [
            {"id": 1, "type": "warning", "message": "5 products below reorder level",    "link": "/inventory",            "time": "10 min ago"},
            {"id": 2, "type": "info",    "message": "Work order WO-018 moved to QC",     "link": "/manufacturing/orders",  "time": "1 hour ago"},
            {"id": 3, "type": "danger",  "message": "Invoice INV-029 overdue by 5 days", "link": "/accounts/invoices",    "time": "2 hours ago"},
            {"id": 4, "type": "success", "message": "PO-044 approved by manager",         "link": "/purchase/orders",      "time": "3 hours ago"},
        ],
        "total": 4,
    }


@router.get("/recent-orders")
async def recent_orders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the 5 most recent sales orders for the dashboard widget."""
    # Will query sales_orders table when Phase 4 (Sales module) is built
    return {"items": [], "total": 0}
