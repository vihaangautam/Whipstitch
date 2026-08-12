"""Phase 2 schema setup: enrichment_results and llm_qualifications

Revision ID: 0002_phase2_tables
Revises: 0001_initial_schema
Create Date: 2026-08-12 19:00:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002_phase2_tables'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enrichment_results table
    op.create_table(
        'enrichment_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('lead_source_type', sa.String(32), nullable=False, server_default='inbound'),
        sa.Column('lead_source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_used', sa.String(64), nullable=False),
        sa.Column('raw_response', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('fallback_triggered', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_enrichment_results_lead_source_id', 'enrichment_results', ['lead_source_id'])

    # Create llm_qualifications table
    op.create_table(
        'llm_qualifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('lead_source_type', sa.String(32), nullable=False, server_default='inbound'),
        sa.Column('lead_source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_score', sa.Integer(), nullable=False),
        sa.Column('fit_reasoning', sa.Text(), nullable=False),
        sa.Column('observation_hook', sa.Text(), nullable=False),
        sa.Column('capability_link', sa.Text(), nullable=False),
        sa.Column('low_friction_ask', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('model_used', sa.String(64), nullable=False, server_default='groq/llama-3.3-70b-versatile'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_llm_qualifications_lead_source_id', 'llm_qualifications', ['lead_source_id'])


def downgrade() -> None:
    op.drop_table('llm_qualifications')
    op.drop_table('enrichment_results')
