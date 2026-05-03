"""Phase 12: Finance module - journal_entries table

Revision ID: 010_phase12_finance
Revises: 009_phase11
"""
from alembic import op
import sqlalchemy as sa

revision      = "010_phase12_finance"
down_revision = "009_phase11"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS journal_entries (
            id             UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            entry_date     VARCHAR(20) NOT NULL,
            reference      VARCHAR(100),
            description    TEXT        NOT NULL,
            debit_account  VARCHAR(100) NOT NULL,
            credit_account VARCHAR(100) NOT NULL,
            amount         NUMERIC(15,2) NOT NULL,
            created_by     VARCHAR(200),
            source         VARCHAR(50) NOT NULL DEFAULT 'manual',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_journal_tenant ON journal_entries (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_journal_date   ON journal_entries (entry_date)"))

    # Add paid_amount to sales_orders if missing
    conn.execute(sa.text("""
        ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0
    """))
    # Add payment_date to payment_records if missing
    conn.execute(sa.text("""
        ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS payment_date VARCHAR(20)
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS journal_entries"))
