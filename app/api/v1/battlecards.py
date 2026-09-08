"""Competitor Battlecards REST API — tenant-scoped, AI-generated, DB-persisted."""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from app.db.models import Tenant, TenantBattlecard
from app.db.session import AsyncSessionLocal
from app.models.battlecard_schemas import CompetitorBattlecard, GenerateBattlecardRequest
from app.services.battlecards.blackboard_orchestrator import BlackboardBattlecardOrchestrator
from app.services.battlecards.persistence import load_tenant_context, persist_battlecard

logger = logging.getLogger("whipstitch.battlecard_api")
router = APIRouter(prefix="/v1/battlecards", tags=["Competitor Battlecards"])

orchestrator = BlackboardBattlecardOrchestrator()


class AutoGenerateRequest(BaseModel):
    tenant_id: str
    competitors: Optional[List[str]] = None  # optional explicit override


async def _load_tenant_context(tenant_key: str):
    tenant_uuid, ctx = await load_tenant_context(tenant_key)
    if tenant_uuid is None:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_key}' not found")
    return tenant_uuid, ctx


async def _persist_card(tenant_uuid, card: CompetitorBattlecard, generated_by: str, model: Optional[str]):
    await persist_battlecard(tenant_uuid, card, generated_by, model)


@router.get("", response_model=List[CompetitorBattlecard])
async def list_battlecards(tenant_id: str = Query(default="trifid_media")):
    """Lists the tenant's generated competitor battlecards (empty until auto-generate is run)."""
    async with AsyncSessionLocal() as session:
        t_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            return []
        rows = await session.execute(
            select(TenantBattlecard)
            .where(TenantBattlecard.tenant_id == tenant.id)
            .order_by(TenantBattlecard.created_at.desc())
        )
        return [CompetitorBattlecard(**r.card_json) for r in rows.scalars().all()]


@router.get("/{competitor_id}", response_model=CompetitorBattlecard)
async def get_battlecard(competitor_id: str, tenant_id: str = Query(default="trifid_media")):
    """Retrieves one persisted battlecard for the tenant."""
    async with AsyncSessionLocal() as session:
        t_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        row = await session.execute(
            select(TenantBattlecard).where(
                TenantBattlecard.tenant_id == tenant.id,
                TenantBattlecard.competitor_id == competitor_id,
            )
        )
        card = row.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Battlecard not generated yet")
    return CompetitorBattlecard(**card.card_json)


@router.post("/auto-generate", response_model=List[CompetitorBattlecard], status_code=status.HTTP_201_CREATED)
async def auto_generate_battlecards(payload: AutoGenerateRequest):
    """Identifies the tenant's likely competitors from their company profile and synthesises
    a battlecard for each via the multi-LLM router (template fallback if no provider)."""
    tenant_uuid, ctx = await _load_tenant_context(payload.tenant_id)

    if not ctx.offering and not ctx.company_description:
        raise HTTPException(
            status_code=400,
            detail="Complete your company description and offering in onboarding first.",
        )

    competitors = payload.competitors or await orchestrator.identify_competitors(ctx)
    logger.info("auto_generate_battlecards tenant=%s competitors=%s", payload.tenant_id, competitors)

    cards: List[CompetitorBattlecard] = []
    for name in competitors[:4]:
        card, generated_by, model = await orchestrator.generate_battlecard(name, ctx, payload.tenant_id)
        await _persist_card(tenant_uuid, card, generated_by, model)
        cards.append(card)
    return cards


@router.post("/generate", response_model=CompetitorBattlecard, status_code=status.HTTP_201_CREATED)
async def generate_battlecard(payload: GenerateBattlecardRequest):
    """Generates and persists a battlecard for one named competitor, using tenant context."""
    tenant_key = getattr(payload, "tenant_id", None) or "trifid_media"
    tenant_uuid, ctx = await _load_tenant_context(tenant_key)

    if payload.tenant_offering:
        ctx.offering = payload.tenant_offering
    if payload.tenant_value_props:
        ctx.value_props = payload.tenant_value_props
    if payload.currency:
        ctx.currency = payload.currency

    card, generated_by, model = await orchestrator.generate_battlecard(
        payload.competitor_name, ctx, tenant_key, rival_intel=payload.tenant_rival_intel
    )
    await _persist_card(tenant_uuid, card, generated_by, model)
    return card
