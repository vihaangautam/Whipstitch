"""6-Signal Autonomous Account Agent REST API Router."""
import logging
from typing import List, Optional

from fastapi import APIRouter, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from app.db.models import Deal, OutboundProspect, Tenant
from app.db.session import AsyncSessionLocal
from app.models.battlecard_schemas import AccountSignal
from app.services.profiling.serper_service import SerperService
from app.services.signals.autonomous_signal_agent import AutonomousSignalAgent

logger = logging.getLogger("whipstitch.signals_api")
router = APIRouter(prefix="/v1/signals", tags=["6-Signal Autonomous Account Agent"])

signal_agent = AutonomousSignalAgent()


class SignalIngestRequest(BaseModel):
    account_name: str
    headline: str
    snippet: str
    source: str = "Manual Telemetry Ingest"
    tenant_id: str = "default"


class SignalScanRequest(BaseModel):
    tenant_id: str
    accounts: Optional[List[str]] = None


class AccountOpportunityScoreResponse(BaseModel):
    account_name: str
    opportunity_viability_score: int
    active_signals_count: int
    signals: List[AccountSignal]


async def _tenant_accounts(tenant_key: str) -> List[str]:
    """Company names from the tenant's outbound prospects + deals, most recent first."""
    async with AsyncSessionLocal() as session:
        t = (await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))).scalar_one_or_none()
        if not t:
            return []
        prospects = (await session.execute(
            select(OutboundProspect.company_name)
            .where(OutboundProspect.tenant_id == t.id)
            .order_by(OutboundProspect.created_at.desc())
        )).all()
        deals = (await session.execute(
            select(Deal.company_name).where(Deal.tenant_id == t.id).order_by(Deal.created_at.desc())
        )).all()
    names = [n for (n,) in prospects] + [n for (n,) in deals]
    return list(dict.fromkeys(n for n in names if n))


@router.get("", response_model=List[AccountSignal])
async def list_signals(
    tenant_id: str = Query(default="default"),
    account_name: Optional[str] = Query(default=None),
):
    """Lists the tenant's real-time revenue signals."""
    return signal_agent.list_signals(tenant_id=tenant_id, account_name=account_name)


@router.post("/scan", response_model=List[AccountSignal])
async def scan_signals(payload: SignalScanRequest):
    """Sweeps the tenant's accounts (outbound prospects + deals, or an explicit list) for
    fresh company news and classifies each into a canonical revenue signal."""
    accounts = payload.accounts or await _tenant_accounts(payload.tenant_id)
    if not accounts:
        return []
    signals = await signal_agent.scan_tenant_signals(payload.tenant_id, accounts, SerperService())
    logger.info("signals_scanned tenant=%s accounts=%d signals=%d", payload.tenant_id, len(accounts), len(signals))
    return signals


@router.post("/ingest", response_model=AccountSignal, status_code=status.HTTP_201_CREATED)
async def ingest_signal(payload: SignalIngestRequest):
    """Classifies an incoming market event into 1 of the canonical revenue signals."""
    return signal_agent.classify_signal(
        account_name=payload.account_name,
        headline=payload.headline,
        snippet=payload.snippet,
        source=payload.source,
        tenant_id=payload.tenant_id,
    )


@router.get("/account/{account_name}/score", response_model=AccountOpportunityScoreResponse)
async def get_account_opportunity_score(account_name: str, tenant_id: str = Query(default="default")):
    """Aggregate opportunity viability score (0-100) from the account's active signals."""
    signals = signal_agent.list_signals(tenant_id=tenant_id, account_name=account_name)
    return AccountOpportunityScoreResponse(
        account_name=account_name,
        opportunity_viability_score=signal_agent.calculate_account_opportunity_score(account_name, tenant_id),
        active_signals_count=len(signals),
        signals=signals,
    )
