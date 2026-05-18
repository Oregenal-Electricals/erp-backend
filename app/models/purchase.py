"""
Oregenal ERP — Purchase Module SQLAlchemy Models
=================================================
Tables:
  purchase_requisitions       PR header
  purchase_requisition_items  PR line items
  rfq_headers                 Request For Quotation
  rfq_items                   RFQ line items
  vendor_quotations           Vendor response to RFQ
  vendor_quotation_items      Quoted prices per line
  purchase_orders             PO header  (replaces thin inline model)
  purchase_order_items        PO line items
  grn_headers                 Goods Receipt Note header
  grn_items                   GRN line items
  po_messages                 Vendor communication thread per PO
  po_amendments               Change request / amendment audit trail

Design notes:
  - created_by / updated_by / approved_by are plain UUID (no FK) to avoid
    MissingGreenlet errors from eager relationship loading.
  - AuditLog pattern: updated_at = None for append-only tables.
  - Status columns use VARCHAR with a DB CHECK constraint enforced in
    migration — never updated to an invalid value.
  - All monetary amounts are NUMERIC(15,2) — safe for Indian Rupee values.
"""

from sqlalchemy import (
    Column, String, Boolean, Integer, Text, Numeric,
    ForeignKey, Date, DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


# ══════════════════════════════════════════════════════════════════════
# PURCHASE REQUISITION
# ══════════════════════════════════════════════════════════════════════

class PurchaseRequisition(Base):
    """
    PR — raised by any department when they need materials/services.
    Workflow: DRAFT → SUBMITTED → APPROVED → CONVERTED (to RFQ or direct PO)
              or REJECTED.
    """
    __tablename__ = "purchase_requisitions"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    pr_number    = Column(String(50),  nullable=False)        # PR-2425-0001
    title        = Column(String(300), nullable=False)        # short description
    status       = Column(String(30),  default="DRAFT", nullable=False, index=True)
    # DRAFT | SUBMITTED | APPROVED | REJECTED | CONVERTED

    # Requester context
    requested_by        = Column(UUID(as_uuid=True), nullable=True)  # user id
    requested_by_name   = Column(String(200), nullable=True)
    department          = Column(String(150), nullable=True)
    required_by_date    = Column(Date, nullable=True)
    priority            = Column(String(20), default="normal", nullable=False)
    # normal | urgent | critical

    # Approval
    submitted_at   = Column(DateTime(timezone=True), nullable=True)
    approved_by    = Column(UUID(as_uuid=True), nullable=True)
    approved_by_name = Column(String(200), nullable=True)
    approved_at    = Column(DateTime(timezone=True), nullable=True)
    rejected_by    = Column(UUID(as_uuid=True), nullable=True)
    rejected_at    = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Conversion tracking
    converted_to_rfq_id = Column(UUID(as_uuid=True), nullable=True)  # rfq_headers.id
    converted_to_po_id  = Column(UUID(as_uuid=True), nullable=True)  # purchase_orders.id

    notes        = Column(Text, nullable=True)
    total_amount = Column(Numeric(15, 2), default=0, nullable=False)  # estimated


class PurchaseRequisitionItem(Base):
    """Line item on a PR."""
    __tablename__ = "purchase_requisition_items"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    pr_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_requisitions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    # Product reference (soft — allows free-text items not in master)
    product_id   = Column(UUID(as_uuid=True), nullable=True)   # inventory_products.id
    product_name = Column(String(300), nullable=False)
    product_code = Column(String(100), nullable=True)
    hsn_code     = Column(String(20),  nullable=True)
    unit         = Column(String(30),  default="Pcs", nullable=False)

    quantity     = Column(Numeric(12, 3), nullable=False)
    estimated_unit_price = Column(Numeric(15, 2), default=0, nullable=False)
    estimated_total      = Column(Numeric(15, 2), default=0, nullable=False)
    gst_rate     = Column(Numeric(5, 2), default=18, nullable=False)

    specifications = Column(Text, nullable=True)   # technical specs
    notes          = Column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════
# REQUEST FOR QUOTATION (RFQ)
# ══════════════════════════════════════════════════════════════════════

class RFQHeader(Base):
    """
    RFQ sent to one or more vendors for price quotation.
    Workflow: DRAFT → SENT → CLOSED → CONVERTED (to PO) | CANCELLED
    """
    __tablename__ = "rfq_headers"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    rfq_number   = Column(String(50), nullable=False)     # RFQ-2425-0001
    title        = Column(String(300), nullable=False)
    status       = Column(String(30), default="DRAFT", nullable=False, index=True)
    # DRAFT | SENT | PARTIALLY_RECEIVED | CLOSED | CONVERTED | CANCELLED

    pr_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_requisitions.id", ondelete="SET NULL"), nullable=True)

    # Timing
    sent_at      = Column(DateTime(timezone=True), nullable=True)
    close_date   = Column(Date, nullable=True)    # deadline for vendor responses
    required_by  = Column(Date, nullable=True)    # delivery required by

    # Converted to PO
    converted_to_po_id = Column(UUID(as_uuid=True), nullable=True)

    terms_and_conditions = Column(Text, nullable=True)
    notes        = Column(Text, nullable=True)

    # Stats (denormalised for speed)
    vendor_count     = Column(Integer, default=0, nullable=False)  # vendors invited
    quotation_count  = Column(Integer, default=0, nullable=False)  # responses received


class RFQItem(Base):
    """Line item on an RFQ — what we want to buy."""
    __tablename__ = "rfq_items"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    rfq_id       = Column(UUID(as_uuid=True), ForeignKey("rfq_headers.id", ondelete="CASCADE"), nullable=False, index=True)
    pr_item_id   = Column(UUID(as_uuid=True), ForeignKey("purchase_requisition_items.id", ondelete="SET NULL"), nullable=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    product_id   = Column(UUID(as_uuid=True), nullable=True)
    product_name = Column(String(300), nullable=False)
    product_code = Column(String(100), nullable=True)
    hsn_code     = Column(String(20),  nullable=True)
    unit         = Column(String(30),  default="Pcs", nullable=False)
    quantity     = Column(Numeric(12, 3), nullable=False)
    target_price = Column(Numeric(15, 2), nullable=True)   # our target / budget price
    gst_rate     = Column(Numeric(5, 2), default=18, nullable=False)
    specifications = Column(Text, nullable=True)
    notes          = Column(Text, nullable=True)


class RFQVendor(Base):
    """
    Which vendors were invited to respond to this RFQ.
    One row per vendor per RFQ.
    """
    __tablename__ = "rfq_vendors"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    rfq_id       = Column(UUID(as_uuid=True), ForeignKey("rfq_headers.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id    = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"),  nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    vendor_name  = Column(String(300), nullable=False)   # snapshot
    vendor_email = Column(String(254), nullable=True)    # snapshot
    sent_at      = Column(DateTime(timezone=True), nullable=True)
    email_sent   = Column(Boolean, default=False, nullable=False)
    has_responded = Column(Boolean, default=False, nullable=False)


# ══════════════════════════════════════════════════════════════════════
# VENDOR QUOTATION
# ══════════════════════════════════════════════════════════════════════

class VendorQuotation(Base):
    """
    Vendor's response to an RFQ.
    Status: RECEIVED → SHORTLISTED | REJECTED → ACCEPTED
    ACCEPTED → triggers PO creation.
    """
    __tablename__ = "vendor_quotations"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    rfq_id       = Column(UUID(as_uuid=True), ForeignKey("rfq_headers.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id    = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"),   nullable=False, index=True)

    quotation_number = Column(String(50),  nullable=False)   # VQ-2425-0001
    vendor_ref       = Column(String(100), nullable=True)    # vendor's own quote number
    status           = Column(String(30),  default="RECEIVED", nullable=False, index=True)
    # RECEIVED | SHORTLISTED | ACCEPTED | REJECTED

    # Snapshot from vendor master
    vendor_name  = Column(String(300), nullable=False)
    vendor_email = Column(String(254), nullable=True)
    vendor_gstin = Column(String(20),  nullable=True)

    received_date  = Column(Date, nullable=True)
    validity_date  = Column(Date, nullable=True)   # quote valid until
    delivery_days  = Column(Integer, nullable=True)

    # Totals (computed from quotation items)
    subtotal     = Column(Numeric(15, 2), default=0, nullable=False)
    tax_amount   = Column(Numeric(15, 2), default=0, nullable=False)
    total_amount = Column(Numeric(15, 2), default=0, nullable=False)

    payment_terms = Column(String(100), nullable=True)
    notes         = Column(Text, nullable=True)

    # Accept/reject
    accepted_by    = Column(UUID(as_uuid=True), nullable=True)
    accepted_at    = Column(DateTime(timezone=True), nullable=True)
    rejected_by    = Column(UUID(as_uuid=True), nullable=True)
    rejected_at    = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Converted to PO
    po_id = Column(UUID(as_uuid=True), nullable=True)   # purchase_orders.id


class VendorQuotationItem(Base):
    """Quoted price per line item in a vendor quotation."""
    __tablename__ = "vendor_quotation_items"

    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    quotation_id   = Column(UUID(as_uuid=True), ForeignKey("vendor_quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    rfq_item_id    = Column(UUID(as_uuid=True), ForeignKey("rfq_items.id", ondelete="SET NULL"), nullable=True)
    created_by     = Column(UUID(as_uuid=True), nullable=True)
    updated_by     = Column(UUID(as_uuid=True), nullable=True)
    is_active      = Column(Boolean, default=True,  nullable=False)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    product_id     = Column(UUID(as_uuid=True), nullable=True)
    product_name   = Column(String(300), nullable=False)
    product_code   = Column(String(100), nullable=True)
    hsn_code       = Column(String(20),  nullable=True)
    unit           = Column(String(30),  default="Pcs", nullable=False)

    quantity       = Column(Numeric(12, 3), nullable=False)
    unit_price     = Column(Numeric(15, 4), nullable=False)
    discount_pct   = Column(Numeric(5, 2),  default=0, nullable=False)
    gst_rate       = Column(Numeric(5, 2),  default=18, nullable=False)
    subtotal       = Column(Numeric(15, 2), default=0, nullable=False)
    tax_amount     = Column(Numeric(15, 2), default=0, nullable=False)
    line_total     = Column(Numeric(15, 2), default=0, nullable=False)

    delivery_days  = Column(Integer, nullable=True)
    brand          = Column(String(150), nullable=True)
    notes          = Column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════
# PURCHASE ORDER  (proper model — replaces inline class in router.py)
# ══════════════════════════════════════════════════════════════════════

class PurchaseOrder(Base):
    """
    PO header.
    Workflow: DRAFT → SUBMITTED → APPROVED → SENT_TO_VENDOR →
              PARTIALLY_RECEIVED → RECEIVED | REJECTED | CANCELLED

    LOCK: is_locked = True after first GRN is posted.
          Locked POs require amendment workflow for any field change.

    PRICE IMMUTABILITY: Line item prices are snapshotted at PO creation.
                        Price list changes never retroactively change approved POs.
    """
    __tablename__ = "purchase_orders"

    # tenant + standard audit
    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    # Identifiers
    po_number    = Column(String(50), nullable=False, index=True)   # PO-2425-0001 from NumberSeries
    order_number = Column(String(50), nullable=True)                # backward-compat alias

    # Vendor FK — MUST link to approved vendor from masters
    vendor_id    = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=True, index=True)
    vendor_name  = Column(String(300), nullable=False)              # snapshot at creation
    vendor_email = Column(String(254), nullable=True)               # snapshot for immutability
    vendor_gstin = Column(String(20),  nullable=True)               # snapshot

    # Status
    status         = Column(String(30), default="DRAFT", nullable=False, index=True)
    # DRAFT | SUBMITTED | APPROVED | SENT_TO_VENDOR | PARTIALLY_RECEIVED | RECEIVED | REJECTED | CANCELLED

    payment_status = Column(String(30), default="PENDING", nullable=False)
    # PENDING | PARTIAL | PAID

    # Provenance
    pr_id          = Column(UUID(as_uuid=True), ForeignKey("purchase_requisitions.id", ondelete="SET NULL"), nullable=True)
    rfq_id         = Column(UUID(as_uuid=True), ForeignKey("rfq_headers.id",           ondelete="SET NULL"), nullable=True)
    quotation_id   = Column(UUID(as_uuid=True), ForeignKey("vendor_quotations.id",     ondelete="SET NULL"), nullable=True)

    # Dates
    order_date       = Column(Date, nullable=True)
    delivery_date    = Column(Date, nullable=True)
    expected_date    = Column(String(20), nullable=True)   # legacy compat

    # Commercial
    payment_terms_days = Column(Integer, default=30, nullable=False)   # snapshot from vendor
    currency           = Column(String(10), default="INR", nullable=False)
    exchange_rate      = Column(Numeric(10, 4), default=1, nullable=False)

    # Amounts (all pre-computed, updated on item add/delete)
    subtotal       = Column(Numeric(15, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)
    tax_amount     = Column(Numeric(15, 2), default=0, nullable=False)
    total_amount   = Column(Numeric(15, 2), default=0, nullable=False)
    items_count    = Column(Integer, default=0, nullable=False)

    # Workflow timestamps
    submitted_by   = Column(UUID(as_uuid=True), nullable=True)
    submitted_at   = Column(DateTime(timezone=True), nullable=True)
    approved_by    = Column(UUID(as_uuid=True), nullable=True)
    approved_by_name = Column(String(200), nullable=True)
    approved_at    = Column(DateTime(timezone=True), nullable=True)
    rejected_by    = Column(UUID(as_uuid=True), nullable=True)
    rejected_at    = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    sent_to_vendor_at = Column(DateTime(timezone=True), nullable=True)

    # Locking + amendments
    is_locked       = Column(Boolean, default=False, nullable=False)
    amendment_count = Column(Integer, default=0,    nullable=False)

    # Soft delete
    deleted_at     = Column(DateTime(timezone=True), nullable=True)

    # Misc
    notes          = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    custom_data    = Column(JSONB, default=dict, nullable=False)


class PurchaseOrderItem(Base):
    """
    PO line item.
    unit_price is IMMUTABLE after PO approval — price list changes do not
    retroactively update approved PO items (business rule #10).
    """
    __tablename__ = "purchase_order_items"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",       ondelete="CASCADE"), nullable=False, index=True)
    po_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    rfq_item_id  = Column(UUID(as_uuid=True), ForeignKey("rfq_items.id",       ondelete="SET NULL"), nullable=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    product_id   = Column(UUID(as_uuid=True), nullable=True)   # inventory_products.id (soft ref)
    product_name = Column(String(300), nullable=False)
    product_sku  = Column(String(100), nullable=True)
    product_code = Column(String(100), nullable=True)
    hsn_code     = Column(String(20),  nullable=True)

    quantity     = Column(Numeric(12, 3), nullable=False)
    unit         = Column(String(30), default="Pcs", nullable=False)

    # Price — snapshotted and immutable after PO approval
    unit_price   = Column(Numeric(15, 4), nullable=False)
    quoted_price = Column(Numeric(15, 4), nullable=True)   # original quotation price for comparison
    discount_pct = Column(Numeric(5, 2),  default=0, nullable=False)
    gst_rate     = Column(Numeric(5, 2),  default=18, nullable=False)
    subtotal     = Column(Numeric(15, 2), default=0, nullable=False)
    tax_amount   = Column(Numeric(15, 2), default=0, nullable=False)
    line_total   = Column(Numeric(15, 2), default=0, nullable=False)

    # Receipt tracking
    received_qty = Column(Numeric(12, 3), default=0, nullable=False)
    returned_qty = Column(Numeric(12, 3), default=0, nullable=False)

    notes        = Column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════
# GOODS RECEIPT NOTE (GRN)
# ══════════════════════════════════════════════════════════════════════

class GRNHeader(Base):
    """
    GRN header — one GRN per delivery (partial deliveries = multiple GRNs per PO).
    Two-phase: CREATE (draft) → POST (atomic stock update via ledger engine).

    RULE: Cannot cancel a POSTED GRN. Stock reversal requires a Purchase Return.
    """
    __tablename__ = "grn_headers"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",       ondelete="CASCADE"), nullable=False, index=True)
    po_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    vendor_id    = Column(UUID(as_uuid=True), ForeignKey("vendors.id",         ondelete="RESTRICT"), nullable=True, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    grn_number     = Column(String(50), nullable=False, index=True)   # GRN-2425-0001
    status         = Column(String(20), default="DRAFT", nullable=False, index=True)
    # DRAFT | POSTED | CANCELLED

    received_date  = Column(Date, nullable=True)
    vehicle_number = Column(String(50), nullable=True)
    dc_number      = Column(String(100), nullable=True)   # delivery challan number
    invoice_number = Column(String(100), nullable=True)   # vendor invoice reference

    # Snapshot
    vendor_name    = Column(String(300), nullable=True)
    po_number      = Column(String(50),  nullable=True)

    # Amounts
    total_received_value = Column(Numeric(15, 2), default=0, nullable=False)

    # Post tracking
    posted_by    = Column(UUID(as_uuid=True), nullable=True)
    posted_at    = Column(DateTime(timezone=True), nullable=True)

    notes        = Column(Text, nullable=True)


class GRNItem(Base):
    """GRN line item — received quantities per PO item."""
    __tablename__ = "grn_items"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",   ondelete="CASCADE"), nullable=False, index=True)
    grn_id       = Column(UUID(as_uuid=True), ForeignKey("grn_headers.id", ondelete="CASCADE"), nullable=False, index=True)
    po_item_id   = Column(UUID(as_uuid=True), ForeignKey("purchase_order_items.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    product_id   = Column(UUID(as_uuid=True), nullable=True)   # inventory_products.id
    product_name = Column(String(300), nullable=False)
    product_sku  = Column(String(100), nullable=True)
    unit         = Column(String(30),  default="Pcs", nullable=False)
    hsn_code     = Column(String(20),  nullable=True)

    ordered_qty    = Column(Numeric(12, 3), nullable=False)    # from PO item
    received_qty   = Column(Numeric(12, 3), nullable=False)    # actually received this GRN
    accepted_qty   = Column(Numeric(12, 3), nullable=False)    # passed QC
    rejected_qty   = Column(Numeric(12, 3), default=0, nullable=False)  # failed QC

    unit_cost      = Column(Numeric(15, 4), nullable=False)    # from PO item unit_price
    total_cost     = Column(Numeric(15, 2), default=0, nullable=False)

    batch_number   = Column(String(100), nullable=True)
    expiry_date    = Column(Date, nullable=True)

    # Stock ledger reference (set after posting)
    ledger_entry_id = Column(UUID(as_uuid=True), nullable=True)

    rejection_reason = Column(Text, nullable=True)
    notes            = Column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════
# PURCHASE RETURN
# ══════════════════════════════════════════════════════════════════════

class PurchaseReturn(Base):
    """
    Purchase return — goods sent back to vendor.
    Workflow: DRAFT → APPROVED → DISPATCHED
    DISPATCHED triggers stock OUT via ledger engine (return_to_vendor).
    """
    __tablename__ = "purchase_returns"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",       ondelete="CASCADE"),  nullable=False, index=True)
    po_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    grn_id       = Column(UUID(as_uuid=True), ForeignKey("grn_headers.id",   ondelete="RESTRICT"),  nullable=True,  index=True)
    vendor_id    = Column(UUID(as_uuid=True), ForeignKey("vendors.id",         ondelete="RESTRICT"), nullable=True,  index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    return_number  = Column(String(50), nullable=False, index=True)   # PRN-2425-0001
    status         = Column(String(20), default="DRAFT", nullable=False, index=True)
    # DRAFT | APPROVED | DISPATCHED | REJECTED

    # Snapshots
    vendor_name    = Column(String(300), nullable=True)
    po_number      = Column(String(50),  nullable=True)
    grn_number     = Column(String(50),  nullable=True)

    return_reason  = Column(String(200), nullable=False)
    notes          = Column(Text, nullable=True)

    total_amount   = Column(Numeric(15, 2), default=0, nullable=False)

    # Approval
    approved_by    = Column(UUID(as_uuid=True), nullable=True)
    approved_at    = Column(DateTime(timezone=True), nullable=True)
    rejected_by    = Column(UUID(as_uuid=True), nullable=True)
    rejected_at    = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Dispatch
    dispatched_by  = Column(UUID(as_uuid=True), nullable=True)
    dispatched_at  = Column(DateTime(timezone=True), nullable=True)


class PurchaseReturnItem(Base):
    """Line item on a purchase return."""
    __tablename__ = "purchase_return_items"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",          ondelete="CASCADE"),  nullable=False, index=True)
    return_id    = Column(UUID(as_uuid=True), ForeignKey("purchase_returns.id",  ondelete="CASCADE"),  nullable=False, index=True)
    grn_item_id  = Column(UUID(as_uuid=True), ForeignKey("grn_items.id",          ondelete="RESTRICT"), nullable=True,  index=True)
    po_item_id   = Column(UUID(as_uuid=True), ForeignKey("purchase_order_items.id", ondelete="RESTRICT"), nullable=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    product_id   = Column(UUID(as_uuid=True), nullable=True)
    product_name = Column(String(300), nullable=False)
    product_sku  = Column(String(100), nullable=True)
    unit         = Column(String(30),  default="Pcs", nullable=False)

    return_qty   = Column(Numeric(12, 3), nullable=False)
    unit_cost    = Column(Numeric(15, 4), nullable=False)
    total_cost   = Column(Numeric(15, 2), default=0, nullable=False)

    return_reason = Column(Text, nullable=True)
    notes         = Column(Text, nullable=True)

    # Set after dispatch
    ledger_entry_id = Column(UUID(as_uuid=True), nullable=True)


# ══════════════════════════════════════════════════════════════════════
# PO MESSAGES (Vendor Communication Thread)
# ══════════════════════════════════════════════════════════════════════

class POMessage(Base):
    """
    In-ERP communication thread per PO.
    message_type distinguishes internal notes from vendor emails.
    All communication is archived here — never deleted.
    """
    __tablename__ = "po_messages"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",       ondelete="CASCADE"),  nullable=False, index=True)
    po_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"),  nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    message_type = Column(String(30), nullable=False)
    # internal_note | vendor_sent | vendor_reply | approval_comment | amendment_note | system

    sender_name  = Column(String(200), nullable=True)    # user name or vendor name
    sender_type  = Column(String(20),  default="user", nullable=False)  # user | vendor | system
    body         = Column(Text, nullable=False)
    is_private   = Column(Boolean, default=False, nullable=False)  # True = internal only
    email_sent   = Column(Boolean, default=False, nullable=False)  # True = emailed to vendor


# ══════════════════════════════════════════════════════════════════════
# PO AMENDMENTS (Change Request Audit Trail)
# ══════════════════════════════════════════════════════════════════════

class POAmendment(Base):
    """
    Append-only audit trail of every amendment made to a locked/approved PO.
    updated_at = None — this table never gets updates.
    """
    __tablename__ = "po_amendments"
    updated_at = None   # append-only — no updated_at column

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",       ondelete="CASCADE"),  nullable=False, index=True)
    po_id        = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"),  nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    is_test_data = Column(Boolean, default=False, nullable=False)

    version      = Column(Integer, nullable=False)    # amendment_count at time of change
    amended_by_name = Column(String(200), nullable=True)
    reason       = Column(Text, nullable=False)
    diff         = Column(JSONB, nullable=True)   # {field: {old: ..., new: ...}}
    status       = Column(String(20), default="PENDING", nullable=False)
    # PENDING | APPROVED | REJECTED (amendment itself needs approval)
    approved_by  = Column(UUID(as_uuid=True), nullable=True)
    approved_at  = Column(DateTime(timezone=True), nullable=True)
