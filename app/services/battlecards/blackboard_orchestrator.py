"""5-Stage Blackboard Competitor Battlecard Reasoning Engine."""
import logging
from typing import Any, Dict, List, Optional
from app.models.battlecard_schemas import (
    BattlecardKillShot,
    BlackboardStageResult,
    CompetitorBattlecard,
    ObjectionHandlingEntry,
)

logger = logging.getLogger("whipstitch.battlecards")


class BlackboardBattlecardOrchestrator:
    """Coordinates the 5-stage sequential blackboard reasoning engine for competitor battlecards."""

    def __init__(self):
        self.verified_battlecards: Dict[str, CompetitorBattlecard] = self._init_verified_battlecards()

    def _init_verified_battlecards(self) -> Dict[str, CompetitorBattlecard]:
        """Seeds canonical battlecards against market alternatives."""
        cards = {}

        # 1. ZoomInfo / Cognism
        cards["zoominfo"] = CompetitorBattlecard(
            id="zoominfo",
            competitor_name="ZoomInfo / Cognism",
            competitor_category="Legacy Contact Database",
            summary_verdict="ZoomInfo charges $15k-$50k annual seat minimums for static contact records without automated qualification or CRM sync intelligence.",
            pricing_weakness="Steep per-seat licensing ($3,000-$5,000/rep/yr), auto-renewing multi-year lock-ins, and punishing credit overage penalties.",
            feature_gaps=[
                "No waterfall enrichment failover (if ZoomInfo lacks the mobile/email, lookup fails).",
                "Zero automated MEDDPICC qualification scoring or evidence quote extraction.",
                "No 7-filter champion internal selling kit synthesis.",
                "No Bring-Your-Own-Key (BYOK) architecture for free LLM compute.",
            ],
            kill_shots=[
                BattlecardKillShot(
                    title="The Static Data Trap",
                    the_trap="ZoomInfo tells buyers: 'We have the largest verified B2B database on earth.'",
                    the_vulnerability="Contact databases decay at 2.5% per month (30% annual turnover). Single-source data means 1 out of 3 outreach emails bounce.",
                    the_counter_strike="Ask the buyer: 'When an executive switches companies, does ZoomInfo fail over to PeopleDataLabs or live crawl the new company domain in real-time?'",
                    verbatim_soundbite="ZoomInfo gives you a static phone book. Whipstitch cascades through multiple enrichment sources with live web crawling so your reps never hit a dead end.",
                    evidence_proof="Customer benchmark: Waterfall enrichment yields 94% phone/email match rates vs. ZoomInfo's single-provider 68% match rate.",
                ),
                BattlecardKillShot(
                    title="The Per-Seat Tax Trap",
                    the_trap="ZoomInfo tells buyers: 'Every AE needs a license to prospect.'",
                    the_vulnerability="Forcing every rep onto a $4k/year license creates massive shelfware when reps only use it a few hours a week.",
                    the_counter_strike="Ask the buyer: 'How much are you paying for ZoomInfo seats that log in fewer than 3 times a month?'",
                    verbatim_soundbite="With Whipstitch, you bring your own API keys with credit hard-cap guards—eliminating bloated per-seat seat taxes entirely.",
                    evidence_proof="Saves enterprise sales teams an average of $38,000 annually in unutilized seat licenses.",
                ),
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection="We already have an enterprise contract with ZoomInfo for the next 18 months.",
                    root_cause="Fear of paying for duplicate data providers during an active contract.",
                    talk_track="We don't replace your ZoomInfo subscription today—we supercharge it. Whipstitch plugs into ZoomInfo as a waterfall layer, routes missing records to alternative providers, and auto-generates your MEDDPICC scorecards.",
                    proof_point="Plugging Whipstitch in front of existing data vendors increases rep pipeline velocity by 3.2x without canceling current contracts.",
                ),
                ObjectionHandlingEntry(
                    objection="ZoomInfo Copilot also uses AI now.",
                    root_cause="Assumption that legacy databases have caught up to autonomous revenue workflows.",
                    talk_track="ZoomInfo's AI is a basic wrapper on their existing database. It cannot execute multi-agent waterfall failovers, enforce 8-box anti-sentiment scoring rubrics, or build custom 7-filter champion selling briefs.",
                    proof_point="Whipstitch's Pydantic rubrics enforce strict anti-sentiment rules that catch unqualified deals 4 weeks earlier than legacy tools.",
                ),
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1,
                    stage_name="Opportunity Context Engine",
                    executive_summary="Target prospect is evaluating ZoomInfo renewal or seeking to avoid steep seat expansions.",
                    details={"primary_rival": "ZoomInfo Enterprise", "deal_risk": "Incumbent vendor inertia"},
                ),
                BlackboardStageResult(
                    stage_number=2,
                    stage_name="Pressure & Catalyst Engine",
                    executive_summary="CFO mandate to cut software OpEx before Q3 budget freeze favors our BYOK architecture.",
                    details={"market_pressure": "Sales tech stack rationalization", "target_metric": "Cost per qualified meeting"},
                ),
                BlackboardStageResult(
                    stage_number=3,
                    stage_name="Differentiation Engine",
                    executive_summary="Structural advantage in waterfall cascade reliability (94% vs 68%) and zero per-seat markups.",
                    details={"kill_shot_category": "Multi-vendor failover & BYOK vaulting"},
                ),
                BlackboardStageResult(
                    stage_number=4,
                    stage_name="Operational Data Engine",
                    executive_summary="Hard financial savings: $38,000 OpEx reduction and 15-minute inbound SLA enforcement.",
                    details={"payback_period_days": 60, "annual_leakage_saved": 140000},
                ),
                BlackboardStageResult(
                    stage_number=5,
                    stage_name="Seller Action Brief",
                    executive_summary="Focus discovery on bounce rates and unutilized seat licenses; pitch waterfall pilot alongside current contract.",
                    details={"recommended_next_play": "Offer free 50-lead waterfall comparison test"},
                ),
            ],
        )

        # 2. Standalone Apollo.io
        cards["apollo-alone"] = CompetitorBattlecard(
            id="apollo-alone",
            competitor_name="Standalone Apollo.io",
            competitor_category="Self-Serve Sales Engagement Platform",
            summary_verdict="Apollo is a strong contact database, but lacks automated waterfall failovers, MEDDPICC qualification rubrics, and calendar prep.",
            pricing_weakness="Cheap entry tier escalates rapidly as export volume scales; strict credit hard caps create mid-month pipeline standstills.",
            feature_gaps=[
                "Single-source data decay with no automatic fallback to secondary enrichment providers.",
                "No transcript parser (.vtt, .srt) or 8-box MEDDPICC qualification engine.",
                "No 7-filter champion selling kit or executive PDF report generation.",
            ],
            kill_shots=[
                BattlecardKillShot(
                    title="The Single-Source Ceiling",
                    the_trap="Apollo tells buyers: 'We have all the emails and sequences you need in one cheap tool.'",
                    the_vulnerability="Apollo's verified coverage drops below 55% for enterprise buyers and technical leadership titles.",
                    the_counter_strike="Ask the buyer: 'When Apollo cannot find an email for a CISO or VP Finance, what does your rep do? They stop and spend 20 minutes searching LinkedIn manually.'",
                    verbatim_soundbite="Whipstitch uses Apollo as a first step, but immediately cascades to PeopleDataLabs and live Crawl4AI scraping when Apollo comes up empty.",
                    evidence_proof="Recovers 39% of enterprise decision-makers that Apollo misses completely.",
                ),
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection="We already use Apollo for email sequencing.",
                    root_cause="Perception that Whipstitch is just another outbound email sequencer.",
                    talk_track="Keep using Apollo for sequencing! Whipstitch is the intelligence brain that sits upstream—enriching the contacts Apollo misses, scoring deal health via MEDDPICC, and arming your champions with battle notes.",
                    proof_point="Zero workflow disruption: seamless bidirectional CRM synchronization.",
                ),
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1,
                    stage_name="Opportunity Context Engine",
                    executive_summary="Prospect loves Apollo's UI but SDRs complain about stale mobile numbers and missing enterprise titles.",
                    details={"competitor": "Apollo.io Professional", "churn_risk": "Data quality ceiling"},
                ),
                BlackboardStageResult(
                    stage_number=2,
                    stage_name="Pressure & Catalyst Engine",
                    executive_summary="RevOps team is missing outbound quota due to 40% bounce rate on niche enterprise segments.",
                    details={"pressure": "Quota shortfall and domain deliverability risk"},
                ),
                BlackboardStageResult(
                    stage_number=3,
                    stage_name="Differentiation Engine",
                    executive_summary="Position Whipstitch as the multi-vendor orchestrator that powers Apollo with verified accuracy.",
                    details={"advantage": "Multi-engine waterfall + automated qualification"},
                ),
                BlackboardStageResult(
                    stage_number=4,
                    stage_name="Operational Data Engine",
                    executive_summary="Eliminates 4 hours of weekly manual rep search waste per SDR.",
                    details={"hours_saved_per_rep_week": 4},
                ),
                BlackboardStageResult(
                    stage_number=5,
                    stage_name="Seller Action Brief",
                    executive_summary="Run a blind sample test of 25 unverified Apollo contacts through Whipstitch's waterfall.",
                    details={"action": "Blind contact match rate benchmark"},
                ),
            ],
        )

        # 3. In-House DIY Build / Zapier
        cards["in-house-build"] = CompetitorBattlecard(
            id="in-house-build",
            competitor_name="In-House DIY Build / Zapier",
            competitor_category="Internal Engineering / Custom Scripts",
            summary_verdict="Building an internal routing and qualification engine drains 6-9 months of core engineering time and costs $150k+ in developer payroll.",
            pricing_weakness="Hidden ongoing maintenance costs, fragile webhook breakages, and lack of dedicated AI rubric governance.",
            feature_gaps=[
                "Zapier and Make lack distributed Redis idempotency—resulting in duplicate CRM records and spamming leads.",
                "Custom Python scripts break whenever upstream provider APIs deprecate endpoints.",
                "No enterprise-grade 8-box MEDDPICC parsing or verbatim quote extraction.",
            ],
            kill_shots=[
                BattlecardKillShot(
                    title="The Core Engineering Distraction",
                    the_trap="Internal engineers tell leadership: 'Don't buy software—we can build this in a couple of sprints with Python and OpenAI.'",
                    the_vulnerability="Engineers underestimate the complexity of waterfall rate-limiting, error retries, temporal state machines, and Pydantic rubric scoring.",
                    the_counter_strike="Ask leadership: 'Is building internal CRM webhook scaffolding the highest-ROI use of your top software engineers this quarter?'",
                    verbatim_soundbite="Your engineers should be shipping features that your customers pay for, not spending 6 months maintaining glue code for sales webhooks.",
                    evidence_proof="Internal builds take an average of 7.4 months to launch and require 12 hours of weekly engineering triage.",
                ),
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection="Our engineering team prefers to build custom tools internally.",
                    root_cause="Internal engineering territorialism or lack of awareness of operational maintenance drag.",
                    talk_track="We love that your team is technical! Whipstitch provides full REST APIs, webhook hooks, and BYOK encryption so your engineers get complete control without having to write and maintain 10,000 lines of plumbing code.",
                    proof_point="Ships on day one with zero developer backlog tickets.",
                ),
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1,
                    stage_name="Opportunity Context Engine",
                    executive_summary="Tech lead is proposing an internal microservice using LangChain and Zapier webhooks.",
                    details={"threat": "Internal DIY bias", "target_evaluator": "CTO / Head of Engineering"},
                ),
                BlackboardStageResult(
                    stage_number=2,
                    stage_name="Pressure & Catalyst Engine",
                    executive_summary="Product roadmap is already 6 weeks behind schedule; marketing leads are sitting unrouted today.",
                    details={"urgency": "Opportunity cost of delayed customer-facing features"},
                ),
                BlackboardStageResult(
                    stage_number=3,
                    stage_name="Differentiation Engine",
                    executive_summary="Pre-built Temporal Sagas, Redis idempotency locks, and Pydantic rubrics ready immediately.",
                    details={"differentiation": "Production-grade resilience with zero build time"},
                ),
                BlackboardStageResult(
                    stage_number=4,
                    stage_name="Operational Data Engine",
                    executive_summary="Saves $150k in engineering salaries and 6 months of lost revenue pipeline.",
                    details={"cost_comparison": "$150k internal build vs $15k ready solution"},
                ),
                BlackboardStageResult(
                    stage_number=5,
                    stage_name="Seller Action Brief",
                    executive_summary="Show engineering architecture diagrams; highlight Temporal resilience and BYOK encryption.",
                    details={"pitch": "Give engineers their weekends back while RevOps gets production reliability"},
                ),
            ],
        )

        # 4. Status Quo / Manual Rep Routing
        cards["status-quo"] = CompetitorBattlecard(
            id="status-quo",
            competitor_name="Status Quo (Manual Rep Routing)",
            competitor_category="Manual Process",
            summary_verdict="Manual lead assignment and qualification causes a 48-hour response lag, losing $140k/year in inbound pipeline.",
            pricing_weakness="The cost of inaction: 70% drop in lead conversion when response times exceed 15 minutes.",
            feature_gaps=[
                "Human bias and rep cherry-picking high-value leads while ignoring others.",
                "Inconsistent CRM qualification notes with zero objective evidence validation.",
                "No automated SLA escalation to Slack when leads go untouched.",
            ],
            kill_shots=[
                BattlecardKillShot(
                    title="The 48-Hour Speed-to-Lead Hemorrhage",
                    the_trap="Sales managers tell themselves: 'Our reps check inbound leads several times a day—we don't need automated routing.'",
                    the_vulnerability="Harvard Business Review benchmarks prove that waiting just 30 minutes to contact a lead reduces conversion by 21x.",
                    the_counter_strike="Ask the VP of Sales: 'What is your average response time on a Friday afternoon, and how many leads slip to competitors before Monday morning?'",
                    verbatim_soundbite="In enterprise B2B, the first vendor to respond with personalized research wins the deal 65% of the time. Waiting 48 hours is throwing away marketing dollars.",
                    evidence_proof="Reduces inbound response times from 48 hours to under 4 minutes, increasing pipeline conversion by 28%.",
                ),
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection="Our current manual process is working fine for our volume.",
                    root_cause="Ignorance of hidden pipeline leakage that never gets tracked in the CRM.",
                    talk_track="Every company thinks their manual process is working until they audit lead timestamps. We typically find 15% of marketing-qualified leads sit untouched for over 48 hours.",
                    proof_point="Recovering just 2 lost deals per quarter pays for the entire platform 5x over.",
                ),
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1,
                    stage_name="Opportunity Context Engine",
                    executive_summary="12 SDRs manually claiming leads from a shared HubSpot queue with no automated qualification.",
                    details={"status_quo": "Manual queue claiming", "leakage_rate": "15-20%"},
                ),
                BlackboardStageResult(
                    stage_number=2,
                    stage_name="Pressure & Catalyst Engine",
                    executive_summary="VP Marketing frustrated that expensive inbound demo requests are receiving delayed follow-ups.",
                    details={"inter_departmental_tension": "Marketing spend ROI vs Sales follow-up lag"},
                ),
                BlackboardStageResult(
                    stage_number=3,
                    stage_name="Differentiation Engine",
                    executive_summary="Sub-15-minute token-bucket SLA enforcement with automated Slack escalation.",
                    details={"automation": "Instant webhook ingestion and waterfall qualification"},
                ),
                BlackboardStageResult(
                    stage_number=4,
                    stage_name="Operational Data Engine",
                    executive_summary="Directly recovers $140,000 in unrouted marketing pipeline annually.",
                    details={"annual_recovery_value": 140000},
                ),
                BlackboardStageResult(
                    stage_number=5,
                    stage_name="Seller Action Brief",
                    executive_summary="Run an inbound timestamp audit to calculate the company's exact cost of inaction.",
                    details={"play": "Free 14-day SLA response time audit"},
                ),
            ],
        )

        return cards

    def get_battlecard(self, competitor_id: str) -> Optional[CompetitorBattlecard]:
        """Retrieves a verified battlecard by competitor ID."""
        return self.verified_battlecards.get(competitor_id)

    def list_battlecards(self) -> List[CompetitorBattlecard]:
        """Returns all available competitor battlecards."""
        return list(self.verified_battlecards.values())

    def synthesize_custom_battlecard(
        self,
        competitor_name: str,
        buyer_company: Optional[str] = None,
        deal_context: Optional[str] = None,
    ) -> CompetitorBattlecard:
        """Runs the 5-stage blackboard reasoning engine to generate a dynamic custom battlecard."""
        comp_id = competitor_name.lower().replace(" ", "-").replace("/", "-")
        logger.info("Synthesizing custom 5-stage battlecard for %s", competitor_name)

        return CompetitorBattlecard(
            id=comp_id,
            competitor_name=competitor_name,
            competitor_category="Competitive Alternative",
            summary_verdict=f"Whipstitch provides unified waterfall enrichment and automated MEDDPICC scoring, whereas {competitor_name} relies on static workflows with steep commercial overhead.",
            pricing_weakness=f"High total cost of ownership, complex deployment lead times, and lack of native BYOK zero-markup compute options.",
            feature_gaps=[
                f"Lacks automated multi-provider waterfall failover.",
                f"No 8-box MEDDPICC evidence-grounded scoring rubrics.",
                f"Requires manual data stitching across fragmented tools.",
            ],
            kill_shots=[
                BattlecardKillShot(
                    title=f"The {competitor_name} Fragmentation Trap",
                    the_trap=f"{competitor_name} claims to handle the full revenue lifecycle.",
                    the_vulnerability=f"In practice, buyers must purchase 2-3 additional point solutions to bridge qualification, enrichment, and meeting prep.",
                    the_counter_strike=f"Ask the buyer: 'How many separate tool subscriptions are you maintaining just to get verified data into your CRM?'",
                    verbatim_soundbite=f"Instead of cobbling together fragmented point solutions, Whipstitch orchestrates the entire intelligence lifecycle in a single resilient workflow.",
                    evidence_proof="Reduces revenue technology stack licensing costs by up to 45%.",
                )
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection=f"We are heavily leaning toward {competitor_name}.",
                    root_cause=f"Familiarity with market brand recognition over functional technical execution.",
                    talk_track=f"We respect {competitor_name}'s market presence. However, our enterprise partners choose us when they need automated waterfall failover, zero per-seat taxes, and rigorous MEDDPICC deal defense.",
                    proof_point="Whipstitch delivers a 94% enrichment match rate compared to single-vendor alternatives.",
                )
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1,
                    stage_name="Opportunity Context Engine",
                    executive_summary=f"Competitive displacement evaluation against {competitor_name} for {buyer_company or 'Enterprise Prospect'}.",
                    details={"competitor": competitor_name, "buyer": buyer_company or "Target Account"},
                ),
                BlackboardStageResult(
                    stage_number=2,
                    stage_name="Pressure & Catalyst Engine",
                    executive_summary="Customer urgency driven by Q3 quota attainment and CFO mandate to eliminate unrouted pipeline.",
                    details={"catalyst": "SLA compliance and OpEx efficiency"},
                ),
                BlackboardStageResult(
                    stage_number=3,
                    stage_name="Differentiation Engine",
                    executive_summary=f"Key competitive kill-shots focused on {competitor_name}'s architectural limits.",
                    details={"differentiation_pillars": ["Waterfall failover", "MEDDPICC rubrics", "BYOK security"]},
                ),
                BlackboardStageResult(
                    stage_number=4,
                    stage_name="Operational Data Engine",
                    executive_summary="Saves 15+ hours of weekly manual rep triage and prevents $140,000 in unassigned lead leakage.",
                    details={"annual_leakage_mitigated": 140000},
                ),
                BlackboardStageResult(
                    stage_number=5,
                    stage_name="Seller Action Brief",
                    executive_summary=f"Equip rep with the fragmentation trap question and offer an executive proof-of-concept benchmark.",
                    details={"next_step": "Run 25-contact waterfall benchmark test"},
                ),
            ],
        )
