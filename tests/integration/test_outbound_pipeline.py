import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.models import OutboundProspect, Tenant
from app.main import app


@pytest.mark.asyncio
async def test_trigger_outbound_prospecting_endpoint():
    mock_tenant = Tenant(id=uuid.uuid4(), tenant_key="trifid_media", name="Trifid Media")
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_tenant
    mock_session.execute.return_value = mock_result

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.v1.outbound.AsyncSessionLocal", return_value=mock_ctx), patch("app.api.v1.outbound.Client.connect", side_effect=Exception("Offline Temporal")):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/v1/outbound/trigger",
                headers={"X-API-Key": settings.API_KEY},
                json={"tenant_id": "trifid_media", "batch_size": 3},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "workflow_id" in data
            assert data["status"] == "triggered"
            assert data["prospects_targeted"] == 3


@pytest.mark.asyncio
async def test_outbound_prospects_list_endpoint():
    mock_tenant = Tenant(id=uuid.uuid4(), tenant_key="trifid_media", name="Trifid Media")
    mock_prospect = OutboundProspect(
        id=uuid.uuid4(),
        tenant_id=mock_tenant.id,
        company_name="NovaScale",
        domain="novascale.io",
        scrape_status="staged_awaiting_approval",
    )

    mock_session = AsyncMock()
    mock_res_tenant = MagicMock()
    mock_res_tenant.scalar_one_or_none.return_value = mock_tenant

    mock_res_prospects = MagicMock()
    mock_res_prospects.scalars().all.return_value = [mock_prospect]

    mock_session.execute.side_effect = [mock_res_tenant, mock_res_prospects]

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.v1.outbound.AsyncSessionLocal", return_value=mock_ctx):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/v1/outbound/prospects?tenant_id=trifid_media",
                headers={"X-API-Key": settings.API_KEY},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["company_name"] == "NovaScale"


@pytest.mark.asyncio
async def test_outbound_unauthorized():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/v1/outbound/trigger",
            headers={"X-API-Key": "invalid-key"},
            json={"tenant_id": "trifid_media"},
        )
        assert resp.status_code == 401

