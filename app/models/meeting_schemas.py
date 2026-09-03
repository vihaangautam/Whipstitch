"""Pydantic schemas for Meeting Intelligence, Calendar Prep & 7-Filter Champion Notes."""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class AttendeePsychographicProfile(BaseModel):
    focus_areas: List[str] = Field(default_factory=list, description="Top 2 business focus areas from recent activity.")
    hooks: List[str] = Field(default_factory=list, description="2 targeted conversation hooks.")
    breaking_the_ice: str = Field(default="", description="1 personalized rapport builder based on career or publications.")
    buying_role: Literal[
        "Champion",
        "Economic Buyer",
        "Technical Evaluator",
        "Security Gatekeeper",
        "Legal / Procurement",
        "Influencer",
        "Unknown"
    ] = Field(default="Unknown", description="Resolved MEDDPICC buying committee role.")
    seniority_level: Optional[str] = Field(default=None, description="Executive, VP, Director, or Manager.")


class MeetingAttendee(BaseModel):
    name: str = Field(..., description="Full name of the attendee.")
    email: Optional[str] = Field(default=None, description="Corporate email address.")
    title: Optional[str] = Field(default="Stakeholder", description="Job title / role designation.")
    organization: Optional[str] = Field(default=None, description="Company name.")
    linkedin_url: Optional[str] = Field(default=None, description="Public LinkedIn profile URL.")
    psychographic: Optional[AttendeePsychographicProfile] = Field(
        default=None, description="AI psychographic and engagement profile."
    )


class CompanySignal(BaseModel):
    source: str = Field(default="Google Serper Radar", description="Source provider or channel.")
    headline: str = Field(..., description="Signal title or news headline.")
    snippet: str = Field(..., description="Summary of the signal or business shift.")
    relevance_to_deal: str = Field(..., description="Why this matters for the sales engagement.")


class PreCallBriefing(BaseModel):
    meeting_id: str = Field(..., description="Associated meeting ID.")
    meeting_title: str = Field(..., description="Meeting calendar title.")
    company_name: str = Field(..., description="Prospect company name.")
    scheduled_time: Optional[str] = Field(default=None, description="Meeting time string.")
    executive_summary: str = Field(..., description="2-sentence briefing on the meeting context and stakes.")
    attendees: List[MeetingAttendee] = Field(default_factory=list, description="Attendees with psychographic dossiers.")
    company_signals: List[CompanySignal] = Field(default_factory=list, description="Recent external market signals.")
    top_medpicc_gaps_to_target: List[str] = Field(default_factory=list, description="Weakest MEDDPICC dimensions to probe.")
    strategic_discovery_questions: List[str] = Field(
        default_factory=list, description="3 high-yield questions designed to resolve qualification gaps."
    )


class ChampionFilterBlock(BaseModel):
    title: str = Field(..., description="Filter title (e.g. 'CFO Financial Case & ROI').")
    talking_points: List[str] = Field(default_factory=list, description="Core arguments the champion should make.")
    verbatim_soundbite: str = Field(..., description="A crisp, executive soundbite the champion can say out loud.")
    anticipated_objection: Optional[str] = Field(default=None, description="Expected pushback from committee.")
    counter_narrative: Optional[str] = Field(default=None, description="How the champion counters the objection.")


class ChampionSellingKit(BaseModel):
    meeting_id: str = Field(..., description="Associated meeting ID.")
    deal_id: Optional[str] = Field(default=None, description="Associated deal ID.")
    champion_name: str = Field(..., description="Full name of the sales champion.")
    champion_title: str = Field(..., description="Title of the sales champion.")
    company_name: str = Field(..., description="Prospect company name.")
    last_updated: Optional[str] = Field(default=None, description="Timestamp of generation.")
    
    # The 7 Strategic Champion Filters
    filter_1_wiifm_career_narrative: ChampionFilterBlock = Field(
        ..., description="Filter 1: Champion personal win, visibility, and promotion alignment."
    )
    filter_2_cfo_business_case_roi: ChampionFilterBlock = Field(
        ..., description="Filter 2: Quantified cost of inaction and payback justification for finance."
    )
    filter_3_infosec_architecture: ChampionFilterBlock = Field(
        ..., description="Filter 3: Security, compliance, and cloud architecture validation."
    )
    filter_4_time_triggers_urgency: ChampionFilterBlock = Field(
        ..., description="Filter 4: Budget deadline, planning cycle, or fiscal year catalyst."
    )
    filter_5_power_structure_dynamics: ChampionFilterBlock = Field(
        ..., description="Filter 5: Buying committee mapping (Signers vs Influencers)."
    )
    filter_6_vendor_disqualification: ChampionFilterBlock = Field(
        ..., description="Filter 6: Why internal build, incumbent, or status quo fails."
    )
    filter_7_shadow_influence_landmines: ChampionFilterBlock = Field(
        ..., description="Filter 7: Navigating behind-the-scenes political resistance and gatekeepers."
    )


class MeetingCreateRequest(BaseModel):
    deal_id: Optional[str] = Field(default=None, description="Optional deal ID to link this meeting to.")
    title: str = Field(..., description="Meeting title (e.g. 'Apex Logistics Discovery & RevOps Alignment').")
    company_name: str = Field(..., description="Target company name.")
    scheduled_time: Optional[str] = Field(default=None, description="ISO timestamp or formatted date/time.")
    attendee_emails: List[str] = Field(default_factory=list, description="Attendee emails to resolve.")
    objective: Optional[str] = Field(default="Discovery & MEDDPICC Alignment", description="Meeting goal.")


class MeetingResponse(BaseModel):
    id: str = Field(..., description="Unique meeting ID.")
    tenant_id: str = Field(..., description="Tenant identifier.")
    deal_id: Optional[str] = Field(default=None)
    title: str
    company_name: str
    scheduled_time: Optional[str] = None
    attendees: List[MeetingAttendee] = Field(default_factory=list)
    briefing_ready: bool = Field(default=False)
    champion_kit_ready: bool = Field(default=False)
    created_at: Optional[str] = None
