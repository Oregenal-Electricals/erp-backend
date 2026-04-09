"""Add full sales module: customers, sales_orders, order_items, payment_records

Revision ID: 005_sales_module
Revises: 004_qc_accounts_hr_notifications
Create Date: 2024-07-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_sales_module"
down_revision = "004_qc_accounts_hr_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── customers ─────────────────────────────────────────────────────
    op.create_table(
        "customers",
        sa.Column("id",           postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",         sa.String(300), nullable=False),
        sa.Column("email",        sa.String(254), nullable=True),
        sa.Column("phone",        sa.String(30),  nullable=True),
        sa.Column("address",      sa.Text, nullable=True),
        sa.Column("gstin",        sa.String(20), nullable=True),
        sa.Column("pan",          sa.String(20), nullable=True),
        sa.Column("credit_limit", sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("is_active",    sa.Boolean, server_default="true", nullable=False),
        sa.Column("custom_data",  postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",   sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customers_tenant_id", "customers", ["tenant_id"])
    op.create_index("ix_customers_name", "customers", ["name"])

    # ── sales_orders ──────────────────────────────────────────────────
    op.create_table(
        "sales_orders",
        sa.Column("id",               postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",        postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_number",     sa.String(50), nullable=False),
        sa.Column("customer_id",      postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_name",    sa.String(300), nullable=False),
        sa.Column("customer_email",   sa.String(254), nullable=True),
        sa.Column("customer_phone",   sa.String(30),  nullable=True),
        sa.Column("customer_address", sa.Text, nullable=True),
        sa.Column("customer_gstin",   sa.String(20), nullable=True),
        sa.Column("subtotal",         sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("discount_amount",  sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("tax_amount",       sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("total_amount",     sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("paid_amount",      sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("balance_due",      sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("status",           sa.String(50), server_default="draft", nullable=False),
        sa.Column("payment_status",   sa.String(50), server_default="unpaid", nullable=False),
        sa.Column("approval_status",  sa.String(50), server_default="none", nullable=False),
        sa.Column("order_date",       sa.String(20), nullable=True),
        sa.Column("delivery_date",    sa.String(20), nullable=True),
        sa.Column("valid_until",      sa.String(20), nullable=True),
        sa.Column("reference_number", sa.String(100), nullable=True),
        sa.Column("terms",            sa.Text, nullable=True),
        sa.Column("notes",            sa.Text, nullable=True),
        sa.Column("internal_notes",   sa.Text, nullable=True),
        sa.Column("assigned_to_id",   postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("custom_data",      postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",       sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],      ["tenants.id"],   ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"],    ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"],     ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_orders_tenant_id",    "sales_orders", ["tenant_id"])
    op.create_index("ix_sales_orders_status",       "sales_orders", ["status"])
    op.create_index("ix_sales_orders_order_number", "sales_orders", ["order_number"])

    # ── order_items ───────────────────────────────────────────────────
    op.create_table(
        "order_items",
        sa.Column("id",           postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id",   postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("product_name", sa.String(300), nullable=False),
        sa.Column("product_sku",  sa.String(100), nullable=True),
        sa.Column("description",  sa.Text, nullable=True),
        sa.Column("quantity",     sa.Numeric(15,3), server_default="1", nullable=False),
        sa.Column("unit",         sa.String(30), server_default="Pcs", nullable=False),
        sa.Column("unit_price",   sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("discount_pct", sa.Numeric(5,2),  server_default="0", nullable=False),
        sa.Column("tax_pct",      sa.Numeric(5,2),  server_default="18", nullable=False),
        sa.Column("line_total",   sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("sort_order",   sa.Integer, server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"],    ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"],  ["sales_orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])

    # ── payment_records ───────────────────────────────────────────────
    op.create_table(
        "payment_records",
        sa.Column("id",           postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount",       sa.Numeric(15,2), nullable=False),
        sa.Column("payment_date", sa.String(20), nullable=True),
        sa.Column("method",       sa.String(50), server_default="bank_transfer", nullable=False),
        sa.Column("reference",    sa.String(200), nullable=True),
        sa.Column("notes",        sa.Text, nullable=True),
        sa.Column("recorded_by",  postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"],     ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"],  ["sales_orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_records_order_id", "payment_records", ["order_id"])


def downgrade() -> None:
    op.drop_table("payment_records")
    op.drop_table("order_items")
    op.drop_table("sales_orders")
    op.drop_table("customers")
