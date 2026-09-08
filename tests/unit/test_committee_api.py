import uuid
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.session import get_db_session
from app.main import app

DUMMY_DEAL_ID = "d0000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_get_committee_members():
    """Test retrieving buying committee members for a deal."""
    mock_session = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = mock_res

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/v1/deals/{DUMMY_DEAL_ID}/committee",
                headers={"X-API-Key": settings.API_KEY},
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert data == []  # no fabricated roster when none exist
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auto_find_candidate():
    """Test discovering an executive for a missing buying committee role."""
    mock_session = AsyncMock()
    mock_deal_res = MagicMock()
    mock_deal_res.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_deal_res

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/v1/deals/{DUMMY_DEAL_ID}/committee/auto-find",
                headers={"X-API-Key": settings.API_KEY},
                json={
                    "role_tag": "Budget Owner",
                    "company_name": "Apex Logistics Global",
                    "domain": "apexlogistics.com",
                },
            )
            assert response.status_code == 200
            candidate = response.json()
            assert "name" in candidate
            assert "title" in candidate
            assert candidate["confidence"] >= 0.8 or candidate["confidence"] >= 80
            assert "apexlogistics.com" in candidate["email"]

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_stream_committee_discovery():
    """Test the real-time SSE stream endpoint for buying committee discovery."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            f"/v1/deals/{DUMMY_DEAL_ID}/committee/stream?role_tag=Budget+Owner&company_name=Apex+Logistics+Global&domain=apexlogistics.com",
            headers={"X-API-Key": settings.API_KEY},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        content = response.text
        assert "gap_detected" in content
        assert "searching_registry" in content
        assert "waterfall_verification" in content
        assert "discovery_complete" in content
