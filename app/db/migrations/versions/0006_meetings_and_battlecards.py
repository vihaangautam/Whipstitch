"""Meetings + per-tenant AI-generated competitor battlecards (replaces in-memory stores)

Revision ID: 0006_meetings_and_battlecards
Revises: 0005_phase7_byok_and_medpicc
Create Date: 2026-09-08 12:00:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0006_meetings_and_battlecards"
down_revision: Union[str, None] = "0005_phase7_byok_and_medpicc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("tenant_track", sa.String(64), nullable=False, server_default="Service / Retainer"),
        sa.Column("buyer_tier", sa.String(64), nullable=False, server_default="Tier 1: Founder-Led SMB"),
        sa.Column("deal_size", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("offering_summary", sa.Text(), nullable=True),
        sa.Column("scheduled_time", sa.String(128), nullable=True),
        sa.Column("objective", sa.String(255), nullable=True),
        sa.Column("attendees_json", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("champion_name", sa.String(255), nullable=True),
        sa.Column("champion_title", sa.String(255), nullable=True),
        sa.Column("briefing_json", postgresql.JSONB(), nullable=True),
        sa.Column("champion_kit_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_meetings_tenant_id", "meetings", ["tenant_id"])

    op.create_table(
        "tenant_battlecards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("competitor_id", sa.String(128), nullable=False),
        sa.Column("competitor_name", sa.String(255), nullable=False),
        sa.Column("card_json", postgresql.JSONB(), nullable=False),
        sa.Column("generated_by", sa.String(32), nullable=False, server_default="llm"),
        sa.Column("model_used", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_tenant_battlecards_tenant_id", "tenant_battlecards", ["tenant_id"])
    op.create_index(
        "ix_tenant_battlecards_tenant_competitor",
        "tenant_battlecards",
        ["tenant_id", "competitor_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_tenant_battlecards_tenant_competitor", table_name="tenant_battlecards")
    op.drop_index("ix_tenant_battlecards_tenant_id", table_name="tenant_battlecards")
    op.drop_table("tenant_battlecards")
    op.drop_index("ix_meetings_tenant_id", table_name="meetings")
    op.drop_table("meetings")
