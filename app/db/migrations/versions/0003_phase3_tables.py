"""Phase 3 schema setup: crm_sync_records and sla_escalations

Revision ID: 0003_phase3_tables
Revises: 0002_phase2_tables
Create Date: 2026-08-12 22:45:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0003_phase3_tables'
down_revision: Union[str, None] = '0002_phase2_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create crm_sync_records table
    op.create_table(
        'crm_sync_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('lead_source_type', sa.String(32), nullable=False, server_default='inbound'),
        sa.Column('lead_source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('crm_provider', sa.String(64), nullable=False, server_default='hubspot'),
        sa.Column('crm_record_id', sa.String(255), nullable=False),
        sa.Column('sync_status', sa.String(32), nullable=False, server_default='synced'),
        sa.Column('synced_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_crm_sync_records_lead_source_id', 'crm_sync_records', ['lead_source_id'])

    # Create sla_escalations table
    op.create_table(
        'sla_escalations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('lead_source_type', sa.String(32), nullable=False, server_default='inbound'),
        sa.Column('lead_source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('slack_message_id', sa.String(255), nullable=True),
    )
    op.create_index('ix_sla_escalations_lead_source_id', 'sla_escalations', ['lead_source_id'])


def downgrade() -> None:
    op.drop_table('sla_escalations')
    op.drop_table('crm_sync_records')
