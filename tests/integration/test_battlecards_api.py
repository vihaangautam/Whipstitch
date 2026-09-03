"""Integration tests for Competitor Battlecards and 6-Signal Agent API."""
from unittest.mock import AsyncMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db_session
from app.main import app


@pytest.mark.asyncio
async def test_battlecards_and_signals_api_lifecycle():
    mock_session = AsyncMock()

    async def override_get_db_session():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List Battlecards
        res = await client.get("/v1/battlecards")
        assert res.status_code == 200
        cards = res.json()
        assert len(cards) >= 4

        # 2. Get ZoomInfo Battlecard Detail
        zi_res = await client.get("/v1/battlecards/zoominfo")
        assert zi_res.status_code == 200
        zi_card = zi_res.json()
        assert zi_card["id"] == "zoominfo"
        assert len(zi_card["kill_shots"]) >= 2
        assert len(zi_card["blackboard_stages"]) == 5

        # 3. Generate Custom Battlecard
        gen_res = await client.post(
            "/v1/battlecards/generate",
            json={
                "competitor_name": "Outreach.io",
                "buyer_company": "Enterprise Corp",
                "deal_context": "Comparing sequencing capabilities vs autonomous waterfall",
            },
        )
        assert gen_res.status_code == 201
        custom_card = gen_res.json()
        assert custom_card["competitor_name"] == "Outreach.io"
        assert len(custom_card["blackboard_stages"]) == 5

        # 4. List Live Signals
        sig_res = await client.get("/v1/signals")
        assert sig_res.status_code == 200
        signals = sig_res.json()
        assert len(signals) >= 6

        # 5. Ingest and Classify a New Signal
        ingest_res = await client.post(
            "/v1/signals/ingest",
            json={
                "account_name": "BioHealth Global",
                "headline": "BioHealth Global Appoints Chief Revenue Officer",
                "snippet": "New CRO to overhaul commercial operations.",
                "source": "PR Newswire",
            },
        )
        assert ingest_res.status_code == 201
        ingested = ingest_res.json()
        assert ingested["signal_type"] == "leadership_shift"
        assert ingested["account_name"] == "BioHealth Global"

        # 6. Get Account Opportunity Score
        score_res = await client.get("/v1/signals/account/BioHealth%20Global/score")
        assert score_res.status_code == 200
        score_data = score_res.json()
        assert score_data["account_name"] == "BioHealth Global"
        assert score_data["opportunity_viability_score"] >= 50

    app.dependency_overrides.clear()
