"""Psychographic profiling and 7-filter champion kit synthesis engine."""
import logging
from typing import Any, Dict, List, Optional
from app.models.meeting_schemas import (
    AttendeePsychographicProfile,
    ChampionFilterBlock,
    ChampionSellingKit,
    CompanySignal,
    MeetingAttendee,
    PreCallBriefing,
)

logger = logging.getLogger("whipstitch.psychographic")


class PsychographicEngine:
    """Extracts attendee psychographics and generates 7-filter champion selling assets."""

    def resolve_buying_role(self, title: str) -> str:
        """Heuristic classifier for MEDDPICC committee role based on title."""
        title_lower = (title or "").lower()
        if any(w in title_lower for w in ["cfo", "chief financial", "finance", "comptroller", "treasurer"]):
            return "Economic Buyer"
        if any(w in title_lower for w in ["revops", "revenue operations", "sales ops", "sales operations"]):
            return "Champion"
        if any(w in title_lower for w in ["security", "ciso", "infosec", "compliance"]):
            return "Security Gatekeeper"
        if any(w in title_lower for w in ["legal", "procurement", "contracts", "counsel"]):
            return "Legal / Procurement"
        if any(w in title_lower for w in ["architect", "cto", "lead engineer", "vp engineering"]):
            return "Technical Evaluator"
        return "Influencer"

    def profile_attendee(
        self, name: str, title: str, organization: str, context: Optional[str] = None
    ) -> AttendeePsychographicProfile:
        """Generates psychographic focus areas, hooks, and icebreakers."""
        role = self.resolve_buying_role(title)
        
        # High-yield tailored profiles based on role
        if role == "Champion":
            focus_areas = [
                "Pipeline Automation & Inbound SLA Compliance",
                "Cross-Functional Team Productivity & Quota Attainment",
            ]
            hooks = [
                f"Noticed {organization}'s rapid sales hiring push this quarter—how are you protecting your inbound SLA as lead volume scales?",
                "Most RevOps leaders we partner with are losing 15-20% of pipeline simply because leads sit unassigned past the 15-minute mark.",
            ]
            icebreaker = f"Saw your recent insights on streamlining operational handoffs at {organization}—resonated strongly with our core thesis on zero-drag revenue architecture."
        elif role == "Economic Buyer":
            focus_areas = [
                "OpEx Rationalization & Vendor Consolidation",
                "Quantified ROI Payback Within Single Fiscal Year",
            ]
            hooks = [
                "We specifically structure our implementation around a hard 90-day payback period before discretionary software budget reviews.",
                f"How is {organization} evaluating new operational software spend ahead of the upcoming Q3 fiscal lock?",
            ]
            icebreaker = f"Noticed your background leading capital efficiency initiatives—our approach is built directly around eliminating waste from unrouted pipeline."
        elif role == "Security Gatekeeper":
            focus_areas = [
                "Zero-Trust Architecture & AES-256 BYOK Key Security",
                "SOC2 Type II & Single-Tenant Volatile Memory Isolation",
            ]
            hooks = [
                "We provide full Bring-Your-Own-Key (BYOK) Fernet encryption so customer API credentials never touch persistent third-party databases.",
                "Our architecture executes LLM calls with zero model retraining on your proprietary enterprise data.",
            ]
            icebreaker = f"Respecting your rigorous InfoSec posture at {organization}, we prepared our pre-signed compliance packet in advance."
        else:
            focus_areas = [
                f"Workflow Modernization at {organization}",
                "Streamlined Vendor Evaluation & Fast Time-to-Value",
            ]
            hooks = [
                f"How is {organization} ensuring commercial alignment between operations and executive sign-off?",
                "We eliminate 80% of manual data entry for reps so they can focus on high-touch enterprise deals.",
            ]
            icebreaker = f"Great to connect ahead of our call—appreciate your team taking time to evaluate modernized revenue intelligence."

        return AttendeePsychographicProfile(
            focus_areas=focus_areas,
            hooks=hooks,
            breaking_the_ice=icebreaker,
            buying_role=role,
            seniority_level="Executive" if "chief" in (title or "").lower() or "vp" in (title or "").lower() else "Management",
        )

    def synthesize_pre_call_briefing(
        self,
        meeting_id: str,
        meeting_title: str,
        company_name: str,
        scheduled_time: Optional[str],
        attendees: List[MeetingAttendee],
        signals: List[CompanySignal],
        deal_gaps: Optional[List[str]] = None,
    ) -> PreCallBriefing:
        """Synthesizes executive pre-call briefing with 3 targeted discovery questions."""
        gaps = deal_gaps or ["Economic Buyer (CFO sign-off unverified)", "Paper Process (InfoSec review lead time)"]
        
        discovery_questions = [
            f"To {company_name}: Sarah mentioned the CFO holds the ultimate discretionary budget—who besides finance sits on the final commercial review?",
            "What is your target go-live milestone, and what InfoSec security gates must be cleared before contract signature?",
            f"If unassigned pipeline leakage ($140k/year) continues unaddressed, what downstream impact does that have on your team's Q4 quota attainment?",
        ]

        summary = (
            f"Strategic evaluation call with {company_name} focusing on revenue automation. "
            f"Primary objective is validating the CFO sign-off process and establishing a formal mutual action timeline before the Q3 budget freeze."
        )

        return PreCallBriefing(
            meeting_id=meeting_id,
            meeting_title=meeting_title,
            company_name=company_name,
            scheduled_time=scheduled_time,
            executive_summary=summary,
            attendees=attendees,
            company_signals=signals,
            top_medpicc_gaps_to_target=gaps,
            strategic_discovery_questions=discovery_questions,
        )

    def synthesize_7_filter_champion_kit(
        self,
        meeting_id: str,
        deal_id: Optional[str],
        champion_name: str,
        champion_title: str,
        company_name: str,
    ) -> ChampionSellingKit:
        """Synthesizes the 7-Filter Champion Selling Kit for closed-door committee meetings."""
        return ChampionSellingKit(
            meeting_id=meeting_id,
            deal_id=deal_id,
            champion_name=champion_name,
            champion_title=champion_title,
            company_name=company_name,
            last_updated="Just Now",
            filter_1_wiifm_career_narrative=ChampionFilterBlock(
                title="Champion Personal Win & Career Narrative",
                talking_points=[
                    f"Positions {champion_name} as the visionary operational leader who modernizes {company_name}'s entire GTM motion.",
                    "Delivers an immediate high-visibility win to executive leadership within 30 days of deployment.",
                    "Automates repetitive manual routing, allowing the champion's team to hit higher quotas with zero headcount increase.",
                ],
                verbatim_soundbite=f"By implementing this, our team eliminates $140k in annual lead leakage and delivers automated CRM routing to leadership within 3 weeks.",
                anticipated_objection="Why can't we just have SDRs manually route incoming leads faster?",
                counter_narrative="Manual routing creates a 48-hour lag where conversion drops by 70%. Automation guarantees sub-15-minute SLA execution.",
            ),
            filter_2_cfo_business_case_roi=ChampionFilterBlock(
                title="CFO Business Case & Quantified ROI",
                talking_points=[
                    "Hard annual cost of inaction estimated at $140,000 across 12 SDRs.",
                    "Payback period achieved within 90 days based on recovering just 2 enterprise opportunities.",
                    "Zero platform markup on LLM tokens via Bring-Your-Own-Key (BYOK) architecture.",
                ],
                verbatim_soundbite="The financial case is straightforward: spending $60k to recover $140k of already-paid-for marketing pipeline is a 2.3x return in year one.",
                anticipated_objection="We have a hiring and software freeze this quarter.",
                counter_narrative="This is not expansion software—it is an efficiency utility that recovers revenue currently slipping through our CRM cracks without hiring new headcount.",
            ),
            filter_3_infosec_architecture=ChampionFilterBlock(
                title="InfoSec, Compliance & Cloud Architecture",
                talking_points=[
                    "Enterprise AES-256 encryption at rest with Fernet vaulting.",
                    "Zero LLM training on customer pipeline data—complete enterprise data sovereignty.",
                    "Compatible with existing HubSpot/Salesforce CRM without ripping and replacing existing stacks.",
                ],
                verbatim_soundbite="Our InfoSec requirements are fully met: keys are encrypted with AES-256, no public AI training occurs, and data is isolated per tenant.",
                anticipated_objection="Does this store our customer PII on third-party AI servers?",
                counter_narrative="No. Processing occurs in volatile memory with strict tokenization, and all third-party API calls run directly under our own enterprise tenant credentials.",
            ),
            filter_4_time_triggers_urgency=ChampionFilterBlock(
                title="Time Triggers & Planning Urgency",
                talking_points=[
                    "Q3 budget freeze deadline occurs in 4 weeks.",
                    "New SDR cohort onboarded next month requires automated assignment from day one.",
                    "Delaying implementation past this quarter pushes rollout into fiscal year-end blackouts.",
                ],
                verbatim_soundbite="If we don't clear security and finalize this before the Q3 lock, we forfeit our discretionary allocation and leak pipeline for another two quarters.",
                anticipated_objection="Can we revisit this next fiscal year?",
                counter_narrative="Every month of delay costs us another $11,500 in unrouted leads. Waiting six months will burn more money than the entire software license.",
            ),
            filter_5_power_structure_dynamics=ChampionFilterBlock(
                title="Power Structure & Committee Alignment",
                talking_points=[
                    "CFO holds ultimate sign-off authority for line items over $100k.",
                    "VP RevOps acts as the operational sponsor and day-to-day champion.",
                    "Head of InfoSec acts as the compliance gatekeeper who must review the security whitepaper.",
                ],
                verbatim_soundbite="I have aligned with our RevOps team; our next step is a 15-minute executive briefing with the CFO to confirm the financial model.",
                anticipated_objection="Who else needs to weigh in before we approve this?",
                counter_narrative="We already have RevOps agreement. Only Finance and InfoSec compliance are required for final clearance.",
            ),
            filter_6_vendor_disqualification=ChampionFilterBlock(
                title="Vendor Disqualification & Why In-House Fails",
                talking_points=[
                    "Building internally would take 6-9 months of dedicated engineering time and $150k+ in developer payroll.",
                    "Legacy tools like ZoomInfo charge massive per-seat platform markups with inflexible annual contracts.",
                    "Whipstitch provides unified waterfall enrichment, MEDDPICC scoring, and calendar intelligence in a single workflow.",
                ],
                verbatim_soundbite="Building an internal waterfall engine would distract our engineering team for 6 months and cost 3x more than buying a ready solution.",
                anticipated_objection="Can't we just write Zapier webhooks to do this?",
                counter_narrative="Zapier lacks waterfall failover, token-bucket rate limiters, Pydantic scoring rubrics, and automated CRM idempotency.",
            ),
            filter_7_shadow_influence_landmines=ChampionFilterBlock(
                title="Shadow Influence & Landmine Mitigation",
                talking_points=[
                    "SDR Managers might fear AI replaces rep qualification judgment.",
                    "Mitigation: Reassure sales leadership that the system acts as a copilot that pre-populates notes, keeping the rep in the driver's seat.",
                    "Finance controller might ask about ongoing API credit overages (addressed by credit hard-cap guards).",
                ],
                verbatim_soundbite="This gives our SDRs more selling time by doing the heavy research upfront, while giving leadership full visibility into deal health.",
                anticipated_objection="Will sales reps actually use this or will it become shelfware?",
                counter_narrative="Reps love it because it writes their follow-up emails and meeting prep briefs in 5 seconds without manual CRM data entry.",
            ),
        )
