import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import resolve_tenant
from app.core.logging import get_logger
from app.db.models import CRMSyncRecord, EnrichmentResult, LeadEvent, LLMQualification, Tenant
from app.db.session import AsyncSessionLocal

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/leads", tags=["Inbound Leads"])


@router.get("", response_model=List[dict])
async def list_inbound_leads(
    search: Optional[str] = Query(default=None, description="Search company name or email"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Retrieves paginated inbound leads for the dashboard table."""
    async with AsyncSessionLocal() as session:
        query = select(LeadEvent).where(LeadEvent.tenant_id == tenant.id)
        if status_filter:
            query = query.where(LeadEvent.status == status_filter)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (LeadEvent.company_name.ilike(search_pattern)) | (LeadEvent.email.ilike(search_pattern))
            )

        query = query.order_by(LeadEvent.created_at.desc()).limit(limit).offset(offset)
        result = await session.execute(query)
        leads = result.scalars().all()

        leads_out = []
        for l in leads:
            # Fetch qualification score if available
            qual_res = await session.execute(
                select(LLMQualification).where(LLMQualification.lead_source_id == l.id)
            )
            qual = qual_res.scalar_one_or_none()

            # Fetch enrichment result if available
            enrich_res = await session.execute(
                select(EnrichmentResult).where(EnrichmentResult.lead_source_id == l.id)
            )
            enrich = enrich_res.scalar_one_or_none()

            leads_out.append(
                {
                    "id": str(l.id),
                    "tenant_id": tenant.tenant_key,
                    "email": l.email,
                    "company_name": l.company_name,
                    "status": l.status,
                    # null, not an invented 88 or "apollo" — this row hasn't actually been
                    # scored/enriched yet, and the frontend renders that honestly ('--').
                    "lead_score": qual.lead_score if qual else None,
                    "provider_used": enrich.provider_used if enrich else None,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                    "updated_at": l.updated_at.isoformat() if l.updated_at else None,
                }
            )

        return leads_out


@router.get("/{lead_id}", response_model=dict)
async def get_inbound_lead_detail(
    lead_id: str,
    tenant: Tenant = Depends(resolve_tenant),
):
    """Retrieves full detail payload for slide-over detail drawer."""
    try:
        l_uuid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lead_id UUID format")

    async with AsyncSessionLocal() as session:
        # Scoped by tenant, not just id: looking a lead up by UUID alone lets any
        # authenticated caller read another workspace's lead.
        lead_res = await session.execute(
            select(LeadEvent).where(LeadEvent.id == l_uuid, LeadEvent.tenant_id == tenant.id)
        )
        lead = lead_res.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        qual_res = await session.execute(
            select(LLMQualification).where(LLMQualification.lead_source_id == l_uuid)
        )
        qual = qual_res.scalar_one_or_none()

        enrich_res = await session.execute(
            select(EnrichmentResult).where(EnrichmentResult.lead_source_id == l_uuid)
        )
        enrich = enrich_res.scalar_one_or_none()

        crm_res = await session.execute(
            select(CRMSyncRecord).where(CRMSyncRecord.lead_source_id == l_uuid)
        )
        crm_record = crm_res.scalar_one_or_none()

        # Each section is null, not an invented one, when that stage of the pipeline
        # hasn't actually run for this lead yet — the frontend renders that honestly
        # ("Not yet enriched" etc.) instead of showing fabricated data as if it were real.
        return {
            "id": str(lead.id),
            "email": lead.email,
            "company_name": lead.company_name,
            "status": lead.status,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "raw_payload": lead.raw_payload or {},
            "enrichment": {
                "provider_used": enrich.provider_used,
                "fallback_triggered": enrich.fallback_triggered,
                "data": enrich.raw_response,
            }
            if enrich
            else None,
            "qualification": {
                "lead_score": qual.lead_score,
                "fit_reasoning": qual.fit_reasoning,
                "outreach_draft": {
                    "observation_hook": qual.observation_hook,
                    "capability_link": qual.capability_link,
                    "low_friction_ask": qual.low_friction_ask,
                },
                "confidence_score": qual.confidence_score,
            }
            if qual
            else None,
            "crm_sync": {
                "crm_provider": crm_record.crm_provider,
                "crm_record_id": crm_record.crm_record_id,
                "sync_status": crm_record.sync_status,
            }
            if crm_record
            else None,
        }
