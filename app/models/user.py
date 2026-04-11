from sqlalchemy import Column, String, Boolean, JSON, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Role(Base):
    """
    Tenant-scoped role definition.
    Permissions stored as JSON: { "module": ["view", "create", "edit", "delete"] }
    """

    __tablename__ = "roles"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, default=1, nullable=False)  # 1=staff, 5=manager, 10=admin
    permissions = Column(JSON, default=dict, nullable=False)
    """
    permissions structure:
    {
      "crm": ["view", "create", "edit"],
      "sales": ["view", "create", "edit", "delete", "approve"],
      "inventory": ["view"],
      ...
    }
    """
    is_system = Column(Boolean, default=False, nullable=False)  # system roles cannot be deleted

    # Relationships
    tenant = relationship("Tenant", back_populates="roles", lazy="noload")
    users = relationship("User", back_populates="role_obj", lazy="noload")

    def __repr__(self):
        return f"<Role {self.name}>"

    def has_permission(self, module: str, action: str) -> bool:
        module_perms = self.permissions.get(module, [])
        return action in module_perms or "admin" in module_perms


class Department(Base):
    """Organisational departments within a tenant."""

    __tablename__ = "departments"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    head_id = Column(UUID(as_uuid=True), nullable=True)  # FK to users.id (circular — set later)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Department {self.name}>"


class User(Base):
    """System user — belongs to one tenant, has one role."""

    __tablename__ = "users"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    # Identity
    name = Column(String(200), nullable=False)
    email = Column(String(254), nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    phone = Column(String(30), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Role shortcut (denormalised for speed — kept in sync with role.slug)
    role = Column(String(50), default="staff", nullable=False)
    # Possible: super_admin | admin | manager | staff | viewer

    # Extra field-level permissions overriding role defaults
    extra_permissions = Column(JSON, default=dict, nullable=False)
    """
    extra_permissions structure (overrides):
    {
      "sales": ["approve"],   // grant extra
      "hr": []               // revoke all
    }
    """

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(String, nullable=True)

    # Preferences
    preferences = Column(JSON, default=dict, nullable=False)
    """
    {
      "theme": "light",
      "language": "en",
      "notifications": { "email": true, "in_app": true }
    }
    """

    # Relationships
    tenant = relationship("Tenant", back_populates="users", lazy="noload")
    role_obj = relationship("Role", back_populates="users", lazy="noload")

    def __repr__(self):
        return f"<User {self.email}>"

    @property
    def permissions(self) -> dict:
        """Merge role permissions with user-level overrides."""
        base = {}
        if self.role_obj:
            base = dict(self.role_obj.permissions or {})
        # Apply extra_permissions overrides
        for module, actions in (self.extra_permissions or {}).items():
            base[module] = actions
        return base

    def has_permission(self, module: str, action: str) -> bool:
        if self.role == "super_admin":
            return True
        perms = self.permissions
        return action in perms.get(module, [])
