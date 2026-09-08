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
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/auth", tags=["User Authentication & Profile"])


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

    # Resolve tenant
    tenant_key = payload.tenant_id or "trifid_media"
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
    tenant = tenant_res.scalar_one_or_none()
    tenant_id = tenant.id if tenant else None

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
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            tenant_id=tenant_key,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
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

    # Fetch tenant key if associated
    tenant_key = "trifid_media"
    if user.tenant_id:
        t_res = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = t_res.scalar_one_or_none()
        if tenant:
            tenant_key = tenant.tenant_key

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
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            tenant_id=tenant_key,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    )


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(
    session: AsyncSession = Depends(get_db_session),
):
    """Instant 1-click login as the pre-configured Sales Representative (Alex Morgan)."""
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

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            tenant_id="trifid_media",
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieves current authenticated user profile."""
    tenant_key = "trifid_media"
    if user.tenant_id:
        t_res = await session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = t_res.scalar_one_or_none()
        if tenant:
            tenant_key = tenant.tenant_key

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        tenant_id=tenant_key,
        is_active=user.is_active,
        created_at=user.created_at,
    )
