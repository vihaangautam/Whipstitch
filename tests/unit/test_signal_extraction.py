import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.activities.outbound_activity import (
    discover_decision_maker_activity,
    disqualify_prospect_gate_activity,
)
from app.db.models import OutboundProspect


@pytest.mark.asyncio
async def test_disqualify_prospect_gate_competitor():
    mock_session = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_res

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.activities.outbound_activity.AsyncSessionLocal", return_value=mock_ctx):
        res = await disqualify_prospect_gate_activity(
            prospect_id="00000000-0000-0000-0000-000000000001",
            company_name="Competitor Inc",
            domain="competitor.com",
        )
        assert res["is_viable_prospect"] is False
        assert "competitor" in res["disqualification_reason"].lower()


@pytest.mark.asyncio
async def test_disqualify_prospect_gate_viable():
    mock_session = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_res

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.activities.outbound_activity.AsyncSessionLocal", return_value=mock_ctx):
        res = await disqualify_prospect_gate_activity(
            prospect_id="00000000-0000-0000-0000-000000000002",
            company_name="Valid Tech Brand",
            domain="validtechbrand.io",
        )
        assert res["is_viable_prospect"] is True
        assert res["disqualification_reason"] is None


@pytest.mark.asyncio
async def test_discover_decision_maker_resolution():
    mock_prospect = OutboundProspect(
        id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
        tenant_id=uuid.uuid4(),
        company_name="Acme Solutions",
        domain="acmesolutions.com",
    )
    mock_session = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_prospect
    mock_session.execute.return_value = mock_res

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.activities.outbound_activity.AsyncSessionLocal", return_value=mock_ctx):
        res = await discover_decision_maker_activity(
            prospect_id="00000000-0000-0000-0000-000000000003",
            company_name="Acme Solutions",
            domain="acmesolutions.com",
            target_roles=["VP Growth", "Founder"],
        )
        # The target role is echoed back, but no resolver is wired up yet, so the
        # contact itself stays unresolved instead of being invented.
        assert res["exact_title"] == "VP Growth"
        assert res["full_name"] is None
        assert res["linkedin_url"] is None
        assert res["is_verified"] is False


