"""
Gate Guard / Security Module — SQLAlchemy Models
=================================================
VisitorEntry, VehicleLog, GateEntry, GateEntryItem, GatePass

Notes:
  created_by / updated_by — plain UUID, no ForeignKey.
  Reason: FK causes MissingGreenlet in async context when set outside
  a greenlet. These are audit fields — we never navigate from them.

  approved_by_id / rejected_by_id — plain UUID for same reason.
"""
from sqlalchemy import (
    Column, String, Boolean, Integer, Text,
    ForeignKey, Date, Numeric, DateTime
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class VisitorEntry(Base):
    __tablename__ = "visitor_entries"

    tenant_id         = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by        = Column(UUID(as_uuid=True), nullable=True)
    updated_by        = Column(UUID(as_uuid=True), nullable=True)
    is_active         = Column(Boolean, default=True,  nullable=False)
    is_test_data      = Column(Boolean, default=False, nullable=False)

    entry_number      = Column(String(30),  nullable=False)
    visitor_name      = Column(String(200), nullable=False)
    visitor_phone     = Column(String(20),  nullable=True)
    visitor_company   = Column(String(200), nullable=True)
    id_proof_type     = Column(String(30),  nullable=True)
    id_proof_number   = Column(String(50),  nullable=True)
    purpose           = Column(Text,        nullable=True)
    meeting_with_name = Column(String(200), nullable=True)
    meeting_with_dept = Column(String(100), nullable=True)
    badge_number      = Column(String(20),  nullable=True)
    gate_in           = Column(DateTime(timezone=True), nullable=True)
    gate_out          = Column(DateTime(timezone=True), nullable=True)
    status            = Column(String(20),  default="inside", nullable=False)
    remarks           = Column(Text,        nullable=True)
    created_by_name   = Column(String(200), nullable=True)


class VehicleLog(Base):
    __tablename__ = "vehicle_logs"

    tenant_id         = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by        = Column(UUID(as_uuid=True), nullable=True)
    updated_by        = Column(UUID(as_uuid=True), nullable=True)
    is_active         = Column(Boolean, default=True,  nullable=False)
    is_test_data      = Column(Boolean, default=False, nullable=False)

    log_number        = Column(String(30),  nullable=False)
    vehicle_number    = Column(String(30),  nullable=False)
    vehicle_type      = Column(String(30),  default="truck", nullable=False)
    driver_name       = Column(String(200), nullable=True)
    driver_phone      = Column(String(20),  nullable=True)
    driver_licence    = Column(String(50),  nullable=True)
    from_location     = Column(String(200), nullable=True)
    to_location       = Column(String(200), nullable=True)
    purpose           = Column(String(100), default="delivery", nullable=False)
    gate_in           = Column(DateTime(timezone=True), nullable=True)
    gate_out          = Column(DateTime(timezone=True), nullable=True)
    status            = Column(String(20),  default="inside", nullable=False)
    linked_entry_type = Column(String(30),  nullable=True)
    linked_entry_id   = Column(UUID(as_uuid=True), nullable=True)
    remarks           = Column(Text,        nullable=True)
    created_by_name   = Column(String(200), nullable=True)


class GateEntry(Base):
    __tablename__ = "gate_entries"

    tenant_id             = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by            = Column(UUID(as_uuid=True), nullable=True)
    updated_by            = Column(UUID(as_uuid=True), nullable=True)
    is_active             = Column(Boolean, default=True,  nullable=False)
    is_test_data          = Column(Boolean, default=False, nullable=False)

    entry_number          = Column(String(30),  nullable=False)
    status                = Column(String(30),  default="PENDING", nullable=False, index=True)

    vendor_name           = Column(String(300), nullable=False)
    vendor_gstin          = Column(String(20),  nullable=True)

    vehicle_number        = Column(String(30),  nullable=True)
    driver_name           = Column(String(200), nullable=True)
    driver_phone          = Column(String(20),  nullable=True)
    transport_mode        = Column(String(30),  default="road", nullable=False)

    vendor_invoice_no     = Column(String(100), nullable=True)
    vendor_invoice_date   = Column(Date,        nullable=True)
    vendor_invoice_amount = Column(Numeric(14, 2), nullable=True)

    po_id                 = Column(UUID(as_uuid=True), nullable=True)
    po_number             = Column(String(50),  nullable=True)

    gate_in               = Column(DateTime(timezone=True), nullable=True)
    gate_out              = Column(DateTime(timezone=True), nullable=True)
    remarks               = Column(Text,        nullable=True)
    attachment_url        = Column(String(500), nullable=True)

    approved_by_id        = Column(UUID(as_uuid=True), nullable=True)
    approved_at           = Column(DateTime(timezone=True), nullable=True)
    rejected_by_id        = Column(UUID(as_uuid=True), nullable=True)
    rejected_at           = Column(DateTime(timezone=True), nullable=True)
    rejection_reason      = Column(Text,        nullable=True)
    held_by_id            = Column(UUID(as_uuid=True), nullable=True)
    held_at               = Column(DateTime(timezone=True), nullable=True)
    hold_reason           = Column(Text,        nullable=True)

    grn_id                = Column(UUID(as_uuid=True), nullable=True)
    grn_number            = Column(String(50),  nullable=True)

    created_by_name       = Column(String(200), nullable=True)


class GateEntryItem(Base):
    __tablename__ = "gate_entry_items"

    gate_entry_id = Column(UUID(as_uuid=True), ForeignKey("gate_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id     = Column(UUID(as_uuid=True), ForeignKey("tenants.id",   ondelete="CASCADE"), nullable=False)
    is_test_data  = Column(Boolean, default=False, nullable=False)

    item_name     = Column(String(300), nullable=False)
    item_code     = Column(String(100), nullable=True)
    description   = Column(Text,        nullable=True)
    qty_received  = Column(Numeric(14, 3), default=0,     nullable=False)
    unit          = Column(String(30),  default="pcs",    nullable=False)
    po_qty        = Column(Numeric(14, 3), nullable=True)
    sort_order    = Column(Integer,     default=0,        nullable=False)
    remarks       = Column(Text,        nullable=True)


class GatePass(Base):
    __tablename__ = "gate_passes"

    tenant_id            = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by           = Column(UUID(as_uuid=True), nullable=True)
    updated_by           = Column(UUID(as_uuid=True), nullable=True)
    is_active            = Column(Boolean, default=True,          nullable=False)
    is_test_data         = Column(Boolean, default=False,         nullable=False)

    pass_number          = Column(String(30),  nullable=False)
    pass_type            = Column(String(20),  default="returnable", nullable=False)
    status               = Column(String(30),  default="OPEN",       nullable=False, index=True)

    party_name           = Column(String(300), nullable=False)
    party_address        = Column(Text,        nullable=True)
    party_phone          = Column(String(20),  nullable=True)

    vehicle_number       = Column(String(30),  nullable=True)
    driver_name          = Column(String(200), nullable=True)
    driver_phone         = Column(String(20),  nullable=True)

    purpose              = Column(Text,        nullable=True)

    reference_type       = Column(String(30),  nullable=True)
    reference_id         = Column(UUID(as_uuid=True), nullable=True)
    reference_number     = Column(String(100), nullable=True)

    expected_return_date = Column(Date,        nullable=True)
    actual_return_date   = Column(Date,        nullable=True)
    gate_out             = Column(DateTime(timezone=True), nullable=True)
    gate_in_return       = Column(DateTime(timezone=True), nullable=True)

    approved_by_id       = Column(UUID(as_uuid=True), nullable=True)
    approved_at          = Column(DateTime(timezone=True), nullable=True)

    items                = Column(JSONB, default=list, nullable=False)

    remarks              = Column(Text,        nullable=True)
    attachment_url       = Column(String(500), nullable=True)
    created_by_name      = Column(String(200), nullable=True)
