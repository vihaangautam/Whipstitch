"""BYOK Settings API Router for managing user/tenant API keys securely."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.core.vault import key_vault
from app.db.models import Tenant, UserAPIKey
from app.db.session import get_db_session
from app.models.medpicc_schemas import APIKeyInfoResponse, SaveAPIKeyRequest, TestKeyResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/settings", tags=["BYOK Settings"])


@router.post("/api-keys", response_model=APIKeyInfoResponse, status_code=status.HTTP_201_CREATED)
async def save_api_key(
    payload: SaveAPIKeyRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Encrypts and securely stores or updates a provider API key."""
    # Validate tenant
    tenant_res = await session.execute(
        select(Tenant).where(Tenant.tenant_key == payload.tenant_id)
    )
    tenant = tenant_res.scalar_one_or_none()
    tenant_uuid = tenant.id if tenant else uuid.uuid4()

    encrypted = key_vault.encrypt_key(payload.api_key)
    masked = key_vault.mask_key(payload.api_key)

    # Check if key already exists for this provider
    res = await session.execute(
        select(UserAPIKey).where(
            UserAPIKey.tenant_id == tenant_uuid,
            UserAPIKey.provider == payload.provider,
        )
    )
    existing = res.scalar_one_or_none()

    if existing:
        existing.encrypted_key = encrypted
        existing.key_masked = masked
        existing.is_active = True
        key_record = existing
    else:
        key_record = UserAPIKey(
            id=uuid.uuid4(),
            tenant_id=tenant_uuid,
            provider=payload.provider,
            encrypted_key=encrypted,
            key_masked=masked,
            is_active=True,
        )
        session.add(key_record)

    await session.commit()
    logger.info("api_key_saved_encrypted", tenant_id=payload.tenant_id, provider=payload.provider, masked=masked)

    return APIKeyInfoResponse(
        id=str(key_record.id),
        provider=key_record.provider,
        key_masked=key_record.key_masked,
        is_active=key_record.is_active,
        created_at=str(key_record.created_at),
    )


@router.get("/api-keys", response_model=List[APIKeyInfoResponse])
async def list_api_keys(
    tenant_id: str = "trifid_media",
    session: AsyncSession = Depends(get_db_session),
):
    """Lists configured provider keys with masked values (never returns plaintext)."""
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    tenant_uuid = tenant.id if tenant else None

    if not tenant_uuid:
        return []

    res = await session.execute(
        select(UserAPIKey).where(
            UserAPIKey.tenant_id == tenant_uuid,
            UserAPIKey.is_active == True,
        )
    )
    keys = res.scalars().all()

    return [
        APIKeyInfoResponse(
            id=str(k.id),
            provider=k.provider,
            key_masked=k.key_masked,
            is_active=k.is_active,
            created_at=str(k.created_at),
        )
        for k in keys
    ]


@router.delete("/api-keys/{provider}", status_code=status.HTTP_200_OK)
async def delete_api_key(
    provider: str,
    tenant_id: str = "trifid_media",
    session: AsyncSession = Depends(get_db_session),
):
    """Revokes / deactivates a configured API key."""
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    res = await session.execute(
        select(UserAPIKey).where(
            UserAPIKey.tenant_id == tenant.id,
            UserAPIKey.provider == provider,
        )
    )
    key_entry = res.scalar_one_or_none()
    if not key_entry:
        raise HTTPException(status_code=404, detail=f"No key found for provider '{provider}'")

    key_entry.is_active = False
    await session.commit()
    logger.info("api_key_revoked", tenant_id=tenant_id, provider=provider)
    return {"status": "revoked", "provider": provider, "message": f"Successfully revoked {provider} key."}


@router.post("/api-keys/test", response_model=TestKeyResponse)
async def test_api_key_connectivity(
    provider: str,
    api_key: str,
):
    """Tests connectivity for a supplied API key without persisting it."""
    clean_key = api_key.strip()
    try:
        if provider == "openai":
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {clean_key}"},
                )
                if resp.status_code == 200:
                    return TestKeyResponse(provider=provider, valid=True, message="OpenAI authentication successful!")
                return TestKeyResponse(provider=provider, valid=False, message=f"OpenAI error {resp.status_code}: Invalid key or unauthorized.")

        elif provider == "groq":
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {clean_key}"},
                )
                if resp.status_code == 200:
                    return TestKeyResponse(provider=provider, valid=True, message="Groq authentication successful!")
                return TestKeyResponse(provider=provider, valid=False, message=f"Groq error {resp.status_code}: Invalid API key.")

        elif provider == "gemini":
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
                )
                if resp.status_code == 200:
                    return TestKeyResponse(provider=provider, valid=True, message="Google Gemini authentication successful!")
                return TestKeyResponse(provider=provider, valid=False, message=f"Gemini error {resp.status_code}: Invalid API key.")

        # Default fallback validation
        if len(clean_key) >= 10:
            return TestKeyResponse(provider=provider, valid=True, message=f"{provider.capitalize()} key format verified.")
        return TestKeyResponse(provider=provider, valid=False, message="Key is too short or malformed.")

    except Exception as e:
        return TestKeyResponse(provider=provider, valid=False, message=f"Connection test failed: {str(e)}")
