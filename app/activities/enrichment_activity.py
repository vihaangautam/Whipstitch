import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.db.models import EnrichmentResult, LeadEvent, Tenant
from app.db.session import AsyncSessionLocal
from app.services.enrichment.waterfall import WaterfallEnricher

logger = get_logger(__name__)


@activity.defn(name="enrich_lead_waterfall_activity")
async def enrich_lead_waterfall_activity(
    lead_id: str,
    tenant_key: str,
    email: str,
    company_name: str,
) -> dict:
    """Temporal Activity: Runs deep multi-provider waterfall enrichment and saves result to DB."""
    bind_correlation_id(lead_id)
    logger.info("enrich_lead_waterfall_activity_started", lead_id=lead_id, tenant_key=tenant_key, email=email)

    waterfall_order = None
    bm25_query_terms = "product features value proposition pricing clients creator roster"

    async with AsyncSessionLocal() as session:
        # Load tenant configuration
        result = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        tenant = result.scalar_one_or_none()

        if tenant and tenant.config:
            waterfall_order = tenant.config.get("enrichment_waterfall_order")
            bm25_query_terms = tenant.config.get("bm25_query_terms", bm25_query_terms)

        # Run Waterfall Enricher
        enricher = WaterfallEnricher(bm25_query_terms=bm25_query_terms)
        profile = await enricher.execute_waterfall(
            email=email,
            company_name=company_name,
            waterfall_order=waterfall_order,
        )

        # Save result to DB
        enrichment_entry = EnrichmentResult(
            id=uuid.uuid4(),
            lead_source_type="inbound",
            lead_source_id=uuid.UUID(lead_id),
            provider_used=profile.provider_used,
            raw_response=profile.model_dump(),
            fallback_triggered=profile.raw_data.get("fallback_triggered", False),
        )
        session.add(enrichment_entry)

        # Update lead_events status
        lead_result = await session.execute(select(LeadEvent).where(LeadEvent.id == uuid.UUID(lead_id)))
        lead_event = lead_result.scalar_one_or_none()
        if lead_event:
            lead_event.status = "enriching"
            lead_event.updated_at = datetime.now(timezone.utc)

        await session.commit()

    logger.info(
        "enrich_lead_waterfall_activity_completed",
        lead_id=lead_id,
        provider_used=profile.provider_used,
        confidence=profile.confidence_score,
    )

    return profile.model_dump()
