import uuid
from typing import Any, Dict
import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class SlackAlerter:
    """Slack Webhook SLA Escalation Channel."""

    async def send_sla_alert(
        self,
        lead_id: str,
        tenant_key: str,
        email: str,
        company_name: str,
        score: int,
        draft_summary: Dict[str, Any],
    ) -> str:
        logger.info(
            "slack_sla_alert_triggered",
            lead_id=lead_id,
            tenant_key=tenant_key,
            email=email,
            score=score,
        )

        slack_msg_id = f"slack-msg-{uuid.uuid4().hex[:8]}"

        # Mock / Sandbox mode check
        if "mock" in settings.SLACK_WEBHOOK_URL.lower():
            logger.info("slack_sla_alert_mock_sent", msg_id=slack_msg_id)
            return slack_msg_id

        # Real Slack Webhook POST
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "text": f"🚨 *SLA Escalation Alert — Uncontacted Hot Lead*",
                    "blocks": [
                        {
                            "type": "header",
                            "text": {"type": "mrkdwn", "text": "🚨 SLA Escalation — Uncontacted Hot Lead"},
                        },
                        {
                            "type": "section",
                            "fields": [
                                {"type": "mrkdwn", "text": f"*Lead Email:*\n{email}"},
                                {"type": "mrkdwn", "text": f"*Company:*\n{company_name}"},
                                {"type": "mrkdwn", "text": f"*Lead Score:*\n🔥 {score}/100"},
                                {"type": "mrkdwn", "text": f"*Tenant:*\n{tenant_key}"},
                            ],
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*Staged Outreach Hook:*\n>{draft_summary.get('observation_hook', '')}",
                            },
                        },
                    ],
                }
                resp = await client.post(settings.SLACK_WEBHOOK_URL, json=payload)
                if resp.status_code == 200:
                    logger.info("slack_webhook_delivery_success")
        except Exception as e:
            logger.error("slack_webhook_delivery_error", error=str(e))

        return slack_msg_id
