"""Buying committee routes.

These run against a real workspace and a real deal rather than a mocked session: every
committee route hangs off a deal id, and since 2026-09-12 each one verifies the deal
belongs to the caller's workspace. A mocked session can't exercise that check.
"""
import pytest


@pytest.mark.asyncio
async def test_get_committee_members_empty(async_client, workspace_factory):
    """No fabricated roster when none exist."""
    ws = await workspace_factory("owner", with_deal=True)

    response = await async_client.get(
        f"/v1/deals/{ws.deal_ids[0]}/committee", headers=ws.headers
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_add_and_list_committee_member(async_client, workspace_factory):
    ws = await workspace_factory("owner", with_deal=True)
    deal_id = ws.deal_ids[0]

    created = await async_client.post(
        f"/v1/deals/{deal_id}/committee",
        headers=ws.headers,
        json={
            "name": "Priya Raman",
            "role": "VP Finance",
            "tag": "Budget Owner",
            "status": "Pending",
            "email": "priya@buyer.test",
        },
    )
    assert created.status_code == 201

    listed = await async_client.get(f"/v1/deals/{deal_id}/committee", headers=ws.headers)
    assert listed.status_code == 200
    assert [m["name"] for m in listed.json()] == ["Priya Raman"]


@pytest.mark.asyncio
async def test_auto_find_candidate(async_client, workspace_factory):
    """Discovers an executive for a missing buying committee role."""
    ws = await workspace_factory("owner", with_deal=True)

    response = await async_client.post(
        f"/v1/deals/{ws.deal_ids[0]}/committee/auto-find",
        headers=ws.headers,
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


@pytest.mark.asyncio
async def test_stream_committee_discovery(async_client, workspace_factory):
    """The real-time SSE stream emits all four discovery milestones."""
    ws = await workspace_factory("owner", with_deal=True)

    response = await async_client.get(
        f"/v1/deals/{ws.deal_ids[0]}/committee/stream"
        "?role_tag=Budget+Owner&company_name=Apex+Logistics+Global&domain=apexlogistics.com",
        headers=ws.headers,
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    content = response.text
    assert "gap_detected" in content
    assert "searching_registry" in content
    assert "waterfall_verification" in content
    assert "discovery_complete" in content


@pytest.mark.asyncio
async def test_stream_rejects_foreign_deal(async_client, workspace_factory):
    """The ownership check must happen before the stream opens, not inside the generator."""
    victim = await workspace_factory("victim", with_deal=True)
    attacker = await workspace_factory("attacker")

    response = await async_client.get(
        f"/v1/deals/{victim.deal_ids[0]}/committee/stream?role_tag=Budget+Owner",
        headers=attacker.headers,
    )
    assert response.status_code == 404
