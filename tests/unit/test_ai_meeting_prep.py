"""Unit tests for the LLM-backed meeting prep (assembly + engine fallback)."""
from unittest.mock import AsyncMock, patch

import pytest

from app.models.meeting_schemas import MeetingAttendee
from app.services.profiling.ai_meeting_prep import (
    _BriefingNarrative,
    _ChampionKitNarrative,
    build_champion_kit,
    build_pre_call_briefing,
)
from app.models.meeting_schemas import ChampionFilterBlock

MEETING = {
    "id": "m1", "tenant_id": "trifid_media", "deal_id": None,
    "title": "Acme Q3 Review", "company_name": "Acme Corp",
    "tenant_track": "Service / Retainer", "buyer_tier": "Tier 1: Founder-Led SMB",
    "deal_size": 1_200_000, "currency": "INR", "offering_summary": "SEO retainer",
    "scheduled_time": "Fri 3pm",
}
ATTENDEES = [
    MeetingAttendee(name="Jane Growth", title="Head of Growth", organization="Acme Corp"),
    MeetingAttendee(name="Bob Finance", title="CFO", organization="Acme Corp"),
]


@pytest.mark.asyncio
async def test_briefing_uses_llm_narrative_and_grounds_real_attendees():
    narrative = _BriefingNarrative(
        executive_summary="High-stakes retainer renewal.",
        top_medpicc_gaps_to_target=["Economic Buyer confirmation", "Paper Process"],
        strategic_discovery_questions=["Q1?", "Q2?", "Q3?"],
        attendee_insights=[
            {"name": "Jane Growth", "title": "Head of Growth", "focus_areas": ["CAC", "velocity"],
             "hooks": ["hook a", "hook b"], "breaking_the_ice": "nice work on X", "buying_role": "the champion"},
        ],
    )
    with patch(
        "app.services.profiling.ai_meeting_prep.llm_router.call_structured_llm",
        new=AsyncMock(return_value=(narrative, "gemini-flash-latest")),
    ):
        b = await build_pre_call_briefing("trifid_media", MEETING, ATTENDEES, [])

    assert b.executive_summary == "High-stakes retainer renewal."
    assert len(b.strategic_discovery_questions) == 3
    assert {a.name for a in b.attendees} == {"Jane Growth", "Bob Finance"}  # identity from meeting, not LLM
    jane = next(a for a in b.attendees if a.name == "Jane Growth")
    assert jane.psychographic.buying_role == "Champion"  # coerced from "the champion"
    bob = next(a for a in b.attendees if a.name == "Bob Finance")
    assert bob.psychographic is not None  # engine fallback filled the unmatched attendee


@pytest.mark.asyncio
async def test_briefing_falls_back_to_engine_on_llm_failure():
    with patch(
        "app.services.profiling.ai_meeting_prep.llm_router.call_structured_llm",
        new=AsyncMock(side_effect=RuntimeError("no provider")),
    ):
        b = await build_pre_call_briefing("trifid_media", MEETING, ATTENDEES, [])
    assert len(b.strategic_discovery_questions) == 3
    assert len(b.attendees) == 2


@pytest.mark.asyncio
async def test_champion_kit_maps_seven_filters():
    blocks = [
        ChampionFilterBlock(title=f"F{i}", talking_points=["a", "b", "c"], verbatim_soundbite="s")
        for i in range(7)
    ]
    with patch(
        "app.services.profiling.ai_meeting_prep.llm_router.call_structured_llm",
        new=AsyncMock(return_value=(_ChampionKitNarrative(filters=blocks), "gemini-flash-latest")),
    ):
        kit = await build_champion_kit("trifid_media", MEETING, "Jane Growth", "Head of Growth")
    assert kit.filter_1_wiifm_career_narrative.title == "F0"
    assert kit.filter_7_shadow_influence_landmines.title == "F6"


@pytest.mark.asyncio
async def test_champion_kit_falls_back_when_fewer_than_seven():
    with patch(
        "app.services.profiling.ai_meeting_prep.llm_router.call_structured_llm",
        new=AsyncMock(return_value=(_ChampionKitNarrative(filters=[]), "x")),
    ):
        kit = await build_champion_kit("trifid_media", MEETING, "Jane Growth", "Head of Growth")
    assert kit.filter_1_wiifm_career_narrative.talking_points  # engine fallback populated
