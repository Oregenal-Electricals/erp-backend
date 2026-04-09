"""Initial schema — all foundation tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2024-07-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── tenants ───────────────────────────────────────────────────────
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("domain", sa.String(200), nullable=True),
        sa.Column("plan", sa.String(50), server_default="free", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("trial_ends_at", sa.String(), nullable=True),
        sa.Column("settings", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("primary_color", sa.String(20), server_default="#4F46E5", nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_tenants_slug", "tenants", ["slug"])

    # ── roles ─────────────────────────────────────────────────────────
    op.create_table(
        "roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("permissions", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("is_system", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_roles_tenant_id", "roles", ["tenant_id"])

    # ── departments ───────────────────────────────────────────────────
    op.create_table(
        "departments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("code", sa.String(20), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("head_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["departments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_departments_tenant_id", "departments", ["tenant_id"])

    # ── users ─────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("hashed_password", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("role", sa.String(50), server_default="staff", nullable=False),
        sa.Column("extra_permissions", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_email_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("last_login_at", sa.String(), nullable=True),
        sa.Column("preferences", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    # ── field_definitions ─────────────────────────────────────────────
    op.create_table(
        "field_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("field_key", sa.String(100), nullable=False),
        sa.Column("field_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("placeholder", sa.String(200), nullable=True),
        sa.Column("help_text", sa.Text(), nullable=True),
        sa.Column("options", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("validation_rules", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_definitions_tenant_id", "field_definitions", ["tenant_id"])
    op.create_index("ix_field_definitions_module", "field_definitions", ["module"])

    # ── form_configs ──────────────────────────────────────────────────
    op.create_table(
        "form_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("layout", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── status_configs ────────────────────────────────────────────────
    op.create_table(
        "status_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("color", sa.String(20), server_default="#6366F1", nullable=False),
        sa.Column("bg_color", sa.String(20), server_default="#EEF2FF", nullable=False),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_initial", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_terminal", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("allowed_transitions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_status_configs_module", "status_configs", ["module"])

    # ── custom_values ─────────────────────────────────────────────────
    op.create_table(
        "custom_values",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_type", sa.String(100), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("field_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["field_id"], ["field_definitions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_custom_values_record", "custom_values", ["record_type", "record_id"])

    # ── workflow_rules ────────────────────────────────────────────────
    op.create_table(
        "workflow_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("run_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("trigger", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("conditions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("actions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workflow_rules_module", "workflow_rules", ["module"])

    # ── approval_chains ───────────────────────────────────────────────
    op.create_table(
        "approval_chains",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("conditions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("steps", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("escalation_hours", sa.Integer(), server_default="48", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── approval_requests ─────────────────────────────────────────────
    op.create_table(
        "approval_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chain_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_type", sa.String(100), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_step", sa.Integer(), server_default="1", nullable=False),
        sa.Column("status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("requested_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("history", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["chain_id"], ["approval_chains.id"]),
        sa.ForeignKeyConstraint(["requested_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_approval_requests_record", "approval_requests", ["record_type", "record_id"])

    # ── automation_rules ──────────────────────────────────────────────
    op.create_table(
        "automation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("conditions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("actions", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("run_count", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── audit_logs ────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_name", sa.String(200), nullable=True),
        sa.Column("module", sa.String(100), nullable=False),
        sa.Column("record_type", sa.String(100), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("record_label", sa.String(200), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("old_values", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("new_values", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("changed_fields", postgresql.JSON(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_tenant_module", "audit_logs", ["tenant_id", "module"])
    op.create_index("ix_audit_logs_record", "audit_logs", ["record_type", "record_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("automation_rules")
    op.drop_table("approval_requests")
    op.drop_table("approval_chains")
    op.drop_table("workflow_rules")
    op.drop_table("custom_values")
    op.drop_table("status_configs")
    op.drop_table("form_configs")
    op.drop_table("field_definitions")
    op.drop_table("users")
    op.drop_table("departments")
    op.drop_table("roles")
    op.drop_table("tenants")
