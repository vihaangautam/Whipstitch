"""Shared tenant-context loading + battlecard persistence for the API and Temporal paths."""
import uuid
from typing import Optional, Tuple

from sqlalchemy import select

from app.db.models import Tenant, TenantBattlecard
from app.db.session import AsyncSessionLocal
from app.models.battlecard_schemas import CompetitorBattlecard
from app.services.battlecards.blackboard_orchestrator import TenantContext


async def load_tenant_context(tenant_key: str) -> Tuple[Optional[uuid.UUID], TenantContext]:
    """Returns (tenant_uuid | None, TenantContext) built from the tenant's onboarding config."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        tenant = res.scalar_one_or_none()
    if not tenant:
        return None, TenantContext(seller_company=tenant_key.replace("_", " ").title())
    cfg = tenant.config or {}
    icp = cfg.get("icp_criteria", {})
    industries = icp.get("target_industries", [])
    ctx = TenantContext(
        seller_company=tenant.name or tenant_key.replace("_", " ").title(),
        offering=cfg.get("offering", ""),
        company_description=cfg.get("company_description", ""),
        industry=industries[0] if industries else cfg.get("industry", ""),
        value_props=cfg.get("value_props", []),
        currency=cfg.get("currency", "USD"),
    )
    return tenant.id, ctx


async def persist_battlecard(
    tenant_uuid: uuid.UUID, card: CompetitorBattlecard, generated_by: str, model: Optional[str]
) -> None:
    """Upserts a battlecard for (tenant, competitor_id)."""
    async with AsyncSessionLocal() as session:
        existing = await session.execute(
            select(TenantBattlecard).where(
                TenantBattlecard.tenant_id == tenant_uuid,
                TenantBattlecard.competitor_id == card.id,
            )
        )
        row = existing.scalar_one_or_none()
        payload = card.model_dump()
        if row:
            row.card_json = payload
            row.competitor_name = card.competitor_name
            row.generated_by = generated_by
            row.model_used = model
        else:
            session.add(
                TenantBattlecard(
                    id=uuid.uuid4(),
                    tenant_id=tenant_uuid,
                    competitor_id=card.id,
                    competitor_name=card.competitor_name,
                    card_json=payload,
                    generated_by=generated_by,
                    model_used=model,
                )
            )
        await session.commit()
