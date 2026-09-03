"""6-Signal Autonomous Account Agent REST API Router."""
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from app.models.battlecard_schemas import AccountSignal
from app.services.signals.autonomous_signal_agent import AutonomousSignalAgent

logger = logging.getLogger("whipstitch.signals_api")
router = APIRouter(prefix="/v1/signals", tags=["6-Signal Autonomous Account Agent"])

signal_agent = AutonomousSignalAgent()


class SignalIngestRequest(BaseModel):
    account_name: str
    headline: str
    snippet: str
    source: str = "Manual Telemetry Ingest"


class AccountOpportunityScoreResponse(BaseModel):
    account_name: str
    opportunity_viability_score: int
    active_signals_count: int
    signals: List[AccountSignal]


@router.get("", response_model=List[AccountSignal])
async def list_signals(account_name: Optional[str] = Query(default=None)):
    """Lists real-time revenue signals across pipeline accounts."""
    return signal_agent.list_signals(account_name=account_name)


@router.post("/ingest", response_model=AccountSignal, status_code=status.HTTP_201_CREATED)
async def ingest_signal(payload: SignalIngestRequest):
    """Classifies an incoming market event into 1 of the 6 canonical revenue signals."""
    signal = signal_agent.classify_signal(
        account_name=payload.account_name,
        headline=payload.headline,
        snippet=payload.snippet,
        source=payload.source,
    )
    return signal


@router.get("/account/{account_name}/score", response_model=AccountOpportunityScoreResponse)
async def get_account_opportunity_score(account_name: str):
    """Calculates the aggregate opportunity viability score (0-100) based on active signals."""
    score = signal_agent.calculate_account_opportunity_score(account_name)
    signals = signal_agent.list_signals(account_name)
    return AccountOpportunityScoreResponse(
        account_name=account_name,
        opportunity_viability_score=score,
        active_signals_count=len(signals),
        signals=signals,
    )
