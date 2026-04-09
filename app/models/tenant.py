from sqlalchemy import Column, String, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    """
    Represents a company/organisation using the ERP.
    All other data is scoped to a tenant via tenant_id foreign key.
    """

    __tablename__ = "tenants"

    # Identity
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(200), nullable=True)  # custom domain support

    # Subscription
    plan = Column(String(50), default="free", nullable=False)       # free | starter | pro | enterprise
    is_active = Column(Boolean, default=True, nullable=False)
    trial_ends_at = Column(String, nullable=True)                    # ISO date string

    # Configuration (stored as JSON for flexibility)
    settings = Column(JSON, default=dict, nullable=False)
    """
    settings structure example:
    {
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "date_format": "DD/MM/YYYY",
      "financial_year_start": "04",  # April
      "modules_enabled": ["crm", "sales", "inventory", "manufacturing"],
      "logo_url": "https://...",
      "address": "...",
      "gstin": "...",
      "pan": "..."
    }
    """

    # Branding
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(20), default="#4F46E5", nullable=True)

    # Relationships
    users = relationship("User", back_populates="tenant", lazy="noload")
    roles = relationship("Role", back_populates="tenant", lazy="noload")

    def __repr__(self):
        return f"<Tenant {self.slug}>"

    @property
    def modules_enabled(self) -> list:
        return self.settings.get("modules_enabled", [
            "crm", "sales", "purchase", "inventory",
            "manufacturing", "qc", "accounts", "hr", "reports"
        ])

    @property
    def currency(self) -> str:
        return self.settings.get("currency", "INR")

    @property
    def timezone(self) -> str:
        return self.settings.get("timezone", "Asia/Kolkata")
