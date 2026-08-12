import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import select
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.core.rate_limiter import TokenBucketRateLimiter
from app.db.models import CRMSyncRecord, LeadEvent
from app.db.session import AsyncSessionLocal
from app.services.crm.hubspot import HubSpotCRMProvider

logger = get_logger(__name__)


@activity.defn(name="sync_to_crm_activity")
async def sync_to_crm_activity(
    lead_id: str,
    tenant_key: str,
    enrichment_data: Dict[str, Any],
    qualification_data: Dict[str, Any],
) -> dict:
    """Temporal Activity: Enforces Token Bucket rate limits, syncs lead to HubSpot CRM, and saves record."""
    bind_correlation_id(lead_id)
    email = enrichment_data.get("email") or "lead@company.com"
    company_name = enrichment_data.get("company_name") or "Target Company"

    logger.info("sync_to_crm_activity_started", lead_id=lead_id, tenant_key=tenant_key, email=email)

    # 1. Enforce Token Bucket Rate Limiting (10 req/sec limit)
    rate_limiter = TokenBucketRateLimiter()
    allowed, wait_time = await rate_limiter.acquire_token(
        provider="hubspot",
        tenant_id=tenant_key,
        capacity=10.0,
        refill_rate=10.0,
    )

    if not allowed:
        logger.info("sync_to_crm_activity_rate_limited_waiting", wait_time=wait_time)

    # 2. Execute HubSpot CRM Sync
    crm_provider = HubSpotCRMProvider()
    sync_result = await crm_provider.sync_lead(
        email=email,
        company_name=company_name,
        enrichment_data=enrichment_data,
        qualification_data=qualification_data,
    )

    # 3. Persist record to DB
    async with AsyncSessionLocal() as session:
        crm_entry = CRMSyncRecord(
            id=uuid.uuid4(),
            lead_source_type="inbound",
            lead_source_id=uuid.UUID(lead_id),
            crm_provider=sync_result.crm_provider,
            crm_record_id=sync_result.crm_record_id,
            sync_status=sync_result.sync_status,
        )
        session.add(crm_entry)

        # Update lead_events status
        lead_res = await session.execute(select(LeadEvent).where(LeadEvent.id == uuid.UUID(lead_id)))
        lead_event = lead_res.scalar_one_or_none()
        if lead_event:
            lead_event.status = "synced"
            lead_event.updated_at = datetime.now(timezone.utc)

        await session.commit()

    logger.info(
        "sync_to_crm_activity_completed",
        lead_id=lead_id,
        crm_record_id=sync_result.crm_record_id,
        sync_status=sync_result.sync_status,
    )

    return sync_result.model_dump()
