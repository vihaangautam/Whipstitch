"""FastAPI authentication, tenant-resolution, and session dependencies.

Tenant isolation rule for this codebase: **the tenant is derived from the authenticated
identity, never from client input.** Routes must not accept a `tenant_id` query/body
parameter and look it up — a caller holding any valid credential could then simply name
someone else's tenant. Use `resolve_tenant` (user-facing routes) or `resolve_ingest_tenant`
(machine webhooks) instead.
"""
import hashlib
import secrets
import uuid
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.models import Tenant, User
from app.db.session import get_db_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login", auto_error=False)

INGEST_KEY_PREFIX = "wsk_"


def hash_ingest_key(raw_key: str) -> str:
    """Ingest keys are stored only as a digest, like a password."""
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()


def generate_ingest_key() -> str:
    return f"{INGEST_KEY_PREFIX}{secrets.token_urlsafe(32)}"


async def get_current_user_optional(
    session: AsyncSession = Depends(get_db_session),
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Optional[User]:
    """Resolves current user via Bearer JWT token or the shared X-API-Key fallback."""
    # 1. Bearer JWT Token resolution
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            try:
                user_uuid = uuid.UUID(user_id)
                res = await session.execute(select(User).where(User.id == user_uuid, User.is_active.is_(True)))
                user = res.scalar_one_or_none()
                if user:
                    return user
            except (ValueError, TypeError):
                pass

    # 2. Shared X-API-Key resolution. This key is a single app-wide secret, so it may only
    #    ever resolve to the default tenant's service account — never to "whichever user
    #    happens to exist", which would hand it an arbitrary tenant's data.
    if x_api_key and secrets.compare_digest(x_api_key, settings.API_KEY):
        res = await session.execute(
            select(User)
            .join(Tenant, User.tenant_id == Tenant.id)
            .where(Tenant.tenant_key == settings.TENANT_DEFAULT_ID, User.is_active.is_(True))
        )
        return res.scalars().first()

    return None


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Enforces authentication: raises 401 if no valid user is resolved."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_rep(
    user: User = Depends(get_current_user),
) -> User:
    """Ensures active user has access (Single profile: sales_representative has full access)."""
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    return user


async def _get_or_create_default_tenant(session: AsyncSession) -> Tenant:
    """The default workspace, created on demand so a fresh database still serves requests.

    Only ever reachable via the shared app-wide key — a caller can't name the tenant it
    wants, which is what `app/api/ingest.py` used to allow.
    """
    res = await session.execute(select(Tenant).where(Tenant.tenant_key == settings.TENANT_DEFAULT_ID))
    tenant = res.scalar_one_or_none()
    if tenant:
        return tenant

    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key=settings.TENANT_DEFAULT_ID,
        name=settings.TENANT_DEFAULT_ID.replace("_", " ").title(),
        config={},
    )
    session.add(tenant)
    await session.flush()
    return tenant


async def resolve_tenant(
    session: AsyncSession = Depends(get_db_session),
    user: Optional[User] = Depends(get_current_user_optional),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Tenant:
    """The workspace the caller is actually allowed to touch.

    JWT sessions resolve to the user's own tenant. The shared X-API-Key resolves to the
    default tenant only. Either way the caller cannot choose — that is the whole point.
    """
    if user is not None and user.tenant_id:
        res = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = res.scalar_one_or_none()
        if tenant and tenant.is_active:
            return tenant
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not attached to an active workspace.",
        )

    # Shared-key callers with no seeded user (fresh database, CI, load tests) still need to
    # reach the default workspace; anything else is unauthenticated.
    if x_api_key and secrets.compare_digest(x_api_key, settings.API_KEY):
        return await _get_or_create_default_tenant(session)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def resolve_ingest_tenant(
    session: AsyncSession = Depends(get_db_session),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Tenant:
    """Tenant resolution for machine callers (marketing webhooks), which have no user session.

    Each tenant holds its own ingest key; the shared app-wide key still works but can only
    ever reach the default tenant, so a leaked integration secret can't cross workspaces.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )

    res = await session.execute(
        select(Tenant).where(
            Tenant.ingest_key_hash == hash_ingest_key(x_api_key),
            Tenant.is_active.is_(True),
        )
    )
    tenant = res.scalar_one_or_none()
    if tenant:
        return tenant

    if secrets.compare_digest(x_api_key, settings.API_KEY):
        return await _get_or_create_default_tenant(session)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API key header",
    )
