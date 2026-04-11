"""Add qc_inspections, invoices, hr_employees, notifications

Revision ID: 004_qc_accounts_hr_notifications
Revises: 003_inventory_purchase_manufacturing
Create Date: 2024-07-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_qc_accounts_hr_notifications"
down_revision = "003_inventory_purchase_manufacturing"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("qc_inspections",
        sa.Column("id",             postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("work_order_id",  sa.String(50), nullable=True),
        sa.Column("product_name",   sa.String(300), nullable=False),
        sa.Column("batch_size",     sa.Integer, server_default="0", nullable=False),
        sa.Column("passed",         sa.Integer, server_default="0", nullable=False),
        sa.Column("failed",         sa.Integer, server_default="0", nullable=False),
        sa.Column("status",         sa.String(20), server_default="pending", nullable=False),
        sa.Column("inspector",      sa.String(200), nullable=True),
        sa.Column("inspection_date",sa.String(20), nullable=True),
        sa.Column("notes",          sa.Text, nullable=True),
        sa.Column("custom_data",    postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",     sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_qc_inspections_tenant", "qc_inspections", ["tenant_id"])

    op.create_table("invoices",
        sa.Column("id",            postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_name", sa.String(300), nullable=False),
        sa.Column("sales_order_id",sa.String(50), nullable=True),
        sa.Column("amount",        sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("paid",          sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("due",           sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("status",        sa.String(30), server_default="draft", nullable=False),
        sa.Column("issue_date",    sa.String(20), nullable=True),
        sa.Column("due_date",      sa.String(20), nullable=True),
        sa.Column("notes",         sa.Text, nullable=True),
        sa.Column("custom_data",   postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",    sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoices_tenant", "invoices", ["tenant_id"])
    op.create_index("ix_invoices_status", "invoices", ["status"])

    op.create_table("hr_employees",
        sa.Column("id",          postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",        sa.String(200), nullable=False),
        sa.Column("email",       sa.String(254), nullable=False),
        sa.Column("phone",       sa.String(30), nullable=True),
        sa.Column("department",  sa.String(100), nullable=True),
        sa.Column("designation", sa.String(200), nullable=True),
        sa.Column("role",        sa.String(50), server_default="staff", nullable=False),
        sa.Column("join_date",   sa.String(20), nullable=True),
        sa.Column("status",      sa.String(30), server_default="active", nullable=False),
        sa.Column("notes",       sa.Text, nullable=True),
        sa.Column("custom_data", postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",  sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hr_employees_tenant", "hr_employees", ["tenant_id"])

    op.create_table("notifications",
        sa.Column("id",        postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id",   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title",     sa.String(300), nullable=False),
        sa.Column("message",   sa.Text, nullable=True),
        sa.Column("link",      sa.String(500), nullable=True),
        sa.Column("type",      sa.String(30), server_default="info", nullable=False),
        sa.Column("is_read",   sa.Boolean, server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"],["users.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user", "notifications", ["user_id"])

def downgrade():
    op.drop_table("notifications")
    op.drop_table("hr_employees")
    op.drop_table("invoices")
    op.drop_table("qc_inspections")
