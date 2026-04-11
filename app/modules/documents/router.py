"""
FlowERP — Documents Module
===========================
Endpoints:
  GET /documents/sales-orders/{id}/invoice.pdf
  GET /documents/sales-orders/{id}/invoice.html
  GET /documents/sales-orders/{id}/quotation.pdf
  GET /documents/purchase-orders/{id}/po.pdf
  GET /documents/config           (get company settings)
  PUT /documents/config           (update company settings)
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.engines.documents import (
    render_document, generate_pdf,
    INVOICE_TEMPLATE, QUOTATION_TEMPLATE, PO_TEMPLATE,
    DEFAULT_COMPANY,
)
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── Company config model ───────────────────────────────────────────────
class CompanyConfig(Base):
    __tablename__ = "company_config"
    tenant_id = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    config    = sa.Column(JSON, default=dict, nullable=False)


class CompanyConfigUpdate(BaseModel):
    name:         Optional[str] = None
    address:      Optional[str] = None
    email:        Optional[str] = None
    phone:        Optional[str] = None
    website:      Optional[str] = None
    gstin:        Optional[str] = None
    pan:          Optional[str] = None
    bank_name:    Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc:    Optional[str] = None
    upi:          Optional[str] = None
    logo_url:     Optional[str] = None
    accent_color: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────
async def get_company_config(tenant_id, db: AsyncSession) -> dict:
    result = await db.execute(
        select(CompanyConfig).where(CompanyConfig.tenant_id == tenant_id)
    )
    cfg = result.scalar_one_or_none()
    if cfg and cfg.config:
        return {**DEFAULT_COMPANY, **cfg.config}
    return DEFAULT_COMPANY


async def get_sales_order(order_id: UUID, tenant_id, db: AsyncSession) -> dict:
    """Fetch sales order with items."""
    from app.modules.sales.router import SalesOrder, OrderItem, order_out
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Sales order not found")
    return await order_out(order, db, include_items=True)


def pdf_or_html_response(html: str, filename: str, force_html: bool = False) -> Response:
    """Return PDF if WeasyPrint installed, else HTML."""
    if force_html:
        return Response(content=html, media_type="text/html")

    pdf_bytes = generate_pdf(html)
    if pdf_bytes:
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    # WeasyPrint not installed — return HTML with inline flag
    return Response(
        content=html,
        media_type="text/html",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-PDF-Fallback": "weasyprint-not-installed",
        },
    )


# ── Invoice endpoints ─────────────────────────────────────────────────
@router.get("/sales-orders/{order_id}/invoice.pdf")
async def sales_invoice_pdf(
    order_id: UUID,
    preview:  bool = Query(False, description="Return HTML preview instead of PDF"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order   = await get_sales_order(order_id, current_user.tenant_id, db)
    company = await get_company_config(current_user.tenant_id, db)
    accent  = company.get("accent_color", "#4F46E5")
    html    = render_document(INVOICE_TEMPLATE, {"order": order, "company": company}, accent)
    return pdf_or_html_response(html, f"{order['order_number']}-invoice.pdf", force_html=preview)


@router.get("/sales-orders/{order_id}/quotation.pdf")
async def sales_quotation_pdf(
    order_id: UUID,
    preview: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    order   = await get_sales_order(order_id, current_user.tenant_id, db)
    company = await get_company_config(current_user.tenant_id, db)
    accent  = company.get("accent_color", "#4F46E5")
    html    = render_document(QUOTATION_TEMPLATE, {"order": order, "company": company}, accent)
    return pdf_or_html_response(html, f"{order['order_number']}-quotation.pdf", force_html=preview)


# ── Purchase Order PDF ────────────────────────────────────────────────
@router.get("/purchase-orders/{po_id}/po.pdf")
async def purchase_order_pdf(
    po_id:   UUID,
    preview: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.purchase.router import PurchaseOrder
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == current_user.tenant_id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Purchase order not found")

    po_data = {
        "id": str(po.id), "order_number": po.order_number, "vendor_name": po.vendor_name,
        "status": po.status, "order_date": po.order_date, "expected_date": po.expected_date,
        "total_amount": float(po.total_amount or 0), "notes": po.notes,
    }
    company = await get_company_config(current_user.tenant_id, db)
    accent  = company.get("accent_color", "#4F46E5")
    html    = render_document(PO_TEMPLATE, {"po": po_data, "company": company, "items": []}, accent)
    return pdf_or_html_response(html, f"PO-{po.order_number}.pdf", force_html=preview)


# ── Company config endpoints ──────────────────────────────────────────
@router.get("/config")
async def get_config(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_company_config(current_user.tenant_id, db)


@router.put("/config")
async def update_config(
    payload: CompanyConfigUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyConfig).where(CompanyConfig.tenant_id == current_user.tenant_id)
    )
    cfg = result.scalar_one_or_none()

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if cfg:
        cfg.config = {**cfg.config, **updates}
    else:
        cfg = CompanyConfig(tenant_id=current_user.tenant_id, config=updates)
        db.add(cfg)

    await db.flush()
    return {**DEFAULT_COMPANY, **cfg.config}


# ── List available document types ─────────────────────────────────────
@router.get("/types")
async def list_document_types(current_user: User = Depends(get_current_active_user)):
    return {
        "types": [
            {"id": "sales_invoice",  "label": "Sales Invoice",    "endpoint": "/documents/sales-orders/{id}/invoice.pdf" },
            {"id": "quotation",      "label": "Quotation",         "endpoint": "/documents/sales-orders/{id}/quotation.pdf"},
            {"id": "purchase_order", "label": "Purchase Order",    "endpoint": "/documents/purchase-orders/{id}/po.pdf"   },
        ]
    }
