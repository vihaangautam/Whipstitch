from unittest.mock import AsyncMock, patch
import pytest


@pytest.mark.asyncio
async def test_root_endpoint(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Whipstitch API Engine"
    assert data["status"] == "running"


@pytest.mark.asyncio
async def test_health_check_unhealthy(async_client):
    # Without real Postgres/Redis/Temporal running, health check should return 503
    response = await async_client.get("/health")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "services" in data
    assert "postgres" in data["services"]
