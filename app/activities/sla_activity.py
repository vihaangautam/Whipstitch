import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.db.models import SLAEscalation
from app.db.session import AsyncSessionLocal
from app.services.alerting.slack import SlackAlerter

logger = get_logger(__name__)


@activity.defn(name="trigger_sla_escalation_activity")
async def trigger_sla_escalation_activity(
    lead_id: str,
    tenant_key: str,
    email: str,
    company_name: str,
    score: int,
    qualification_data: Dict[str, Any],
) -> dict:
    """Temporal Activity: Fires Slack alert when a high-priority lead is uncontacted past the SLA window."""
    bind_correlation_id(lead_id)
    logger.info("trigger_sla_escalation_activity_started", lead_id=lead_id, score=score)

    draft_summary = qualification_data.get("outreach_draft", {})
    alerter = SlackAlerter()
    slack_msg_id = await alerter.send_sla_alert(
        lead_id=lead_id,
        tenant_key=tenant_key,
        email=email,
        company_name=company_name,
        score=score,
        draft_summary=draft_summary,
    )

    # Persist record in DB
    async with AsyncSessionLocal() as session:
        escalation_entry = SLAEscalation(
            id=uuid.uuid4(),
            lead_source_type="inbound",
            lead_source_id=uuid.UUID(lead_id),
            triggered_at=datetime.now(timezone.utc),
            slack_message_id=slack_msg_id,
        )
        session.add(escalation_entry)
        await session.commit()

    logger.info("trigger_sla_escalation_activity_completed", lead_id=lead_id, slack_msg_id=slack_msg_id)

    return {
        "status": "escalated",
        "lead_id": lead_id,
        "slack_message_id": slack_msg_id,
    }
