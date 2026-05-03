"""015: Add updated_at column to permission_audit_log

The Base class adds updated_at to every model automatically,
but migration 013 created permission_audit_log without it.
SQLAlchemy's INSERT includes updated_at in the RETURNING clause,
causing UndefinedColumnError.

Revision ID: 015_audit_log_updated_at
Revises: 014_unique_email_per_tenant
"""
from alembic import op
import sqlalchemy as sa

revision      = "015_audit_log_updated_at"
down_revision = "014_unique_email_per_tenant"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE permission_audit_log
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE permission_audit_log
        DROP COLUMN IF EXISTS updated_at
    """))
