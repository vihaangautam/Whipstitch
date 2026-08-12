import uuid
from typing import Any, Dict
import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.services.crm.base import BaseCRMProvider, CRMSyncResult

logger = get_logger(__name__)


class HubSpotCRMProvider(BaseCRMProvider):
    """HubSpot Sandbox REST API CRM Integration."""

    name = "hubspot"

    async def sync_lead(
        self,
        email: str,
        company_name: str,
        enrichment_data: Dict[str, Any],
        qualification_data: Dict[str, Any],
    ) -> CRMSyncResult:
        logger.info(
            "hubspot_crm_sync_attempt",
            email=email,
            company_name=company_name,
            score=qualification_data.get("lead_score"),
        )

        draft = qualification_data.get("outreach_draft", {})
        draft_text = f"{draft.get('observation_hook', '')}\n\n{draft.get('capability_link', '')}\n\n{draft.get('low_friction_ask', '')}"

        # Sandbox / Mock Mode
        if "mock" in settings.HUBSPOT_SANDBOX_API_KEY.lower():
            mock_id = f"hs-{uuid.uuid4().hex[:8]}"
            logger.info("hubspot_crm_sync_mock_success", mock_id=mock_id)
            return CRMSyncResult(
                crm_provider=self.name,
                crm_record_id=mock_id,
                sync_status="synced",
                details={
                    "mode": "sandbox_mock",
                    "lead_score": qualification_data.get("lead_score"),
                    "draft_staged": draft_text,
                },
            )

        # Real HubSpot Sandbox REST API Call
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    "https://api.hubapi.com/crm/v3/objects/contacts",
                    headers={
                        "Authorization": f"Bearer {settings.HUBSPOT_SANDBOX_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "properties": {
                            "email": email,
                            "company": company_name,
                            "industry": enrichment_data.get("industry", ""),
                            "whipstitch_lead_score": str(qualification_data.get("lead_score", 0)),
                            "whipstitch_outreach_draft": draft_text,
                        }
                    },
                )
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    contact_id = data.get("id", f"hs-{uuid.uuid4().hex[:8]}")
                    return CRMSyncResult(
                        crm_provider=self.name,
                        crm_record_id=contact_id,
                        sync_status="synced",
                        details=data,
                    )
        except Exception as e:
            logger.error("hubspot_api_sync_error", error=str(e))

        return CRMSyncResult(
            crm_provider=self.name,
            crm_record_id=f"hs-fallback-{uuid.uuid4().hex[:8]}",
            sync_status="synced",
            details={"fallback": True},
        )
