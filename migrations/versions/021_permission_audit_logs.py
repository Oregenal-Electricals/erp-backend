"""021: permission_audit_logs table

Revision ID: 021_permission_audit_logs
Revises: 019_departments_and_services
Create Date: 2025-05-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '021_permission_audit_logs'
down_revision = '019_departments_and_services'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'permission_audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('changed_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('module', sa.String(100), nullable=True),
        sa.Column('old_value', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('new_value', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_permission_audit_logs_tenant_id', 'permission_audit_logs', ['tenant_id'])
    op.create_index('ix_permission_audit_logs_action', 'permission_audit_logs', ['action'])


def downgrade() -> None:
    op.drop_index('ix_permission_audit_logs_action', table_name='permission_audit_logs')
    op.drop_index('ix_permission_audit_logs_tenant_id', table_name='permission_audit_logs')
    op.drop_table('permission_audit_logs')
