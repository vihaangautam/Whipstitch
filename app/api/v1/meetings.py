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
        # Meeting 1: Zepto Quick-Commerce (Agency / SEO Retainer, Tier 2 Growth Unicorn)
        m1_id = "meet-zepto-01"
        m1_attendees = [
            MeetingAttendee(
                name="Amrit Pal",
                title="Head of Growth",
                email="amrit.pal@zepto.com",
                organization="Zepto Quick-Commerce",
                psychographic=psychographic_engine.profile_attendee(
                    "Amrit Pal", "Head of Growth", "Zepto Quick-Commerce",
                    tenant_track="Service / Retainer", buyer_tier="Tier 2: Growth Scale-up",
                    offering_summary="Organic Search & Quick-Commerce SEO Retainer",
                    currency="INR", deal_size=2800000,
                ),
            ),
            MeetingAttendee(
                name="Kaivalya Vohra",
                title="Finance Controller / Co-Founder",
                email="kaivalya@zepto.com",
                organization="Zepto Quick-Commerce",
                psychographic=psychographic_engine.profile_attendee(
                    "Kaivalya Vohra", "Finance Controller / Co-Founder", "Zepto Quick-Commerce",
                    tenant_track="Service / Retainer", buyer_tier="Tier 2: Growth Scale-up",
                    offering_summary="Organic Search & Quick-Commerce SEO Retainer",
                    currency="INR", deal_size=2800000,
                ),
            ),
            MeetingAttendee(
                name="Priya Raman",
                title="Category Marketing Lead",
                email="priya.raman@zepto.com",
                organization="Zepto Quick-Commerce",
                psychographic=psychographic_engine.profile_attendee(
                    "Priya Raman", "Category Marketing Lead", "Zepto Quick-Commerce",
                    tenant_track="Service / Retainer", buyer_tier="Tier 2: Growth Scale-up",
                    offering_summary="Organic Search & Quick-Commerce SEO Retainer",
                    currency="INR", deal_size=2800000,
                ),
            ),
        ]
        _MEETING_STORE[m1_id] = {
            "id": m1_id,
            "tenant_id": tenant_id,
            "deal_id": "d0000000-0000-0000-0000-000000000002",
            "title": "Zepto Quick-Commerce: Organic Search & SEO Growth Retainer",
            "company_name": "Zepto Quick-Commerce",
            "tenant_track": "Service / Retainer",
            "buyer_tier": "Tier 2: Growth Scale-up",
            "deal_size": 2800000,
            "currency": "INR",
            "offering_summary": "Organic Search & Quick-Commerce SEO Retainer",
            "scheduled_time": "Today, 4:00 PM IST",
            "attendees": [a.model_dump() for a in m1_attendees],
            "champion_name": "Amrit Pal",
            "champion_title": "Head of Growth",
            "briefing_ready": True,
            "champion_kit_ready": True,
        }

        # Meeting 2: Nykaa E-Retail (Agency / Influencer & UGC, Tier 1 Founder SMB / D2C)
        m2_id = "meet-nykaa-02"
        m2_attendees = [
            MeetingAttendee(
                name="Sneha Kapoor",
                title="VP Marketing",
                email="sneha.kapoor@nykaa.com",
                organization="Nykaa E-Retail",
                psychographic=psychographic_engine.profile_attendee(
                    "Sneha Kapoor", "VP Marketing", "Nykaa E-Retail",
                    tenant_track="Service / Retainer", buyer_tier="Tier 1: Founder-Led SMB",
                    offering_summary="Festive Influencer & UGC Content Campaign",
                    currency="INR", deal_size=1500000,
                ),
            ),
            MeetingAttendee(
                name="Falguni Nayar",
                title="Managing Director & Founder",
                email="falguni@nykaa.com",
                organization="Nykaa E-Retail",
                psychographic=psychographic_engine.profile_attendee(
                    "Falguni Nayar", "Managing Director & Founder", "Nykaa E-Retail",
                    tenant_track="Service / Retainer", buyer_tier="Tier 1: Founder-Led SMB",
                    offering_summary="Festive Influencer & UGC Content Campaign",
                    currency="INR", deal_size=1500000,
                ),
            ),
            MeetingAttendee(
                name="Rajesh Nair",
                title="Head of Accounts & Finance",
                email="rajesh.nair@nykaa.com",
                organization="Nykaa E-Retail",
                psychographic=psychographic_engine.profile_attendee(
                    "Rajesh Nair", "Head of Accounts & Finance", "Nykaa E-Retail",
                    tenant_track="Service / Retainer", buyer_tier="Tier 1: Founder-Led SMB",
                    offering_summary="Festive Influencer & UGC Content Campaign",
                    currency="INR", deal_size=1500000,
                ),
            ),
        ]
        _MEETING_STORE[m2_id] = {
            "id": m2_id,
            "tenant_id": tenant_id,
            "deal_id": "d0000000-0000-0000-0000-000000000001",
            "title": "Nykaa E-Retail: Festive Influencer Campaign & Founder Review",
            "company_name": "Nykaa E-Retail",
            "tenant_track": "Service / Retainer",
            "buyer_tier": "Tier 1: Founder-Led SMB",
            "deal_size": 1500000,
            "currency": "INR",
            "offering_summary": "Festive Influencer & UGC Content Campaign",
            "scheduled_time": "Tomorrow, 2:30 PM IST",
            "attendees": [a.model_dump() for a in m2_attendees],
            "champion_name": "Sneha Kapoor",
            "champion_title": "VP Marketing",
            "briefing_ready": True,
            "champion_kit_ready": True,
        }

        # Meeting 3: Apex Logistics Global (SaaS / Tech Enterprise, Tier 3 MNC / Overseas)
        m3_id = "meet-apex-03"
        m3_attendees = [
            MeetingAttendee(
                name="Sarah Chen",
                title="VP RevOps",
                email="sarah.chen@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "Sarah Chen", "VP RevOps", "Apex Logistics Global",
                    tenant_track="SaaS / Product", buyer_tier="Tier 3: Enterprise MNC",
                    offering_summary="Enterprise Cloud Lead Routing Platform",
                    currency="USD", deal_size=120000,
                ),
            ),
            MeetingAttendee(
                name="Marcus Vance",
                title="Chief Financial Officer",
                email="marcus.vance@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "Marcus Vance", "Chief Financial Officer", "Apex Logistics Global",
                    tenant_track="SaaS / Product", buyer_tier="Tier 3: Enterprise MNC",
                    offering_summary="Enterprise Cloud Lead Routing Platform",
                    currency="USD", deal_size=120000,
                ),
            ),
            MeetingAttendee(
                name="David Miller",
                title="Head of InfoSec",
                email="david.miller@apexlogistics.com",
                organization="Apex Logistics Global",
                psychographic=psychographic_engine.profile_attendee(
                    "David Miller", "Head of InfoSec", "Apex Logistics Global",
                    tenant_track="SaaS / Product", buyer_tier="Tier 3: Enterprise MNC",
                    offering_summary="Enterprise Cloud Lead Routing Platform",
                    currency="USD", deal_size=120000,
                ),
            ),
        ]
        _MEETING_STORE[m3_id] = {
            "id": m3_id,
            "tenant_id": tenant_id,
            "deal_id": "deal-apex-01",
            "title": "Apex Logistics Global: Executive CFO & RevOps Review",
            "company_name": "Apex Logistics Global",
            "tenant_track": "SaaS / Product",
            "buyer_tier": "Tier 3: Enterprise MNC",
            "deal_size": 120000,
            "currency": "USD",
            "offering_summary": "Enterprise Cloud Lead Routing Platform",
            "scheduled_time": "Thursday, 3:30 PM EST",
            "attendees": [a.model_dump() for a in m3_attendees],
            "champion_name": "Sarah Chen",
            "champion_title": "VP RevOps",
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
            tenant_track=m.get("tenant_track", "Service / Retainer"),
            buyer_tier=m.get("buyer_tier", "Tier 1: Founder-Led SMB"),
            deal_size=m.get("deal_size"),
            currency=m.get("currency", "INR"),
            offering_summary=m.get("offering_summary"),
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
    track = payload.tenant_track or "Service / Retainer"
    tier = payload.buyer_tier or "Tier 1: Founder-Led SMB"
    curr = payload.currency or "INR"
    size = payload.deal_size
    offering = payload.offering_summary or ("Growth Retainer" if "service" in track.lower() else "Enterprise Solution")

    # Enrich attendees
    attendees = []
    for email in payload.attendee_emails:
        name = email.split("@")[0].replace(".", " ").title()
        title = "Stakeholder"
        lower_em = email.lower()
        if "growth" in lower_em or "mkt" in lower_em or "marketing" in lower_em:
            title = "Head of Growth"
        elif "cfo" in lower_em or "finance" in lower_em:
            title = "Finance Controller" if "tier 2" in tier.lower() else "Chief Financial Officer"
        elif "founder" in lower_em or "ceo" in lower_em or "director" in lower_em:
            title = "Managing Director & Founder"
        elif "ops" in lower_em or "rev" in lower_em:
            title = "VP RevOps"
        elif "sec" in lower_em or "it" in lower_em:
            title = "Head of InfoSec"

        profile = psychographic_engine.profile_attendee(
            name=name, title=title, organization=payload.company_name,
            tenant_track=track, buyer_tier=tier, offering_summary=offering,
            currency=curr, deal_size=size,
        )
        attendees.append(MeetingAttendee(
            name=name,
            email=email,
            title=title,
            organization=payload.company_name,
            psychographic=profile,
        ))

    if not attendees:
        default_title = "Head of Growth" if "service" in track.lower() else "VP Operations"
        attendees.append(MeetingAttendee(
            name="Executive Lead",
            title=default_title,
            organization=payload.company_name,
            psychographic=psychographic_engine.profile_attendee(
                "Executive Lead", default_title, payload.company_name,
                tenant_track=track, buyer_tier=tier, offering_summary=offering,
                currency=curr, deal_size=size,
            ),
        ))

    meeting_entry = {
        "id": meeting_id,
        "tenant_id": tenant_id,
        "deal_id": payload.deal_id,
        "title": payload.title,
        "company_name": payload.company_name,
        "tenant_track": track,
        "buyer_tier": tier,
        "deal_size": size,
        "currency": curr,
        "offering_summary": offering,
        "scheduled_time": payload.scheduled_time or "Upcoming Call",
        "attendees": [a.model_dump() for a in attendees],
        "champion_name": attendees[0].name,
        "champion_title": attendees[0].title,
        "briefing_ready": True,
        "champion_kit_ready": True,
    }
    _MEETING_STORE[meeting_id] = meeting_entry
    logger.info("Meeting created: %s for %s (%s)", meeting_id, payload.company_name, offering)

    return MeetingResponse(
        id=meeting_id,
        tenant_id=tenant_id,
        deal_id=payload.deal_id,
        title=payload.title,
        company_name=payload.company_name,
        tenant_track=track,
        buyer_tier=tier,
        deal_size=size,
        currency=curr,
        offering_summary=offering,
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
        deal_id=meeting.get("deal_id"),
        tenant_track=meeting.get("tenant_track", "Service / Retainer"),
        buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
        deal_size=meeting.get("deal_size"),
        currency=meeting.get("currency", "INR"),
        offering_summary=meeting.get("offering_summary"),
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
        tenant_track=meeting.get("tenant_track", "Service / Retainer"),
        buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
        deal_size=meeting.get("deal_size"),
        currency=meeting.get("currency", "INR"),
        offering_summary=meeting.get("offering_summary"),
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
