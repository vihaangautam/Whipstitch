import pytest
from app.services.crm.hubspot import HubSpotCRMProvider


@pytest.mark.asyncio
async def test_hubspot_crm_sync_mock():
    provider = HubSpotCRMProvider()
    result = await provider.sync_lead(
        email="crm_test@brand.com",
        company_name="CRM Brand",
        enrichment_data={"industry": "D2C"},
        qualification_data={
            "lead_score": 90,
            "outreach_draft": {
                "observation_hook": "Noticed funding round",
                "capability_link": "We scale UGC",
                "low_friction_ask": "Worth connecting?",
            },
        },
    )

    assert result is not None
    assert result.crm_provider == "hubspot"
    assert result.sync_status == "synced"
    assert result.crm_record_id.startswith("hs-")
