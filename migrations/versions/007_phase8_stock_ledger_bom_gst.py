"""Phase 8: stock_ledger, boms, bom_components, hsn_code, customer_gstin

Revision ID: 007_phase8
Revises: 006_phase6_reports_docs_saas
"""
from alembic import op
import sqlalchemy as sa

revision      = "007_phase8"
down_revision = "006_phase6_reports_docs_saas"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── stock_ledger ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS stock_ledger (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id)             ON DELETE CASCADE,
            product_id       UUID        NOT NULL REFERENCES inventory_products(id)  ON DELETE CASCADE,
            movement_type    VARCHAR(50) NOT NULL,
            quantity         INTEGER     NOT NULL,
            direction        VARCHAR(4)  NOT NULL,
            unit_cost        NUMERIC(15,4) NOT NULL DEFAULT 0,
            total_cost       NUMERIC(15,4) NOT NULL DEFAULT 0,
            wac_after        NUMERIC(15,4) NOT NULL DEFAULT 0,
            stock_after      INTEGER     NOT NULL,
            reference_type   VARCHAR(50),
            reference_id     VARCHAR(50),
            reference_number VARCHAR(100),
            notes            TEXT,
            created_by       VARCHAR(200),
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_stock_ledger_tenant  ON stock_ledger (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_stock_ledger_product ON stock_ledger (product_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_stock_ledger_type    ON stock_ledger (movement_type)"))

    # ── boms ──────────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS boms (
            id           UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            product_name VARCHAR(300) NOT NULL,
            product_id   UUID        REFERENCES inventory_products(id) ON DELETE SET NULL,
            version      VARCHAR(20) NOT NULL DEFAULT 'v1.0',
            description  TEXT,
            status       VARCHAR(20) NOT NULL DEFAULT 'active',
            yield_qty    INTEGER     NOT NULL DEFAULT 1,
            yield_unit   VARCHAR(30) NOT NULL DEFAULT 'Pcs',
            notes        TEXT,
            deleted_at   TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_boms_tenant ON boms (tenant_id)"))

    # ── bom_components ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS bom_components (
            id           UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
            bom_id       UUID          NOT NULL REFERENCES boms(id)                 ON DELETE CASCADE,
            tenant_id    UUID          NOT NULL REFERENCES tenants(id)              ON DELETE CASCADE,
            product_id   UUID          NOT NULL REFERENCES inventory_products(id)   ON DELETE CASCADE,
            product_name VARCHAR(300)  NOT NULL,
            product_sku  VARCHAR(100),
            quantity     NUMERIC(12,4) NOT NULL,
            unit         VARCHAR(30)   NOT NULL DEFAULT 'Pcs',
            unit_cost    NUMERIC(15,4) NOT NULL DEFAULT 0,
            notes        TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_bom_components_bom ON bom_components (bom_id)"))

    # ── Add hsn_code to order_items (safe) ────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20)
    """))

    # ── Add customer_gstin to sales_orders (safe) ─────────────────────
    conn.execute(sa.text("""
        ALTER TABLE sales_orders
        ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(20)
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS bom_components"))
    conn.execute(sa.text("DROP TABLE IF EXISTS boms"))
    conn.execute(sa.text("DROP TABLE IF EXISTS stock_ledger"))
