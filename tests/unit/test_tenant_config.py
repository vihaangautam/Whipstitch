"""Tenant ICP/SLA configuration routes.

Written against real rows rather than a mocked session: the config read now comes from the
caller's authenticated workspace, so a test that mocks only the write path would compare a
mocked write against a real read and prove nothing.
"""
import pytest


@pytest.mark.asyncio
async def test_tenant_config_unauthorized(async_client):
    response = await async_client.get(
        "/v1/tenants/trifid_media/config",
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_and_get_tenant_config(async_client, workspace_factory):
    ws = await workspace_factory("config")

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

    post_resp = await async_client.post(
        f"/v1/tenants/{ws.tenant_key}/config",
        json=payload,
        headers=ws.headers,
    )
    assert post_resp.status_code == 200
    assert post_resp.json()["enrichment_waterfall_order"] == ["hunter", "apollo", "llm_fallback"]

    get_resp = await async_client.get(
        f"/v1/tenants/{ws.tenant_key}/config",
        headers=ws.headers,
    )
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["enrichment_waterfall_order"] == ["hunter", "apollo", "llm_fallback"]
    assert data["sla_window_minutes"] == 10
    assert data["icp_criteria"]["target_industries"] == ["Fintech", "SaaS"]


@pytest.mark.asyncio
async def test_config_update_preserves_onboarding_fields(async_client, workspace_factory):
    """A full-schema POST carries defaults for every field; it must not wipe values the
    onboarding wizard set but this form doesn't edit."""
    ws = await workspace_factory("preserve")

    await async_client.post(
        "/v1/auth/onboarding",
        headers=ws.headers,
        json={
            "company_description": "We sell cold chain logistics.",
            "offering": "Refrigerated fleet retainers.",
            "target_industries": ["FMCG"],
            "geographies": ["India"],
            "target_decision_maker_roles": ["Head of Supply Chain"],
            "trigger_roles": ["Procurement Lead"],
            "employee_count_min": 20,
            "employee_count_max": 200,
        },
    )

    await async_client.post(
        f"/v1/tenants/{ws.tenant_key}/config",
        headers=ws.headers,
        json={
            "enrichment_waterfall_order": ["apollo"],
            "icp_criteria": {"employee_count_min": 30},
            "bm25_query_terms": "cold chain",
            "target_decision_maker_roles": [],
            "routing_matrix": {},
            "sla_window_minutes": 15,
        },
    )

    me = await async_client.get("/v1/auth/me", headers=ws.headers)
    assert me.json()["onboarded"] is True

    cfg = await async_client.get(f"/v1/tenants/{ws.tenant_key}/config", headers=ws.headers)
    assert cfg.json()["trigger_roles"] == ["Procurement Lead"]
