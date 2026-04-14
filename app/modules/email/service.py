"""
FlowERP — Email Notification Service
======================================
Supports:
  - SMTP (any provider — Gmail, Outlook, Zoho)
  - AWS SES (production recommended)

Triggered by:
  - Low stock alerts
  - Sales order approval needed
  - Invoice sent to customer
  - Purchase order sent to vendor
  - Work order status change
  - User account created / password reset

Config (in .env):
  EMAIL_PROVIDER=smtp              # smtp | ses | disabled
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=you@company.com
  SMTP_PASSWORD=your-app-password
  EMAIL_FROM=noreply@yourcompany.com
  EMAIL_FROM_NAME=FlowERP

  # AWS SES (alternative)
  AWS_REGION=ap-south-1
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  SES_FROM_EMAIL=noreply@yourcompany.com
"""
from __future__ import annotations

import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


# ── Configuration ──────────────────────────────────────────────────────
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "disabled").lower()   # smtp | ses | disabled
SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM     = os.getenv("EMAIL_FROM", "noreply@flowerp.com")
EMAIL_FROM_NAME= os.getenv("EMAIL_FROM_NAME", "FlowERP")
AWS_REGION     = os.getenv("AWS_REGION", "ap-south-1")


# ── Base HTML template ─────────────────────────────────────────────────
def _wrap_html(content: str, subject: str, company_name: str = "FlowERP") -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:0; background:#f4f5f7; color:#1a1a2e; }}
    .wrapper {{ max-width:600px; margin:32px auto; }}
    .header  {{ background:#4F46E5; padding:24px 32px; border-radius:12px 12px 0 0; }}
    .header h1 {{ color:white; margin:0; font-size:20px; font-weight:700; }}
    .header p  {{ color:#c7d2fe; margin:4px 0 0; font-size:13px; }}
    .body    {{ background:white; padding:32px; border-radius:0 0 12px 12px; border:1px solid #e5e7eb; border-top:none; }}
    .btn     {{ display:inline-block; padding:12px 24px; background:#4F46E5; color:white; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px; margin:16px 0; }}
    .info-box{{ background:#f0f4ff; border-left:4px solid #4F46E5; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; font-size:13px; }}
    .warn-box{{ background:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; font-size:13px; }}
    .danger-box{{ background:#fef2f2; border-left:4px solid #ef4444; padding:12px 16px; border-radius:0 8px 8px 0; margin:16px 0; font-size:13px; }}
    table  {{ width:100%; border-collapse:collapse; margin:16px 0; font-size:13px; }}
    th     {{ background:#f9fafb; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; border-bottom:1px solid #e5e7eb; }}
    td     {{ padding:10px 12px; border-bottom:1px solid #f3f4f6; }}
    .footer{{ text-align:center; font-size:11px; color:#9ca3af; margin-top:24px; padding:0 16px; }}
    hr     {{ border:none; border-top:1px solid #e5e7eb; margin:24px 0; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>{company_name}</h1>
      <p>{subject}</p>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      <p>This email was sent by {company_name} · Powered by FlowERP</p>
      <p>© {__import__('datetime').datetime.now().year} FlowERP. All rights reserved.</p>
    </div>
  </div>
</body>
</html>"""


# ── Core send function ────────────────────────────────────────────────
async def send_email(
    to:       str | list[str],
    subject:  str,
    html:     str,
    text:     Optional[str] = None,
    cc:       Optional[list[str]] = None,
    reply_to: Optional[str] = None,
) -> bool:
    """
    Send an email. Returns True on success, False on failure.
    Never raises — email failure should not break business logic.
    """
    if EMAIL_PROVIDER == "disabled":
        logger.info(f"[EMAIL DISABLED] Would send '{subject}' to {to}")
        return True

    recipients = [to] if isinstance(to, str) else to

    if EMAIL_PROVIDER == "ses":
        return await _send_ses(recipients, subject, html, text, cc, reply_to)
    elif EMAIL_PROVIDER == "smtp":
        return await _send_smtp(recipients, subject, html, text, cc, reply_to)
    else:
        logger.warning(f"Unknown EMAIL_PROVIDER: {EMAIL_PROVIDER}")
        return False


async def _send_smtp(
    to: list[str], subject: str, html: str,
    text: Optional[str], cc: Optional[list[str]], reply_to: Optional[str],
) -> bool:
    import smtplib
    import asyncio

    def _blocking_send():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        msg["To"]      = ", ".join(to)
        if cc:    msg["Cc"] = ", ".join(cc)
        if reply_to: msg["Reply-To"] = reply_to

        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        all_recipients = to + (cc or [])
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, all_recipients, msg.as_string())
        return True

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _blocking_send)
        logger.info(f"Email sent via SMTP: '{subject}' → {to}")
        return True
    except Exception as e:
        logger.error(f"SMTP send failed: {e}")
        return False


async def _send_ses(
    to: list[str], subject: str, html: str,
    text: Optional[str], cc: Optional[list[str]], reply_to: Optional[str],
) -> bool:
    try:
        import boto3
        from botocore.exceptions import ClientError

        client = boto3.client("ses", region_name=AWS_REGION)
        body   = {"Html": {"Charset": "UTF-8", "Data": html}}
        if text:
            body["Text"] = {"Charset": "UTF-8", "Data": text}

        kwargs = {
            "Destination": {"ToAddresses": to, "CcAddresses": cc or []},
            "Message": {
                "Subject": {"Charset": "UTF-8", "Data": subject},
                "Body": body,
            },
            "Source": f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>",
        }
        if reply_to:
            kwargs["ReplyToAddresses"] = [reply_to]

        client.send_email(**kwargs)
        logger.info(f"Email sent via SES: '{subject}' → {to}")
        return True
    except ImportError:
        logger.error("boto3 not installed. Run: pip install boto3")
        return False
    except Exception as e:
        logger.error(f"SES send failed: {e}")
        return False


# ── Pre-built email templates ─────────────────────────────────────────
async def send_invoice_email(
    to:             str,
    customer_name:  str,
    order_number:   str,
    total_amount:   float,
    due_date:       Optional[str],
    company_name:   str = "FlowERP",
    portal_link:    Optional[str] = None,
) -> bool:
    subject = f"Invoice {order_number} from {company_name}"
    content = f"""
    <p>Dear {customer_name},</p>
    <p>Please find below the details for your invoice:</p>
    <div class="info-box">
      <strong>Invoice Number:</strong> {order_number}<br/>
      <strong>Amount Due:</strong> ₹{total_amount:,.2f}<br/>
      {'<strong>Due Date:</strong> ' + due_date + '<br/>' if due_date else ''}
    </div>
    <p>Please make payment by the due date to avoid any delays in future orders.</p>
    {f'<a href="{portal_link}" class="btn">View Invoice</a>' if portal_link else ''}
    <hr/>
    <p style="font-size:12px;color:#6b7280;">If you have any questions about this invoice, please reply to this email or contact our accounts team.</p>
    <p>Thank you for your business.</p>
    """
    html = _wrap_html(content, subject, company_name)
    return await send_email(to, subject, html)


async def send_low_stock_alert(
    to:         str | list[str],
    items:      list[dict],   # [{"name": str, "sku": str, "stock": int, "reorder_point": int}]
    company_name: str = "FlowERP",
) -> bool:
    count   = len(items)
    subject = f"⚠️ Low Stock Alert — {count} item{'s' if count != 1 else ''} below reorder level"
    rows    = "".join(
        f"<tr><td><strong>{i['name']}</strong></td><td>{i['sku']}</td>"
        f"<td style='color:#ef4444;font-weight:600'>{i['stock']}</td>"
        f"<td>{i['reorder_point']}</td></tr>"
        for i in items
    )
    content = f"""
    <p>This is an automated low stock alert from {company_name}.</p>
    <div class="warn-box">
      <strong>{count} product{'s' if count != 1 else ''}</strong> {'are' if count != 1 else 'is'} below the reorder point and may need replenishment.
    </div>
    <table>
      <thead><tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Reorder At</th></tr></thead>
      <tbody>{rows}</tbody>
    </table>
    <p>Please create purchase orders to restock these items.</p>
    """
    html = _wrap_html(content, subject, company_name)
    return await send_email(to, subject, html)


async def send_po_to_vendor(
    to:           str,
    vendor_name:  str,
    po_number:    str,
    items:        list[dict],
    total:        float,
    company_name: str = "FlowERP",
    delivery_date: Optional[str] = None,
) -> bool:
    subject = f"Purchase Order {po_number} from {company_name}"
    rows    = "".join(
        f"<tr><td>{i.get('name','')}</td><td style='text-align:center'>{i.get('quantity','')}</td>"
        f"<td style='text-align:right'>₹{i.get('unit_price',0):,.2f}</td>"
        f"<td style='text-align:right'>₹{i.get('total',0):,.2f}</td></tr>"
        for i in items
    )
    content = f"""
    <p>Dear {vendor_name},</p>
    <p>Please find below our Purchase Order <strong>{po_number}</strong>:</p>
    {'<div class="info-box"><strong>Expected Delivery:</strong> ' + delivery_date + '</div>' if delivery_date else ''}
    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>{rows}</tbody>
      <tfoot><tr>
        <td colspan="3" style="text-align:right;font-weight:700;padding:12px">Total Amount</td>
        <td style="text-align:right;font-weight:700;font-size:15px;color:#4F46E5">₹{total:,.2f}</td>
      </tr></tfoot>
    </table>
    <p>Please confirm receipt of this order and provide an expected delivery timeline.</p>
    <p>Thank you for your partnership.</p>
    """
    html = _wrap_html(content, subject, company_name)
    return await send_email(to, subject, html)


async def send_approval_request(
    to:           str,
    approver_name:str,
    doc_type:     str,   # "Sales Order" | "Purchase Order" | "Leave Request"
    doc_number:   str,
    requested_by: str,
    amount:       Optional[float],
    notes:        Optional[str],
    approval_link:Optional[str],
    company_name: str = "FlowERP",
) -> bool:
    subject = f"[Action Required] {doc_type} {doc_number} needs your approval"
    content = f"""
    <p>Dear {approver_name},</p>
    <p>A {doc_type.lower()} has been submitted and requires your approval.</p>
    <div class="info-box">
      <strong>Document:</strong> {doc_type} — {doc_number}<br/>
      <strong>Submitted by:</strong> {requested_by}<br/>
      {'<strong>Amount:</strong> ₹' + f'{amount:,.2f}' + '<br/>' if amount else ''}
      {'<strong>Notes:</strong> ' + notes + '<br/>' if notes else ''}
    </div>
    {f'<a href="{approval_link}" class="btn">Review & Approve →</a>' if approval_link else ''}
    <p style="font-size:12px;color:#6b7280;">You can approve or reject this request from the FlowERP dashboard.</p>
    """
    html = _wrap_html(content, subject, company_name)
    return await send_email(to, subject, html)


async def send_work_order_update(
    to:         str,
    wo_number:  str,
    product:    str,
    new_status: str,
    quantity:   int,
    company_name: str = "FlowERP",
) -> bool:
    status_map = {
        "in_production": ("🔧 In Production", "info-box"),
        "qc_pending":    ("🔍 QC Inspection Pending", "warn-box"),
        "qc_passed":     ("✅ QC Passed", "info-box"),
        "qc_failed":     ("❌ QC Failed", "danger-box"),
        "completed":     ("✅ Completed", "info-box"),
    }
    label, box_cls = status_map.get(new_status, (new_status.title(), "info-box"))
    subject = f"Work Order {wo_number} — Status Update: {label}"
    content = f"""
    <p>This is an automated status update for Work Order <strong>{wo_number}</strong>.</p>
    <div class="{box_cls}">
      <strong>Product:</strong> {product}<br/>
      <strong>Quantity:</strong> {quantity} Pcs<br/>
      <strong>New Status:</strong> {label}
    </div>
    <p>Please log in to FlowERP to take any required action.</p>
    """
    html = _wrap_html(content, subject, company_name)
    return await send_email(to, subject, html)


async def send_welcome_email(
    to:       str,
    name:     str,
    company:  str,
    login_url:str = "http://localhost:3000/login",
) -> bool:
    subject = f"Welcome to {company} on FlowERP 🎉"
    content = f"""
    <p>Hi {name},</p>
    <p>Welcome to <strong>{company}</strong>'s FlowERP workspace! Your account has been created.</p>
    <div class="info-box">
      <strong>Login URL:</strong> <a href="{login_url}">{login_url}</a><br/>
      <strong>Email:</strong> {to}
    </div>
    <a href="{login_url}" class="btn">Log In to FlowERP →</a>
    <p>If you have any questions, contact your system administrator.</p>
    """
    html = _wrap_html(content, subject, company)
    return await send_email(to, subject, html)
