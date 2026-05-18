"""019: Departments table + user extra_permissions + service layer support

What this migration does:
  NEW TABLES:
    departments  — organisational departments with hierarchy support

  ALTER TABLES (safe, ADD COLUMN IF NOT EXISTS):
    users        — add extra_permissions JSONB column (user-level permission overrides)
                 — add is_test_data BOOLEAN column
    roles        — add is_test_data BOOLEAN column
    permission_audit_log — add notes TEXT column (used by auth_service audit entries)

  INDEXES:
    departments  — ix_departments_tenant, ix_departments_name

  IDEMPOTENT:
    All CREATE TABLE and ALTER TABLE statements use IF NOT EXISTS / IF NOT EXISTS guards.

Revision ID: 019_departments_and_services
Revises: 018_masters_module
Create Date: 2025-05-16
"""
from alembic import op
import sqlalchemy as sa

revision      = "019_departments_and_services"
down_revision = "018_masters_module"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. departments ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS departments (
            id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

            tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name        VARCHAR(150) NOT NULL,
            code        VARCHAR(20),
            parent_id   UUID        REFERENCES departments(id) ON DELETE SET NULL,
            head_id     UUID,           -- soft ref to users.id (no FK to avoid circular)
            is_active   BOOLEAN     NOT NULL DEFAULT true
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_departments_tenant "
        "ON departments(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_departments_name "
        "ON departments(tenant_id, name)"
    ))

    # ── 2. users — extra_permissions column ───────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS extra_permissions JSONB NOT NULL DEFAULT '{}'
    """))

    # ── 3. users — is_test_data column ───────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false
    """))

    # ── 4. roles — is_test_data column ───────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false
    """))

    # ── 5. permission_audit_log — notes column ────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE permission_audit_log
        ADD COLUMN IF NOT EXISTS notes TEXT
    """))

    # ── 6. Backfill extra_permissions for existing users ─────────────
    conn.execute(sa.text("""
        UPDATE users SET extra_permissions = '{}' WHERE extra_permissions IS NULL
    """))

    print("✅  019_departments_and_services applied")


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("DROP TABLE IF EXISTS departments CASCADE"))
    conn.execute(sa.text("ALTER TABLE users DROP COLUMN IF EXISTS extra_permissions"))
    conn.execute(sa.text("ALTER TABLE users DROP COLUMN IF EXISTS is_test_data"))
    conn.execute(sa.text("ALTER TABLE roles DROP COLUMN IF EXISTS is_test_data"))
    conn.execute(sa.text("ALTER TABLE permission_audit_log DROP COLUMN IF EXISTS notes"))
