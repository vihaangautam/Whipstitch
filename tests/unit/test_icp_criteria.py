"""Unit tests verifying dynamic ICP criteria prompt injection and competitor blocklist gate."""
import pytest
from app.activities.qualification_activity import generate_mock_qualification
from app.activities.outbound_activity import disqualify_prospect_gate_activity
from app.db.session import AsyncSessionLocal
from app.db.models import Tenant
from sqlalchemy import select


def test_icp_qualification_scores_based_on_configured_industries():
    """Verifies that qualification scoring respects configured target industries."""
    icp_criteria = {
        "target_industries": ["Fintech", "E-Commerce"],
        "employee_count_min": 50,
        "employee_count_max": 2000,
    }

    # Matching lead
    match_qual = generate_mock_qualification("Acme Payments", "Fintech & Payments", icp_criteria)
    assert match_qual.lead_score >= 75
    assert "Strong ICP fit" in match_qual.fit_reasoning

    # Non-matching lead
    mismatch_qual = generate_mock_qualification("Heavy Metals Ltd", "Mining & Metallurgy", icp_criteria)
    assert mismatch_qual.lead_score < 50
    assert "outside the primary target verticals" in mismatch_qual.fit_reasoning


@pytest.mark.asyncio
async def test_dynamic_competitor_blocklist_gate():
    """Verifies that competitor domains from tenant configuration are disqualified."""
    # 1. Update tenant config with a custom blocked domain
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Tenant).where(Tenant.tenant_key == "trifid_media"))
        tenant = res.scalar_one_or_none()
        if tenant:
            tenant.config = {
                **(tenant.config or {}),
                "competitor_blocklist": ["customrival.com", "badactor.io"],
            }
            await session.commit()

    # 2. Test standard viable domain
    viable = await disqualify_prospect_gate_activity(
        "pros-1", "Viable Brand Inc", "viablebrand.com", tenant_key="trifid_media"
    )
    assert viable["is_viable_prospect"] is True

    # 3. Test custom blocked domain from tenant config
    blocked = await disqualify_prospect_gate_activity(
        "pros-2", "Custom Rival", "customrival.com", tenant_key="trifid_media"
    )
    assert blocked["is_viable_prospect"] is False
    assert "matched competitor blocklist" in blocked["disqualification_reason"]
