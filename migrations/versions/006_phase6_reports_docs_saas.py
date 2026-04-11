"""Add saved_reports, company_config, plan column on tenants

Revision ID: 006_phase6_reports_docs_saas
Revises: 005_sales_module
Create Date: 2024-07-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006_phase6_reports_docs_saas"
down_revision = "005_sales_module"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add plan column to tenants (if not exists)
    try:
        op.add_column("tenants", sa.Column("plan", sa.String(50), server_default="free", nullable=False))
    except Exception:
        pass  # Column may already exist

    # saved_reports
    op.create_table(
        "saved_reports",
        sa.Column("id",          postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",        sa.String(300), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("module",      sa.String(100), nullable=False),
        sa.Column("config",      postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("is_public",   sa.Boolean, server_default="false", nullable=False),
        sa.Column("schedule",    sa.String(50), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by",  postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at",  sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"],["users.id"],   ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_reports_tenant", "saved_reports", ["tenant_id"])

    # company_config
    op.create_table(
        "company_config",
        sa.Column("id",        postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("config",    postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_company_config_tenant", "company_config", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("company_config")
    op.drop_table("saved_reports")
