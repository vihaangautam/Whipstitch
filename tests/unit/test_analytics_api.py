from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_analytics_summary_unauthorized():
    response = client.get("/v1/analytics/summary?tenant_id=trifid_media")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analytics_summary_mocked():
    mock_session = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar.return_value = 10
    mock_session.execute.return_value = mock_res

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.v1.analytics.AsyncSessionLocal", return_value=mock_ctx), patch(
        "app.core.apollo_budget.ApolloBudgetGuard.get_monthly_usage", return_value=12
    ):
        response = client.get(
            "/v1/analytics/summary?tenant_id=trifid_media",
            headers={"X-API-Key": settings.API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert "sla_compliance_rate" in data
        assert isinstance(data["sla_compliance_rate"], (int, float))
        assert data["apollo_credits_used"] == 12


def test_analytics_leads_over_time():
    response = client.get(
        "/v1/analytics/leads-over-time?tenant_id=trifid_media",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert len(data["datasets"]) == 2


def test_analytics_pipeline():
    response = client.get(
        "/v1/analytics/pipeline?tenant_id=trifid_media",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert "funnel" in data
    assert "provider_counts" in data
    assert "model_counts" in data


def test_analytics_audit_logs():
    response = client.get(
        "/v1/analytics/audit-logs?tenant_id=trifid_media",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
