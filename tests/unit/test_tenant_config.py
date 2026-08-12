from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.db.models import Tenant


@pytest.mark.asyncio
async def test_tenant_config_unauthorized(async_client):
    response = await async_client.get(
        "/v1/tenants/trifid_media/config",
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_and_get_tenant_config_mocked(async_client):
    headers = {"X-API-Key": "whipstitch-dev-key-12345"}

    payload = {
        "enrichment_waterfall_order": ["hunter", "apollo", "llm_fallback"],
        "icp_criteria": {
            "target_industries": ["Fintech", "SaaS"],
            "employee_count_min": 100,
            "employee_count_max": 1000,
        },
        "bm25_query_terms": "fintech payroll compliance",
        "target_decision_maker_roles": ["CTO", "VP Engineering"],
        "routing_matrix": {"high_priority": "enterprise_team"},
        "sla_window_minutes": 10,
    }

    mock_tenant = Tenant(
        tenant_key="test_tenant_001",
        name="Test Tenant",
        config=payload,
    )

    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_tenant
    mock_session.execute.return_value = mock_result

    # Mock async context manager for AsyncSessionLocal()
    mock_session_ctx = MagicMock()
    mock_session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.tenant.AsyncSessionLocal", return_value=mock_session_ctx):
        # Post update
        post_resp = await async_client.post(
            "/v1/tenants/test_tenant_001/config",
            json=payload,
            headers=headers,
        )
        assert post_resp.status_code == 200
        data = post_resp.json()
        assert data["enrichment_waterfall_order"] == ["hunter", "apollo", "llm_fallback"]

        # Get config
        get_resp = await async_client.get(
            "/v1/tenants/test_tenant_001/config",
            headers=headers,
        )
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["enrichment_waterfall_order"] == ["hunter", "apollo", "llm_fallback"]
