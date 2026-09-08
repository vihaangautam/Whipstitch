"""Integration tests for tenant-scoped AI battlecards + the 6-signal agent (no seed fixtures)."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_battlecards_api_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. A workspace with no generated cards returns an empty list (not ZoomInfo/Apollo).
        res = await client.get("/v1/battlecards?tenant_id=trifid_media")
        assert res.status_code == 200

        # 2. Generate one for a named competitor (LLM disabled in tests -> template fallback).
        gen = await client.post(
            "/v1/battlecards/generate",
            json={"competitor_name": "Outreach.io", "tenant_id": "trifid_media"},
        )
        assert gen.status_code == 201
        card = gen.json()
        assert card["competitor_name"] == "Outreach.io"
        assert card["id"] == "outreach-io"
        assert len(card["blackboard_stages"]) == 5

        # 3. It is now persisted and retrievable for that tenant.
        detail = await client.get("/v1/battlecards/outreach-io?tenant_id=trifid_media")
        assert detail.status_code == 200
        assert detail.json()["competitor_name"] == "Outreach.io"

        listed = (await client.get("/v1/battlecards?tenant_id=trifid_media")).json()
        assert any(c["id"] == "outreach-io" for c in listed)

        # 4. Auto-generate a full set from the tenant's company profile.
        auto = await client.post("/v1/battlecards/auto-generate", json={"tenant_id": "trifid_media"})
        assert auto.status_code == 201
        assert len(auto.json()) >= 1

        # 5. Unknown competitor for this tenant -> 404, not a fabricated card.
        assert (await client.get("/v1/battlecards/nonexistent-rival?tenant_id=trifid_media")).status_code == 404

        # 6. Signals agent still works.
        ingest = await client.post(
            "/v1/signals/ingest",
            json={
                "account_name": "BioHealth Global",
                "headline": "BioHealth Global Appoints Chief Revenue Officer",
                "snippet": "New CRO to overhaul commercial operations.",
                "source": "PR Newswire",
            },
        )
        assert ingest.status_code == 201
        assert ingest.json()["signal_type"] == "leadership_shift"
