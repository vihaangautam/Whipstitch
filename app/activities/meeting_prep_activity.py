"""Temporal activities for Meeting Intelligence: AI pre-call briefing + 7-filter champion kit."""
import logging
import uuid
from typing import Any, Dict, Optional

from sqlalchemy import select
from temporalio import activity

from app.db.models import Meeting
from app.db.session import AsyncSessionLocal
from app.models.meeting_schemas import CompanySignal, MeetingAttendee
from app.services.profiling.ai_meeting_prep import build_champion_kit, build_pre_call_briefing
from app.services.profiling.serper_service import SerperService

logger = logging.getLogger("whipstitch.meeting_activities")
serper_service = SerperService()


async def _load_meeting(meeting_id: str) -> Optional[Meeting]:
    try:
        m_uuid = uuid.UUID(meeting_id)
    except ValueError:
        return None
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Meeting).where(Meeting.id == m_uuid))
        return res.scalar_one_or_none()


def _dict(m: Meeting) -> Dict[str, Any]:
    return {
        "id": str(m.id), "tenant_id": str(m.tenant_id),
        "deal_id": str(m.deal_id) if m.deal_id else None,
        "title": m.title, "company_name": m.company_name,
        "tenant_track": m.tenant_track, "buyer_tier": m.buyer_tier,
        "deal_size": m.deal_size, "currency": m.currency,
        "offering_summary": m.offering_summary, "scheduled_time": m.scheduled_time,
    }


@activity.defn(name="build_meeting_briefing_activity")
async def build_meeting_briefing_activity(meeting_id: str) -> Dict[str, Any]:
    """Fetches live company signals and synthesises the AI pre-call briefing, caching it."""
    meeting = await _load_meeting(meeting_id)
    if not meeting:
        raise ValueError(f"meeting {meeting_id} not found")

    attendees = [MeetingAttendee(**a) for a in (meeting.attendees_json or [])]
    raw_signals = await serper_service.search_company_signals(meeting.company_name)
    signals = [CompanySignal(**s) for s in raw_signals] if raw_signals else []

    briefing = await build_pre_call_briefing(
        tenant_id=str(meeting.tenant_id), meeting=_dict(meeting),
        attendees=attendees, signals=signals,
    )
    payload = briefing.model_dump()
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Meeting).where(Meeting.id == meeting.id))
        row = res.scalar_one_or_none()
        if row:
            row.briefing_json = payload
            await session.commit()
    return payload


@activity.defn(name="build_champion_kit_activity")
async def build_champion_kit_activity(meeting_id: str) -> Dict[str, Any]:
    """Synthesises the 7-filter champion selling kit, caching it."""
    meeting = await _load_meeting(meeting_id)
    if not meeting:
        raise ValueError(f"meeting {meeting_id} not found")

    kit = await build_champion_kit(
        tenant_id=str(meeting.tenant_id), meeting=_dict(meeting),
        champion_name=meeting.champion_name or "Champion",
        champion_title=meeting.champion_title or "Stakeholder",
    )
    payload = kit.model_dump()
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Meeting).where(Meeting.id == meeting.id))
        row = res.scalar_one_or_none()
        if row:
            row.champion_kit_json = payload
            await session.commit()
    return payload
