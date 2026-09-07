"""Psychographic profiling and 7-filter champion kit synthesis engine.
Supports Track (Service/Retainer vs SaaS/Product) and Tier (Tier 1 Founder SMB, Tier 2 Unicorn Growth, Tier 3 Enterprise).
"""
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


def _format_deal_currency(deal_size: Optional[float], currency: str = "INR") -> str:
    """Formats deal size intuitively in INR (Lakhs/Cr) or USD."""
    if deal_size is None or deal_size <= 0:
        return "₹28 Lakhs" if currency == "INR" else "$60,000"
    if currency == "INR":
        if deal_size >= 10000000:
            return f"₹{deal_size / 10000000:.2f} Cr"
        if deal_size >= 100000:
            return f"₹{deal_size / 100000:.1f} Lakhs"
        return f"₹{int(deal_size):,}"
    return f"${int(deal_size):,}"


class PsychographicEngine:
    """Extracts attendee psychographics and generates 7-filter champion selling assets tailored to Track & Tier."""

    def resolve_buying_role(
        self,
        title: str,
        tenant_track: str = "Service / Retainer",
        buyer_tier: str = "Tier 1: Founder-Led SMB",
    ) -> str:
        """Heuristic classifier for MEDDPICC committee role based on title, track, and tier."""
        title_lower = (title or "").lower()

        # 1. Economic Buyer (Budget & P&L Authority)
        if any(w in title_lower for w in [
            "founder", "co-founder", "ceo", "managing director", "md", "promoter",
            "cfo", "chief financial", "financial", "finance", "controller", "treasurer", "comptroller"
        ]):
            return "Economic Buyer"

        # 2. Security & Compliance Gatekeepers
        if any(w in title_lower for w in ["security", "ciso", "infosec", "compliance"]):
            return "Security Gatekeeper"

        # 3. Legal, Procurement & Commercial SOW Reviewers
        if any(w in title_lower for w in ["procurement", "accounts", "legal", "contracts", "counsel", "commercial", "category"]):
            return "Legal / Procurement"

        # 4. Champions (Growth, Marketing, RevOps, Sales Leadership)
        if any(w in title_lower for w in [
            "growth", "marketing", "brand", "cmo", "revops", "revenue operations",
            "sales ops", "sales operations", "head of sales", "vp sales", "demand",
            "content", "seo", "acquisition", "product"
        ]):
            return "Champion"

        # 5. Technical Evaluators
        if any(w in title_lower for w in ["architect", "cto", "lead engineer", "vp engineering", "tech", "developer"]):
            return "Technical Evaluator"

        return "Influencer"

    def profile_attendee(
        self,
        name: str,
        title: str,
        organization: str,
        context: Optional[str] = None,
        tenant_track: str = "Service / Retainer",
        buyer_tier: str = "Tier 1: Founder-Led SMB",
        offering_summary: Optional[str] = None,
        currency: str = "INR",
        deal_size: Optional[float] = None,
    ) -> AttendeePsychographicProfile:
        """Generates psychographic focus areas, hooks, and icebreakers tailored to Track & Tier."""
        role = self.resolve_buying_role(title, tenant_track, buyer_tier)
        is_service = "service" in tenant_track.lower() or "retainer" in tenant_track.lower()
        offering = offering_summary or ("Growth & SEO Retainer" if is_service else "Revenue Intelligence Platform")
        deal_str = _format_deal_currency(deal_size, currency)

        if is_service:
            # ─── SERVICE / AGENCY / RETAINER LOGIC ───
            if role == "Champion":
                focus_areas = [
                    f"Acquisition Velocity & Lowering Customer Acquisition Cost (CAC)",
                    f"Reliable Deliverable Turnaround & Bandwidth Expansion",
                ]
                hooks = [
                    f"Noticed {organization}'s rapid expansion this quarter—how are you protecting your CAC targets without overspending on paid performance ads?",
                    f"Most marketing & growth leaders we partner with are overwhelmed managing execution in-house; our sprint model gives you dedicated expertise from day one.",
                ]
                icebreaker = f"Saw {organization}'s recent market push—impressive execution. Resonated strongly with our core approach to sustainable organic scale."
            elif role == "Economic Buyer":
                if "tier 1" in buyer_tier.lower():
                    focus_areas = [
                        "Direct Business Revenue & Tangible Unit Economics",
                        "Cashflow Predictability & Deliverable-Backed Milestone Release",
                    ]
                    hooks = [
                        f"We structure our engagement around direct commercial ROI—targeting positive payback on this {deal_str} sprint within 60-90 days.",
                        f"How is {organization} evaluating new agency commitments to ensure every Rupee generates measurable growth before Q3 closes?",
                    ]
                    icebreaker = f"Great to connect directly. We deeply respect founder-led discipline and structure our contracts to protect your bottom-line cashflow."
                else:
                    focus_areas = [
                        "Budget Rationalization & Blended ROAS Impact",
                        "Clear SOW Deliverable Milestones & Finance PO Approval",
                    ]
                    hooks = [
                        f"Partnering with our specialized team costs 60% less than building a 4-person in-house team, with zero hiring lag and zero overhead.",
                        f"We provide transparent monthly attribution reporting so finance sees exactly how this {deal_str} investment converts to top-line growth.",
                    ]
                    icebreaker = f"Noticed your focus on operational efficiency at {organization}—our scope is built directly around measurable performance."
            elif role in ["Legal / Procurement", "Security Gatekeeper"]:
                focus_areas = [
                    "SOW Scope Precision & Prevention of Scope Creep",
                    "Deliverable Acceptance Criteria & Milestone Payment Terms",
                ]
                hooks = [
                    "Our SOW defines exact weekly sprint deliverables and approval SLAs so your internal team has complete delivery transparency.",
                    f"We operate on clear payment milestones with standardized GST-compliant invoicing.",
                ]
                icebreaker = f"Respecting {organization}'s governance process, we prepared our deliverable schedule and draft SOW terms in advance."
            else:
                focus_areas = [
                    f"Streamlined Collaboration with {organization}'s Internal Team",
                    "Fast Time-to-Value & Seamless Tool Handoff",
                ]
                hooks = [
                    f"How is {organization} ensuring smooth coordination between external partners and internal team leads?",
                    "We integrate directly into your existing Slack/Notion/CRM workflow so there is zero operational friction.",
                ]
                icebreaker = f"Great to connect ahead of our call—excited to explore how we can support {organization}'s growth targets."

        else:
            # ─── B2B SAAS / TECH PRODUCT LOGIC ───
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
                    f"Quantified Payback on {deal_str} Investment Within 90 Days",
                ]
                hooks = [
                    f"We specifically structure our implementation around a hard 90-day payback period before discretionary software budget reviews.",
                    f"How is {organization} evaluating new operational software spend ahead of the upcoming fiscal lock?",
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

        seniority = "Executive" if any(w in (title or "").lower() for w in ["chief", "vp", "founder", "head", "director", "partner", "md"]) else "Management"

        return AttendeePsychographicProfile(
            focus_areas=focus_areas,
            hooks=hooks,
            breaking_the_ice=icebreaker,
            buying_role=role,
            seniority_level=seniority,
        )

    def synthesize_pre_call_briefing(
        self,
        meeting_id: str,
        meeting_title: str,
        company_name: str,
        scheduled_time: Optional[str],
        attendees: List[MeetingAttendee],
        signals: List[CompanySignal],
        deal_id: Optional[str] = None,
        tenant_track: str = "Service / Retainer",
        buyer_tier: str = "Tier 1: Founder-Led SMB",
        deal_size: Optional[float] = None,
        currency: str = "INR",
        offering_summary: Optional[str] = None,
        deal_gaps: Optional[List[str]] = None,
    ) -> PreCallBriefing:
        """Synthesizes executive pre-call briefing with 3 targeted discovery questions."""
        is_service = "service" in tenant_track.lower() or "retainer" in tenant_track.lower()
        deal_str = _format_deal_currency(deal_size, currency)
        offering = offering_summary or ("Growth & SEO Retainer" if is_service else "Revenue Intelligence Platform")

        if is_service:
            if "tier 1" in buyer_tier.lower():
                default_gaps = [
                    "Economic Buyer: Founder confirmation on 50% advance invoice",
                    "Paper Process: Scope sign-off on 60-day launch roadmap",
                ]
                discovery_questions = [
                    f"Since the Founder has final authority on signing off on this {deal_str} engagement, what specific commercial proof or case study will give them total conviction?",
                    "What is your target launch deadline, and what approval steps are needed on the SOW before our team can kick off sprint 1?",
                    f"If your team continues without dedicated {offering} support, what impact does that have on your quarterly customer acquisition targets and blended CAC?",
                ]
                summary = (
                    f"Commercial pitch meeting with {company_name} for the {offering} ({deal_str}). "
                    f"The primary goal is confirming Founder/MD buy-in, aligning on the 50% advance payment terms, and locking the project kickoff date."
                )
            else:
                default_gaps = [
                    "Economic Buyer: VP Marketing / Controller PO release unverified",
                    "Decision Criteria: Formal KPIs for organic traffic and CAC reduction",
                ]
                discovery_questions = [
                    f"Who besides the growth team sits on the commercial PO sign-off for this {deal_str} retainer?",
                    "What target milestones does our team need to hit in month 1 to prove undeniable value to leadership?",
                    f"What is the commercial cost of inaction if organic traffic and CAC targets miss your next quarterly board update?",
                ]
                summary = (
                    f"Strategic growth review with {company_name} evaluating our {offering} ({deal_str}). "
                    f"The primary goal is aligning on core performance KPIs and getting Finance PO authorization before the quarter closes."
                )
        else:
            default_gaps = [
                "Economic Buyer: CFO budget sign-off unverified",
                "Paper Process: InfoSec architecture & SOC2 review timeline",
            ]
            discovery_questions = [
                f"Sarah mentioned Marcus (CFO) holds the final signing authority—who besides finance sits on the final commercial review?",
                "What is your target go-live milestone, and what InfoSec security gates must be cleared before contract signature?",
                f"If pipeline leakage ($140k/year) continues unaddressed, what downstream impact does that have on your team's Q4 quota attainment?",
            ]
            summary = (
                f"Strategic evaluation call with {company_name} focusing on automated revenue intelligence. "
                f"Primary objective is validating the CFO sign-off process and establishing a formal mutual action timeline before the Q3 budget freeze."
            )

        gaps = deal_gaps or default_gaps

        return PreCallBriefing(
            meeting_id=meeting_id,
            deal_id=deal_id,
            meeting_title=meeting_title,
            company_name=company_name,
            tenant_track=tenant_track,
            buyer_tier=buyer_tier,
            deal_size=deal_size,
            currency=currency,
            offering_summary=offering,
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
        tenant_track: str = "Service / Retainer",
        buyer_tier: str = "Tier 1: Founder-Led SMB",
        deal_size: Optional[float] = None,
        currency: str = "INR",
        offering_summary: Optional[str] = None,
    ) -> ChampionSellingKit:
        """Synthesizes the 7-Filter Champion Selling Kit for closed-door committee meetings."""
        is_service = "service" in tenant_track.lower() or "retainer" in tenant_track.lower()
        deal_str = _format_deal_currency(deal_size, currency)
        offering = offering_summary or ("Growth & SEO Retainer" if is_service else "Revenue Intelligence Platform")

        if is_service:
            # ─── 7 ANGLES FOR SERVICE / AGENCY / RETAINER DEALS ───
            return ChampionSellingKit(
                meeting_id=meeting_id,
                deal_id=deal_id,
                champion_name=champion_name,
                champion_title=champion_title,
                company_name=company_name,
                tenant_track=tenant_track,
                buyer_tier=buyer_tier,
                deal_size=deal_size,
                currency=currency,
                offering_summary=offering,
                last_updated="Just Now",
                filter_1_wiifm_career_narrative=ChampionFilterBlock(
                    title="Champion Personal Win & Career Narrative",
                    talking_points=[
                        f"Positions {champion_name} as the visionary growth leader who unlocked sustainable organic revenue for {company_name}.",
                        "Delivers high-visibility traffic and acquisition wins to leadership within the first 30 days of sprint execution.",
                        "Relieves internal marketing bandwidth so the internal team can focus on big brand partnerships without burnout.",
                    ],
                    verbatim_soundbite=f"Bringing on this specialized team lets us hit our aggressive acquisition numbers without adding 4 expensive full-time salaries to our payroll.",
                    anticipated_objection="Why can't our current team just handle this internally?",
                    counter_narrative="Our team is already at 100% capacity managing daily operations. Hiring an agency specialist team gives us instant execution with zero ramp-up delay.",
                ),
                filter_2_cfo_business_case_roi=ChampionFilterBlock(
                    title="CFO / Founder Business Case & ROI",
                    talking_points=[
                        f"Hard financial return: A {deal_str} investment pays for itself by reducing blended customer acquisition cost (CAC).",
                        "Saves an estimated ₹40-60 Lakhs in paid performance ad burn by building a compounding organic pipeline.",
                        "Clean, predictable retainer structure with zero hidden agency markups or unpredictable fees.",
                    ],
                    verbatim_soundbite=f"The financial math is clear: investing {deal_str} to lower our blended CAC and capture high-intent buyers delivers a 3x return compared to burning more budget on Meta and Google ads.",
                    anticipated_objection="Can we cut marketing spend and do this cheaper?",
                    counter_narrative="Cheaper options or freelance marketplaces produce low-quality work and risk domain penalties. A specialized partner guarantees measurable ROI and brand protection.",
                ),
                filter_3_infosec_architecture=ChampionFilterBlock(
                    title="Security, Service Quality & IP Ownership Assurance",
                    talking_points=[
                        "100% IP ownership: All created assets, code, copy, and optimization data belong entirely to {company_name}.",
                        "Strict SLA delivery schedule with weekly sprints and transparent tracking dashboards.",
                        "Strict non-disclosure agreement (NDA) ensuring confidential growth metrics never leak.",
                    ],
                    verbatim_soundbite="All intellectual property and ranking assets remain 100% ours, with milestone checkpoints ensuring zero deliverable drop.",
                    anticipated_objection="What happens if the deliverables are delayed or don't meet standards?",
                    counter_narrative="The contract has milestone sign-offs built in. We review weekly sprints, and payment is tied directly to agreed deliverables.",
                ),
                filter_4_time_triggers_urgency=ChampionFilterBlock(
                    title="Time Triggers & Planning Urgency",
                    talking_points=[
                        f"Upcoming festive/quarterly demand surge creates an immediate revenue window.",
                        "Organic search and content optimization require 4-6 weeks to compound—starting today catches peak market demand.",
                        "Competitors in our niche are already bidding aggressively on our core categories.",
                    ],
                    verbatim_soundbite="If we delay kickoff by even one month, we miss the upcoming seasonal demand window and surrender organic market share to rivals.",
                    anticipated_objection="Can we pause and review this next quarter?",
                    counter_narrative="Delaying means continuing to burn cash on expensive paid ads. Starting now builds compounding organic traffic before our competitors lock down the top search spots.",
                ),
                filter_5_power_structure_dynamics=ChampionFilterBlock(
                    title="Power Structure & Committee Alignment",
                    talking_points=[
                        "Founder / Finance Controller holds ultimate approval for signing off on external service retainers.",
                        f"{champion_name} acts as the executive project owner and day-to-day sponsor.",
                        "Commercial reviewer verifies the SOW milestones and payment schedule.",
                    ],
                    verbatim_soundbite=f"I have already aligned our growth team; we just need executive sign-off on the {deal_str} SOW to initiate sprint 1.",
                    anticipated_objection="Who else internally needs to approve this agency partnership?",
                    counter_narrative="Our growth and marketing teams are 100% aligned. We only need commercial sign-off on the payment milestones to proceed.",
                ),
                filter_6_vendor_disqualification=ChampionFilterBlock(
                    title="Vendor Disqualification (Why Alternatives Fail)",
                    talking_points=[
                        "Building in-house requires 4-6 months of recruitment, recruiter fees, and 2x higher annual payroll.",
                        "Generic freelance marketplaces produce shallow, AI-generated spam that risks brand reputation.",
                        "Traditional legacy agencies charge bloated retainers without tying work to commercial acquisition KPIs.",
                    ],
                    verbatim_soundbite="Building this in-house would take 6 months and cost ₹45 Lakhs in headcount. This partner gives us an experienced execution team starting next Monday.",
                    anticipated_objection="Can't we just hire a junior specialist or intern to do this?",
                    counter_narrative="A junior hire lacks strategic depth and requires senior management time. This partner brings senior execution experience from day one.",
                ),
                filter_7_shadow_influence_landmines=ChampionFilterBlock(
                    title="Shadow Influence & Landmine Mitigation",
                    talking_points=[
                        "Internal creative or tech team might worry an external partner will disrupt existing processes.",
                        "Mitigation: Position the partner as an execution multiplier that supports the internal team rather than replacing them.",
                        "Pre-empt leadership skepticism by agreeing on clear 30-day quick wins.",
                    ],
                    verbatim_soundbite="This partner takes the heavy lifting off our team's plate, giving us senior execution without disrupting our current roadmap.",
                    anticipated_objection="Will this distract our internal team and require too much management oversight?",
                    counter_narrative="No. They operate autonomously with weekly 30-minute syncs, saving our team time rather than demanding more oversight.",
                ),
            )

        else:
            # ─── 7 ANGLES FOR B2B SAAS / TECH PRODUCT DEALS ───
            return ChampionSellingKit(
                meeting_id=meeting_id,
                deal_id=deal_id,
                champion_name=champion_name,
                champion_title=champion_title,
                company_name=company_name,
                tenant_track=tenant_track,
                buyer_tier=buyer_tier,
                deal_size=deal_size,
                currency=currency,
                offering_summary=offering,
                last_updated="Just Now",
                filter_1_wiifm_career_narrative=ChampionFilterBlock(
                    title="Champion Personal Win & Career Narrative",
                    talking_points=[
                        f"Positions {champion_name} as the visionary operational leader who modernizes {company_name}'s entire GTM motion.",
                        "Delivers an immediate high-visibility win to executive leadership within 30 days of deployment.",
                        "Automates repetitive manual workflows, allowing the champion's team to hit higher targets with zero headcount increase.",
                    ],
                    verbatim_soundbite=f"By implementing this, our team eliminates pipeline leakage and delivers automated revenue intelligence to leadership within 3 weeks.",
                    anticipated_objection="Why can't we just have reps manually manage lead triage faster?",
                    counter_narrative="Manual triage creates a 48-hour lag where conversion drops by 70%. Automation guarantees sub-15-minute SLA execution.",
                ),
                filter_2_cfo_business_case_roi=ChampionFilterBlock(
                    title="CFO Business Case & Quantified ROI",
                    talking_points=[
                        f"Hard annual cost of inaction estimated at {deal_str} in missed revenue.",
                        "Payback period achieved within 90 days based on closing just 2 additional enterprise opportunities.",
                        "Zero platform markup on LLM tokens via Bring-Your-Own-Key (BYOK) architecture.",
                    ],
                    verbatim_soundbite=f"The financial case is straightforward: spending {deal_str} to recover already-paid-for marketing pipeline is a 2.5x return in year one.",
                    anticipated_objection="We have a hiring and software freeze this quarter.",
                    counter_narrative="This is not luxury software—it is an efficiency utility that recovers revenue currently slipping through our CRM cracks without hiring new headcount.",
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
                        "New sales rep cohort onboarded next month requires automated assignment from day one.",
                        "Delaying implementation past this quarter pushes rollout into fiscal year-end blackouts.",
                    ],
                    verbatim_soundbite="If we don't clear security and finalize this before the Q3 lock, we forfeit our discretionary allocation and leak pipeline for another two quarters.",
                    anticipated_objection="Can we revisit this next fiscal year?",
                    counter_narrative="Every month of delay costs us thousands in unrouted leads. Waiting six months burns more money than the entire software license.",
                ),
                filter_5_power_structure_dynamics=ChampionFilterBlock(
                    title="Power Structure & Committee Alignment",
                    talking_points=[
                        f"CFO holds ultimate sign-off authority for line items over {deal_str}.",
                        f"{champion_name} acts as the operational sponsor and day-to-day champion.",
                        "Head of InfoSec acts as the compliance gatekeeper who must review the security whitepaper.",
                    ],
                    verbatim_soundbite="I have aligned with our team; our next step is a 15-minute executive briefing with Finance to confirm the commercial model.",
                    anticipated_objection="Who else needs to weigh in before we approve this?",
                    counter_narrative="We already have operational agreement. Only Finance and InfoSec compliance are required for final clearance.",
                ),
                filter_6_vendor_disqualification=ChampionFilterBlock(
                    title="Vendor Disqualification & Why In-House Fails",
                    talking_points=[
                        "Building internally would take 6-9 months of dedicated engineering time and $150k+ in developer payroll.",
                        "Legacy tools charge massive per-seat platform markups with inflexible annual contracts.",
                        "Whipstitch provides unified waterfall enrichment, MEDDPICC scoring, and calendar intelligence in a single workflow.",
                    ],
                    verbatim_soundbite="Building an internal waterfall engine would distract our engineering team for 6 months and cost 3x more than buying a ready solution.",
                    anticipated_objection="Can't we just write Zapier webhooks to do this?",
                    counter_narrative="Zapier lacks waterfall failover, token-bucket rate limiters, Pydantic scoring rubrics, and automated CRM idempotency.",
                ),
                filter_7_shadow_influence_landmines=ChampionFilterBlock(
                    title="Shadow Influence & Landmine Mitigation",
                    talking_points=[
                        "Sales Managers might fear AI replaces rep qualification judgment.",
                        "Mitigation: Reassure sales leadership that the system acts as a copilot that pre-populates notes, keeping the rep in the driver's seat.",
                        "Finance controller might ask about ongoing API credit overages (addressed by credit hard-cap guards).",
                    ],
                    verbatim_soundbite="This gives our reps more selling time by doing the heavy research upfront, while giving leadership full visibility into deal health.",
                    anticipated_objection="Will sales reps actually use this or will it become shelfware?",
                    counter_narrative="Reps love it because it writes their follow-up emails and meeting prep briefs in 5 seconds without manual CRM data entry.",
                ),
            )

