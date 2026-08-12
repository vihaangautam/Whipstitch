import uuid
from fastapi import APIRouter, Header, HTTPException, Response, status
from sqlalchemy import select
from temporalio.client import Client

from app.core.config import settings
from app.core.idempotency import IdempotencyManager, derive_idempotency_key
from app.core.logging import bind_correlation_id, get_logger
from app.db.models import EnrichmentResult, LeadEvent, LLMQualification, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import EventStatusResponse, IngestEventRequest, IngestEventResponse

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/v1/events/ingest",
    response_model=IngestEventResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest Lead Webhook Event with Idempotency",
)
async def ingest_lead_event(
    payload: IngestEventRequest,
    response: Response,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key header",
        )

    # Derive or accept idempotency key
    idempotency_key = derive_idempotency_key(
        payload.email, payload.company_name, payload.idempotency_key
    )

    # Atomic Idempotency Lock Check
    idempotency_mgr = IdempotencyManager()
    is_acquired, cached_state = await idempotency_mgr.acquire_lock_or_get_cached(
        payload.tenant_id, idempotency_key
    )

    if not is_acquired:
        response.status_code = status.HTTP_202_ACCEPTED
        logger.info(
            "ingest_event_duplicate_accepted",
            tenant_id=payload.tenant_id,
            idempotency_key=idempotency_key,
        )
        return IngestEventResponse(
            event_id=cached_state.get("event_id", "duplicate"),
            status="duplicate",
            message="Duplicate event payload received within 24h window; cached state returned.",
            cached_state=cached_state,
        )

    event_id = str(uuid.uuid4())
    bind_correlation_id(event_id)

    logger.info(
        "ingest_event_received",
        tenant_id=payload.tenant_id,
        email=payload.email,
        company_name=payload.company_name,
        idempotency_key=idempotency_key,
    )

    async with AsyncSessionLocal() as session:
        # Check tenant exists or create default seed tenant
        result = await session.execute(
            select(Tenant).where(Tenant.tenant_key == payload.tenant_id)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                tenant_key=payload.tenant_id,
                name="Trifid Media" if payload.tenant_id == "trifid_media" else payload.tenant_id,
                config={
                    "enrichment_waterfall_order": [
                        "apollo",
                        "people_data_labs",
                        "hunter",
                        "diffbot",
                        "crawl4ai",
                        "llm_fallback",
                    ],
                    "icp_criteria": {
                        "target_industries": ["D2C", "E-commerce", "Lifestyle", "Consumer Tech"],
                        "employee_count_min": 50,
                        "employee_count_max": 500,
                    },
                    "bm25_query_terms": "product features value proposition pricing clients creator roster",
                    "sla_window_minutes": 15,
                },
            )
            session.add(tenant)
            await session.flush()

        # Write lead_events record
        lead_event = LeadEvent(
            id=uuid.UUID(event_id),
            tenant_id=tenant.id,
            idempotency_key=idempotency_key,
            source="inbound_webhook",
            email=payload.email,
            company_name=payload.company_name,
            raw_payload=payload.raw_payload,
            status="received",
        )
        session.add(lead_event)
        await session.commit()

    # Store initial cached state for idempotency duplicate queries
    await idempotency_mgr.set_cached_state(
        payload.tenant_id,
        idempotency_key,
        {
            "event_id": event_id,
            "tenant_id": payload.tenant_id,
            "email": payload.email,
            "company_name": payload.company_name,
            "status": "received",
        },
    )

    # Trigger Temporal workflow async
    try:
        temporal_client = await Client.connect(
            settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE
        )
        await temporal_client.start_workflow(
            "WhipstitchLeadWorkflow",
            {
                "event_id": event_id,
                "tenant_id": payload.tenant_id,
                "email": payload.email,
                "company_name": payload.company_name,
                "idempotency_key": idempotency_key,
            },
            id=f"inbound-lead-{event_id}",
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
        logger.info("temporal_workflow_started", workflow_id=f"inbound-lead-{event_id}")
    except Exception as e:
        logger.warning("temporal_start_workflow_skipped_or_failed", error=str(e))

    return IngestEventResponse(
        event_id=event_id,
        status="received",
        message="Event accepted and workflow queued",
    )


@router.get(
    "/v1/events/{event_id}/status",
    response_model=EventStatusResponse,
    summary="Get Inbound Event Processing Status",
)
async def get_event_status(
    event_id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key header",
        )

    try:
        lead_uuid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event_id UUID format")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(LeadEvent).where(LeadEvent.id == lead_uuid))
        lead_event = result.scalar_one_or_none()

        if not lead_event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Event '{event_id}' not found")

        tenant_result = await session.execute(select(Tenant).where(Tenant.id == lead_event.tenant_id))
        tenant = tenant_result.scalar_one_or_none()

        # Fetch enrichment summary if available
        enrich_result = await session.execute(
            select(EnrichmentResult).where(EnrichmentResult.lead_source_id == lead_uuid)
        )
        enrichment = enrich_result.scalar_one_or_none()

        # Fetch qualification summary if available
        qual_result = await session.execute(
            select(LLMQualification).where(LLMQualification.lead_source_id == lead_uuid)
        )
        qualification = qual_result.scalar_one_or_none()

        return EventStatusResponse(
            event_id=str(lead_event.id),
            tenant_id=tenant.tenant_key if tenant else "unknown",
            email=lead_event.email,
            company_name=lead_event.company_name,
            status=lead_event.status,
            created_at=lead_event.created_at.isoformat(),
            enrichment_summary={
                "provider_used": enrichment.provider_used,
                "fallback_triggered": enrichment.fallback_triggered,
            }
            if enrichment
            else None,
            qualification_summary={
                "lead_score": qualification.lead_score,
                "confidence_score": qualification.confidence_score,
                "model_used": qualification.model_used,
                "draft": {
                    "observation_hook": qualification.observation_hook,
                    "capability_link": qualification.capability_link,
                    "low_friction_ask": qualification.low_friction_ask,
                },
            }
            if qualification
            else None,
        )
