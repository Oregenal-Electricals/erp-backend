"""012: warehouses table + payment_records table

Revision ID: 012_warehouses_payments
Revises: 011_phase13_crm_hr
"""
from alembic import op
import sqlalchemy as sa

revision      = "012_warehouses_payments"
down_revision = "011_phase13_crm_hr"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── Warehouses ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS warehouses (
            id         UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name       VARCHAR(300) NOT NULL,
            code       VARCHAR(30),
            location   VARCHAR(300),
            capacity   NUMERIC(12,2),
            manager    VARCHAR(200),
            notes      TEXT,
            is_active  BOOLEAN NOT NULL DEFAULT true,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_warehouses_tenant ON warehouses (tenant_id)"))

    # ── Payment Records ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS payment_records (
            id             UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            sales_order_id VARCHAR(100),
            customer_name  VARCHAR(300),
            invoice_ref    VARCHAR(100),
            amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
            method         VARCHAR(50)   NOT NULL DEFAULT 'bank_transfer',
            reference      VARCHAR(200),
            payment_date   VARCHAR(20),
            notes          TEXT,
            status         VARCHAR(20)   NOT NULL DEFAULT 'confirmed',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payment_records_tenant ON payment_records (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payment_records_so ON payment_records (sales_order_id)"))

    # ── paid_amount on sales_orders (if missing) ──────────────────────
    conn.execute(sa.text("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0"))

    # ── Seed default warehouses from inventory_products warehouse field ─
    # (run manually or via seed.py)


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS payment_records"))
    conn.execute(sa.text("DROP TABLE IF EXISTS warehouses"))
