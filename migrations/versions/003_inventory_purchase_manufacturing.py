"""Add inventory_products, purchase_orders, work_orders tables

Revision ID: 003_inventory_purchase_manufacturing
Revises: 002_crm_leads
Create Date: 2024-07-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003_inventory_purchase_manufacturing"
down_revision = "002_crm_leads"
branch_labels = None
depends_on = None

def upgrade():
    # inventory_products
    op.create_table("inventory_products",
        sa.Column("id",           postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name",         sa.String(300), nullable=False),
        sa.Column("sku",          sa.String(100), nullable=False),
        sa.Column("category",     sa.String(100), nullable=True),
        sa.Column("unit",         sa.String(30), server_default="Pcs", nullable=False),
        sa.Column("description",  sa.Text, nullable=True),
        sa.Column("cost_price",   sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("selling_price",sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("stock",        sa.Integer, server_default="0", nullable=False),
        sa.Column("reorder_point",sa.Integer, server_default="0", nullable=False),
        sa.Column("status",       sa.String(20), server_default="active", nullable=False),
        sa.Column("custom_data",  postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",   sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_products_tenant", "inventory_products", ["tenant_id"])
    op.create_index("ix_inventory_products_sku", "inventory_products", ["sku"])

    # purchase_orders
    op.create_table("purchase_orders",
        sa.Column("id",            postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("vendor_name",   sa.String(300), nullable=False),
        sa.Column("order_number",  sa.String(50), nullable=True),
        sa.Column("status",        sa.String(50), server_default="draft", nullable=False),
        sa.Column("payment_status",sa.String(50), server_default="pending", nullable=False),
        sa.Column("total_amount",  sa.Numeric(15,2), server_default="0", nullable=False),
        sa.Column("items_count",   sa.Integer, server_default="0", nullable=False),
        sa.Column("order_date",    sa.String(20), nullable=True),
        sa.Column("expected_date", sa.String(20), nullable=True),
        sa.Column("notes",         sa.Text, nullable=True),
        sa.Column("custom_data",   postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",    sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_purchase_orders_tenant", "purchase_orders", ["tenant_id"])
    op.create_index("ix_purchase_orders_status", "purchase_orders", ["status"])

    # work_orders
    op.create_table("work_orders",
        sa.Column("id",           postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(300), nullable=False),
        sa.Column("quantity",     sa.Integer, server_default="1", nullable=False),
        sa.Column("unit",         sa.String(30), server_default="Pcs", nullable=False),
        sa.Column("status",       sa.String(50), server_default="planned", nullable=False),
        sa.Column("priority",     sa.String(20), server_default="normal", nullable=False),
        sa.Column("planned_date", sa.String(20), nullable=True),
        sa.Column("assigned_to",  sa.String(200), nullable=True),
        sa.Column("notes",        sa.Text, nullable=True),
        sa.Column("custom_data",  postgresql.JSON(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("deleted_at",   sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"],["tenants.id"],ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_work_orders_tenant", "work_orders", ["tenant_id"])
    op.create_index("ix_work_orders_status", "work_orders", ["status"])

def downgrade():
    op.drop_table("work_orders")
    op.drop_table("purchase_orders")
    op.drop_table("inventory_products")
