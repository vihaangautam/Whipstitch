"""LLM-backed pre-call briefing + 7-filter champion kit, with the rules-based
PsychographicEngine as a deterministic fallback.

Strategy: the LLM produces only the *narrative* (per-attendee hooks, discovery questions,
champion angles); attendee identity (name/title/email) comes from the meeting record, so a
model hiccup can never invent a person.
"""
import logging
from difflib import SequenceMatcher
from typing import Any, Dict, List

from pydantic import BaseModel, Field, field_validator

from app.core.llm_router import llm_router
from app.models.meeting_schemas import (
    AttendeePsychographicProfile,
    ChampionFilterBlock,
    ChampionSellingKit,
    CompanySignal,
    MeetingAttendee,
    PreCallBriefing,
)
from app.services.profiling.psychographic_engine import PsychographicEngine

logger = logging.getLogger("whipstitch.ai_meeting_prep")
engine = PsychographicEngine()


def _name_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() * 100

_ROLES = {
    "champion": "Champion",
    "economic buyer": "Economic Buyer",
    "budget": "Economic Buyer",
    "technical": "Technical Evaluator",
    "evaluator": "Technical Evaluator",
    "security": "Security Gatekeeper",
    "gatekeeper": "Security Gatekeeper",
    "legal": "Legal / Procurement",
    "procurement": "Legal / Procurement",
    "influencer": "Influencer",
}


def _coerce_role(v: Any) -> str:
    s = str(v or "").strip().lower()
    for key, val in _ROLES.items():
        if key in s:
            return val
    return "Unknown"


class _AttendeeInsight(BaseModel):
    name: str
    title: str = "Stakeholder"
    focus_areas: List[str] = Field(default_factory=list)
    hooks: List[str] = Field(default_factory=list)
    breaking_the_ice: str = ""
    buying_role: str = "Unknown"

    _r = field_validator("buying_role", mode="before")(lambda v: _coerce_role(v))


class _BriefingNarrative(BaseModel):
    executive_summary: str
    top_medpicc_gaps_to_target: List[str] = Field(default_factory=list)
    strategic_discovery_questions: List[str] = Field(default_factory=list)
    attendee_insights: List[_AttendeeInsight] = Field(default_factory=list)


class _ChampionKitNarrative(BaseModel):
    filters: List[ChampionFilterBlock] = Field(default_factory=list)


_BRIEFING_SYSTEM = (
    "You are a senior B2B sales strategist preparing a rep for a specific prospect call. "
    "Ground everything in the seller's real offering and the attendees' actual titles. "
    "Return ONLY strict JSON. `strategic_discovery_questions` must have exactly 3 items. "
    "`top_medpicc_gaps_to_target` must have 2-3 items. For each attendee provide 2 focus_areas, "
    "2 hooks, and 1 breaking_the_ice line. `buying_role` must be one of: Champion, Economic Buyer, "
    "Technical Evaluator, Security Gatekeeper, Legal / Procurement, Influencer, Unknown."
)

_CHAMPION_SYSTEM = (
    "You are a B2B sales strategist writing an internal-selling kit the champion uses in a "
    "closed-door buying-committee meeting. Return ONLY strict JSON with a `filters` array of "
    "EXACTLY 7 objects in this order: 1) champion's personal/career win, 2) CFO business case "
    "& ROI, 3) security / service-quality / IP assurance, 4) time triggers & urgency, "
    "5) power structure & committee alignment, 6) why alternatives (in-house / status quo) fail, "
    "7) shadow influence & landmine mitigation. Each object: title, talking_points (3 strings), "
    "verbatim_soundbite, anticipated_objection, counter_narrative. Be specific to the seller's offering."
)


def _ctx_block(meeting: Dict[str, Any]) -> str:
    return (
        f"SELLER OFFERING: {meeting.get('offering_summary') or 'not specified'}\n"
        f"PROSPECT: {meeting['company_name']}\n"
        f"MEETING: {meeting['title']}\n"
        f"BUSINESS MODEL: {meeting.get('tenant_track')}\n"
        f"BUYER TIER: {meeting.get('buyer_tier')}\n"
        f"DEAL SIZE: {meeting.get('deal_size')} {meeting.get('currency')}\n"
    )


async def build_pre_call_briefing(
    tenant_id: str,
    meeting: Dict[str, Any],
    attendees: List[MeetingAttendee],
    signals: List[CompanySignal],
) -> PreCallBriefing:
    """LLM briefing grounded in real attendees; falls back to the rules engine on any failure."""
    try:
        att_lines = "\n".join(f"- {a.name} — {a.title or 'Stakeholder'}" for a in attendees)
        user = (
            _ctx_block(meeting)
            + f"\nATTENDEES:\n{att_lines}\n\n"
            "Produce JSON: {executive_summary, top_medpicc_gaps_to_target, "
            "strategic_discovery_questions, attendee_insights:[{name,title,focus_areas,hooks,"
            "breaking_the_ice,buying_role}]}"
        )
        narrative, model = await llm_router.call_structured_llm(
            tenant_id=tenant_id,
            system_prompt=_BRIEFING_SYSTEM,
            user_prompt=user,
            response_model=_BriefingNarrative,
            feature="meeting_briefing",
        )
        if not narrative.strategic_discovery_questions:
            raise ValueError("no discovery questions from LLM")

        by_name = {i.name.strip().lower(): i for i in narrative.attendee_insights}
        enriched: List[MeetingAttendee] = []
        for a in attendees:
            ins = by_name.get(a.name.strip().lower())
            if not ins and narrative.attendee_insights:
                best = max(narrative.attendee_insights, key=lambda i: _name_ratio(i.name, a.name))
                if _name_ratio(best.name, a.name) >= 75:
                    ins = best
            if ins:
                psy = AttendeePsychographicProfile(
                    focus_areas=ins.focus_areas[:3],
                    hooks=ins.hooks[:3],
                    breaking_the_ice=ins.breaking_the_ice,
                    buying_role=ins.buying_role,
                    seniority_level="Executive" if any(
                        w in (a.title or "").lower() for w in ("chief", "vp", "founder", "head", "director")
                    ) else "Management",
                )
            else:
                psy = engine.profile_attendee(
                    a.name, a.title or "Stakeholder", a.organization or meeting["company_name"],
                    tenant_track=meeting.get("tenant_track", "Service / Retainer"),
                    buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
                    offering_summary=meeting.get("offering_summary"),
                    currency=meeting.get("currency", "USD"),
                    deal_size=meeting.get("deal_size"),
                )
            enriched.append(a.model_copy(update={"psychographic": psy}))

        return PreCallBriefing(
            meeting_id=meeting["id"],
            deal_id=meeting.get("deal_id"),
            meeting_title=meeting["title"],
            company_name=meeting["company_name"],
            tenant_track=meeting.get("tenant_track", "Service / Retainer"),
            buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
            deal_size=meeting.get("deal_size"),
            currency=meeting.get("currency", "USD"),
            offering_summary=meeting.get("offering_summary"),
            scheduled_time=meeting.get("scheduled_time"),
            executive_summary=narrative.executive_summary,
            attendees=enriched,
            company_signals=signals,
            top_medpicc_gaps_to_target=narrative.top_medpicc_gaps_to_target[:3],
            strategic_discovery_questions=narrative.strategic_discovery_questions[:3],
        )
    except Exception as e:
        logger.warning("llm_briefing_failed_using_engine: %s", e)
        return engine.synthesize_pre_call_briefing(
            meeting_id=meeting["id"],
            meeting_title=meeting["title"],
            company_name=meeting["company_name"],
            scheduled_time=meeting.get("scheduled_time"),
            attendees=attendees,
            signals=signals,
            deal_id=meeting.get("deal_id"),
            tenant_track=meeting.get("tenant_track", "Service / Retainer"),
            buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
            deal_size=meeting.get("deal_size"),
            currency=meeting.get("currency", "USD"),
            offering_summary=meeting.get("offering_summary"),
        )


async def build_champion_kit(
    tenant_id: str,
    meeting: Dict[str, Any],
    champion_name: str,
    champion_title: str,
) -> ChampionSellingKit:
    """LLM 7-filter champion kit; falls back to the rules engine on any failure."""
    try:
        user = (
            _ctx_block(meeting)
            + f"\nCHAMPION: {champion_name} — {champion_title}\n\n"
            'Produce JSON: {"filters": [ {title, talking_points, verbatim_soundbite, '
            'anticipated_objection, counter_narrative}, ... 7 total ]}'
        )
        narrative, model = await llm_router.call_structured_llm(
            tenant_id=tenant_id,
            system_prompt=_CHAMPION_SYSTEM,
            user_prompt=user,
            response_model=_ChampionKitNarrative,
            feature="champion_kit",
        )
        f = narrative.filters
        if len(f) < 7:
            raise ValueError(f"expected 7 champion filters, got {len(f)}")
        return ChampionSellingKit(
            meeting_id=meeting["id"],
            deal_id=meeting.get("deal_id"),
            champion_name=champion_name,
            champion_title=champion_title,
            company_name=meeting["company_name"],
            tenant_track=meeting.get("tenant_track", "Service / Retainer"),
            buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
            deal_size=meeting.get("deal_size"),
            currency=meeting.get("currency", "USD"),
            offering_summary=meeting.get("offering_summary"),
            last_updated="Just now",
            filter_1_wiifm_career_narrative=f[0],
            filter_2_cfo_business_case_roi=f[1],
            filter_3_infosec_architecture=f[2],
            filter_4_time_triggers_urgency=f[3],
            filter_5_power_structure_dynamics=f[4],
            filter_6_vendor_disqualification=f[5],
            filter_7_shadow_influence_landmines=f[6],
        )
    except Exception as e:
        logger.warning("llm_champion_kit_failed_using_engine: %s", e)
        return engine.synthesize_7_filter_champion_kit(
            meeting_id=meeting["id"],
            deal_id=meeting.get("deal_id"),
            champion_name=champion_name,
            champion_title=champion_title,
            company_name=meeting["company_name"],
            tenant_track=meeting.get("tenant_track", "Service / Retainer"),
            buyer_tier=meeting.get("buyer_tier", "Tier 1: Founder-Led SMB"),
            deal_size=meeting.get("deal_size"),
            currency=meeting.get("currency", "USD"),
            offering_summary=meeting.get("offering_summary"),
        )
