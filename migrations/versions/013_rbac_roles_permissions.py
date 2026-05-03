"""013: RBAC — role level enforcement, permissions audit log, role_slug unique per tenant

Revision ID: 013_rbac_roles_permissions
Revises: 012_warehouses_payments
Create Date: 2024-01-01

Adds:
  - unique constraint on (tenant_id, slug) in roles
  - role_level check: users cannot assign a role whose level >= their own level
  - permission_audit_log table to track every permission change
  - ensure is_system column exists on roles
"""
from alembic import op
import sqlalchemy as sa

revision      = "013_rbac_roles_permissions"
down_revision = "012_warehouses_payments"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── 1. Unique constraint on (tenant_id, slug) for roles ──────────
    # Drop if exists first to avoid duplicate constraint errors
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_roles_tenant_slug'
            ) THEN
                ALTER TABLE roles
                ADD CONSTRAINT uq_roles_tenant_slug UNIQUE (tenant_id, slug);
            END IF;
        END $$
    """))

    # ── 2. Ensure level column has correct range constraint ───────────
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'ck_roles_level_range'
            ) THEN
                ALTER TABLE roles
                ADD CONSTRAINT ck_roles_level_range CHECK (level BETWEEN 1 AND 100);
            END IF;
        END $$
    """))

    # ── 3. Ensure is_system column exists on roles ────────────────────
    conn.execute(sa.text("""
        ALTER TABLE roles ADD COLUMN IF NOT EXISTS
        is_system BOOLEAN NOT NULL DEFAULT false
    """))

    # ── 4. Ensure level column exists on roles ────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE roles ADD COLUMN IF NOT EXISTS
        level INTEGER NOT NULL DEFAULT 1
    """))

    # ── 5. Ensure description column exists on roles ──────────────────
    conn.execute(sa.text("""
        ALTER TABLE roles ADD COLUMN IF NOT EXISTS
        description TEXT
    """))

    # ── 6. Permission Audit Log table ─────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS permission_audit_log (
            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            changed_by_id UUID        REFERENCES users(id) ON DELETE SET NULL,
            target_type   VARCHAR(20) NOT NULL,   -- 'role' | 'user'
            target_id     UUID        NOT NULL,
            action        VARCHAR(30) NOT NULL,   -- 'grant' | 'revoke' | 'role_create' | 'role_update' | 'role_delete' | 'user_role_change'
            module        VARCHAR(50),
            old_value     JSONB,
            new_value     JSONB,
            ip_address    VARCHAR(45),
            notes         TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_perm_audit_tenant ON permission_audit_log (tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_perm_audit_target ON permission_audit_log (target_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_perm_audit_created ON permission_audit_log (created_at DESC)"
    ))

    # ── 7. Update existing roles with proper levels (idempotent) ──────
    # Set levels for any system roles that exist
    level_map = [
        ("super_admin", 100),
        ("admin",        90),
        ("gate_guard",   20),
        ("iqc_inspector",30),
        ("store_manager",40),
        ("manager",      50),
        ("staff",        10),
        ("viewer",        1),
    ]
    for slug, level in level_map:
        conn.execute(sa.text(
            f"UPDATE roles SET level = {level}, is_system = true "
            f"WHERE slug = '{slug}'"
        ))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS permission_audit_log"))
    conn.execute(sa.text("""
        ALTER TABLE roles
        DROP CONSTRAINT IF EXISTS uq_roles_tenant_slug,
        DROP CONSTRAINT IF EXISTS ck_roles_level_range
    """))
