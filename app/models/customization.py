from sqlalchemy import Column, String, Boolean, JSON, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class FieldDefinition(Base):
    """
    Custom field definition for any module.
    One row = one custom field configured by an admin.
    """

    __tablename__ = "field_definitions"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    module = Column(String(100), nullable=False, index=True)  # e.g. "sales_orders", "crm_leads"
    field_key = Column(String(100), nullable=False)           # snake_case unique per module+tenant
    field_type = Column(String(50), nullable=False)           # text|number|date|dropdown|checkbox|textarea|file
    label = Column(String(200), nullable=False)
    placeholder = Column(String(200), nullable=True)
    help_text = Column(Text, nullable=True)
    options = Column(JSON, default=list, nullable=False)      # for dropdown: ["Option A", "Option B"]
    is_required = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    validation_rules = Column(JSON, default=dict, nullable=False)
    """
    validation_rules example:
    { "min": 0, "max": 100, "pattern": "^[A-Z]", "min_length": 3 }
    """

    def __repr__(self):
        return f"<FieldDefinition {self.module}.{self.field_key}>"


class FormConfig(Base):
    """
    Form layout configuration for a module.
    Stores which fields appear, in which order, in which sections.
    """

    __tablename__ = "form_configs"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    module = Column(String(100), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    layout = Column(JSON, default=dict, nullable=False)
    """
    layout structure:
    {
      "sections": [
        {
          "id": "basic",
          "title": "Basic Info",
          "columns": 2,
          "fields": [
            { "field_key": "customer_name", "width": "full", "visible": true, "required": true },
            { "field_key": "dispatch_mode", "width": "half", "visible": true, "required": false }
          ]
        }
      ]
    }
    """

    def __repr__(self):
        return f"<FormConfig {self.module}/{self.name}>"


class StatusConfig(Base):
    """
    Custom status definitions per module per tenant.
    Each tenant can define their own workflow statuses.
    """

    __tablename__ = "status_configs"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    module = Column(String(100), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    color = Column(String(20), default="#6366F1", nullable=False)   # hex color
    bg_color = Column(String(20), default="#EEF2FF", nullable=False)
    icon = Column(String(50), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_initial = Column(Boolean, default=False, nullable=False)     # starting status
    is_terminal = Column(Boolean, default=False, nullable=False)    # end status (no further transitions)
    allowed_transitions = Column(JSON, default=list, nullable=False)
    """
    allowed_transitions: ["approved", "rejected"]   # list of status slugs this can move to
    """

    def __repr__(self):
        return f"<StatusConfig {self.module}/{self.slug}>"


class CustomValue(Base):
    """
    Stores the actual values of custom fields for every record.
    Uses a single JSONB column for flexible storage.
    """

    __tablename__ = "custom_values"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    record_type = Column(String(100), nullable=False, index=True)  # e.g. "sales_orders"
    record_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    field_id = Column(UUID(as_uuid=True), ForeignKey("field_definitions.id", ondelete="CASCADE"), nullable=False)
    value = Column(JSON, nullable=True)  # stores any type as JSON

    def __repr__(self):
        return f"<CustomValue {self.record_type}/{self.record_id}/{self.field_id}>"
