"""Phase 4 schema setup: outbound_prospects

Revision ID: 0004_phase4_tables
Revises: 0003_phase3_tables
Create Date: 2026-08-15 15:40:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0004_phase4_tables'
down_revision: Union[str, None] = '0003_phase3_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'outbound_prospects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('domain', sa.String(255), nullable=False),
        sa.Column('industry', sa.String(255), nullable=True),
        sa.Column('scrape_status', sa.String(32), nullable=False, server_default='discovered'),
        sa.Column('disqualification_reason', sa.Text(), nullable=True),
        sa.Column('decision_maker_name', sa.String(255), nullable=True),
        sa.Column('decision_maker_title', sa.String(255), nullable=True),
        sa.Column('decision_maker_linkedin', sa.String(255), nullable=True),
        sa.Column('signals_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('fit_markdown', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_outbound_prospects_tenant_id', 'outbound_prospects', ['tenant_id'])
    op.create_index('ix_outbound_prospects_domain', 'outbound_prospects', ['domain'])


def downgrade() -> None:
    op.drop_index('ix_outbound_prospects_domain', table_name='outbound_prospects')
    op.drop_index('ix_outbound_prospects_tenant_id', table_name='outbound_prospects')
    op.drop_table('outbound_prospects')
