from sqlalchemy import Column, String, Boolean, JSON, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WorkflowRule(Base):
    """
    No-code workflow rule stored as a JSON rule tree.
    Evaluated by the workflow engine on every record event.
    """

    __tablename__ = "workflow_rules"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    run_count = Column(Integer, default=0, nullable=False)

    trigger = Column(JSON, nullable=False)
    """
    trigger structure:
    {
      "event": "record_created" | "field_updated" | "status_changed" | "scheduled",
      "field": "amount",              // for field_updated
      "from_status": "draft",         // for status_changed
      "to_status": "approved",        // for status_changed
      "schedule": "0 9 * * 1"        // cron for scheduled
    }
    """

    conditions = Column(JSON, default=list, nullable=False)
    """
    conditions structure (AND logic between items):
    [
      { "field": "amount", "operator": "greater_than", "value": 100000 },
      { "field": "customer_type", "operator": "equals", "value": "wholesale" }
    ]
    Operators: equals | not_equals | greater_than | less_than |
               contains | starts_with | is_empty | is_not_empty |
               in_list | past_by_days
    """

    actions = Column(JSON, default=list, nullable=False)
    """
    actions structure:
    [
      { "type": "notify", "targets": ["role:sales_manager", "user:uuid"] },
      { "type": "require_approval", "chain_id": "uuid" },
      { "type": "update_field", "field": "priority", "value": "high" },
      { "type": "send_email", "template": "order_created", "to": "customer" },
      { "type": "create_task", "title": "Review order", "assignee": "role:manager" }
    ]
    """

    def __repr__(self):
        return f"<WorkflowRule {self.name}>"


class ApprovalChain(Base):
    """
    Approval chain configuration — defines who must approve what and in what order.
    """

    __tablename__ = "approval_chains"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    module = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    conditions = Column(JSON, default=list, nullable=False)
    """
    Same structure as WorkflowRule.conditions —
    determines when this approval chain applies.
    """

    steps = Column(JSON, default=list, nullable=False)
    """
    steps structure:
    [
      {
        "step": 1,
        "label": "Manager Approval",
        "approver_type": "role" | "user" | "department_head",
        "approver_value": "sales_manager",      // role slug or user uuid
        "approval_type": "any_one" | "all",     // for multiple approvers
        "escalation_hours": 24,                 // auto-escalate after N hours
        "escalate_to": "role:admin"
      }
    ]
    """

    escalation_hours = Column(Integer, default=48, nullable=False)

    def __repr__(self):
        return f"<ApprovalChain {self.name}>"


class ApprovalRequest(Base):
    """Tracks an in-progress approval for a specific record."""

    __tablename__ = "approval_requests"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    chain_id = Column(UUID(as_uuid=True), ForeignKey("approval_chains.id"), nullable=False)
    record_type = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    current_step = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="pending", nullable=False)   # pending|approved|rejected|cancelled
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    history = Column(JSON, default=list, nullable=False)
    """
    history: [
      { "step": 1, "action": "approved", "by": "user_uuid", "at": "iso_datetime", "comment": "..." }
    ]
    """
    notes = Column(Text, nullable=True)


class AutomationRule(Base):
    """Event-driven automation rules — evaluated asynchronously by Celery."""

    __tablename__ = "automation_rules"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    module = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    """
    event_type: record_created | record_updated | status_changed |
                payment_received | stock_below_threshold | daily_check
    """
    conditions = Column(JSON, default=list, nullable=False)
    actions = Column(JSON, default=list, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    run_count = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<AutomationRule {self.name}>"


class AuditLog(Base):
    """Immutable audit trail for all data changes."""

    __tablename__ = "audit_logs"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    user_name = Column(String(200), nullable=True)
    module = Column(String(100), nullable=False, index=True)
    record_type = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    record_label = Column(String(200), nullable=True)   # human-readable identifier
    action = Column(String(50), nullable=False)          # create|update|delete|approve|reject|export
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changed_fields = Column(JSON, default=list, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.module}/{self.action}>"
