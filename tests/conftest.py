import uuid
from dataclasses import dataclass, field
from typing import List

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.models import (
    BuyingCommitteeMember,
    Deal,
    DealDiagnostic,
    LeadEvent,
    Meeting,
    OutboundProspect,
    Tenant,
    TenantBattlecard,
    User,
    UserAPIKey,
)
from app.db.session import AsyncSessionLocal
from app.main import app


@pytest.fixture(autouse=True)
def _no_external_apis(monkeypatch):
    """Guarantee tests never touch real Apollo / Serper / LLM endpoints."""
    monkeypatch.setattr(settings, "MOCK_APOLLO", True, raising=False)
    monkeypatch.setenv("SERPER_API_KEY", "mock")
    for key in ("SERPER_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
        monkeypatch.setattr(settings, key, "mock-test-key", raising=False)


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@dataclass
class Workspace:
    """A real tenant + user + JWT, for testing isolation against the actual database."""
    tenant_id: uuid.UUID
    tenant_key: str
    user_id: uuid.UUID
    token: str
    deal_ids: List[uuid.UUID] = field(default_factory=list)
    lead_ids: List[uuid.UUID] = field(default_factory=list)

    @property
    def headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}


@pytest_asyncio.fixture
async def workspace_factory():
    """Builds isolated workspaces backed by real rows, then cleans them up.

    Tenant isolation can't be proven with a mocked session — the whole question is whether
    the query filters by tenant, and a mock answers whatever it was told to regardless.
    These fixtures write real rows so a missing WHERE clause actually shows up as a leak.
    """
    created: List[Workspace] = []

    async def _make(label: str, *, with_deal: bool = False, with_lead: bool = False) -> Workspace:
        suffix = uuid.uuid4().hex[:8]
        tenant_key = f"test_{label}_{suffix}"
        tenant_uuid = uuid.uuid4()
        user_uuid = uuid.uuid4()

        async with AsyncSessionLocal() as session:
            session.add(
                Tenant(
                    id=tenant_uuid,
                    tenant_key=tenant_key,
                    name=f"Test Workspace {label}",
                    config={"onboarded": True, "icp_criteria": {}},
                )
            )
            # Flush before adding rows that reference this tenant: no ORM relationship is
            # declared between Tenant and Deal/LeadEvent, so SQLAlchemy has no dependency
            # to sort by and can emit the child INSERT first. Postgres rejects that on the
            # foreign key; SQLite doesn't enforce it and silently accepts the orphan.
            await session.flush()

            session.add(
                User(
                    id=user_uuid,
                    tenant_id=tenant_uuid,
                    email=f"{label}_{suffix}@example.test",
                    hashed_password=hash_password("TestPassword123!"),
                    full_name=f"Test User {label}",
                    role="sales_representative",
                    is_active=True,
                )
            )
            ws = Workspace(
                tenant_id=tenant_uuid,
                tenant_key=tenant_key,
                user_id=user_uuid,
                token=create_access_token(
                    {
                        "sub": str(user_uuid),
                        "email": f"{label}_{suffix}@example.test",
                        "name": f"Test User {label}",
                        "role": "sales_representative",
                        "tenant_id": tenant_key,
                    }
                ),
            )

            if with_deal:
                deal_uuid = uuid.uuid4()
                session.add(
                    Deal(
                        id=deal_uuid,
                        tenant_id=tenant_uuid,
                        deal_name=f"{label} Deal",
                        company_name=f"{label} Corp",
                        domain=f"{label}.example",
                        deal_size=50000.0,
                        currency="USD",
                        current_stage="Discovery",
                    )
                )
                ws.deal_ids.append(deal_uuid)

            if with_lead:
                lead_uuid = uuid.uuid4()
                session.add(
                    LeadEvent(
                        id=lead_uuid,
                        tenant_id=tenant_uuid,
                        idempotency_key=f"idem_{suffix}",
                        source="inbound_webhook",
                        email=f"lead_{suffix}@buyer.test",
                        company_name=f"{label} Buyer Co",
                        raw_payload={},
                        status="received",
                    )
                )
                ws.lead_ids.append(lead_uuid)

            await session.commit()

        created.append(ws)
        return ws

    yield _make

    # Children first: Postgres enforces the foreign keys back to tenants, so deleting the
    # tenant while anything still references it aborts the whole teardown.
    child_models = (
        BuyingCommitteeMember,
        DealDiagnostic,
        UserAPIKey,
        Meeting,
        TenantBattlecard,
        OutboundProspect,
        LeadEvent,
        Deal,
    )
    async with AsyncSessionLocal() as session:
        for ws in created:
            for model in child_models:
                await session.execute(delete(model).where(model.tenant_id == ws.tenant_id))
            await session.execute(delete(User).where(User.id == ws.user_id))
            await session.execute(delete(Tenant).where(Tenant.id == ws.tenant_id))
        await session.commit()
