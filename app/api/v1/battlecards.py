"""Competitor Battlecards REST API Router."""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.models.battlecard_schemas import (
    CompetitorBattlecard,
    GenerateBattlecardRequest,
)
from app.services.battlecards.blackboard_orchestrator import BlackboardBattlecardOrchestrator

logger = logging.getLogger("whipstitch.battlecard_api")
router = APIRouter(prefix="/v1/battlecards", tags=["Competitor Battlecards"])

orchestrator = BlackboardBattlecardOrchestrator()


@router.get("", response_model=List[CompetitorBattlecard])
async def list_battlecards():
    """Lists all verified competitor battlecards."""
    return orchestrator.list_battlecards()


@router.get("/{competitor_id}", response_model=CompetitorBattlecard)
async def get_battlecard(competitor_id: str):
    """Retrieves a specific competitor battlecard with kill-shots, objection matrix, and blackboard trace."""
    battlecard = orchestrator.get_battlecard(competitor_id)
    if not battlecard:
        # Check if custom generation requested
        battlecard = orchestrator.synthesize_custom_battlecard(competitor_name=competitor_id)
    return battlecard


@router.post("/generate", response_model=CompetitorBattlecard, status_code=status.HTTP_201_CREATED)
async def generate_battlecard(payload: GenerateBattlecardRequest):
    """Generates a dynamic 5-stage blackboard battlecard for any custom rival or opportunity."""
    battlecard = orchestrator.synthesize_custom_battlecard(
        competitor_name=payload.competitor_name,
        buyer_company=payload.buyer_company,
        deal_context=payload.deal_context,
        seller_company=payload.seller_company,
        tenant_offering=payload.tenant_offering,
        tenant_value_props=payload.tenant_value_props,
        buyer_tier=payload.buyer_tier or 1,
        currency=payload.currency or "INR",
        team_type=payload.team_type or "team",
    )
    return battlecard

