"""Cross-tenant isolation: can workspace A reach workspace B's data?

Every test here is an attempted breach that must fail. They run against real rows rather
than mocks, because the thing under test is whether the query carries a tenant filter at
all — a mocked session returns whatever it was handed and would pass either way.

Regression coverage for the pattern found on 2026-09-12: routes accepted a caller-supplied
`tenant_id` (or looked objects up by bare UUID), so anyone holding any valid credential
could name someone else's workspace.
"""
import pytest

from app.core.config import settings


@pytest.mark.asyncio
async def test_deal_from_another_workspace_is_not_readable(async_client, workspace_factory):
    victim = await workspace_factory("victim", with_deal=True)
    attacker = await workspace_factory("attacker")
    victim_deal = victim.deal_ids[0]

    resp = await async_client.get(f"/v1/deals/{victim_deal}/medpicc", headers=attacker.headers)
    assert resp.status_code == 404, "attacker read another workspace's MEDDPICC scorecard"

    resp = await async_client.get(f"/v1/deals/{victim_deal}/committee", headers=attacker.headers)
    assert resp.status_code == 404, "attacker read another workspace's buying committee"

    resp = await async_client.get(f"/v1/deals/{victim_deal}/follow-up", headers=attacker.headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_deal_list_only_returns_own_workspace(async_client, workspace_factory):
    victim = await workspace_factory("victim", with_deal=True)
    attacker = await workspace_factory("attacker", with_deal=True)

    resp = await async_client.get("/v1/deals", headers=attacker.headers)
    assert resp.status_code == 200
    returned_ids = {d["id"] for d in resp.json()}
    assert str(victim.deal_ids[0]) not in returned_ids
    assert str(attacker.deal_ids[0]) in returned_ids


@pytest.mark.asyncio
async def test_transcript_upload_rejected_for_foreign_deal(async_client, workspace_factory):
    """Writes matter as much as reads — this one would have let an attacker inject a
    transcript into someone else's deal and trigger LLM spend on their workspace."""
    victim = await workspace_factory("victim", with_deal=True)
    attacker = await workspace_factory("attacker")

    resp = await async_client.post(
        f"/v1/deals/{victim.deal_ids[0]}/transcript",
        headers=attacker.headers,
        data={"raw_text": "Injected transcript from another tenant."},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_lead_detail_from_another_workspace_is_not_readable(async_client, workspace_factory):
    victim = await workspace_factory("victim", with_lead=True)
    attacker = await workspace_factory("attacker")

    resp = await async_client.get(f"/v1/leads/{victim.lead_ids[0]}", headers=attacker.headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_lead_list_is_scoped_to_own_workspace(async_client, workspace_factory):
    victim = await workspace_factory("victim", with_lead=True)
    attacker = await workspace_factory("attacker")

    resp = await async_client.get("/v1/leads", headers=attacker.headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_event_status_is_scoped_to_own_workspace(async_client, workspace_factory):
    victim = await workspace_factory("victim", with_lead=True)
    attacker = await workspace_factory("attacker")

    resp = await async_client.get(
        f"/v1/events/{victim.lead_ids[0]}/status", headers=attacker.headers
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tenant_config_path_cannot_name_another_workspace(async_client, workspace_factory):
    """The workspace key stays in the URL, but it grants nothing — the session decides."""
    victim = await workspace_factory("victim")
    attacker = await workspace_factory("attacker")

    resp = await async_client.get(
        f"/v1/tenants/{victim.tenant_key}/config", headers=attacker.headers
    )
    assert resp.status_code == 403

    resp = await async_client.post(
        f"/v1/tenants/{victim.tenant_key}/config",
        headers=attacker.headers,
        json={
            "enrichment_waterfall_order": ["apollo"],
            "icp_criteria": {},
            "bm25_query_terms": "hostile overwrite",
            "target_decision_maker_roles": [],
            "routing_matrix": {},
            "sla_window_minutes": 1,
        },
    )
    assert resp.status_code == 403, "attacker overwrote another workspace's ICP config"


@pytest.mark.asyncio
async def test_byok_keys_are_scoped_to_own_workspace(async_client, workspace_factory):
    victim = await workspace_factory("victim")
    attacker = await workspace_factory("attacker")

    saved = await async_client.post(
        "/v1/settings/api-keys",
        headers=victim.headers,
        json={"tenant_id": victim.tenant_key, "provider": "openai", "api_key": "sk-victim-secret-12345"},
    )
    assert saved.status_code == 201

    # The attacker names the victim's tenant in the body; it must be ignored entirely.
    listed = await async_client.get("/v1/settings/api-keys", headers=attacker.headers)
    assert listed.status_code == 200
    assert listed.json() == [], "attacker enumerated another workspace's BYOK providers"

    revoked = await async_client.delete("/v1/settings/api-keys/openai", headers=attacker.headers)
    assert revoked.status_code == 404, "attacker revoked another workspace's BYOK key"

    # And the victim's key is still there, untouched.
    still_there = await async_client.get("/v1/settings/api-keys", headers=victim.headers)
    assert [k["provider"] for k in still_there.json()] == ["openai"]


@pytest.mark.asyncio
async def test_body_supplied_tenant_id_is_ignored_on_write(async_client, workspace_factory):
    """A deal created while naming someone else's tenant must land in the caller's own."""
    victim = await workspace_factory("victim")
    attacker = await workspace_factory("attacker")

    resp = await async_client.post(
        "/v1/deals",
        headers=attacker.headers,
        json={
            "tenant_id": victim.tenant_key,
            "deal_name": "Planted Deal",
            "company_name": "Planted Corp",
            "deal_size": 1000.0,
            "currency": "USD",
            "current_stage": "Discovery",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["tenant_id"] == attacker.tenant_key

    victim_deals = await async_client.get("/v1/deals", headers=victim.headers)
    assert victim_deals.json() == [], "write landed in the named tenant instead of the caller's"


@pytest.mark.asyncio
async def test_unauthenticated_requests_are_rejected(async_client, workspace_factory):
    await workspace_factory("victim", with_deal=True)

    for path in ("/v1/deals", "/v1/leads", "/v1/settings/api-keys", "/v1/analytics/summary"):
        resp = await async_client.get(path)
        assert resp.status_code == 401, f"{path} served an unauthenticated request"


@pytest.mark.asyncio
async def test_shared_api_key_cannot_reach_a_named_workspace(async_client, workspace_factory):
    """The app-wide key is a service credential for the default workspace only.

    It used to be the single gate on most routes, which meant one leaked build artifact
    (it is compiled into the frontend bundle) exposed every tenant.
    """
    victim = await workspace_factory("victim", with_deal=True)
    headers = {"X-API-Key": settings.API_KEY}

    resp = await async_client.get(f"/v1/deals/{victim.deal_ids[0]}/medpicc", headers=headers)
    assert resp.status_code == 404

    resp = await async_client.get(f"/v1/tenants/{victim.tenant_key}/config", headers=headers)
    assert resp.status_code == 403

    listed = await async_client.get("/v1/deals", headers=headers)
    assert listed.status_code == 200
    assert str(victim.deal_ids[0]) not in {d["id"] for d in listed.json()}
