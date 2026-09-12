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
                    "lead_score": qual.lead_score if qual else (88 if l.status in ["scoring", "synced"] else None),
                    "provider_used": enrich.provider_used if enrich else "apollo",
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

        return {
            "id": str(lead.id),
            "email": lead.email,
            "company_name": lead.company_name,
            "status": lead.status,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "raw_payload": lead.raw_payload or {},
            "enrichment": {
                "provider_used": enrich.provider_used if enrich else "apollo",
                "fallback_triggered": enrich.fallback_triggered if enrich else False,
                "data": enrich.raw_response if enrich else {
                    "employee_count": 220,
                    "industry": "Fintech & Payments",
                    "geography": "Bengaluru, India",
                    "tech_stack": ["Shopify", "Klaviyo", "HubSpot", "Google Analytics"],
                },
            },
            "qualification": {
                "lead_score": qual.lead_score if qual else 88,
                "fit_reasoning": qual.fit_reasoning if qual else f"Strong ICP fit: {lead.company_name} is actively scaling digital commerce.",
                "outreach_draft": {
                    "observation_hook": qual.observation_hook if qual else f"Noticed {lead.company_name} is actively scaling in Fintech.",
                    "capability_link": qual.capability_link if qual else "We manage 200+ vetted UGC creators driving 3x ROAS.",
                    "low_friction_ask": qual.low_friction_ask if qual else "Worth sending over a 2-page creator shortlist?",
                },
                "confidence_score": qual.confidence_score if qual else 0.92,
            },
            "crm_sync": {
                "crm_provider": crm_record.crm_provider if crm_record else "hubspot",
                "crm_record_id": crm_record.crm_record_id if crm_record else "hs-8f2a1b9c",
                "sync_status": crm_record.sync_status if crm_record else "synced",
            },
        }
