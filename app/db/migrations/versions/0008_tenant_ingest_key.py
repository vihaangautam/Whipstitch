"""Per-tenant webhook ingest key

Revision ID: 0008_tenant_ingest_key
Revises: 0007_users_and_buying_committee
Create Date: 2026-09-12 20:00:00.000000

Inbound webhooks are machine-authenticated and carry no user session, so before this
change the only thing identifying the owning tenant was a `tenant_id` string in the
request body — which any caller holding the single shared API key could set to anything.
This column lets each tenant hold its own ingest secret instead.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0008_tenant_ingest_key"
down_revision: Union[str, None] = "0007_users_and_buying_committee"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("ingest_key_hash", sa.String(64), nullable=True))
    op.create_index("ix_tenants_ingest_key_hash", "tenants", ["ingest_key_hash"])


def downgrade() -> None:
    op.drop_index("ix_tenants_ingest_key_hash", table_name="tenants")
    op.drop_column("tenants", "ingest_key_hash")
