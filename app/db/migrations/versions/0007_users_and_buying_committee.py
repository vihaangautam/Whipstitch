"""Users and Buying Committee Members tables

Revision ID: 0007_users_and_buying_committee
Revises: 0006_meetings_and_battlecards
Create Date: 2026-09-10 03:00:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0007_users_and_buying_committee"
down_revision: Union[str, None] = "0006_meetings_and_battlecards"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="sales_representative"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Buying committee members table
    op.create_table(
        "buying_committee_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deals.id"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(255), nullable=False),
        sa.Column("tag", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="Engaged"),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("linkedin_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_buying_committee_members_deal_id", "buying_committee_members", ["deal_id"])
    op.create_index("ix_buying_committee_members_tenant_id", "buying_committee_members", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("buying_committee_members")
    op.drop_table("users")
