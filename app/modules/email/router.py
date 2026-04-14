"""
FlowERP — Email API Router
===========================
POST /email/invoice/{order_id}      — send invoice to customer
POST /email/po/{order_id}           — send PO to vendor
POST /email/low-stock               — send low stock report to purchase team
POST /email/approval/{doc_type}/{id}— request approval
POST /email/test                    — test email config
GET  /email/config                  — get email config (no secrets)
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.modules.email.service import (
    send_invoice_email, send_po_to_vendor,
    send_low_stock_alert, send_approval_request,
    send_welcome_email, EMAIL_PROVIDER,
)
from app.modules.sales.router import SalesOrder
from app.modules.purchase.router import PurchaseOrder
from app.modules.stock_ledger.router import InventoryProduct

router = APIRouter(prefix="/email", tags=["Email Notifications"])


class TestEmailRequest(BaseModel):
    to: str


class POEmailRequest(BaseModel):
    vendor_email: str
    include_items: bool = True


class InvoiceEmailRequest(BaseModel):
    customer_email: Optional[str] = None  # override if different from order email


# ── Config check ─────────────────────────────────────────────────────
@router.get("/config")
async def get_email_config(current_user: User = Depends(require_admin)):
    """Returns email provider config (never exposes credentials)."""
    import os
    return {
        "provider":      EMAIL_PROVIDER,
        "from_email":    os.getenv("EMAIL_FROM", "not configured"),
        "from_name":     os.getenv("EMAIL_FROM_NAME", "FlowERP"),
        "smtp_host":     os.getenv("SMTP_HOST", "") if EMAIL_PROVIDER == "smtp" else None,
        "aws_region":    os.getenv("AWS_REGION", "") if EMAIL_PROVIDER == "ses" else None,
        "is_configured": EMAIL_PROVIDER != "disabled",
        "note": "Set EMAIL_PROVIDER=smtp or ses in .env to enable. See docs for config options.",
    }


# ── Test email ────────────────────────────────────────────────────────
@router.post("/test")
async def send_test_email(
    payload: TestEmailRequest,
    bg: BackgroundTasks,
    current_user: User = Depends(require_admin),
):
    from app.modules.email.service import send_email, _wrap_html
    subject = "FlowERP — Test Email"
    html    = _wrap_html(
        f"<p>Hi {current_user.name},</p><p>Your FlowERP email configuration is working correctly! 🎉</p>"
        f"<div class='info-box'>Provider: <strong>{EMAIL_PROVIDER}</strong><br/>Sent to: {payload.to}</div>",
        subject,
    )
    bg.add_task(send_email, payload.to, subject, html)
    return {"success": True, "message": f"Test email queued to {payload.to}", "provider": EMAIL_PROVIDER}


# ── Send invoice to customer ──────────────────────────────────────────
@router.post("/invoice/{order_id}")
async def send_invoice(
    order_id: UUID,
    payload:  InvoiceEmailRequest,
    bg:       BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db:       AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == current_user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    to = payload.customer_email or order.customer_email
    if not to:
        raise HTTPException(422, "No email address for customer. Provide customer_email in request body.")

    bg.add_task(
        send_invoice_email,
        to             = to,
        customer_name  = order.customer_name,
        order_number   = order.order_number,
        total_amount   = float(order.total_amount or 0),
        due_date       = order.delivery_date,
        company_name   = "FlowERP",
    )
    return {
        "success": True,
        "message": f"Invoice email queued to {to}",
        "order":   order.order_number,
    }


# ── Send PO to vendor ─────────────────────────────────────────────────
@router.post("/po/{order_id}")
async def send_po_email(
    order_id: UUID,
    payload:  POEmailRequest,
    bg:       BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db:       AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == order_id, PurchaseOrder.tenant_id == current_user.tenant_id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase order not found")

    bg.add_task(
        send_po_to_vendor,
        to            = payload.vendor_email,
        vendor_name   = po.vendor_name,
        po_number     = po.order_number or str(order_id)[:8].upper(),
        items         = [],   # TODO: attach PO line items when model exists
        total         = float(po.total_amount or 0),
        delivery_date = po.expected_date,
    )
    return {"success": True, "message": f"PO email queued to {payload.vendor_email}"}


# ── Low stock alert ───────────────────────────────────────────────────
@router.post("/low-stock")
async def send_low_stock_email(
    bg:           BackgroundTasks,
    to:           str,
    current_user: User = Depends(get_current_active_user),
    db:           AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    q = select(InventoryProduct).where(
        InventoryProduct.tenant_id  == current_user.tenant_id,
        InventoryProduct.deleted_at.is_(None),
        InventoryProduct.status     == "active",
        InventoryProduct.stock      <= InventoryProduct.reorder_point,
    ).order_by(InventoryProduct.stock).limit(20)

    products = (await db.execute(q)).scalars().all()
    if not products:
        return {"success": True, "message": "No low-stock items found — nothing to send"}

    items = [
        {"name": p.name, "sku": p.sku, "stock": int(p.stock or 0), "reorder_point": int(p.reorder_point or 0)}
        for p in products
    ]
    bg.add_task(send_low_stock_alert, to=to, items=items)
    return {"success": True, "message": f"Low-stock alert queued to {to}", "items_count": len(items)}
