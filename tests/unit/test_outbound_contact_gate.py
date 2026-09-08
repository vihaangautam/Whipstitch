"""Locks the two outbound lead-quality invariants.

1. Fixture-backed discovery must never spend Apollo credits (50/month hard cap).
2. A prospect without a verified contact email must never reach CRM as a contact.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.activities.outbound_activity import (
    discover_decision_maker_activity,
    discover_prospects_activity,
    stage_prospect_in_crm_activity,
)
from app.core.apollo_budget import ApolloBudgetGuard
from app.db.models import Tenant


def _session_ctx(scalar_result=None):
    session = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = scalar_result
    session.execute.return_value = result
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=session)
    ctx.__aexit__ = AsyncMock(return_value=None)
    return ctx


@pytest.mark.asyncio
async def test_fixture_discovery_spends_no_apollo_credits():
    tenant = Tenant(id=uuid.uuid4(), tenant_key="trifid_media", name="Trifid Media")

    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx(tenant)
    ), patch.object(ApolloBudgetGuard, "consume_credits", new=AsyncMock()) as spend:
        prospects = await discover_prospects_activity("trifid_media", batch_size=3)

    assert len(prospects) == 3
    spend.assert_not_called()


@pytest.mark.asyncio
async def test_discovery_prioritizes_tenant_icp_industries():
    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key="logistics_tenant",
        name="Logistics Corp",
        config={"icp_criteria": {"target_industries": ["Logistics & Supply Chain"]}},
    )

    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx(tenant)
    ):
        prospects = await discover_prospects_activity("logistics_tenant", batch_size=1)

    assert len(prospects) == 1
    assert prospects[0]["company_name"] == "Veritas Logistics Cloud"
    assert prospects[0]["industry"] == "Logistics & Supply Chain"


@pytest.mark.asyncio
async def test_decision_maker_is_unresolved_rather_than_invented():
    dm = await discover_decision_maker_activity(
        str(uuid.uuid4()), "NovaScale Technologies", "novascale.io", ["Head of Marketing"]
    )

    assert dm["is_verified"] is False
    assert dm["full_name"] is None
    assert dm["email"] is None
    assert dm["confidence_score"] == 0.0


@pytest.mark.asyncio
async def test_unverified_contact_is_not_staged_to_crm():
    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx()
    ), patch("app.activities.outbound_activity.HubSpotCRMProvider") as crm:
        result = await stage_prospect_in_crm_activity(
            str(uuid.uuid4()),
            "trifid_media",
            {"company_name": "NovaScale", "domain": "novascale.io", "decision_maker": {}},
            {"lead_score": 88},
        )

    assert result["sync_status"] == "skipped_unverified_contact"
    assert result["crm_record_id"] is None
    crm.assert_not_called()


@pytest.mark.asyncio
async def test_verified_contact_is_staged_with_its_real_email():
    sync_result = MagicMock()
    sync_result.crm_provider = "hubspot"
    sync_result.crm_record_id = "hs-12345678"
    sync_result.model_dump.return_value = {
        "crm_provider": "hubspot",
        "crm_record_id": "hs-12345678",
        "sync_status": "synced",
        "details": {},
    }
    provider = MagicMock()
    provider.sync_lead = AsyncMock(return_value=sync_result)

    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx()
    ), patch("app.activities.outbound_activity.HubSpotCRMProvider", return_value=provider):
        result = await stage_prospect_in_crm_activity(
            str(uuid.uuid4()),
            "trifid_media",
            {
                "company_name": "NovaScale",
                "domain": "novascale.io",
                "decision_maker": {
                    "full_name": "Priya Raman",
                    "email": "priya.raman@novascale.io",
                    "is_verified": True,
                },
            },
            {"lead_score": 88},
        )

    assert result["crm_record_id"] == "hs-12345678"
    provider.sync_lead.assert_awaited_once()
    assert provider.sync_lead.await_args.kwargs["email"] == "priya.raman@novascale.io"
