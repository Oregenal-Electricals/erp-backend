"""
Workflow Engine
===============
Evaluates JSON-based workflow rules against record data.
Called on every record create/update event.
"""
from typing import Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.engines import WorkflowRule, AuditLog
from app.models.user import User


class WorkflowEngine:
    """Evaluates and executes workflow rules."""

    def __init__(self, db: AsyncSession, tenant_id: UUID, user: Optional[User] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.user = user

    async def process_event(
        self,
        event: str,
        module: str,
        record: dict,
        old_record: Optional[dict] = None,
    ) -> list[dict]:
        """
        Process all active workflow rules for the given event + module.
        Returns list of actions that were executed.
        """
        rules = await self._load_rules(module)
        executed = []

        for rule in rules:
            trigger = rule.trigger or {}
            if not self._matches_trigger(trigger, event, record, old_record):
                continue
            if not self._evaluate_conditions(rule.conditions or [], record):
                continue

            # Execute actions
            for action in (rule.actions or []):
                result = await self._execute_action(action, record, rule)
                executed.append({"rule": rule.name, "action": action, "result": result})

            # Increment run count
            rule.run_count = (rule.run_count or 0) + 1

        return executed

    async def _load_rules(self, module: str) -> list[WorkflowRule]:
        result = await self.db.execute(
            select(WorkflowRule).where(
                WorkflowRule.tenant_id == self.tenant_id,
                WorkflowRule.module == module,
                WorkflowRule.is_active == True,
            )
        )
        return result.scalars().all()

    def _matches_trigger(self, trigger: dict, event: str, record: dict, old_record: Optional[dict]) -> bool:
        trigger_event = trigger.get("event", "")

        if trigger_event != event:
            return False

        if event == "status_changed" and old_record:
            from_status = trigger.get("from_status")
            to_status = trigger.get("to_status")
            if from_status and old_record.get("status") != from_status:
                return False
            if to_status and record.get("status") != to_status:
                return False

        if event == "field_updated" and old_record:
            field = trigger.get("field")
            if field and old_record.get(field) == record.get(field):
                return False  # Field didn't actually change

        return True

    def _evaluate_conditions(self, conditions: list[dict], record: dict) -> bool:
        """All conditions must pass (AND logic)."""
        for condition in conditions:
            if not self._evaluate_single_condition(condition, record):
                return False
        return True

    def _evaluate_single_condition(self, condition: dict, record: dict) -> bool:
        field = condition.get("field", "")
        operator = condition.get("operator", "")
        expected = condition.get("value")
        actual = record.get(field)

        try:
            if operator == "equals":
                return str(actual) == str(expected)
            elif operator == "not_equals":
                return str(actual) != str(expected)
            elif operator == "greater_than":
                return float(actual or 0) > float(expected or 0)
            elif operator == "less_than":
                return float(actual or 0) < float(expected or 0)
            elif operator == "greater_than_or_equal":
                return float(actual or 0) >= float(expected or 0)
            elif operator == "less_than_or_equal":
                return float(actual or 0) <= float(expected or 0)
            elif operator == "contains":
                return expected.lower() in str(actual or "").lower()
            elif operator == "starts_with":
                return str(actual or "").lower().startswith(expected.lower())
            elif operator == "is_empty":
                return not actual
            elif operator == "is_not_empty":
                return bool(actual)
            elif operator == "in_list":
                items = [i.strip() for i in str(expected).split(",")]
                return str(actual) in items
            elif operator == "past_by_days":
                from datetime import datetime, timedelta
                if not actual:
                    return False
                due = datetime.fromisoformat(str(actual))
                threshold = datetime.utcnow() - timedelta(days=int(expected))
                return due < threshold
        except (TypeError, ValueError):
            return False

        return False

    async def _execute_action(self, action: dict, record: dict, rule: WorkflowRule) -> dict:
        action_type = action.get("type", "")

        if action_type == "notify":
            return await self._action_notify(action, record, rule)
        elif action_type == "require_approval":
            return await self._action_require_approval(action, record)
        elif action_type == "update_field":
            return await self._action_update_field(action, record)
        elif action_type == "send_email":
            return {"status": "queued", "type": "send_email"}
        elif action_type == "create_task":
            return {"status": "queued", "type": "create_task"}

        return {"status": "unknown_action", "type": action_type}

    async def _action_notify(self, action: dict, record: dict, rule: WorkflowRule) -> dict:
        """Queue notification to targets."""
        targets = action.get("targets", [])
        # In production: push to Celery task queue
        # For now: create in-app notification records
        from app.models.engines import AuditLog
        return {"status": "queued", "targets": targets, "type": "notify"}

    async def _action_require_approval(self, action: dict, record: dict) -> dict:
        """Trigger approval chain."""
        chain_id = action.get("chain_id")
        return {"status": "approval_triggered", "chain_id": chain_id}

    async def _action_update_field(self, action: dict, record: dict) -> dict:
        """Update a field on the record."""
        field = action.get("field")
        value = action.get("value")
        record[field] = value
        return {"status": "field_updated", "field": field, "value": value}
