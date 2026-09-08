from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import TenantConfigSchema

router = APIRouter()
logger = get_logger(__name__)


@router.get(
    "/v1/tenants/{tenant_id}/config",
    response_model=TenantConfigSchema,
    summary="Get Tenant Configuration",
)
async def get_tenant_config(
    tenant_id: str,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tenant '{tenant_id}' not found")

        return TenantConfigSchema(**tenant.config)


@router.post(
    "/v1/tenants/{tenant_id}/config",
    response_model=TenantConfigSchema,
    summary="Update Tenant Configuration",
)
async def update_tenant_config(
    tenant_id: str,
    config_update: TenantConfigSchema,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
        tenant = result.scalar_one_or_none()

        new_config = config_update.model_dump()
        if not tenant:
            tenant = Tenant(
                tenant_key=tenant_id,
                name=tenant_id.replace("_", " ").title(),
                config=new_config,
            )
            session.add(tenant)
        else:
            # A full-schema POST carries defaults for every field; don't let those clobber
            # values this workspace already set through onboarding but this form doesn't edit.
            existing = tenant.config or {}
            new_config["onboarded"] = new_config.get("onboarded") or existing.get("onboarded", False)
            for k in ("company_description", "offering", "trigger_roles", "target_decision_maker_roles"):
                if not new_config.get(k) and existing.get(k):
                    new_config[k] = existing[k]
            # icp_criteria is a nested dict — keep sub-keys the form omits (e.g. trigger data)
            merged_icp = {**existing.get("icp_criteria", {}), **new_config.get("icp_criteria", {})}
            new_config["icp_criteria"] = merged_icp
            tenant.config = new_config

        await session.commit()
        logger.info("tenant_config_updated", tenant_id=tenant_id)
        return config_update
