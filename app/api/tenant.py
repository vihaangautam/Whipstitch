from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import resolve_tenant
from app.core.logging import get_logger
from app.db.models import Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import TenantConfigSchema

router = APIRouter()
logger = get_logger(__name__)


def _assert_own_workspace(tenant_id: str, tenant: Tenant) -> None:
    """The workspace key stays in the URL for readability, but it is not what grants access.

    Without this check any holder of the shared API key could read or overwrite another
    workspace's ICP rules, blocklists and SLA thresholds just by changing the path segment.
    """
    if tenant_id != tenant.tenant_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to that workspace.",
        )


@router.get(
    "/v1/tenants/{tenant_id}/config",
    response_model=TenantConfigSchema,
    summary="Get Tenant Configuration",
)
async def get_tenant_config(
    tenant_id: str,
    tenant: Tenant = Depends(resolve_tenant),
):
    _assert_own_workspace(tenant_id, tenant)
    return TenantConfigSchema(**(tenant.config or {}))


@router.post(
    "/v1/tenants/{tenant_id}/config",
    response_model=TenantConfigSchema,
    summary="Update Tenant Configuration",
)
async def update_tenant_config(
    tenant_id: str,
    config_update: TenantConfigSchema,
    tenant: Tenant = Depends(resolve_tenant),
):
    _assert_own_workspace(tenant_id, tenant)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tenant).where(Tenant.id == tenant.id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

        new_config = config_update.model_dump()
        # A full-schema POST carries defaults for every field; don't let those clobber
        # values this workspace already set through onboarding but this form doesn't edit.
        existing = row.config or {}
        new_config["onboarded"] = new_config.get("onboarded") or existing.get("onboarded", False)
        for k in ("company_description", "offering", "trigger_roles", "target_decision_maker_roles"):
            if not new_config.get(k) and existing.get(k):
                new_config[k] = existing[k]
        # icp_criteria is a nested dict — keep sub-keys the form omits (e.g. trigger data)
        new_config["icp_criteria"] = {
            **existing.get("icp_criteria", {}),
            **new_config.get("icp_criteria", {}),
        }
        row.config = new_config

        await session.commit()
        logger.info("tenant_config_updated", tenant_id=tenant_id)
        return config_update
