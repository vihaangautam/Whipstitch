"""Temporal activities for Competitor Battlecards and 6-Signal Agent."""
import logging
from typing import Any, Dict, List, Optional
from temporalio import activity

from app.services.battlecards.blackboard_orchestrator import BlackboardBattlecardOrchestrator
from app.services.signals.autonomous_signal_agent import AutonomousSignalAgent

logger = logging.getLogger("whipstitch.battlecard_activities")

orchestrator = BlackboardBattlecardOrchestrator()
signal_agent = AutonomousSignalAgent()


@activity.defn(name="generate_competitor_battlecard_activity")
async def generate_competitor_battlecard_activity(
    competitor_name: str,
    buyer_company: Optional[str] = None,
    deal_context: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates a complete 5-stage blackboard battlecard for a given competitor."""
    logger.info("Generating battlecard activity for %s", competitor_name)
    battlecard = orchestrator.synthesize_custom_battlecard(
        competitor_name=competitor_name,
        buyer_company=buyer_company,
        deal_context=deal_context,
    )
    return battlecard.model_dump()


@activity.defn(name="classify_account_signal_activity")
async def classify_account_signal_activity(
    account_name: str,
    headline: str,
    snippet: str,
    source: str = "Google Serper Radar",
) -> Dict[str, Any]:
    """Classifies an event into 1 of the 6 canonical revenue signals."""
    logger.info("Classifying signal for %s: %s", account_name, headline)
    signal = signal_agent.classify_signal(
        account_name=account_name,
        headline=headline,
        snippet=snippet,
        source=source,
    )
    return signal.model_dump()
