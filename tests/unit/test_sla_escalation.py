import pytest
from app.services.alerting.slack import SlackAlerter


@pytest.mark.asyncio
async def test_slack_sla_alert_mock():
    alerter = SlackAlerter()
    msg_id = await alerter.send_sla_alert(
        lead_id="test-lead-123",
        tenant_key="trifid_media",
        email="hot_lead@brand.com",
        company_name="Hot Lead Brand",
        score=95,
        draft_summary={"observation_hook": "Noticed scaling hiring signals"},
    )

    assert msg_id is not None
    assert msg_id.startswith("slack-msg-")
