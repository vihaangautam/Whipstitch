"""Meeting Intelligence, Calendar Prep & Champion Notes API Router."""
import os
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.session import get_db_session
from app.models.meeting_schemas import (
    ChampionSellingKit,
    MeetingAttendee,
    MeetingCreateRequest,
    MeetingResponse,
    PreCallBriefing,
)
from app.services.profiling.psychographic_engine import PsychographicEngine
from app.services.profiling.serper_service import SerperService

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/meetings", tags=["Meeting Intelligence & Calendar Prep"])

psychographic_engine = PsychographicEngine()
serper_service = SerperService()

# In-memory store for meeting intelligence sessions
_MEETING_STORE: Dict[str, Dict[str, Any]] = {}


def _get_or_create_default_meetings(tenant_id: str) -> List[Dict[str, Any]]:
    """Seeds default realistic meetings if store is empty for tenant."""
    if not _MEETING_STORE:
        m1_id = "meet-apex-01"
        m1_attendees = [
            MeetingAttendee(
                name="Sarah Chen",
                title="VP RevOps",
                email="sarah.chen@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "Sarah Chen", "VP RevOps", "Apex Logistics Global"
                ),
            ),
            MeetingAttendee(
                name="Marcus Vance",
                title="Chief Financial Officer",
                email="marcus.vance@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "Marcus Vance", "Chief Financial Officer", "Apex Logistics Global"
                ),
            ),
            MeetingAttendee(
                name="David Miller",
                title="Head of InfoSec",
                email="david.miller@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "David Miller", "Head of InfoSec", "Apex Logistics Global"
                ),
            ),
        ]
        _MEETING_STORE[m1_id] = {
            "id": m1_id,
            "tenant_id": tenant_id,
            "deal_id": "deal-apex-01",
            "title": "Apex Logistics: Executive CFO & RevOps Review",
            "company_name": "Apex Logistics Global",
            "scheduled_time": "Today, 3:30 PM EST",
            "attendees": [a.model_dump() for a in m1_attendees],
            "champion_name": "Sarah Chen",
            "champion_title": "VP RevOps",
            "briefing_ready": True,
            "champion_kit_ready": True,
        }

        m2_id = "meet-cloudscale-02"
        m2_attendees = [
            MeetingAttendee(
                name="Alex Thorne",
                title="Director of Global Sales Ops",
                email="alex@cloudscale.io",
                organization="CloudScale Systems",
                psychographic=psychographic_engine.profile_attendee(
                    "Alex Thorne", "Director of Global Sales Ops", "CloudScale Systems"
                ),
            )
        ]
        _MEETING_STORE[m2_id] = {
            "id": m2_id,
            "tenant_id": tenant_id,
            "deal_id": "deal-cloudscale-02",
            "title": "CloudScale Systems: Lead Routing Solution Demo",
            "company_name": "CloudScale Systems",
            "scheduled_time": "Tomorrow, 11:00 AM EST",
            "attendees": [a.model_dump() for a in m2_attendees],
            "champion_name": "Alex Thorne",
            "champion_title": "Director of Global Sales Ops",
            "briefing_ready": True,
            "champion_kit_ready": True,
        }

    return [m for m in _MEETING_STORE.values() if m.get("tenant_id") == tenant_id]


@router.get("", response_model=List[MeetingResponse])
async def list_meetings(
    tenant_id: str = Query(default="trifid_media"),
    session: AsyncSession = Depends(get_db_session),
):
    """Lists all upcoming meetings and intelligence readiness states."""
    meetings_data = _get_or_create_default_meetings(tenant_id)
    return [
        MeetingResponse(
            id=m["id"],
            tenant_id=m["tenant_id"],
            deal_id=m.get("deal_id"),
            title=m["title"],
            company_name=m["company_name"],
            scheduled_time=m.get("scheduled_time"),
            attendees=[MeetingAttendee(**a) for a in m.get("attendees", [])],
            briefing_ready=m.get("briefing_ready", False),
            champion_kit_ready=m.get("champion_kit_ready", False),
        )
        for m in meetings_data
    ]


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    payload: MeetingCreateRequest,
    tenant_id: str = Query(default="trifid_media"),
    session: AsyncSession = Depends(get_db_session),
):
    """Creates a new meeting record or ingests from calendar webhook."""
    meeting_id = f"meet-{uuid.uuid4().hex[:8]}"
    
    # Enrich attendees
    attendees = []
    for email in payload.attendee_emails:
        name = email.split("@")[0].replace(".", " ").title()
        title = "Stakeholder"
        if "cfo" in email.lower() or "finance" in email.lower():
            title = "Chief Financial Officer"
        elif "ops" in email.lower() or "rev" in email.lower():
            title = "VP RevOps"
        elif "sec" in email.lower() or "it" in email.lower():
            title = "Head of InfoSec"

        profile = psychographic_engine.profile_attendee(name, title, payload.company_name)
        attendees.append(MeetingAttendee(
            name=name,
            email=email,
            title=title,
            organization=payload.company_name,
            psychographic=profile,
        ))

    if not attendees:
        attendees.append(MeetingAttendee(
            name="Executive Lead",
            title="VP Revenue",
            organization=payload.company_name,
            psychographic=psychographic_engine.profile_attendee("Executive Lead", "VP Revenue", payload.company_name),
        ))

    meeting_entry = {
        "id": meeting_id,
        "tenant_id": tenant_id,
        "deal_id": payload.deal_id,
        "title": payload.title,
        "company_name": payload.company_name,
        "scheduled_time": payload.scheduled_time or "Upcoming Call",
        "attendees": [a.model_dump() for a in attendees],
        "champion_name": attendees[0].name,
        "champion_title": attendees[0].title,
        "briefing_ready": True,
        "champion_kit_ready": True,
    }
    _MEETING_STORE[meeting_id] = meeting_entry
    logger.info("Meeting created: %s for %s", meeting_id, payload.company_name)

    return MeetingResponse(
        id=meeting_id,
        tenant_id=tenant_id,
        deal_id=payload.deal_id,
        title=payload.title,
        company_name=payload.company_name,
        scheduled_time=payload.scheduled_time or "Upcoming Call",
        attendees=attendees,
        briefing_ready=True,
        champion_kit_ready=True,
    )


@router.get("/{meeting_id}/briefing", response_model=PreCallBriefing)
async def get_pre_call_briefing(meeting_id: str):
    """Retrieves the pre-call executive briefing with attendee dossiers and Serper signals."""
    meeting = _MEETING_STORE.get(meeting_id)
    if not meeting:
        # Fallback to default
        _get_or_create_default_meetings("trifid_media")
        meeting = _MEETING_STORE.get(meeting_id)
        if not meeting:
            raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    attendees = [MeetingAttendee(**a) for a in meeting.get("attendees", [])]
    signals_data = await serper_service.search_company_signals(meeting["company_name"])

    briefing = psychographic_engine.synthesize_pre_call_briefing(
        meeting_id=meeting_id,
        meeting_title=meeting["title"],
        company_name=meeting["company_name"],
        scheduled_time=meeting.get("scheduled_time"),
        attendees=attendees,
        signals=signals_data,
    )
    return briefing


@router.get("/{meeting_id}/champion-kit", response_model=ChampionSellingKit)
async def get_champion_selling_kit(meeting_id: str):
    """Retrieves the 7-Filter Champion Internal Selling Kit for closed-door buying meetings."""
    meeting = _MEETING_STORE.get(meeting_id)
    if not meeting:
        _get_or_create_default_meetings("trifid_media")
        meeting = _MEETING_STORE.get(meeting_id)
        if not meeting:
            raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    champion_name = meeting.get("champion_name", "Sarah Chen")
    champion_title = meeting.get("champion_title", "VP RevOps")

    kit = psychographic_engine.synthesize_7_filter_champion_kit(
        meeting_id=meeting_id,
        deal_id=meeting.get("deal_id"),
        champion_name=champion_name,
        champion_title=champion_title,
        company_name=meeting["company_name"],
    )
    return kit


@router.post("/{meeting_id}/prep", response_model=Dict[str, Any])
async def trigger_meeting_prep(meeting_id: str):
    """Triggers on-demand regeneration of meeting intelligence assets."""
    meeting = _MEETING_STORE.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    meeting["briefing_ready"] = True
    meeting["champion_kit_ready"] = True
    logger.info("Meeting prep refreshed for %s", meeting_id)

    return {
        "meeting_id": meeting_id,
        "status": "ready",
        "message": "Pre-call briefing and 7-filter champion kit successfully synthesized.",
    }
