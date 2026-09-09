"""Authentication API Router for User Login, Registration, and Profile Retrieval."""
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.models import Tenant, User
from app.db.session import get_db_session
from app.models.auth_schemas import (
    OnboardingRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/auth", tags=["User Authentication & Profile"])


async def _resolve_tenant(session: AsyncSession, user: User):
    """Returns (tenant_key, tenant_config) for a user, with safe fallbacks."""
    if not user.tenant_id:
        return "trifid_media", {}
    res = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = res.scalar_one_or_none()
    if not tenant:
        return "trifid_media", {}
    return tenant.tenant_key, (tenant.config or {})


def _user_response(user: User, tenant_key: str, tenant_config: dict) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        tenant_id=tenant_key,
        is_active=user.is_active,
        onboarded=bool(tenant_config.get("onboarded", False)),
        created_at=user.created_at,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Registers a new user account with default sales representative role."""
    clean_email = payload.email.strip().lower()

    # Check for existing user
    res = await session.execute(select(User).where(User.email == clean_email))
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Resolve or auto-create company tenant workspace
    company = (payload.company_name or "").strip()
    if company:
        import re
        tenant_key = re.sub(r"[^a-zA-Z0-9_]", "_", company.lower().strip())
        tenant_key = re.sub(r"_+", "_", tenant_key).strip("_")
    else:
        tenant_key = payload.tenant_id or "trifid_media"

    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        tenant = Tenant(
            id=uuid.uuid4(),
            tenant_key=tenant_key,
            name=company or tenant_key.replace("_", " ").title(),
            config={
                "onboarded": False,
                "icp_criteria": {
                    "employee_count_min": 50,
                    "employee_count_max": 500,
                    "target_industries": ["B2B SaaS", "Fintech", "Enterprise Software", "E-Commerce"],
                    "geographies": ["India", "US", "UAE", "UK"],
                },
                "competitor_blocklist": [],
                "sla_window_minutes": 15,
                "waterfall_order": ["apollo", "serper", "scraper", "gemini"],
            },
        )
        session.add(tenant)
        await session.flush()

    tenant_id = tenant.id

    # Create user
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        email=clean_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="sales_representative",
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "tenant_id": tenant_key,
    }
    access_token = create_access_token(token_data)

    logger.info("user_registered_successfully", user_id=str(user.id), email=user.email)
    _key, _cfg = await _resolve_tenant(session, user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_user_response(user, _key, _cfg),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Authenticates a user and issues a JWT access token."""
    clean_email = payload.email.strip().lower()

    res = await session.execute(select(User).where(User.email == clean_email))
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated.",
        )

    tenant_key, tenant_cfg = await _resolve_tenant(session, user)

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "tenant_id": tenant_key,
    }
    access_token = create_access_token(token_data)

    logger.info("user_logged_in_successfully", user_id=str(user.id), email=user.email)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_user_response(user, tenant_key, tenant_cfg),
    )


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(
    session: AsyncSession = Depends(get_db_session),
):
    """Instant 1-click login as the pre-configured Sales Representative (Alex Morgan).
    Disabled in production so real deployments only get real, registered accounts."""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    demo_email = "rep@trifidmedia.in"
    res = await session.execute(select(User).where(User.email == demo_email))
    user = res.scalar_one_or_none()

    if not user:
        # Auto-seed the demo user if missing
        tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == "trifid_media"))
        tenant = tenant_res.scalar_one_or_none()
        tenant_id = tenant.id if tenant else None

        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            email=demo_email,
            hashed_password=hash_password("Whipstitch123!"),
            full_name="Alex Morgan",
            role="sales_representative",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "tenant_id": "trifid_media",
    }
    access_token = create_access_token(token_data)

    _key, _cfg = await _resolve_tenant(session, user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_user_response(user, _key, {**_cfg, "onboarded": True}),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieves current authenticated user profile."""
    tenant_key, tenant_cfg = await _resolve_tenant(session, user)
    return _user_response(user, tenant_key, tenant_cfg)


@router.post("/onboarding", response_model=UserResponse)
async def complete_onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Persists workspace setup answers into the tenant config and marks it onboarded."""
    if not user.tenant_id:
        raise HTTPException(status_code=400, detail="User has no workspace to configure.")

    res = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    config = dict(tenant.config or {})
    icp = dict(config.get("icp_criteria", {}))
    if payload.target_industries:
        icp["target_industries"] = payload.target_industries
    if payload.geographies:
        icp["geographies"] = payload.geographies
    if payload.employee_count_min is not None:
        icp["employee_count_min"] = payload.employee_count_min
    if payload.employee_count_max is not None:
        icp["employee_count_max"] = payload.employee_count_max

    config.update(
        {
            "company_description": payload.company_description.strip(),
            "offering": payload.offering.strip(),
            "icp_criteria": icp,
            "onboarded": True,
        }
    )
    if payload.target_decision_maker_roles:
        config["target_decision_maker_roles"] = payload.target_decision_maker_roles
    if payload.trigger_roles:
        config["trigger_roles"] = payload.trigger_roles

    tenant.config = config
    await session.commit()
    logger.info("tenant_onboarding_completed", tenant_key=tenant.tenant_key, user_id=str(user.id))

    return _user_response(user, tenant.tenant_key, config)
