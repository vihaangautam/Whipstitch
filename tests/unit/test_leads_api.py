import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_leads_list_unauthorized():
    response = client.get("/v1/leads?tenant_id=trifid_media")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_leads_list_mocked():
    mock_tenant = MagicMock()
    mock_tenant.id = uuid.uuid4()

    mock_lead = MagicMock()
    mock_lead.id = uuid.uuid4()
    mock_lead.email = "test@example.com"
    mock_lead.company_name = "Acme Test"
    mock_lead.status = "synced"
    mock_lead.created_at = None
    mock_lead.updated_at = None

    mock_session = AsyncMock()
    mock_tenant_res = MagicMock()
    mock_tenant_res.scalar_one_or_none.return_value = mock_tenant

    mock_leads_res = MagicMock()
    mock_leads_res.scalars.return_value.all.return_value = [mock_lead]

    mock_qual_res = MagicMock()
    mock_qual_res.scalar_one_or_none.return_value = None

    mock_enrich_res = MagicMock()
    mock_enrich_res.scalar_one_or_none.return_value = None

    mock_session.execute.side_effect = [
        mock_tenant_res,
        mock_leads_res,
        mock_qual_res,
        mock_enrich_res,
    ]

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.v1.leads.AsyncSessionLocal", return_value=mock_ctx):
        response = client.get(
            "/v1/leads?tenant_id=trifid_media",
            headers={"X-API-Key": settings.API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["company_name"] == "Acme Test"
