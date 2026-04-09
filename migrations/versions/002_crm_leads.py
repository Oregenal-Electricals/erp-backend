"""Add crm_leads table

Revision ID: 002_crm_leads
Revises: 001_initial_schema
Create Date: 2024-07-02 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_crm_leads"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crm_leads",
        sa.Column("id",             postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",           sa.String(300), nullable=False),
        sa.Column("contact_name",   sa.String(200), nullable=True),
        sa.Column("email",          sa.String(254), nullable=True),
        sa.Column("phone",          sa.String(30),  nullable=True),
        sa.Column("source",         sa.String(100), nullable=True),
        sa.Column("status",         sa.String(50),  server_default="new", nullable=False),
        sa.Column("estimated_value",sa.Numeric(15, 2), nullable=True),
        sa.Column("notes",          sa.Text, nullable=True),
        sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("custom_data",    postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",     sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],     ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_to_id"],["users.id"],   ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_crm_leads_tenant_id", "crm_leads", ["tenant_id"])
    op.create_index("ix_crm_leads_status",    "crm_leads", ["status"])
    op.create_index("ix_crm_leads_email",     "crm_leads", ["email"])


def downgrade() -> None:
    op.drop_table("crm_leads")
