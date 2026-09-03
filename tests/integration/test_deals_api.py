"""Integration tests for Deals & BYOK Settings API endpoints."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.db.models import Deal, DealDiagnostic, EvidenceQuote, MEDPICCScore, Tenant, UserAPIKey
from app.db.session import get_db_session
from app.main import app


@pytest.mark.asyncio
async def test_create_and_list_deals():
    tenant_id = uuid.uuid4()
    mock_tenant = Tenant(id=tenant_id, tenant_key="trifid_media", name="Trifid Media")
    mock_deal = Deal(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        deal_name="Acme Global Enterprise",
        company_name="Acme Global",
        domain="acmeglobal.com",
        deal_size=75000.0,
        currency="USD",
        current_stage="Discovery",
    )

    mock_session = AsyncMock()
    mock_tenant_res = MagicMock()
    mock_tenant_res.scalar_one_or_none.return_value = mock_tenant

    mock_deals_res = MagicMock()
    mock_deals_res.scalars().all.return_value = [mock_deal]

    mock_diag_res = MagicMock()
    mock_diag_res.scalar_one_or_none.return_value = None

    mock_session.execute.side_effect = [
        mock_tenant_res,  # create: find tenant
        mock_tenant_res,  # list: find tenant
        mock_deals_res,   # list: find deals
        mock_diag_res,    # list: latest diagnostic
    ]

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Create deal
            create_payload = {
                "tenant_id": "trifid_media",
                "deal_name": "Acme Global Enterprise",
                "company_name": "Acme Global",
                "domain": "acmeglobal.com",
                "deal_size": 75000.0,
            }
            res = await client.post("/v1/deals", json=create_payload)
            assert res.status_code == 201
            assert res.json()["deal_name"] == "Acme Global Enterprise"

            # 2. List deals
            list_res = await client.get("/v1/deals?tenant_id=trifid_media")
            assert list_res.status_code == 200
            assert len(list_res.json()) == 1
            assert list_res.json()[0]["deal_name"] == "Acme Global Enterprise"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_transcript_endpoint():
    deal_id = uuid.uuid4()
    mock_deal = Deal(id=deal_id, tenant_id=uuid.uuid4(), deal_name="Fintech Deal", company_name="FintechPay")

    mock_session = AsyncMock()
    mock_deal_res = MagicMock()
    mock_deal_res.scalar_one_or_none.return_value = mock_deal
    mock_session.execute.return_value = mock_deal_res

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            vtt_transcript = """WEBVTT

1
00:00:01.000 --> 00:00:05.000
Buyer: We are spending $200k/year on manual compliance reviews and losing 3 deals a month.
"""
            res = await client.post(
                f"/v1/deals/{str(deal_id)}/transcript",
                data={"raw_text": vtt_transcript},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "uploaded"
            assert "spending $200k/year" in data["full_text"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_byok_api_key_lifecycle():
    tenant_id = uuid.uuid4()
    mock_tenant = Tenant(id=tenant_id, tenant_key="trifid_media", name="Trifid Media")
    mock_key = UserAPIKey(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        provider="openai",
        encrypted_key="fake-encrypted-token",
        key_masked="sk-...cdef",
        is_active=True,
    )

    mock_session = AsyncMock()
    mock_tenant_res = MagicMock()
    mock_tenant_res.scalar_one_or_none.return_value = mock_tenant

    mock_existing_res = MagicMock()
    mock_existing_res.scalar_one_or_none.return_value = None

    mock_keys_res = MagicMock()
    mock_keys_res.scalars().all.return_value = [mock_key]

    mock_key_single = MagicMock()
    mock_key_single.scalar_one_or_none.return_value = mock_key

    mock_session.execute.side_effect = [
        mock_tenant_res,    # save: get tenant
        mock_existing_res,  # save: check existing
        mock_tenant_res,    # list: get tenant
        mock_keys_res,      # list: get keys
        mock_tenant_res,    # delete: get tenant
        mock_key_single,    # delete: get key
    ]

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Save Key
            save_res = await client.post(
                "/v1/settings/api-keys",
                json={
                    "tenant_id": "trifid_media",
                    "provider": "openai",
                    "api_key": "sk-proj-test-1234567890abcdef",
                },
            )
            assert save_res.status_code == 201
            assert save_res.json()["key_masked"] == "sk-...cdef"

            # 2. List Keys
            list_res = await client.get("/v1/settings/api-keys?tenant_id=trifid_media")
            assert list_res.status_code == 200
            assert len(list_res.json()) == 1

            # 3. Test Connectivity
            test_res = await client.post(
                "/v1/settings/api-keys/test?provider=openai&api_key=sk-proj-test-1234567890abcdef"
            )
            assert test_res.status_code == 200

            # 4. Revoke Key
            del_res = await client.delete("/v1/settings/api-keys/openai?tenant_id=trifid_media")
            assert del_res.status_code == 200
            assert del_res.json()["status"] == "revoked"
    finally:
        app.dependency_overrides.clear()
