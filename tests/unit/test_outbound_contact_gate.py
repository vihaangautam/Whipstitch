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
    result.all.return_value = []
    session.execute.return_value = result
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=session)
    ctx.__aexit__ = AsyncMock(return_value=None)
    return ctx


@pytest.mark.asyncio
async def test_discovery_returns_empty_and_spends_nothing_in_mock_mode():
    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key="trifid_media",
        name="Trifid Media",
        config={"icp_criteria": {"target_industries": ["B2B SaaS"], "geographies": ["US"]}},
    )

    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx(tenant)
    ), patch.object(ApolloBudgetGuard, "consume_credits", new=AsyncMock()) as spend:
        prospects = await discover_prospects_activity("trifid_media", batch_size=3)

    assert prospects == []
    spend.assert_not_called()


@pytest.mark.asyncio
async def test_discovery_passes_tenant_icp_to_apollo(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "MOCK_APOLLO", False, raising=False)
    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key="logistics_tenant",
        name="Logistics Corp",
        config={"icp_criteria": {
            "target_industries": ["Logistics & Supply Chain"],
            "geographies": ["India"],
            "employee_count_min": 50,
            "employee_count_max": 500,
        }},
    )

    apollo_mock = AsyncMock(
        return_value=[{"name": "Veritas", "domain": "veritas.com", "industry": "Logistics & Supply Chain", "employee_count": 200}]
    )
    with patch(
        "app.activities.outbound_activity.AsyncSessionLocal", return_value=_session_ctx(tenant)
    ), patch.object(ApolloBudgetGuard, "can_consume", new=AsyncMock(return_value=True)), patch.object(
        ApolloBudgetGuard, "consume_credits", new=AsyncMock()
    ) as spend, patch(
        "app.activities.outbound_activity.apollo_search_organizations", apollo_mock
    ):
        prospects = await discover_prospects_activity("logistics_tenant", batch_size=1)

    apollo_mock.assert_awaited_once()
    call = apollo_mock.await_args
    assert call.args[0] == ["Logistics & Supply Chain"]
    assert call.args[1] == ["India"]
    spend.assert_awaited_once()
    assert len(prospects) == 1
    assert prospects[0]["industry"] == "Logistics & Supply Chain"


@pytest.mark.asyncio
async def test_discovery_falls_back_to_hiring_signals_when_apollo_unavailable():
    """MOCK_APOLLO is on (autouse), so discovery must use free ATS hiring-signal search."""
    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key="agency_tenant",
        name="Agency Co",
        config={
            "icp_criteria": {"target_industries": ["D2C"], "geographies": ["India"]},
            "trigger_roles": ["SEO Specialist"],
        },
    )
    hiring = [
        {"name": "Northwind Retail", "domain": "northwind.com", "industry": None,
         "hiring_signal": {"label": "Hiring SEO Specialist · India", "evidence_url": "https://boards.greenhouse.io/northwind/jobs/1"}},
    ]
    session = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = tenant
    result.all.return_value = []
    session.execute.return_value = result
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=session)
    ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.activities.outbound_activity.AsyncSessionLocal", return_value=ctx), patch(
        "app.activities.outbound_activity.SerperService"
    ) as serper_cls:
        serper_cls.return_value.discover_via_hiring_signals = AsyncMock(return_value=hiring)
        prospects = await discover_prospects_activity("agency_tenant", batch_size=3)

    assert len(prospects) == 1
    assert prospects[0]["company_name"] == "Northwind Retail"
    staged = session.add.call_args_list[0].args[0]
    assert staged.signals_json["source"] == "serper_hiring"
    assert staged.signals_json["confidence_label"] == "inferred"
    assert staged.signals_json["hiring_signal_label"] == "Hiring SEO Specialist · India"


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
