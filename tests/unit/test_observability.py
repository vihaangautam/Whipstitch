"""Request correlation ID and /metrics.

Regression coverage for the request-scoped X-Request-ID header and the Prometheus
counters RequestObservabilityMiddleware maintains.
"""
import pytest

from app.core.observability import http_requests_total


@pytest.mark.asyncio
async def test_response_carries_a_request_id(async_client):
    response = await async_client.get("/ping")
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID")


@pytest.mark.asyncio
async def test_caller_supplied_request_id_is_echoed_back(async_client):
    response = await async_client.get("/ping", headers={"X-Request-ID": "caller-supplied-id"})
    assert response.headers.get("X-Request-ID") == "caller-supplied-id"


@pytest.mark.asyncio
async def test_two_concurrent_requests_get_different_request_ids(async_client):
    r1 = await async_client.get("/ping")
    r2 = await async_client.get("/ping")
    assert r1.headers["X-Request-ID"] != r2.headers["X-Request-ID"]


@pytest.mark.asyncio
async def test_metrics_endpoint_exposes_prometheus_text_format(async_client):
    await async_client.get("/ping")
    response = await async_client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text
    assert "http_request_duration_seconds" in response.text


@pytest.mark.asyncio
async def test_request_counter_increments_per_route_not_per_raw_path(async_client, workspace_factory):
    """Two different deal ids on the same route must collapse into one label set, not
    create a new Prometheus time series per id — that's the cardinality blowup the route
    pattern (not request.url.path) is specifically there to avoid."""
    ws = await workspace_factory("metrics_cardinality", with_deal=True)
    before = http_requests_total.labels("GET", "/v1/deals/{deal_id}/medpicc", "404")._value.get()

    await async_client.get(f"/v1/deals/{ws.deal_ids[0]}/medpicc", headers=ws.headers)

    after = http_requests_total.labels("GET", "/v1/deals/{deal_id}/medpicc", "404")._value.get()
    assert after == before + 1
