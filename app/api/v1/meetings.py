"""Meeting Intelligence, Calendar Prep & Champion Notes API — tenant-scoped, DB-backed."""
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.logging import get_logger
from app.db.models import Meeting, Tenant
from app.db.session import AsyncSessionLocal
from app.models.meeting_schemas import (
    ChampionSellingKit,
    CompanySignal,
    MeetingAttendee,
    MeetingCreateRequest,
    MeetingResponse,
    PreCallBriefing,
)
from app.services.profiling.ai_meeting_prep import build_champion_kit, build_pre_call_briefing
from app.services.profiling.psychographic_engine import PsychographicEngine
from app.services.profiling.serper_service import SerperService

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/meetings", tags=["Meeting Intelligence & Calendar Prep"])

psychographic_engine = PsychographicEngine()
serper_service = SerperService()


def _meeting_dict(m: Meeting) -> dict:
    return {
        "id": str(m.id),
        "tenant_id": str(m.tenant_id),
        "deal_id": str(m.deal_id) if m.deal_id else None,
        "title": m.title,
        "company_name": m.company_name,
        "tenant_track": m.tenant_track,
        "buyer_tier": m.buyer_tier,
        "deal_size": m.deal_size,
        "currency": m.currency,
        "offering_summary": m.offering_summary,
        "scheduled_time": m.scheduled_time,
    }


async def _tenant_uuid(tenant_key: str) -> Optional[uuid.UUID]:
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        t = res.scalar_one_or_none()
        return t.id if t else None


async def _get_meeting(meeting_id: str) -> Meeting:
    try:
        m_uuid = uuid.UUID(meeting_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Meeting not found")
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Meeting).where(Meeting.id == m_uuid))
        meeting = res.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    return meeting


def _to_response(m: Meeting) -> MeetingResponse:
    return MeetingResponse(
        id=str(m.id),
        tenant_id=str(m.tenant_id),
        deal_id=str(m.deal_id) if m.deal_id else None,
        title=m.title,
        company_name=m.company_name,
        tenant_track=m.tenant_track,
        buyer_tier=m.buyer_tier,
        deal_size=m.deal_size,
        currency=m.currency,
        offering_summary=m.offering_summary,
        scheduled_time=m.scheduled_time,
        attendees=[MeetingAttendee(**a) for a in (m.attendees_json or [])],
        briefing_ready=m.briefing_json is not None,
        champion_kit_ready=m.champion_kit_json is not None,
        created_at=m.created_at.isoformat() if m.created_at else None,
    )


@router.get("", response_model=List[MeetingResponse])
async def list_meetings(tenant_id: str = Query(default="trifid_media")):
    """Lists the tenant's meetings. Empty until the rep schedules one."""
    t_uuid = await _tenant_uuid(tenant_id)
    if not t_uuid:
        return []
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(Meeting).where(Meeting.tenant_id == t_uuid).order_by(Meeting.created_at.desc())
        )
        return [_to_response(m) for m in res.scalars().all()]


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(payload: MeetingCreateRequest, tenant_id: str = Query(default="trifid_media")):
    """Creates a real meeting from rep-entered prospect details and resolves attendee profiles."""
    t_uuid = await _tenant_uuid(tenant_id)
    if not t_uuid:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_id}' not found")

    track = payload.tenant_track or "Service / Retainer"
    tier = payload.buyer_tier or "Tier 1: Founder-Led SMB"
    curr = payload.currency or "INR"
    offering = payload.offering_summary or ("Growth Retainer" if "service" in track.lower() else "Enterprise Solution")

    attendees: List[MeetingAttendee] = []
    for email in payload.attendee_emails:
        name = email.split("@")[0].replace(".", " ").replace("_", " ").title()
        lower = email.lower()
        title = "Stakeholder"
        if any(k in lower for k in ("growth", "marketing", "mkt")):
            title = "Head of Growth"
        elif any(k in lower for k in ("cfo", "finance")):
            title = "Finance Controller" if "tier 2" in tier.lower() else "Chief Financial Officer"
        elif any(k in lower for k in ("founder", "ceo", "director")):
            title = "Managing Director & Founder"
        elif any(k in lower for k in ("ops", "rev")):
            title = "VP RevOps"
        elif any(k in lower for k in ("sec", "infosec", "it")):
            title = "Head of InfoSec"
        attendees.append(
            MeetingAttendee(
                name=name,
                email=email,
                title=title,
                organization=payload.company_name,
                psychographic=psychographic_engine.profile_attendee(
                    name=name, title=title, organization=payload.company_name,
                    tenant_track=track, buyer_tier=tier, offering_summary=offering,
                    currency=curr, deal_size=payload.deal_size,
                ),
            )
        )

    if not attendees:
        default_title = "Head of Growth" if "service" in track.lower() else "VP Operations"
        attendees.append(
            MeetingAttendee(
                name="Executive Lead", title=default_title, organization=payload.company_name,
                psychographic=psychographic_engine.profile_attendee(
                    "Executive Lead", default_title, payload.company_name,
                    tenant_track=track, buyer_tier=tier, offering_summary=offering,
                    currency=curr, deal_size=payload.deal_size,
                ),
            )
        )

    deal_uuid = None
    if payload.deal_id:
        try:
            deal_uuid = uuid.UUID(payload.deal_id)
        except ValueError:
            deal_uuid = None

    meeting = Meeting(
        id=uuid.uuid4(),
        tenant_id=t_uuid,
        deal_id=deal_uuid,
        title=payload.title,
        company_name=payload.company_name,
        tenant_track=track,
        buyer_tier=tier,
        deal_size=payload.deal_size,
        currency=curr,
        offering_summary=offering,
        scheduled_time=payload.scheduled_time or "Upcoming Call",
        objective=payload.objective,
        attendees_json=[a.model_dump() for a in attendees],
        champion_name=attendees[0].name,
        champion_title=attendees[0].title,
    )
    async with AsyncSessionLocal() as session:
        session.add(meeting)
        await session.commit()
        await session.refresh(meeting)

    logger.info("meeting_created", meeting_id=str(meeting.id), company=payload.company_name)
    return _to_response(meeting)


async def _cache_meeting_field(meeting_id: uuid.UUID, field: str, payload: dict):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Meeting).where(Meeting.id == meeting_id))
        row = res.scalar_one_or_none()
        if row:
            setattr(row, field, payload)
            await session.commit()


@router.get("/{meeting_id}/briefing", response_model=PreCallBriefing)
async def get_pre_call_briefing(meeting_id: str):
    """AI pre-call briefing grounded in the meeting's real attendees + live Serper signals."""
    meeting = await _get_meeting(meeting_id)
    attendees = [MeetingAttendee(**a) for a in (meeting.attendees_json or [])]
    signals_data = await serper_service.search_company_signals(meeting.company_name)
    signals = [
        s if isinstance(s, CompanySignal) else CompanySignal(**s)
        for s in signals_data
    ] if signals_data else []

    briefing = await build_pre_call_briefing(
        tenant_id=str(meeting.tenant_id),
        meeting=_meeting_dict(meeting),
        attendees=attendees,
        signals=signals,
    )
    await _cache_meeting_field(meeting.id, "briefing_json", briefing.model_dump())
    return briefing


@router.get("/{meeting_id}/champion-kit", response_model=ChampionSellingKit)
async def get_champion_selling_kit(meeting_id: str):
    """AI 7-filter champion internal-selling kit for this meeting."""
    meeting = await _get_meeting(meeting_id)
    kit = await build_champion_kit(
        tenant_id=str(meeting.tenant_id),
        meeting=_meeting_dict(meeting),
        champion_name=meeting.champion_name or "Champion",
        champion_title=meeting.champion_title or "Stakeholder",
    )
    await _cache_meeting_field(meeting.id, "champion_kit_json", kit.model_dump())
    return kit


@router.post("/{meeting_id}/prep")
async def trigger_meeting_prep(meeting_id: str):
    """Regenerates briefing + champion kit. Uses the Temporal MeetingPrepWorkflow when a
    worker is reachable, otherwise runs the same activities inline."""
    await _get_meeting(meeting_id)  # 404 early if missing

    try:
        from temporalio.client import Client
        from app.core.config import settings

        client = await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE)
        await client.start_workflow(
            "MeetingPrepWorkflow",
            {"meeting_id": meeting_id},
            id=f"meeting-prep-{meeting_id}",
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
        logger.info("meeting_prep_workflow_started", meeting_id=meeting_id)
        return {"meeting_id": meeting_id, "status": "scheduled", "message": "Meeting prep workflow started."}
    except Exception as e:
        logger.warning("temporal_unavailable_running_meeting_prep_inline", error=str(e))

    await get_pre_call_briefing(meeting_id)
    await get_champion_selling_kit(meeting_id)
    return {
        "meeting_id": meeting_id,
        "status": "ready",
        "message": "Pre-call briefing and 7-filter champion kit synthesised.",
    }
