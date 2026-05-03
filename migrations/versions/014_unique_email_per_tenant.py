"""014: Add unique constraint on users (tenant_id, email) to prevent duplicate logins

Revision ID: 014_unique_email_per_tenant
Revises: 013_rbac_roles_permissions
"""
from alembic import op
import sqlalchemy as sa

revision      = "014_unique_email_per_tenant"
down_revision = "013_rbac_roles_permissions"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # First, remove duplicate rows — keep only the most recently created one
    conn.execute(sa.text("""
        DELETE FROM users
        WHERE id NOT IN (
            SELECT DISTINCT ON (tenant_id, email) id
            FROM users
            ORDER BY tenant_id, email, created_at DESC
        )
    """))

    # Now add unique constraint
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_users_tenant_email'
            ) THEN
                ALTER TABLE users
                ADD CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email);
            END IF;
        END $$
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_tenant_email"
    ))
