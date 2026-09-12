"""BYOK Settings API Router for managing user/tenant API keys securely."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.core.vault import key_vault
from app.db.models import Tenant, UserAPIKey
from app.db.session import get_db_session
from app.models.medpicc_schemas import APIKeyInfoResponse, SaveAPIKeyRequest, TestAPIKeyRequest, TestKeyResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/settings", tags=["BYOK Settings"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)):
    if not api_key or api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key header",
        )
    return api_key


@router.post("/api-keys", response_model=APIKeyInfoResponse, status_code=status.HTTP_201_CREATED)
async def save_api_key(
    payload: SaveAPIKeyRequest,
    session: AsyncSession = Depends(get_db_session),
    api_key_hdr: str = Security(verify_api_key),
):
    """Encrypts and securely stores or updates a provider API key."""
    # Resolve tenant, creating it if this is the first time we've seen it —
    # minting a random UUID here would orphan the key: it FK-violates on
    # Postgres, and even where the DB doesn't enforce the FK, list_api_keys
    # can never find it again since it looks up by tenant_key, not this UUID.
    tenant_res = await session.execute(
        select(Tenant).where(Tenant.tenant_key == payload.tenant_id)
    )
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        tenant = Tenant(id=uuid.uuid4(), tenant_key=payload.tenant_id, name=payload.tenant_id)
        session.add(tenant)
        await session.flush()
    tenant_uuid = tenant.id

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
    api_key_hdr: str = Security(verify_api_key),
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
    api_key_hdr: str = Security(verify_api_key),
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


async def _run_provider_test(provider: str, clean_key: str) -> TestKeyResponse:
    """Actual connectivity check against the provider, shared by both test endpoints below."""
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


@router.post("/api-keys/test", response_model=TestKeyResponse)
async def test_api_key_connectivity(
    payload: TestAPIKeyRequest,
    api_key_hdr: str = Security(verify_api_key),
):
    """Tests connectivity for a freshly-typed API key, without persisting it.
    Takes the key in the request body, never as a query param — query strings end up
    in server/proxy access logs and browser history."""
    return await _run_provider_test(payload.provider, payload.api_key.strip())


@router.post("/api-keys/{provider}/test-stored", response_model=TestKeyResponse)
async def test_stored_api_key(
    provider: str,
    tenant_id: str = "trifid_media",
    session: AsyncSession = Depends(get_db_session),
    api_key_hdr: str = Security(verify_api_key),
):
    """Tests the key already saved for this provider by decrypting it server-side.
    Use this for 'Test Ping' on an already-configured key — the plaintext never has to
    round-trip through the browser again, unlike re-submitting a freshly typed key."""
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    res = await session.execute(
        select(UserAPIKey).where(
            UserAPIKey.tenant_id == tenant.id,
            UserAPIKey.provider == provider,
            UserAPIKey.is_active == True,
        )
    )
    key_entry = res.scalar_one_or_none()
    if not key_entry:
        raise HTTPException(status_code=404, detail=f"No stored key found for provider '{provider}'")

    try:
        decrypted = key_vault.decrypt_key(key_entry.encrypted_key)
    except ValueError as e:
        return TestKeyResponse(provider=provider, valid=False, message=str(e))

    return await _run_provider_test(provider, decrypted)
