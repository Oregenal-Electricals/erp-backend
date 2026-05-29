"""022: last_login_at column type String -> DateTime

Revision ID: 022_last_login_at_datetime
Revises: 021_permission_audit_logs
Create Date: 2025-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = '022_last_login_at_datetime'
down_revision = '021_permission_audit_logs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN last_login_at TYPE TIMESTAMPTZ
        USING CASE
            WHEN last_login_at IS NULL THEN NULL
            ELSE last_login_at::TIMESTAMPTZ
        END
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN last_login_at TYPE VARCHAR
        USING last_login_at::VARCHAR
    """)
