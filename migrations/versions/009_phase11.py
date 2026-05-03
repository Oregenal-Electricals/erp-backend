"""Phase 11: purchase_order_items, qc_defects, notifications rebuild

Revision ID: 009_phase11
Revises: 008_phase9_plant_ops
"""
from alembic import op
import sqlalchemy as sa

revision      = "009_phase11"
down_revision = "008_phase9_plant_ops"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── purchase_order_items ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id           UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id    UUID          NOT NULL REFERENCES tenants(id)         ON DELETE CASCADE,
            po_id        UUID          NOT NULL REFERENCES purchase_orders(id)  ON DELETE CASCADE,
            product_id   UUID,
            product_name VARCHAR(300)  NOT NULL,
            product_sku  VARCHAR(100),
            quantity     NUMERIC(12,3) NOT NULL DEFAULT 1,
            unit         VARCHAR(30)   NOT NULL DEFAULT 'Pcs',
            unit_price   NUMERIC(15,2) NOT NULL DEFAULT 0,
            tax_pct      NUMERIC(5,2)  NOT NULL DEFAULT 18,
            discount_pct NUMERIC(5,2)  NOT NULL DEFAULT 0,
            line_total   NUMERIC(15,2) NOT NULL DEFAULT 0,
            hsn_code     VARCHAR(20),
            received_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
            notes        TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_po_items_po ON purchase_order_items (po_id)"))

    # ── qc_defects ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS qc_defects (
            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id     UUID        NOT NULL REFERENCES tenants(id)          ON DELETE CASCADE,
            inspection_id UUID        NOT NULL REFERENCES qc_inspections(id)   ON DELETE CASCADE,
            category      VARCHAR(100) NOT NULL,
            description   TEXT         NOT NULL,
            severity      VARCHAR(20)  NOT NULL DEFAULT 'minor',
            quantity      INTEGER      NOT NULL DEFAULT 1,
            disposition   VARCHAR(30)  NOT NULL DEFAULT 'rework',
            image_url     VARCHAR(500),
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_qc_defects_inspection ON qc_defects (inspection_id)"))

    # ── Add result column to qc_inspections if missing ────────────────
    conn.execute(sa.text("ALTER TABLE qc_inspections ADD COLUMN IF NOT EXISTS result VARCHAR(10)"))
    conn.execute(sa.text("ALTER TABLE qc_inspections ADD COLUMN IF NOT EXISTS remarks TEXT"))

    # ── notifications (rebuild with proper schema) ────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS notifications (
            id         UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id    UUID,
            type       VARCHAR(50) NOT NULL DEFAULT 'system',
            level      VARCHAR(20) NOT NULL DEFAULT 'info',
            title      VARCHAR(300) NOT NULL,
            message    TEXT,
            link       VARCHAR(300),
            is_read    BOOLEAN     NOT NULL DEFAULT false,
            read_at    TIMESTAMPTZ,
            meta       JSON        NOT NULL DEFAULT '{}',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_tenant  ON notifications (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_user    ON notifications (user_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read)"))


    # order_number on work_orders
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50)"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS produced_qty NUMERIC(12,3) DEFAULT 0"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rejection_qty NUMERIC(12,3) DEFAULT 0"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS start_date VARCHAR(20)"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS end_date VARCHAR(20)"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS machine_name VARCHAR(200)"))
    conn.execute(sa.text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS bom_consumed BOOLEAN DEFAULT false"))

def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS qc_defects"))
    conn.execute(sa.text("DROP TABLE IF EXISTS purchase_order_items"))
