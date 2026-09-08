"""6-Signal Autonomous Account Agent for real-time revenue opportunity discovery."""
import logging
import uuid
from typing import Any, Dict, List, Optional
from app.models.battlecard_schemas import AccountSignal, SignalType

logger = logging.getLogger("whipstitch.signal_agent")


class AutonomousSignalAgent:
    """Monitors, classifies, and scores the 6 high-intent revenue triggers across target accounts."""

    def __init__(self):
        # Per-tenant signal store. Signals come from POST /v1/signals/ingest or /scan;
        # no seed fixtures.
        self._by_tenant: Dict[str, List[AccountSignal]] = {}

    @property
    def active_signals(self) -> List[AccountSignal]:
        """Back-compat flat view across all tenants."""
        return [s for lst in self._by_tenant.values() for s in lst]

    def list_signals(
        self,
        tenant_id: str = "default",
        account_name: Optional[str] = None,
        buyer_tier: Optional[int] = None,
    ) -> List[AccountSignal]:
        """Returns the tenant's detected signals, optionally filtered by account and tier."""
        signals = list(self._by_tenant.get(tenant_id, []))
        if account_name:
            signals = [s for s in signals if s.account_name.lower() == account_name.lower()]
        if buyer_tier in (1, 2):
            signals = [s for s in signals if s.opportunity_viability_boost >= 10]
        return signals

    async def scan_tenant_signals(
        self, tenant_id: str, accounts: List[str], serper
    ) -> List[AccountSignal]:
        """Runs a Serper company-news sweep over `accounts` and classifies each into a
        canonical revenue signal. Replaces the tenant's signal set."""
        self._by_tenant[tenant_id] = []
        for name in [a.strip() for a in accounts if a and a.strip()][:8]:
            try:
                news = await serper.search_company_signals(name)
            except Exception as e:
                logger.warning("signal_scan_serper_failed for %s: %s", name, e)
                continue
            if not news:
                continue
            top = news[0]
            self.classify_signal(
                account_name=name,
                headline=top.get("headline", f"{name} market activity"),
                snippet=top.get("snippet", ""),
                source=top.get("source", "Google Serper Radar"),
                tenant_id=tenant_id,
            )
        return self._by_tenant.get(tenant_id, [])

    def classify_signal(
        self,
        account_name: str,
        headline: str,
        snippet: str,
        source: str = "Google Serper Radar",
        known_competitors: Optional[List[str]] = None,
        buyer_tier: Optional[int] = None,
        tenant_offering: Optional[str] = None,
        seasonal_calendar: Optional[List[str]] = None,
        geography: Optional[str] = "India",
        tenant_id: str = "default",
    ) -> AccountSignal:
        """Classifies an incoming event into 1 of the 7 canonical revenue signals with tier-aware weighting and configurable calendar."""
        text = f"{headline} {snippet}".lower()
        
        # Build dynamic competitor keywords list (Dropped bare 'pitching' to prevent false positives)
        competitor_keywords = [
            "churn", "renewal", "dissatisfied", "agency review", "pitching agencies",
            "in a pitch process", "agency pitch", "replacing agency", "reviewing agencies",
            "vendor review", "rfp out", "poor roas", "slow turnaround", "bad data", "overage", "bounce"
        ]
        if known_competitors:
            for comp in known_competitors:
                competitor_keywords.append(comp.lower().strip())
        else:
            competitor_keywords.append("zoominfo")

        # Resolve seasonal calendar (Tenant-configurable with geography fallback)
        if seasonal_calendar:
            active_calendar = [s.lower().strip() for s in seasonal_calendar]
        elif geography and geography.lower() in ("us", "usa", "uk", "europe", "global"):
            active_calendar = ["q4 holiday", "black friday", "cyber monday", "super bowl", "back to school", "end of fiscal year", "summer peak", "holiday campaign"]
        else:
            active_calendar = ["diwali", "festive season", "eoss", "end of season", "ipl", "holiday campaign", "republic day", "independence day", "navratri", "dussehra"]

        # 1. Leadership Move
        if any(w in text for w in ["appointed", "hired", "joined", "vp", "chief", "director", "leadership", "promoted"]):
            sig_type: SignalType = "leadership_shift"
            boost = 25
            play = "Reach out to congratulate the new executive and share an operational quick-win blueprint."
            hook = f"Saw your new role at {account_name}—congratulations! Typically early on, optimizing team throughput is a high-impact focus."

        # 2. Capital Expansion
        elif any(w in text for w in ["series", "funding", "raised", "capital", "acquired", "acquisition", "m&a", "investment"]):
            sig_type: SignalType = "capital_expansion"
            boost = 30
            play = "Engage leadership before new growth budget allocations lock in."
            hook = f"Congrats on the recent expansion at {account_name}! How are you equipping the team to scale output without compromising quality?"

        # 3. Seasonal Campaign Window (Highest urgency for Track 1 / Tier 1-2)
        elif any(w in text for w in active_calendar):
            sig_type: SignalType = "seasonal_campaign_window"
            boost = 30 if (buyer_tier is None or buyer_tier in (1, 2)) else 20
            play = "Engage leadership before campaign production schedules and agency rosters lock in."
            hook = f"Noticed {account_name}'s upcoming seasonal campaign ramp! We have dedicated production capacity open to hit strict delivery timelines without last-minute rush penalties."

        # 4. Incumbent Churn / Review (Dynamic Competitor Matching with tight phrase defense)
        elif any(w in text for w in competitor_keywords):
            sig_type: SignalType = "incumbent_churn"
            boost = 25 if (buyer_tier is not None and buyer_tier in (1, 2)) else 20
            play = "Offer a low-friction pilot or blind benchmark test against their current vendor."
            hook = f"Heard from industry peers about turnaround and consistency challenges with incumbent partners. We provide guaranteed SLAs and transparent deliverables."

        # 5. Tech Stack Migration (Tier-reweighted: low for Tier 1 SMB/D2C, high for Tier 3)
        elif any(w in text for w in ["hubspot", "salesforce", "migrate", "migration", "stack", "snowflake", "segment"]):
            sig_type: SignalType = "tech_stack_migration"
            boost = 5 if (buyer_tier is not None and buyer_tier in (1, 2)) else 20
            play = "Highlight seamless integration, clean data hygiene, and zero workflow disruption."
            hook = f"Noticed {account_name}'s recent systems transition—our solution ensures seamless handover without pipeline disruption."

        # 6. Compliance / InfoSec (Tier-reweighted: low for Tier 1 SMB/D2C, high for Tier 3)
        elif any(w in text for w in ["soc2", "infosec", "compliance", "security", "gdpr", "audit", "pii"]):
            sig_type: SignalType = "compliance_infosec"
            boost = 5 if (buyer_tier is not None and buyer_tier in (1, 2)) else 25
            play = "Send our compliance packet featuring AES-256 encryption and zero public AI training."
            hook = f"Given {account_name}'s strict compliance focus, our security guarantees complete data confidentiality."

        # 7. Velocity Surge (Default)
        else:
            sig_type: SignalType = "velocity_surge"
            boost = 20 if (buyer_tier is not None and buyer_tier in (1, 2)) else 15
            play = "Offer fast-turnaround capacity to prevent backlogs during volume spikes."
            hook = f"Noticed {account_name}'s accelerating market activity—our engine ensures high-intent opportunities receive immediate execution."

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
            buyer_tier=buyer_tier or 1,
        )

        self._by_tenant.setdefault(tenant_id, []).insert(0, signal)
        logger.info("Signal classified: %s for %s (%s, boost=%d, tenant=%s)", signal.id, account_name, sig_type, boost, tenant_id)
        return signal

    def calculate_account_opportunity_score(self, account_name: str, tenant_id: str = "default") -> int:
        """Calculates the aggregate opportunity viability score (0-100) based on active signals."""
        account_signals = self.list_signals(tenant_id=tenant_id, account_name=account_name)
        if not account_signals:
            return 50  # baseline neutral

        base_score = 50
        total_boost = sum(s.opportunity_viability_boost for s in account_signals)
        final_score = min(100, base_score + total_boost)
        return final_score
