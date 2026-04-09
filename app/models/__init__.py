# Import ALL models here so Alembic autogenerate picks them up
from app.models.tenant import Tenant
from app.models.user import User, Role, Department
from app.models.customization import FieldDefinition, FormConfig, StatusConfig, CustomValue
from app.models.engines import WorkflowRule, ApprovalChain, ApprovalRequest, AutomationRule, AuditLog

__all__ = [
    "Tenant",
    "User",
    "Role",
    "Department",
    "FieldDefinition",
    "FormConfig",
    "StatusConfig",
    "CustomValue",
    "WorkflowRule",
    "ApprovalChain",
    "ApprovalRequest",
    "AutomationRule",
    "AuditLog",
]
