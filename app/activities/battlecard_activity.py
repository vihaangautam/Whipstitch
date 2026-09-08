"""Temporal activities for Competitor Battlecards and 6-Signal Agent."""
import logging
from typing import Any, Dict, List, Optional
from temporalio import activity

from app.services.battlecards.blackboard_orchestrator import BlackboardBattlecardOrchestrator
from app.services.battlecards.persistence import load_tenant_context, persist_battlecard
from app.services.signals.autonomous_signal_agent import AutonomousSignalAgent

logger = logging.getLogger("whipstitch.battlecard_activities")

orchestrator = BlackboardBattlecardOrchestrator()
signal_agent = AutonomousSignalAgent()


@activity.defn(name="generate_competitor_battlecard_activity")
async def generate_competitor_battlecard_activity(
    competitor_name: str,
    tenant_key: str = "trifid_media",
    buyer_company: Optional[str] = None,
    deal_context: Optional[str] = None,
) -> Dict[str, Any]:
    """LLM-generates a full 5-stage battlecard for `competitor_name` using the tenant's own
    company profile, then persists it. Template fallback if no LLM provider is reachable."""
    logger.info("generate_competitor_battlecard_activity competitor=%s tenant=%s", competitor_name, tenant_key)
    tenant_uuid, ctx = await load_tenant_context(tenant_key)

    card, generated_by, model = await orchestrator.generate_battlecard(competitor_name, ctx, tenant_key)

    if tenant_uuid is not None:
        try:
            await persist_battlecard(tenant_uuid, card, generated_by, model)
        except Exception as e:
            logger.warning("battlecard_persist_failed: %s", e)

    return card.model_dump()


@activity.defn(name="auto_generate_tenant_battlecards_activity")
async def auto_generate_tenant_battlecards_activity(tenant_key: str) -> List[Dict[str, Any]]:
    """Identifies the tenant's competitors and generates + persists a battlecard for each."""
    tenant_uuid, ctx = await load_tenant_context(tenant_key)
    competitors = await orchestrator.identify_competitors(ctx)
    out: List[Dict[str, Any]] = []
    for name in competitors[:4]:
        card, generated_by, model = await orchestrator.generate_battlecard(name, ctx, tenant_key)
        if tenant_uuid is not None:
            try:
                await persist_battlecard(tenant_uuid, card, generated_by, model)
            except Exception as e:
                logger.warning("battlecard_persist_failed: %s", e)
        out.append(card.model_dump())
    return out


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
