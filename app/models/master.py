"""
Master Setup Models
====================
Company, Branch, FinancialYear, NumberSeries,
ApprovalRule, ChangeRequestSetting, AuditLog

Notes on created_by / updated_by:
  Stored as plain UUID columns WITHOUT ForeignKey.
  Reason: ForeignKey causes SQLAlchemy to track relationship state,
  which triggers MissingGreenlet errors in async context when the
  value is set outside a greenlet. These are audit fields — we never
  navigate from them.

Note on AuditLog.updated_at:
  AuditLog is append-only. It intentionally has NO updated_at column.
  We override updated_at = None to prevent the Base class from
  including it in INSERT/SELECT statements.
"""
from sqlalchemy import (
    Column, String, Boolean, Integer, Text,
    ForeignKey, Date, Numeric, DateTime
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Company(Base):
    """Full company profile for a tenant."""
    __tablename__ = "companies"

    tenant_id     = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by    = Column(UUID(as_uuid=True), nullable=True)   # plain UUID — no FK tracking
    updated_by    = Column(UUID(as_uuid=True), nullable=True)
    is_active     = Column(Boolean, default=True,  nullable=False)
    is_test_data  = Column(Boolean, default=False, nullable=False)

    name          = Column(String(200), nullable=False)
    legal_name    = Column(String(200), nullable=True)
    gstin         = Column(String(20),  nullable=True)
    pan           = Column(String(20),  nullable=True)
    cin           = Column(String(25),  nullable=True)
    tan           = Column(String(15),  nullable=True)

    address_line1 = Column(String(300), nullable=True)
    address_line2 = Column(String(300), nullable=True)
    city          = Column(String(100), nullable=True)
    state         = Column(String(100), nullable=True)
    pincode       = Column(String(10),  nullable=True)
    country       = Column(String(100), default="India", nullable=False)

    phone         = Column(String(30),  nullable=True)
    email         = Column(String(254), nullable=True)
    website       = Column(String(300), nullable=True)

    logo_url      = Column(String(500), nullable=True)
    stamp_url     = Column(String(500), nullable=True)
    signature_url = Column(String(500), nullable=True)
    primary_color = Column(String(20),  default="#4F46E5", nullable=True)

    currency                = Column(String(10), default="INR",          nullable=False)
    timezone                = Column(String(60), default="Asia/Kolkata", nullable=False)
    date_format             = Column(String(30), default="DD/MM/YYYY",   nullable=False)
    fiscal_year_start_month = Column(Integer,    default=4,              nullable=False)


class Branch(Base):
    """A factory, warehouse, branch office, or showroom."""
    __tablename__ = "branches"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id",   ondelete="CASCADE"), nullable=False, index=True)
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=True,  nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    name          = Column(String(200), nullable=False)
    code          = Column(String(20),  nullable=True)
    branch_type   = Column(String(30),  default="factory", nullable=False)

    address_line1 = Column(String(300), nullable=True)
    address_line2 = Column(String(300), nullable=True)
    city          = Column(String(100), nullable=True)
    state         = Column(String(100), nullable=True)
    pincode       = Column(String(10),  nullable=True)

    gstin         = Column(String(20),  nullable=True)
    phone         = Column(String(30),  nullable=True)
    email         = Column(String(254), nullable=True)
    is_head_office = Column(Boolean,   default=False, nullable=False)


class FinancialYear(Base):
    """Financial year. Exactly ONE is_active=True per tenant at any time."""
    __tablename__ = "financial_years"

    tenant_id    = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by   = Column(UUID(as_uuid=True), nullable=True)
    updated_by   = Column(UUID(as_uuid=True), nullable=True)
    is_active    = Column(Boolean, default=False, nullable=False)
    is_test_data = Column(Boolean, default=False, nullable=False)

    name         = Column(String(30), nullable=False)
    start_date   = Column(Date,       nullable=False)
    end_date     = Column(Date,       nullable=False)

    is_closed    = Column(Boolean,                 default=False, nullable=False)
    closed_by    = Column(UUID(as_uuid=True),      nullable=True)
    closed_at    = Column(DateTime(timezone=True), nullable=True)


class NumberSeries(Base):
    """Auto-numbering per document type. Example: PO-2425-0001"""
    __tablename__ = "number_series"

    tenant_id      = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by     = Column(UUID(as_uuid=True), nullable=True)
    updated_by     = Column(UUID(as_uuid=True), nullable=True)
    is_active      = Column(Boolean, default=True,  nullable=False)
    is_test_data   = Column(Boolean, default=False, nullable=False)

    document_type  = Column(String(60), nullable=False)
    prefix         = Column(String(20), default="",      nullable=False)
    include_year   = Column(Boolean,    default=True,    nullable=False)
    year_format    = Column(String(10), default="YY-YY", nullable=False)
    separator      = Column(String(5),  default="-",     nullable=False)
    padding_digits = Column(Integer,    default=4,       nullable=False)
    current_number = Column(Integer,    default=0,       nullable=False)
    suffix         = Column(String(20), default="",      nullable=False)


class ApprovalRule(Base):
    """Which documents need approval, who approves, auto-approve threshold."""
    __tablename__ = "approval_rules"

    tenant_id              = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by             = Column(UUID(as_uuid=True), nullable=True)
    updated_by             = Column(UUID(as_uuid=True), nullable=True)
    is_active              = Column(Boolean, default=True,  nullable=False)
    is_test_data           = Column(Boolean, default=False, nullable=False)

    document_type          = Column(String(60),     nullable=False)
    is_approval_required   = Column(Boolean,        default=False, nullable=False)
    auto_approve_below_amt = Column(Numeric(14, 2), nullable=True)
    approver_role          = Column(String(60),     nullable=True)
    escalation_hours       = Column(Integer,        default=24,    nullable=False)
    notify_on_submit       = Column(Boolean,        default=True,  nullable=False)
    notify_on_approve      = Column(Boolean,        default=True,  nullable=False)
    notify_on_reject       = Column(Boolean,        default=True,  nullable=False)


class ChangeRequestSetting(Base):
    """Controls whether approved documents can be changed."""
    __tablename__ = "change_request_settings"

    tenant_id            = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by           = Column(UUID(as_uuid=True), nullable=True)
    updated_by           = Column(UUID(as_uuid=True), nullable=True)
    is_active            = Column(Boolean, default=True,  nullable=False)
    is_test_data         = Column(Boolean, default=False, nullable=False)

    document_type        = Column(String(60), nullable=False)
    allow_change_request = Column(Boolean,    default=False, nullable=False)
    who_can_raise        = Column(String(60), nullable=True)
    who_can_approve      = Column(String(60), nullable=True)
    requires_reason      = Column(Boolean,    default=True, nullable=False)


class AuditLog(Base):
    """
    Universal audit trail — append-only.
    updated_at = None overrides Base to exclude it from all SQL statements.
    The audit_log table in PostgreSQL has NO updated_at column by design.
    """
    __tablename__ = "audit_log"

    # ── KEY FIX: override Base.updated_at with None ──────────────────
    # Base declares updated_at as a Column. By setting it to None here,
    # we tell SQLAlchemy this model has no updated_at mapped attribute.
    # Without this, every SELECT/INSERT includes updated_at and crashes
    # with "column audit_log.updated_at does not exist".
    updated_at = None

    tenant_id       = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id         = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_name       = Column(String(200), nullable=True)
    user_role       = Column(String(60),  nullable=True)
    is_test_data    = Column(Boolean,     default=False, nullable=False)

    action          = Column(String(30),  nullable=False)
    module          = Column(String(60),  nullable=False)
    document_type   = Column(String(60),  nullable=True)
    document_id     = Column(UUID(as_uuid=True), nullable=True, index=True)
    document_number = Column(String(100), nullable=True)

    old_value       = Column(JSONB, nullable=True)
    new_value       = Column(JSONB, nullable=True)
    ip_address      = Column(String(45),  nullable=True)
    user_agent      = Column(String(500), nullable=True)
    notes           = Column(Text,        nullable=True)
