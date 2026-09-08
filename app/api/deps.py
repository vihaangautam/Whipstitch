"""FastAPI authentication and session dependencies."""
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


async def get_current_user_optional(
    session: AsyncSession = Depends(get_db_session),
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Optional[User]:
    """Resolves current user via Bearer JWT token or X-API-Key fallback."""
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

    # 2. X-API-Key resolution (falls back to default representative user)
    if x_api_key and x_api_key == settings.API_KEY:
        res = await session.execute(select(User).where(User.email == "rep@trifidmedia.in"))
        rep_user = res.scalar_one_or_none()
        if rep_user:
            return rep_user

        # If user not yet created, return first active user if available
        first_res = await session.execute(select(User).where(User.is_active.is_(True)))
        return first_res.scalars().first()

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
