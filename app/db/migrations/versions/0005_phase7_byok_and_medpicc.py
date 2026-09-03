"""Phase 7 schema setup: BYOK user_api_keys, llm_usage_logs, deals, deal_diagnostics, medpicc_scores, evidence_quotes

Revision ID: 0005_phase7_byok_and_medpicc
Revises: 0004_phase4_tables
Create Date: 2026-09-03 18:20:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0005_phase7_byok_and_medpicc'
down_revision: Union[str, None] = '0004_phase4_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_api_keys
    op.create_table(
        'user_api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('provider', sa.String(64), nullable=False),
        sa.Column('encrypted_key', sa.Text(), nullable=False),
        sa.Column('key_masked', sa.String(32), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_user_api_keys_tenant_id', 'user_api_keys', ['tenant_id'])

    # 2. llm_usage_logs
    op.create_table(
        'llm_usage_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('feature', sa.String(64), nullable=False),
        sa.Column('provider', sa.String(64), nullable=False),
        sa.Column('model', sa.String(64), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('output_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estimated_cost_usd', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('latency_seconds', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_byok', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('success', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_llm_usage_logs_tenant_id', 'llm_usage_logs', ['tenant_id'])

    # 3. deals
    op.create_table(
        'deals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('deal_name', sa.String(255), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('deal_size', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(8), nullable=False, server_default='USD'),
        sa.Column('current_stage', sa.String(64), nullable=False, server_default='Discovery'),
        sa.Column('hubspot_deal_id', sa.String(128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_deals_tenant_id', 'deals', ['tenant_id'])
    op.create_index('ix_deals_company_name', 'deals', ['company_name'])

    # 4. deal_diagnostics
    op.create_table(
        'deal_diagnostics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('deal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deals.id'), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('transcript_source', sa.String(32), nullable=False, server_default='text_upload'),
        sa.Column('transcript_text', sa.Text(), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False),
        sa.Column('deal_category', sa.String(32), nullable=False),
        sa.Column('next_best_action', sa.Text(), nullable=False),
        sa.Column('follow_up_email_subject', sa.String(255), nullable=True),
        sa.Column('follow_up_email_body', sa.Text(), nullable=True),
        sa.Column('closure_if_addressed', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('closure_if_ignored', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('top_blocking_boxes', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('seller_summary', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('model_used', sa.String(64), nullable=False),
        sa.Column('pdf_report_path', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_deal_diagnostics_deal_id', 'deal_diagnostics', ['deal_id'])
    op.create_index('ix_deal_diagnostics_tenant_id', 'deal_diagnostics', ['tenant_id'])

    # 5. medpicc_scores
    op.create_table(
        'medpicc_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('diagnostic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deal_diagnostics.id'), nullable=False),
        sa.Column('box_name', sa.String(64), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('max_score', sa.Integer(), nullable=False),
        sa.Column('rating', sa.String(32), nullable=False),
        sa.Column('evidence_basis', sa.String(32), nullable=False, server_default='direct'),
        sa.Column('hard_cap_applied', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('missing_evidence', sa.Text(), nullable=True),
        sa.Column('coaching_questions', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_medpicc_scores_diagnostic_id', 'medpicc_scores', ['diagnostic_id'])

    # 6. evidence_quotes
    op.create_table(
        'evidence_quotes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('score_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('medpicc_scores.id'), nullable=False),
        sa.Column('person_name', sa.String(255), nullable=True),
        sa.Column('evidence_date', sa.String(64), nullable=True),
        sa.Column('medium', sa.String(64), nullable=True),
        sa.Column('quote', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_evidence_quotes_score_id', 'evidence_quotes', ['score_id'])


def downgrade() -> None:
    op.drop_index('ix_evidence_quotes_score_id', table_name='evidence_quotes')
    op.drop_table('evidence_quotes')

    op.drop_index('ix_medpicc_scores_diagnostic_id', table_name='medpicc_scores')
    op.drop_table('medpicc_scores')

    op.drop_index('ix_deal_diagnostics_tenant_id', table_name='deal_diagnostics')
    op.drop_index('ix_deal_diagnostics_deal_id', table_name='deal_diagnostics')
    op.drop_table('deal_diagnostics')

    op.drop_index('ix_deals_company_name', table_name='deals')
    op.drop_index('ix_deals_tenant_id', table_name='deals')
    op.drop_table('deals')

    op.drop_index('ix_llm_usage_logs_tenant_id', table_name='llm_usage_logs')
    op.drop_table('llm_usage_logs')

    op.drop_index('ix_user_api_keys_tenant_id', table_name='user_api_keys')
    op.drop_table('user_api_keys')
