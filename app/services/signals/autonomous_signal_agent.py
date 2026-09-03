"""6-Signal Autonomous Account Agent for real-time revenue opportunity discovery."""
import logging
import uuid
from typing import Any, Dict, List, Optional
from app.models.battlecard_schemas import AccountSignal, SignalType

logger = logging.getLogger("whipstitch.signal_agent")


class AutonomousSignalAgent:
    """Monitors, classifies, and scores the 6 high-intent revenue triggers across target accounts."""

    def __init__(self):
        self.active_signals: List[AccountSignal] = self._init_sample_signals()

    def _init_sample_signals(self) -> List[AccountSignal]:
        """Seeds canonical high-intent signals across pipeline accounts."""
        return [
            AccountSignal(
                id="sig-01",
                account_name="Apex Logistics Global",
                signal_type="leadership_shift",
                headline="Sarah Chen appointed as VP Revenue Operations",
                snippet="Previously scaled outbound pipeline 4x at Flexport; currently restructuring lead routing and SLA enforcement at Apex Logistics.",
                source="LinkedIn Executive Movements",
                detected_at="2 hours ago",
                confidence_score=96,
                opportunity_viability_boost=25,
                recommended_sales_play="Congratulate on the new role and share the 15-minute speed-to-lead benchmark audit.",
                pre_drafted_hook="Saw the move to Apex Logistics—congrats Sarah! Typically when new RevOps leaders take the helm, tightening inbound routing SLAs is an early 30-day win.",
            ),
            AccountSignal(
                id="sig-02",
                account_name="CloudScale Systems",
                signal_type="capital_expansion",
                headline="CloudScale Systems Secures $42M Series B for Enterprise Expansion",
                snippet="Led by Scale Venture Partners. Funding will be deployed to double the enterprise sales team and modernize pipeline infrastructure.",
                source="TechCrunch Funding Radar",
                detected_at="5 hours ago",
                confidence_score=94,
                opportunity_viability_boost=30,
                recommended_sales_play="Reach out to VP Sales before budget allocation locks for the upcoming fiscal quarter.",
                pre_drafted_hook="Huge congratulations on the $42M Series B! Noticed your aggressive sales hiring targets—how are you scaling automated lead qualification so new reps ramp instantly?",
            ),
            AccountSignal(
                id="sig-03",
                account_name="FinPulse Payments",
                signal_type="tech_stack_migration",
                headline="FinPulse Payments Migrates Core CRM Architecture to HubSpot Enterprise",
                snippet="Transitioning from legacy on-premise CRM to cloud HubSpot; actively looking for bidirectional enrichment and routing integrations.",
                source="Datanyze Tech Tracker",
                detected_at="1 day ago",
                confidence_score=91,
                opportunity_viability_boost=20,
                recommended_sales_play="Highlight Whipstitch's native HubSpot sync, Redis idempotency locks, and zero-loss webhook ingestion.",
                pre_drafted_hook="Noticed FinPulse is transitioning to HubSpot Enterprise. We built native automated enrichment specifically to prevent dirty data from contaminating fresh CRM migrations.",
            ),
            AccountSignal(
                id="sig-04",
                account_name="Nexus Health Technologies",
                signal_type="compliance_infosec",
                headline="Nexus Health Initiates SOC2 Type II Audit & Strict PII Vendor Review",
                snippet="Board-level mandate requiring all third-party software vendors to provide AES-256 encryption and zero LLM data training guarantees.",
                source="SecurityScorecard Monitor",
                detected_at="1 day ago",
                confidence_score=95,
                opportunity_viability_boost=25,
                recommended_sales_play="Send the pre-signed InfoSec compliance package highlighting BYOK Fernet vaulting.",
                pre_drafted_hook="Saw Nexus Health's heightened InfoSec compliance focus. We provide Bring-Your-Own-Key AES-256 encryption with zero LLM model retraining on your enterprise pipeline.",
            ),
            AccountSignal(
                id="sig-05",
                account_name="DataCore Systems",
                signal_type="incumbent_churn",
                headline="DataCore Sales Team Complains of 42% Bounce Rate on Incumbent Contact Vendor",
                snippet="Public G2 / TrustRadius review citing frustration with outdated phone numbers and inflexible annual seat lock-ins.",
                source="G2 Competitive Review Radar",
                detected_at="2 days ago",
                confidence_score=88,
                opportunity_viability_boost=20,
                recommended_sales_play="Offer a blind 50-lead waterfall test to prove superior phone/email match rates (94% vs 58%).",
                pre_drafted_hook="Noticed frustration around contact decay on single-provider databases. We run a multi-vendor waterfall cascade so reps never bounce on target accounts.",
            ),
            AccountSignal(
                id="sig-06",
                account_name="Vanguard Logistics",
                signal_type="velocity_surge",
                headline="Inbound Webhook Volume Spikes 140% Following Product Launch",
                snippet="Surge in demo requests creating rep backlog; average first-touch response time slowed from 20 minutes to 3.5 hours.",
                source="Whipstitch Telemetry Monitor",
                detected_at="3 days ago",
                confidence_score=98,
                opportunity_viability_boost=30,
                recommended_sales_play="Trigger automated Slack SLA escalation and offer instant waterfall routing to clear the backlog.",
                pre_drafted_hook="Saw the massive traffic surge post-launch! When inbound demo volume doubles, automated qualification ensures enterprise buyers get immediate white-glove routing.",
            ),
        ]

    def list_signals(self, account_name: Optional[str] = None) -> List[AccountSignal]:
        """Returns all detected signals, optionally filtered by account."""
        if account_name:
            return [s for s in self.active_signals if s.account_name.lower() == account_name.lower()]
        return self.active_signals

    def classify_signal(
        self,
        account_name: str,
        headline: str,
        snippet: str,
        source: str = "Google Serper Radar",
    ) -> AccountSignal:
        """Classifies an incoming event into 1 of the 6 canonical revenue signals."""
        text = f"{headline} {snippet}".lower()
        
        # 1. Leadership Move
        if any(w in text for w in ["appointed", "hired", "joined", "vp", "chief", "director", "leadership", "promoted"]):
            sig_type: SignalType = "leadership_shift"
            boost = 25
            play = "Reach out to congratulate the new executive and share an operational quick-win blueprint."
            hook = f"Saw your new role at {account_name}—congratulations! Typically early on, optimizing sales efficiency is a high-impact focus."

        # 2. Capital Expansion
        elif any(w in text for w in ["series", "funding", "raised", "capital", "acquired", "acquisition", "m&a", "investment"]):
            sig_type: SignalType = "capital_expansion"
            boost = 30
            play = "Engage sales leadership before new headcount budget allocations lock in."
            hook = f"Congrats on the recent expansion at {account_name}! How are you equipping the new sales cohort to hit quota quickly?"

        # 3. Tech Stack Migration
        elif any(w in text for w in ["hubspot", "salesforce", "migrate", "migration", "stack", "snowflake", "segment"]):
            sig_type: SignalType = "tech_stack_migration"
            boost = 20
            play = "Highlight seamless bidirectional sync and automated CRM deduplication."
            hook = f"Noticed {account_name}'s recent CRM modernizations—our integration guarantees clean waterfall data across systems."

        # 4. Compliance / InfoSec
        elif any(w in text for w in ["soc2", "infosec", "compliance", "security", "gdpr", "audit", "pii"]):
            sig_type: SignalType = "compliance_infosec"
            boost = 25
            play = "Send our pre-signed compliance packet featuring BYOK Fernet encryption."
            hook = f"Given {account_name}'s strict InfoSec requirements, our BYOK vault guarantees customer data is never used to train public AI."

        # 5. Incumbent Churn
        elif any(w in text for w in ["bounce", "zoominfo", "churn", "renewal", "frustrated", "bad data", "overage"]):
            sig_type: SignalType = "incumbent_churn"
            boost = 20
            play = "Propose a 25-lead blind match rate benchmark against their current provider."
            hook = f"Heard about contact decay challenges on legacy data tools. We run a multi-vendor waterfall so reps never hit dead ends."

        # 6. Velocity Surge (Default)
        else:
            sig_type: SignalType = "velocity_surge"
            boost = 15
            play = "Offer sub-15-minute speed-to-lead routing to prevent pipeline leakage."
            hook = f"Noticed {account_name}'s accelerating market activity—our engine ensures high-intent prospects receive instant qualification."

        signal = AccountSignal(
            id=f"sig-{uuid.uuid4().hex[:6]}",
            account_name=account_name,
            signal_type=sig_type,
            headline=headline,
            snippet=snippet,
            source=source,
            detected_at="Just now",
            confidence_score=92,
            opportunity_viability_boost=boost,
            recommended_sales_play=play,
            pre_drafted_hook=hook,
        )

        self.active_signals.insert(0, signal)
        logger.info("Signal classified: %s for %s (%s)", signal.id, account_name, sig_type)
        return signal

    def calculate_account_opportunity_score(self, account_name: str) -> int:
        """Calculates the aggregate opportunity viability score (0-100) based on active signals."""
        account_signals = self.list_signals(account_name)
        if not account_signals:
            return 50  # baseline neutral

        base_score = 50
        total_boost = sum(s.opportunity_viability_boost for s in account_signals)
        final_score = min(100, base_score + total_boost)
        return final_score
