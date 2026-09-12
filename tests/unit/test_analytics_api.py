"""Pipeline analytics routes.

Uses the async client throughout. The sync TestClient runs the app on its own event loop,
which collides with the session-scoped loop the async engine's connection pool is bound to
(see pytest.ini) — harmless on the SQLite fallback, but it fails against real Postgres.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings


@pytest.mark.asyncio
async def test_analytics_summary_unauthorized(async_client):
    response = await async_client.get("/v1/analytics/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analytics_summary_mocked(async_client):
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
        response = await async_client.get(
            "/v1/analytics/summary",
            headers={"X-API-Key": settings.API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert "sla_compliance_rate" in data
        assert isinstance(data["sla_compliance_rate"], (int, float))
        assert data["apollo_credits_used"] == 12


@pytest.mark.asyncio
async def test_analytics_leads_over_time(async_client):
    response = await async_client.get(
        "/v1/analytics/leads-over-time",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert len(data["datasets"]) == 2


@pytest.mark.asyncio
async def test_analytics_pipeline(async_client):
    response = await async_client.get(
        "/v1/analytics/pipeline",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    data = response.json()
    assert "funnel" in data
    assert "provider_counts" in data
    assert "model_counts" in data
    assert "sla_buckets" in data
    assert "token_usage" in data


@pytest.mark.asyncio
async def test_analytics_audit_logs(async_client):
    response = await async_client.get(
        "/v1/analytics/audit-logs",
        headers={"X-API-Key": settings.API_KEY},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_analytics_is_scoped_to_the_callers_workspace(async_client, workspace_factory):
    """Two workspaces, one lead each: neither may see the other's funnel counts."""
    victim = await workspace_factory("victim", with_lead=True)
    attacker = await workspace_factory("attacker")

    victim_view = await async_client.get("/v1/analytics/pipeline", headers=victim.headers)
    attacker_view = await async_client.get("/v1/analytics/pipeline", headers=attacker.headers)

    assert victim_view.json()["funnel"]["inbound_ingested"] == 1
    assert attacker_view.json()["funnel"]["inbound_ingested"] == 0
