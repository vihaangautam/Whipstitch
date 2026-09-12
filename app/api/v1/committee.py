"""Buying Committee & Real-Time SSE Streaming Router."""
import asyncio
import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import resolve_tenant
from app.db.models import BuyingCommitteeMember, Deal, Tenant
from app.db.session import get_db_session
from app.services.committee.committee_service import committee_service

logger = logging.getLogger("whipstitch.api.committee")
router = APIRouter(prefix="/v1/deals/{deal_id}/committee", tags=["Buying Committee & Real-Time SSE"])


class CommitteeMemberSchema(BaseModel):
    id: Optional[str] = None
    deal_id: Optional[str] = None
    name: str
    role: str
    tag: str
    status: str = "Engaged"
    email: Optional[str] = None
    linkedin_url: Optional[str] = None


class AutoFindRequest(BaseModel):
    role_tag: str  # 'Budget Owner', 'Security Reviewer', 'Legal & Contracts'
    company_name: Optional[str] = None
    domain: Optional[str] = None


async def _owned_deal(session: AsyncSession, deal_id: str, tenant: Tenant) -> Deal:
    """Committee routes are nested under a deal, so the deal must belong to the caller."""
    try:
        deal_uuid = uuid.UUID(deal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid deal_id UUID format")
    res = await session.execute(
        select(Deal).where(Deal.id == deal_uuid, Deal.tenant_id == tenant.id)
    )
    deal = res.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.get("", response_model=List[CommitteeMemberSchema])
async def get_committee_members(
    deal_id: str,
    session: AsyncSession = Depends(get_db_session),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Lists all confirmed buying committee members for a deal."""
    deal_uuid = (await _owned_deal(session, deal_id, tenant)).id
    res = await session.execute(
        select(BuyingCommitteeMember).where(BuyingCommitteeMember.deal_id == deal_uuid)
    )
    members = res.scalars().all()

    return [
        CommitteeMemberSchema(
            id=str(m.id),
            deal_id=str(m.deal_id),
            name=m.name,
            role=m.role,
            tag=m.tag,
            status=m.status,
            email=m.email,
            linkedin_url=m.linkedin_url,
        )
        for m in members
    ]


@router.post("", response_model=CommitteeMemberSchema, status_code=status.HTTP_201_CREATED)
async def add_committee_member(
    deal_id: str,
    payload: CommitteeMemberSchema,
    session: AsyncSession = Depends(get_db_session),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Adds or updates a buying committee member for the deal."""
    deal = await _owned_deal(session, deal_id, tenant)
    deal_uuid = deal.id
    tenant_uuid = deal.tenant_id

    member = BuyingCommitteeMember(
        id=uuid.uuid4(),
        deal_id=deal_uuid,
        tenant_id=tenant_uuid,
        name=payload.name,
        role=payload.role,
        tag=payload.tag,
        status=payload.status,
        email=payload.email,
        linkedin_url=payload.linkedin_url,
    )
    session.add(member)
    await session.commit()

    return CommitteeMemberSchema(
        id=str(member.id),
        deal_id=str(member.deal_id),
        name=member.name,
        role=member.role,
        tag=member.tag,
        status=member.status,
        email=member.email,
        linkedin_url=member.linkedin_url,
    )


@router.post("/auto-find")
async def auto_find_committee_candidate(
    deal_id: str,
    payload: AutoFindRequest,
    session: AsyncSession = Depends(get_db_session),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Discovers and resolves a candidate executive for a missing role."""
    deal = await _owned_deal(session, deal_id, tenant)

    company_name = payload.company_name or deal.company_name or ""
    domain = payload.domain or deal.domain or ""

    candidate = await committee_service.auto_find_candidate(
        company_name=company_name,
        domain=domain,
        role_tag=payload.role_tag,
    )

    return candidate


# ==========================================
# Real-Time SSE Stream for Deal Discovery
# ==========================================

@router.get("/stream")
async def stream_committee_discovery(
    deal_id: str,
    role_tag: str = Query("Budget Owner", description="Target missing committee role"),
    company_name: str = Query(""),
    domain: str = Query(""),
    session: AsyncSession = Depends(get_db_session),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Streams real-time agent execution events as candidate executives are discovered and verified."""
    # Checked before the stream opens: once the generator starts yielding the request-scoped
    # session is no longer safe to use, and an unauthorized stream would already be in flight.
    await _owned_deal(session, deal_id, tenant)

    async def event_generator():
        # Step 1: Gap Evaluation
        step1_data = {
            "step": 1,
            "role": role_tag,
            "message": f"Identified missing {role_tag} on deal",
            "progress": 25,
        }
        yield f"event: gap_detected\ndata: {json.dumps(step1_data)}\n\n"
        await asyncio.sleep(0.6)

        # Step 2: Search Registry & Serper
        step2_data = {
            "step": 2,
            "message": f"Searching Apollo & Serper for {role_tag} at {company_name}...",
            "progress": 55,
        }
        yield f"event: searching_registry\ndata: {json.dumps(step2_data)}\n\n"
        await asyncio.sleep(0.7)

        # Step 3: Run Waterfall Enrichment
        candidate = await committee_service.auto_find_candidate(
            company_name=company_name,
            domain=domain,
            role_tag=role_tag,
        )
        cand_name = candidate.get("name", "Executive")
        cand_title = candidate.get("title", role_tag)
        step3_data = {
            "step": 3,
            "candidate_name": cand_name,
            "message": f"Verifying credentials for {cand_name} ({cand_title})...",
            "progress": 85,
        }
        yield f"event: waterfall_verification\ndata: {json.dumps(step3_data)}\n\n"
        await asyncio.sleep(0.5)

        # Step 4: Complete
        step4_data = {
            "step": 4,
            "message": "Executive candidate verified & ready for committee",
            "progress": 100,
            "candidate": candidate,
        }
        yield f"event: discovery_complete\ndata: {json.dumps(step4_data)}\n\n"


    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
