import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from temporalio.client import Client

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import CRMSyncRecord, OutboundProspect, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import (
    ApproveProspectRequest,
    ApproveProspectResponse,
    OutboundProspectResponse,
    TriggerOutboundRequest,
    TriggerOutboundResponse,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/outbound", tags=["Outbound Prospecting"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)):
    if not api_key or api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key header",
        )
    return api_key


@router.post("/trigger", response_model=TriggerOutboundResponse)
async def trigger_outbound_prospecting(
    payload: TriggerOutboundRequest,
    api_key: str = Security(verify_api_key),
):
    """Triggers signal-based outbound prospecting workflow for a tenant."""
    logger.info("outbound_prospecting_triggered", tenant_id=payload.tenant_id, batch_size=payload.batch_size)

    # Validate tenant
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Tenant).where(Tenant.tenant_key == payload.tenant_id))
        tenant = res.scalar_one_or_none()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{payload.tenant_id}' not found",
            )

    workflow_id = f"outbound-wf-{payload.tenant_id}-{uuid.uuid4().hex[:8]}"

    try:
        temporal_client = await Client.connect(settings.TEMPORAL_HOST)
        await temporal_client.start_workflow(
            "OutboundProspectingWorkflow",
            args=[payload.tenant_id, payload.batch_size],
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
        logger.info("outbound_workflow_started", workflow_id=workflow_id)
    except Exception as e:
        logger.warning("temporal_connection_warning_offline_running_direct", error=str(e))
        from app.activities.outbound_activity import (
            discover_decision_maker_activity,
            discover_prospects_activity,
            disqualify_prospect_gate_activity,
            qualify_outbound_prospect_activity,
            research_prospect_activity,
            stage_prospect_in_crm_activity,
        )

        try:
            discovered = await discover_prospects_activity(payload.tenant_id, payload.batch_size)
            for p in discovered:
                p_id = p["prospect_id"]
                c_name = p["company_name"]
                dom = p["domain"]
                icp_res = await disqualify_prospect_gate_activity(p_id, c_name, dom)
                if not icp_res.get("is_viable_prospect", True):
                    continue
                dm_res = await discover_decision_maker_activity(
                    p_id, c_name, dom, ["Head of Marketing", "Founder", "VP Growth"]
                )
                res_data = await research_prospect_activity(
                    p_id, c_name, dom, "ugc creator marketing roas product features"
                )
                qual_data = await qualify_outbound_prospect_activity(
                    p_id, payload.tenant_id, c_name, dom, res_data
                )
                prospect_dict = {
                    "prospect_id": p_id,
                    "company_name": c_name,
                    "domain": dom,
                    "decision_maker": dm_res,
                }
                await stage_prospect_in_crm_activity(
                    p_id, payload.tenant_id, prospect_dict, qual_data
                )
        except Exception as act_err:
            logger.error("outbound_direct_fallback_error", error=str(act_err))

    return TriggerOutboundResponse(
        workflow_id=workflow_id,
        status="triggered",
        prospects_targeted=payload.batch_size,
        message=f"Outbound prospecting workflow successfully initiated for tenant '{payload.tenant_id}'",
    )


@router.get("/prospects", response_model=List[OutboundProspectResponse])
async def list_outbound_prospects(
    tenant_id: str = "trifid_media",
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    api_key: str = Security(verify_api_key),
):
    """Retrieves paginated outbound prospects for review/approval."""
    async with AsyncSessionLocal() as session:
        tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
        tenant = tenant_res.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        query = select(OutboundProspect).where(OutboundProspect.tenant_id == tenant.id)
        if status_filter:
            query = query.where(OutboundProspect.scrape_status == status_filter)

        query = query.order_by(OutboundProspect.created_at.desc()).limit(limit).offset(offset)
        result = await session.execute(query)
        prospects = result.scalars().all()

        return [
            OutboundProspectResponse(
                id=str(p.id),
                tenant_id=tenant_id,
                company_name=p.company_name,
                domain=p.domain,
                industry=p.industry,
                scrape_status=p.scrape_status,
                disqualification_reason=p.disqualification_reason,
                decision_maker_name=p.decision_maker_name,
                decision_maker_title=p.decision_maker_title,
                decision_maker_linkedin=p.decision_maker_linkedin,
                signals_json=p.signals_json or {},
                fit_markdown=p.fit_markdown,
                created_at=p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
                updated_at=p.updated_at.isoformat() if p.updated_at else datetime.now(timezone.utc).isoformat(),

            )
            for p in prospects
        ]


@router.post("/prospects/{prospect_id}/approve", response_model=ApproveProspectResponse)
async def approve_or_reject_prospect(
    prospect_id: str,
    payload: ApproveProspectRequest,
    api_key: str = Security(verify_api_key),
):
    """Human-in-the-loop: Approve or Reject a staged prospect."""
    try:
        p_uuid = uuid.UUID(prospect_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid prospect_id UUID")

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(OutboundProspect).where(OutboundProspect.id == p_uuid))
        prospect = res.scalar_one_or_none()
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")

        new_status = "approved" if payload.action == "approve" else "rejected"
        prospect.scrape_status = new_status
        if payload.action == "reject" and payload.rejection_reason:
            prospect.disqualification_reason = payload.rejection_reason
        prospect.updated_at = datetime.now(timezone.utc)

        # Update CRM record status
        crm_res = await session.execute(
            select(CRMSyncRecord).where(CRMSyncRecord.lead_source_id == p_uuid)
        )
        crm_record = crm_res.scalar_one_or_none()
        if crm_record:
            crm_record.sync_status = new_status

        await session.commit()

    logger.info("prospect_approval_action", prospect_id=prospect_id, action=payload.action)
    return ApproveProspectResponse(
        prospect_id=prospect_id,
        status=new_status,
        message=f"Prospect '{prospect.company_name}' successfully {new_status}.",
    )
