"""019: Module 1 Hardening — password reset tokens, token blacklist,
users column gaps, atomic number series, audit_log date index.

Revision ID: 019_module1_fixes
Revises: 018_masters_module
Create Date: 2025-05-08
"""
from alembic import op
import sqlalchemy as sa

revision      = "019_module1_fixes"
down_revision = "018_masters_module"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    conn.execute(sa.text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS updated_by   UUID REFERENCES users(id) ON DELETE SET NULL
    """))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active   BOOLEAN     NOT NULL DEFAULT true,
            is_test_data BOOLEAN    NOT NULL DEFAULT false,
            tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id     UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
            created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
            token       VARCHAR(128) NOT NULL UNIQUE,
            expires_at  TIMESTAMPTZ  NOT NULL,
            used_at     TIMESTAMPTZ,
            ip_address  VARCHAR(45)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prt_token  ON password_reset_tokens(token)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prt_user   ON password_reset_tokens(user_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prt_expiry ON password_reset_tokens(expires_at)"))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS token_blacklist (
            id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active   BOOLEAN     NOT NULL DEFAULT true,
            is_test_data BOOLEAN    NOT NULL DEFAULT false,
            tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
            created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
            jti         VARCHAR(128) NOT NULL,
            expires_at  TIMESTAMPTZ NOT NULL,
            revoked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            reason      VARCHAR(50) DEFAULT 'logout'
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_tbl_jti     ON token_blacklist(jti)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_tbl_expires ON token_blacklist(expires_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_tbl_user    ON token_blacklist(user_id)"))

    conn.execute(sa.text("""
        ALTER TABLE number_series
        ADD COLUMN IF NOT EXISTS min_number       INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS reset_each_year  BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_reset_year  INTEGER
    """))

    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'ck_number_series_min'
            ) THEN
                ALTER TABLE number_series
                ADD CONSTRAINT ck_number_series_min CHECK (current_number >= 0);
            END IF;
        END $$
    """))

    conn.execute(sa.text("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id VARCHAR(64)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_audit_log_module_date ON audit_log(module, created_at DESC)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_audit_log_user_date   ON audit_log(user_id, created_at DESC)"))

    conn.execute(sa.text("""
        ALTER TABLE departments
        ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS description  TEXT
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS token_blacklist"))
    conn.execute(sa.text("DROP TABLE IF EXISTS password_reset_tokens"))
    conn.execute(sa.text("""
        ALTER TABLE users
        DROP COLUMN IF EXISTS is_test_data,
        DROP COLUMN IF EXISTS created_by,
        DROP COLUMN IF EXISTS updated_by
    """))
    conn.execute(sa.text("""
        ALTER TABLE number_series
        DROP COLUMN IF EXISTS min_number,
        DROP COLUMN IF EXISTS reset_each_year,
        DROP COLUMN IF EXISTS last_reset_year
    """))
    conn.execute(sa.text("ALTER TABLE audit_log DROP COLUMN IF EXISTS session_id"))
    conn.execute(sa.text("""
        ALTER TABLE departments
        DROP COLUMN IF EXISTS is_test_data,
        DROP COLUMN IF EXISTS created_by,
        DROP COLUMN IF EXISTS updated_by,
        DROP COLUMN IF EXISTS description
    """))
