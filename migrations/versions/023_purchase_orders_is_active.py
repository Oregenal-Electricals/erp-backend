"""023: Add is_active to purchase_orders

Revision ID: 023_purchase_orders_is_active
Revises: 022_last_login_at_datetime
Create Date: 2025-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = '023_purchase_orders_is_active'
down_revision = '022_last_login_at_datetime'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true")


def downgrade() -> None:
    op.execute("ALTER TABLE purchase_orders DROP COLUMN IF EXISTS is_active")
