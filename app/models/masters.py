"""
Masters Module — SQLAlchemy Models
====================================
Vendor, HsnCode, PriceList, PriceListItem, PriceHistory

Notes:
  - created_by / updated_by are plain UUID (no FK) — avoids MissingGreenlet
  - approved_by / rejected_by — plain UUID for same reason
  - Customer and InventoryProduct stay in their original routers
    (sales/router.py and inventory/router.py) to avoid breaking
    existing FK references. We extend them via ALTER TABLE in migration.
  - PriceHistory is append-only — updated_at = None (no such column)
"""
from sqlalchemy import (
    Column, String, Boolean, Integer, Text,
    ForeignKey, Date, Numeric, DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Vendor(Base):
    """
    Full vendor master.
    Replaces the bare vendor_name string stored on purchase orders.
    Status workflow: PENDING → APPROVED | REJECTED | BLOCKED
    """
    __tablename__ = "vendors"

    tenant_id        = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by       = Column(UUID(as_uuid=True), nullable=True)
    updated_by       = Column(UUID(as_uuid=True), nullable=True)
    is_active        = Column(Boolean, default=True,  nullable=False)
    is_test_data     = Column(Boolean, default=False, nullable=False)

    # Identity
    vendor_code      = Column(String(30),  nullable=False)   # VEN-0001
    name             = Column(String(300), nullable=False)
    legal_name       = Column(String(300), nullable=True)
    vendor_type      = Column(String(30),  default="material", nullable=False)  # material/service/both
    status           = Column(String(30),  default="PENDING",  nullable=False, index=True)

    # Tax registration
    gstin            = Column(String(20),  nullable=True)
    pan              = Column(String(20),  nullable=True)
    msme_number      = Column(String(30),  nullable=True)

    # Address
    address_line1    = Column(String(300), nullable=True)
    address_line2    = Column(String(300), nullable=True)
    city             = Column(String(100), nullable=True)
    state            = Column(String(100), nullable=True)
    pincode          = Column(String(10),  nullable=True)
    country          = Column(String(100), default="India", nullable=False)

    # Contact
    contact_person   = Column(String(200), nullable=True)
    phone            = Column(String(30),  nullable=True)
    email            = Column(String(254), nullable=True)
    website          = Column(String(300), nullable=True)

    # Commercial
    payment_terms_days = Column(Integer,       default=30,  nullable=False)
    credit_limit       = Column(Numeric(14,2), default=0,   nullable=False)
    rating             = Column(Integer,       default=0,   nullable=False)   # 0-5

    # Bank details
    bank_account     = Column(String(30),  nullable=True)
    bank_ifsc        = Column(String(15),  nullable=True)
    bank_name        = Column(String(200), nullable=True)
    bank_branch      = Column(String(200), nullable=True)

    notes            = Column(Text, nullable=True)

    # Approval workflow
    approved_by      = Column(UUID(as_uuid=True), nullable=True)
    approved_at      = Column(DateTime(timezone=True), nullable=True)
    rejected_by      = Column(UUID(as_uuid=True), nullable=True)
    rejected_at      = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)


class HsnCode(Base):
    """
    HSN (Harmonized System Nomenclature) and SAC (Service Accounting Code) master.
    Linked to products — auto-fills GST rates on invoices.
    CGST = SGST = IGST / 2 always.
    """
    __tablename__ = "hsn_codes"

    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by     = Column(UUID(as_uuid=True), nullable=True)
    updated_by     = Column(UUID(as_uuid=True), nullable=True)
    is_active      = Column(Boolean, default=True,  nullable=False)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    code           = Column(String(10),  nullable=False)           # e.g. 85392200
    description    = Column(String(500), nullable=False)
    code_type      = Column(String(10),  default="hsn", nullable=False)  # hsn / sac

    # GST rates (%)
    igst_rate      = Column(Numeric(5,2), default=18, nullable=False)
    cgst_rate      = Column(Numeric(5,2), default=9,  nullable=False)   # igst/2
    sgst_rate      = Column(Numeric(5,2), default=9,  nullable=False)   # igst/2
    cess_rate      = Column(Numeric(5,2), default=0,  nullable=False)

    effective_from = Column(Date, nullable=True)
    effective_to   = Column(Date, nullable=True)   # None = still active


class PriceList(Base):
    """
    Price list header.
    Each list has a type (sales/purchase), effective date range, and
    an optional assignment scope (all / specific customer / vendor / group).

    RULE: Price lists are IMMUTABLE after creation.
    When prices change, a new price list is created.
    Old orders retain their prices because we snapshot the price
    at order creation time — we never look up the price list again
    for old orders.
    """
    __tablename__ = "price_lists"

    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by     = Column(UUID(as_uuid=True), nullable=True)
    updated_by     = Column(UUID(as_uuid=True), nullable=True)
    is_active      = Column(Boolean, default=True,  nullable=False)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    name           = Column(String(200), nullable=False)   # e.g. "Standard Q1 FY2025"
    list_type      = Column(String(20),  nullable=False)   # sales / purchase
    currency       = Column(String(10),  default="INR",   nullable=False)
    applicable_to  = Column(String(30),  default="all",   nullable=False)  # all/customer/vendor/group
    description    = Column(Text, nullable=True)

    effective_from = Column(Date, nullable=False)
    effective_to   = Column(Date, nullable=True)   # None = open-ended

    is_default     = Column(Boolean, default=False, nullable=False)  # default for this type

    # Optional: lock to specific party
    party_id       = Column(UUID(as_uuid=True), nullable=True)   # customer_id or vendor_id
    party_name     = Column(String(300), nullable=True)


class PriceListItem(Base):
    """
    One product line inside a price list.
    Supports quantity-break pricing (min_qty / max_qty).
    Can override list-level effective dates at item level.
    """
    __tablename__ = "price_list_items"

    price_list_id  = Column(UUID(as_uuid=True), ForeignKey("price_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    # Product ref (soft — no FK to allow flexible product types)
    product_id     = Column(UUID(as_uuid=True), nullable=True)
    product_code   = Column(String(100), nullable=True)
    product_name   = Column(String(300), nullable=False)
    unit           = Column(String(30),  default="Pcs", nullable=False)

    # Pricing
    unit_price     = Column(Numeric(14,4), nullable=False)
    min_qty        = Column(Numeric(14,3), default=1, nullable=False)
    max_qty        = Column(Numeric(14,3), nullable=True)   # None = no upper limit
    discount_pct   = Column(Numeric(5,2),  default=0, nullable=False)

    # Item-level date override (if None, inherits from PriceList)
    effective_from = Column(Date, nullable=True)
    effective_to   = Column(Date, nullable=True)

    notes          = Column(Text, nullable=True)


class PriceHistory(Base):
    """
    Immutable audit trail of every price change.
    Written BEFORE a price update — old price is never lost.

    updated_at = None — this table is append-only, no updates ever.
    """
    __tablename__ = "price_history"

    # Override Base to exclude updated_at — this table has no such column
    updated_at = None

    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    # What changed
    product_id     = Column(UUID(as_uuid=True), nullable=True, index=True)
    product_code   = Column(String(100), nullable=True)
    product_name   = Column(String(300), nullable=True)

    price_list_id  = Column(UUID(as_uuid=True), nullable=True)
    price_list_name= Column(String(200), nullable=True)

    price_type     = Column(String(20), nullable=False)  # sales / purchase / cost

    old_price      = Column(Numeric(14,4), nullable=True)
    new_price      = Column(Numeric(14,4), nullable=False)

    # Who changed it
    changed_by     = Column(UUID(as_uuid=True), nullable=True)
    changed_by_name= Column(String(200), nullable=True)
    change_reason  = Column(Text, nullable=True)

    effective_from = Column(Date, nullable=True)
