"""Initial Phase 1 schema setup

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-12 18:30:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_key', sa.String(64), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('config', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_tenants_tenant_key', 'tenants', ['tenant_key'], unique=True)

    # Create lead_events table
    op.create_table(
        'lead_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('idempotency_key', sa.String(255), nullable=False, unique=True),
        sa.Column('source', sa.String(64), nullable=False, server_default='inbound_webhook'),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('raw_payload', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(32), nullable=False, server_default='received'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_lead_events_tenant_id', 'lead_events', ['tenant_id'])
    op.create_index('ix_lead_events_idempotency_key', 'lead_events', ['idempotency_key'], unique=True)
    op.create_index('ix_lead_events_email', 'lead_events', ['email'])

    # Create execution_audit_log table
    op.create_table(
        'execution_audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('workflow_id', sa.String(255), nullable=False),
        sa.Column('workflow_type', sa.String(128), nullable=False),
        sa.Column('activity_name', sa.String(128), nullable=False),
        sa.Column('status', sa.String(32), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
    )
    op.create_index('ix_execution_audit_log_workflow_id', 'execution_audit_log', ['workflow_id'])


def downgrade() -> None:
    op.drop_table('execution_audit_log')
    op.drop_table('lead_events')
    op.drop_table('tenants')
