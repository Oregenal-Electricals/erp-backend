"""Add saved_reports, company_config, plan column on tenants

Revision ID: 006_phase6_reports_docs_saas
Revises: 005_sales_module
Create Date: 2024-07-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision      = "006_phase6_reports_docs_saas"
down_revision = "005_sales_module"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── Add plan column to tenants (safe — checks existence first) ────
    conn.execute(sa.text("""
        ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'free'
    """))

    # ── saved_reports (safe create) ────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS saved_reports (
            id          UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name        VARCHAR(300) NOT NULL,
            description TEXT,
            module      VARCHAR(100) NOT NULL,
            config      JSON        NOT NULL DEFAULT '{}',
            is_public   BOOLEAN     NOT NULL DEFAULT false,
            schedule    VARCHAR(50),
            last_run_at TIMESTAMPTZ,
            created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
            deleted_at  TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS ix_saved_reports_tenant
        ON saved_reports (tenant_id)
    """))

    # ── company_config (safe create) ──────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS company_config (
            id          UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id   UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
            config      JSON        NOT NULL DEFAULT '{}',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS ix_company_config_tenant
        ON company_config (tenant_id)
    """))


def downgrade() -> None:
    op.drop_table("company_config")
    op.drop_table("saved_reports")
