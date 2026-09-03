"""Temporal activities for Meeting Intelligence, Calendar Prep & 7-Filter Champion Notes."""
import logging
from typing import Any, Dict, List, Optional
from temporalio import activity

from app.models.meeting_schemas import (
    CompanySignal,
    MeetingAttendee,
)
from app.services.profiling.psychographic_engine import PsychographicEngine
from app.services.profiling.serper_service import SerperService

logger = logging.getLogger("whipstitch.meeting_activities")
psychographic_engine = PsychographicEngine()
serper_service = SerperService()


@activity.defn(name="profile_meeting_attendees_activity")
async def profile_meeting_attendees_activity(
    attendees_raw: List[Dict[str, Any]],
    company_name: str,
) -> List[Dict[str, Any]]:
    """Enriches each meeting attendee with psychographic focus areas, hooks, and icebreakers."""
    logger.info("Profiling %d attendees for %s", len(attendees_raw), company_name)
    enriched_attendees = []

    for att in attendees_raw:
        name = att.get("name", "Stakeholder")
        title = att.get("title", "Executive")
        org = att.get("organization") or company_name
        email = att.get("email")
        linkedin = att.get("linkedin_url")

        profile = psychographic_engine.profile_attendee(
            name=name,
            title=title,
            organization=org,
            context=att.get("context"),
        )

        attendee_obj = MeetingAttendee(
            name=name,
            email=email,
            title=title,
            organization=org,
            linkedin_url=linkedin,
            psychographic=profile,
        )
        enriched_attendees.append(attendee_obj.model_dump())

    return enriched_attendees


@activity.defn(name="fetch_company_signals_activity")
async def fetch_company_signals_activity(company_name: str) -> List[Dict[str, str]]:
    """Queries Google Serper for active business signals, news, and hiring updates."""
    logger.info("Fetching Serper company signals for %s", company_name)
    signals = await serper_service.search_company_signals(company_name)
    return signals


@activity.defn(name="generate_pre_call_briefing_activity")
async def generate_pre_call_briefing_activity(
    meeting_id: str,
    meeting_title: str,
    company_name: str,
    scheduled_time: Optional[str],
    enriched_attendees_data: List[Dict[str, Any]],
    signals_data: List[Dict[str, str]],
    deal_gaps: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Synthesizes attendee profiles and company signals into an executive pre-call briefing."""
    attendees = [MeetingAttendee(**a) for a in enriched_attendees_data]
    signals = [CompanySignal(**s) for s in signals_data]

    briefing = psychographic_engine.synthesize_pre_call_briefing(
        meeting_id=meeting_id,
        meeting_title=meeting_title,
        company_name=company_name,
        scheduled_time=scheduled_time,
        attendees=attendees,
        signals=signals,
        deal_gaps=deal_gaps,
    )
    return briefing.model_dump()


@activity.defn(name="generate_champion_selling_kit_activity")
async def generate_champion_selling_kit_activity(
    meeting_id: str,
    deal_id: Optional[str],
    champion_name: str,
    champion_title: str,
    company_name: str,
) -> Dict[str, Any]:
    """Generates the 7-filter champion internal selling kit."""
    logger.info("Generating 7-filter champion kit for %s at %s", champion_name, company_name)
    kit = psychographic_engine.synthesize_7_filter_champion_kit(
        meeting_id=meeting_id,
        deal_id=deal_id,
        champion_name=champion_name,
        champion_title=champion_title,
        company_name=company_name,
    )
    return kit.model_dump()
