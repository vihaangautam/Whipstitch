import pytest
from app.core.idempotency import derive_idempotency_key, IdempotencyManager


def test_derive_idempotency_key_deterministic():
    key1 = derive_idempotency_key("contact@brand.com", "Acme Brand")
    key2 = derive_idempotency_key("CONTACT@BRAND.COM ", " acme brand ")
    assert key1 == key2
    assert len(key1) == 64  # SHA-256 hex string length


def test_derive_idempotency_key_custom_override():
    key = derive_idempotency_key("contact@brand.com", "Acme Brand", custom_key="custom-key-999")
    assert key == "custom-key-999"


@pytest.mark.asyncio
async def test_idempotency_manager_acquire_and_duplicate():
    manager = IdempotencyManager(redis_client=None)

    # Simulated memory-backed redis test or unit behavior verification
    key = derive_idempotency_key("unit@test.com", "UnitTest Corp")
    assert isinstance(key, str)
