"""Unit tests for the 7-Filter Champion Selling Kit and Pre-Call Briefing synthesis."""
import pytest
from app.models.meeting_schemas import MeetingAttendee
from app.services.profiling.psychographic_engine import PsychographicEngine


def test_champion_selling_kit_all_7_filters():
    engine = PsychographicEngine()
    kit = engine.synthesize_7_filter_champion_kit(
        meeting_id="meet-test-1",
        deal_id="deal-test-1",
        champion_name="Sarah Chen",
        champion_title="VP RevOps",
        company_name="Apex Logistics Global",
    )

    assert kit.champion_name == "Sarah Chen"
    assert kit.company_name == "Apex Logistics Global"

    # Filter 1: WIIFM & Career Narrative
    assert "WIIFM" in kit.filter_1_wiifm_career_narrative.title or "Career Narrative" in kit.filter_1_wiifm_career_narrative.title
    assert len(kit.filter_1_wiifm_career_narrative.talking_points) >= 3
    assert len(kit.filter_1_wiifm_career_narrative.verbatim_soundbite) > 10

    # Filter 2: CFO Business Case & ROI
    assert "CFO" in kit.filter_2_cfo_business_case_roi.title
    assert len(kit.filter_2_cfo_business_case_roi.talking_points) >= 3
    assert kit.filter_2_cfo_business_case_roi.anticipated_objection is not None

    # Filter 3: InfoSec & Architecture
    assert "InfoSec" in kit.filter_3_infosec_architecture.title or "Security" in kit.filter_3_infosec_architecture.title
    assert len(kit.filter_3_infosec_architecture.talking_points) >= 3

    # Filter 4: Time Triggers & Urgency
    assert "Time" in kit.filter_4_time_triggers_urgency.title or "Urgency" in kit.filter_4_time_triggers_urgency.title

    # Filter 5: Power Structure Dynamics
    assert "Power" in kit.filter_5_power_structure_dynamics.title or "Structure" in kit.filter_5_power_structure_dynamics.title

    # Filter 6: Vendor Disqualification
    assert "Disqualification" in kit.filter_6_vendor_disqualification.title

    # Filter 7: Shadow Influence & Landmines
    assert "Shadow" in kit.filter_7_shadow_influence_landmines.title or "Landmine" in kit.filter_7_shadow_influence_landmines.title


def test_pre_call_briefing_discovery_questions():
    engine = PsychographicEngine()
    attendees = [
        MeetingAttendee(
            name="Sarah Chen",
            title="VP RevOps",
            psychographic=engine.profile_attendee("Sarah Chen", "VP RevOps", "Apex"),
        )
    ]
    briefing = engine.synthesize_pre_call_briefing(
        meeting_id="meet-test-1",
        meeting_title="Discovery Call",
        company_name="Apex Logistics",
        scheduled_time="Today, 3:30 PM",
        attendees=attendees,
        signals=[],
    )

    assert briefing.company_name == "Apex Logistics"
    assert len(briefing.strategic_discovery_questions) == 3
    assert len(briefing.top_medpicc_gaps_to_target) >= 2
    assert len(briefing.executive_summary) > 20
