"""
FlowERP — Document Template Engine
====================================
Generates professional PDFs for:
  - Sales Invoices
  - Quotations
  - Purchase Orders
  - Delivery Notes

Uses Jinja2 for HTML templating + WeasyPrint for PDF generation.
Falls back to HTML response if WeasyPrint not installed.
"""

from datetime import datetime
from typing import Optional
from jinja2 import Environment, BaseLoader

# ── Base CSS shared across all documents ──────────────────────────────
BASE_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  color: #1a1a2e;
  background: white;
  padding: 0;
}
.page { padding: 40px 48px; min-height: 297mm; }

/* Header */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 3px solid {{ accent }};
}
.company-name { font-size: 22px; font-weight: 700; color: {{ accent }}; }
.company-meta { font-size: 11px; color: #666; margin-top: 4px; line-height: 1.6; }
.doc-title    { font-size: 26px; font-weight: 700; color: #1a1a2e; text-align: right; }
.doc-number   { font-size: 15px; font-weight: 600; color: #555; margin-top: 4px; text-align: right; }
.doc-date     { font-size: 12px; color: #888; margin-top: 2px; text-align: right; }

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 6px;
}
.status-approved  { background: #ECFDF5; color: #059669; border: 1px solid #6EE7B7; }
.status-pending   { background: #FFFBEB; color: #D97706; border: 1px solid #FCD34D; }
.status-draft     { background: #F9FAFB; color: #6B7280; border: 1px solid #D1D5DB; }
.status-paid      { background: #ECFDF5; color: #059669; border: 1px solid #6EE7B7; }
.status-sent      { background: #EFF6FF; color: #2563EB; border: 1px solid #93C5FD; }

/* Billing section */
.billing-section {
  display: flex;
  gap: 40px;
  margin-bottom: 28px;
}
.billing-block { flex: 1; }
.billing-block h4 {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #999;
  margin-bottom: 8px;
  font-weight: 600;
}
.billing-block .name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.billing-block p { font-size: 12px; line-height: 1.7; color: #555; }

/* Line items table */
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.items-table thead tr { background: {{ accent }}; }
.items-table th {
  padding: 10px 12px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  font-weight: 600;
  text-align: left;
}
.items-table th.right { text-align: right; }
.items-table th.center { text-align: center; }
.items-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  font-size: 12px;
  color: #333;
}
.items-table tr:nth-child(even) td { background: #fafafa; }
.items-table td.right { text-align: right; }
.items-table td.center { text-align: center; }
.item-name { font-weight: 600; color: #1a1a2e; }
.item-sku { font-size: 10px; color: #888; font-family: monospace; margin-top: 2px; }
.item-desc { font-size: 11px; color: #777; margin-top: 2px; font-style: italic; }

/* Totals */
.totals-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 28px;
}
.totals-box { width: 280px; }
.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #555;
  border-bottom: 1px solid #f5f5f5;
}
.totals-row.total {
  font-size: 16px;
  font-weight: 700;
  color: {{ accent }};
  border-top: 2px solid {{ accent }};
  border-bottom: none;
  padding-top: 10px;
  margin-top: 4px;
}
.totals-row.paid { color: #059669; }
.totals-row.balance { color: #DC2626; font-weight: 600; }
.totals-row.discount { color: #D97706; }

/* Notes/Terms */
.doc-notes {
  background: #f9f9f9;
  border-left: 3px solid {{ accent }};
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: #555;
  margin-bottom: 16px;
  line-height: 1.6;
}
.doc-notes strong { color: #1a1a2e; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }

/* Footer */
.doc-footer {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #aaa;
}
.signature-block { text-align: center; }
.signature-line { border-top: 1px solid #ccc; width: 160px; margin: 40px auto 4px; }
.signature-label { font-size: 10px; color: #999; }

/* Payment info box */
.payment-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.payment-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #059669; margin-bottom: 8px; }
.payment-box p { font-size: 12px; color: #555; line-height: 1.6; }

/* Watermark for draft */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 80px;
  font-weight: 900;
  color: rgba(0,0,0,0.04);
  text-transform: uppercase;
  letter-spacing: 10px;
  pointer-events: none;
  z-index: 0;
}
"""

# ── Invoice Template ──────────────────────────────────────────────────
INVOICE_TEMPLATE = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Invoice {{ order.order_number }}</title>
<style>{{ css }}</style>
</head><body>
{% if order.status == 'draft' %}<div class="watermark">DRAFT</div>{% endif %}

<div class="page">

  <!-- Header -->
  <div class="doc-header">
    <div>
      <div class="company-name">{{ company.name }}</div>
      <div class="company-meta">
        {{ company.address }}<br/>
        {% if company.gstin %}GSTIN: {{ company.gstin }}<br/>{% endif %}
        {% if company.phone %}Phone: {{ company.phone }}<br/>{% endif %}
        {{ company.email }}
      </div>
    </div>
    <div>
      <div class="doc-title">TAX INVOICE</div>
      <div class="doc-number">{{ order.order_number }}</div>
      <div class="doc-date">Date: {{ order.order_date or today }}</div>
      {% if order.delivery_date %}<div class="doc-date">Due: {{ order.delivery_date }}</div>{% endif %}
      <div>
        <span class="status-badge status-{{ order.payment_status }}">
          {{ order.payment_status | upper }}
        </span>
      </div>
    </div>
  </div>

  <!-- Billing -->
  <div class="billing-section">
    <div class="billing-block">
      <h4>Bill To</h4>
      <p class="name">{{ order.customer_name }}</p>
      {% if order.customer_address %}<p>{{ order.customer_address }}</p>{% endif %}
      {% if order.customer_gstin %}<p>GSTIN: {{ order.customer_gstin }}</p>{% endif %}
      {% if order.customer_email %}<p>{{ order.customer_email }}</p>{% endif %}
      {% if order.customer_phone %}<p>{{ order.customer_phone }}</p>{% endif %}
    </div>
    {% if order.reference_number %}
    <div class="billing-block">
      <h4>Reference</h4>
      <p class="name">{{ order.reference_number }}</p>
    </div>
    {% endif %}
    <div class="billing-block" style="text-align:right">
      <h4>Invoice Details</h4>
      <p>Invoice No: <strong>{{ order.order_number }}</strong></p>
      <p>Invoice Date: {{ order.order_date or today }}</p>
      {% if order.valid_until %}<p>Valid Until: {{ order.valid_until }}</p>{% endif %}
    </div>
  </div>

  <!-- Line Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Item / Description</th>
        <th class="center" style="width:70px">Qty</th>
        <th class="right" style="width:90px">Unit Price</th>
        <th class="center" style="width:60px">Disc%</th>
        <th class="center" style="width:60px">GST%</th>
        <th class="right" style="width:100px">Amount</th>
      </tr>
    </thead>
    <tbody>
      {% for item in order.items %}
      <tr>
        <td>{{ loop.index }}</td>
        <td>
          <div class="item-name">{{ item.product_name }}</div>
          {% if item.product_sku %}<div class="item-sku">{{ item.product_sku }}</div>{% endif %}
          {% if item.description %}<div class="item-desc">{{ item.description }}</div>{% endif %}
        </td>
        <td class="center">{{ item.quantity }} {{ item.unit }}</td>
        <td class="right">₹{{ "{:,.2f}".format(item.unit_price) }}</td>
        <td class="center">{{ item.discount_pct }}%</td>
        <td class="center">{{ item.tax_pct }}%</td>
        <td class="right">₹{{ "{:,.2f}".format(item.line_total) }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>₹{{ "{:,.2f}".format(order.subtotal) }}</span></div>
      {% if order.discount_amount and order.discount_amount > 0 %}
      <div class="totals-row discount"><span>Discount</span><span>- ₹{{ "{:,.2f}".format(order.discount_amount) }}</span></div>
      {% endif %}
      <div class="totals-row"><span>GST</span><span>₹{{ "{:,.2f}".format(order.tax_amount) }}</span></div>
      <div class="totals-row total"><span>Total</span><span>₹{{ "{:,.2f}".format(order.total_amount) }}</span></div>
      {% if order.paid_amount and order.paid_amount > 0 %}
      <div class="totals-row paid"><span>Amount Paid</span><span>₹{{ "{:,.2f}".format(order.paid_amount) }}</span></div>
      <div class="totals-row balance"><span>Balance Due</span><span>₹{{ "{:,.2f}".format(order.balance_due) }}</span></div>
      {% endif %}
    </div>
  </div>

  <!-- Payment Info -->
  {% if order.balance_due and order.balance_due > 0 %}
  <div class="payment-box">
    <h4>Payment Instructions</h4>
    <p>
      Bank: {{ company.bank_name or 'HDFC Bank' }} &nbsp;|&nbsp;
      A/C: {{ company.bank_account or 'XXXXXXXXXXXX' }} &nbsp;|&nbsp;
      IFSC: {{ company.bank_ifsc or 'HDFC0000XXX' }}
    </p>
    {% if company.upi %}<p>UPI: {{ company.upi }}</p>{% endif %}
  </div>
  {% endif %}

  {% if order.notes %}
  <div class="doc-notes">
    <strong>Notes</strong>
    {{ order.notes }}
  </div>
  {% endif %}

  {% if order.terms %}
  <div class="doc-notes">
    <strong>Terms & Conditions</strong>
    {{ order.terms }}
  </div>
  {% endif %}

  <!-- Footer -->
  <div class="doc-footer">
    <div>
      <p>Generated by FlowERP · {{ today }}</p>
      {% if company.website %}<p>{{ company.website }}</p>{% endif %}
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Authorised Signatory</div>
      <div class="signature-label">{{ company.name }}</div>
    </div>
  </div>

</div>
</body></html>"""


# ── Quotation Template ────────────────────────────────────────────────
QUOTATION_TEMPLATE = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Quotation {{ order.order_number }}</title>
<style>{{ css }}</style>
</head><body>
<div class="page">
  <div class="doc-header">
    <div>
      <div class="company-name">{{ company.name }}</div>
      <div class="company-meta">{{ company.address }}<br/>{{ company.email }}</div>
    </div>
    <div>
      <div class="doc-title">QUOTATION</div>
      <div class="doc-number">{{ order.order_number }}</div>
      <div class="doc-date">Date: {{ order.order_date or today }}</div>
      {% if order.valid_until %}<div class="doc-date">Valid Until: {{ order.valid_until }}</div>{% endif %}
    </div>
  </div>

  <div class="billing-section">
    <div class="billing-block">
      <h4>Quotation For</h4>
      <p class="name">{{ order.customer_name }}</p>
      {% if order.customer_email %}<p>{{ order.customer_email }}</p>{% endif %}
      {% if order.customer_phone %}<p>{{ order.customer_phone }}</p>{% endif %}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Item / Description</th>
        <th class="center" style="width:70px">Qty</th>
        <th class="right" style="width:90px">Unit Price</th>
        <th class="center" style="width:60px">Disc%</th>
        <th class="center" style="width:60px">GST%</th>
        <th class="right" style="width:100px">Amount</th>
      </tr>
    </thead>
    <tbody>
      {% for item in order.items %}
      <tr>
        <td>{{ loop.index }}</td>
        <td>
          <div class="item-name">{{ item.product_name }}</div>
          {% if item.description %}<div class="item-desc">{{ item.description }}</div>{% endif %}
        </td>
        <td class="center">{{ item.quantity }} {{ item.unit }}</td>
        <td class="right">₹{{ "{:,.2f}".format(item.unit_price) }}</td>
        <td class="center">{{ item.discount_pct }}%</td>
        <td class="center">{{ item.tax_pct }}%</td>
        <td class="right">₹{{ "{:,.2f}".format(item.line_total) }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>₹{{ "{:,.2f}".format(order.subtotal) }}</span></div>
      <div class="totals-row"><span>GST</span><span>₹{{ "{:,.2f}".format(order.tax_amount) }}</span></div>
      <div class="totals-row total"><span>Total</span><span>₹{{ "{:,.2f}".format(order.total_amount) }}</span></div>
    </div>
  </div>

  {% if order.notes %}
  <div class="doc-notes"><strong>Notes</strong>{{ order.notes }}</div>
  {% endif %}
  {% if order.terms %}
  <div class="doc-notes"><strong>Terms & Conditions</strong>{{ order.terms }}</div>
  {% endif %}

  <div class="doc-footer">
    <div><p>Generated by FlowERP · {{ today }}</p></div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Authorised Signatory</div>
    </div>
  </div>
</div>
</body></html>"""


# ── Purchase Order Template ────────────────────────────────────────────
PO_TEMPLATE = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Purchase Order {{ po.id }}</title>
<style>{{ css }}</style>
</head><body>
<div class="page">
  <div class="doc-header">
    <div>
      <div class="company-name">{{ company.name }}</div>
      <div class="company-meta">{{ company.address }}<br/>{{ company.email }}</div>
    </div>
    <div>
      <div class="doc-title">PURCHASE ORDER</div>
      <div class="doc-number">{{ po.order_number or po.id }}</div>
      <div class="doc-date">Date: {{ po.order_date or today }}</div>
      {% if po.expected_date %}<div class="doc-date">Expected: {{ po.expected_date }}</div>{% endif %}
      <span class="status-badge status-{{ po.status }}">{{ po.status | upper }}</span>
    </div>
  </div>

  <div class="billing-section">
    <div class="billing-block">
      <h4>Vendor / Supplier</h4>
      <p class="name">{{ po.vendor_name }}</p>
    </div>
    <div class="billing-block">
      <h4>Deliver To</h4>
      <p class="name">{{ company.name }}</p>
      <p>{{ company.address }}</p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      {% for item in items %}
      <tr>
        <td>{{ loop.index }}</td>
        <td><div class="item-name">{{ item.name }}</div></td>
        <td class="center">{{ item.quantity }} {{ item.unit }}</td>
        <td class="right">₹{{ "{:,.2f}".format(item.unit_price) }}</td>
        <td class="right">₹{{ "{:,.2f}".format(item.total) }}</td>
      </tr>
      {% else %}
      <tr><td colspan="5" style="text-align:center;color:#999;padding:20px">No items added</td></tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row total">
        <span>Total Amount</span>
        <span>₹{{ "{:,.2f}".format(po.total_amount or 0) }}</span>
      </div>
    </div>
  </div>

  {% if po.notes %}<div class="doc-notes"><strong>Notes</strong>{{ po.notes }}</div>{% endif %}

  <div class="doc-footer">
    <div><p>Generated by FlowERP · {{ today }}</p></div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Purchase Manager</div>
    </div>
  </div>
</div>
</body></html>"""


# ── Template renderer ─────────────────────────────────────────────────
def render_document(template_str: str, context: dict, accent_color: str = "#4F46E5") -> str:
    """Render a Jinja2 document template to HTML string."""
    env = Environment(loader=BaseLoader(), autoescape=False)
    tpl = env.from_string(template_str)

    css = env.from_string(BASE_CSS).render(accent=accent_color)
    ctx = {
        "css":    css,
        "today":  datetime.now().strftime("%d %b %Y"),
        "accent": accent_color,
        **context,
    }
    return tpl.render(**ctx)


def generate_pdf(html: str) -> Optional[bytes]:
    """Convert HTML to PDF bytes. Returns None if WeasyPrint not installed."""
    try:
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except ImportError:
        return None


# ── Default company config ────────────────────────────────────────────
DEFAULT_COMPANY = {
    "name":         "FlowERP Demo Company",
    "address":      "123 Industrial Area, Phase 2\nMumbai, Maharashtra 400001",
    "email":        "info@demo-company.com",
    "phone":        "+91 98765 43210",
    "website":      "www.demo-company.com",
    "gstin":        "27AABCU9603R1ZX",
    "bank_name":    "HDFC Bank",
    "bank_account": "50100123456789",
    "bank_ifsc":    "HDFC0001234",
    "upi":          "payments@demo-company",
}
