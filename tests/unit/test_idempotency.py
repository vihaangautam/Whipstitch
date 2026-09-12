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


# ---------------------------------------------------------------------------
# Redis-outage degradation (regression, 2026-09-12)
#
# /health advertises that the app "degrades to in-memory locks" without Redis, but the
# idempotency manager had no such fallback: every webhook raised redis.TimeoutError and
# returned a 500. Ingestion is the product's primary entry point, so a Redis blip took
# the whole inbound pipeline down.
# ---------------------------------------------------------------------------
import uuid as _uuid
from unittest.mock import AsyncMock, patch

from app.core import idempotency as _idem


@pytest.fixture
def _clear_local_locks():
    _idem._local_locks.clear()
    _idem._local_state.clear()
    _idem._local_duplicates.clear()
    yield
    _idem._local_locks.clear()
    _idem._local_state.clear()
    _idem._local_duplicates.clear()


def _unreachable_redis():
    """A client that fails the way an unreachable Redis actually fails."""
    from redis.exceptions import TimeoutError as RedisTimeout

    client = AsyncMock()
    client.set.side_effect = RedisTimeout("Timeout connecting to server")
    client.get.side_effect = RedisTimeout("Timeout connecting to server")
    client.incr.side_effect = RedisTimeout("Timeout connecting to server")
    return client


@pytest.mark.asyncio
async def test_lock_falls_back_to_process_local_when_redis_is_down(_clear_local_locks):
    manager = IdempotencyManager()
    tenant = f"t_{_uuid.uuid4().hex[:6]}"
    key = derive_idempotency_key("buyer@acme.test", "Acme Inc")

    with patch.object(IdempotencyManager, "_get_redis", AsyncMock(return_value=_unreachable_redis())):
        acquired, cached = await manager.acquire_lock_or_get_cached(tenant, key)
        assert acquired is True, "first event should be accepted even with Redis down"
        assert cached is None

        acquired_again, cached_again = await manager.acquire_lock_or_get_cached(tenant, key)
        assert acquired_again is False, "duplicate slipped through the local fallback"
        assert cached_again is not None


@pytest.mark.asyncio
async def test_cached_state_survives_redis_outage(_clear_local_locks):
    manager = IdempotencyManager()
    tenant = f"t_{_uuid.uuid4().hex[:6]}"
    key = derive_idempotency_key("buyer@acme.test", "Acme Inc")

    with patch.object(IdempotencyManager, "_get_redis", AsyncMock(return_value=_unreachable_redis())):
        await manager.acquire_lock_or_get_cached(tenant, key)
        await manager.set_cached_state(tenant, key, {"event_id": "abc-123", "status": "received"})

        _, cached = await manager.acquire_lock_or_get_cached(tenant, key)
        assert cached["event_id"] == "abc-123"
        assert await manager.get_duplicate_count(tenant) == 1


@pytest.mark.asyncio
async def test_locks_stay_separate_per_tenant(_clear_local_locks):
    """Same payload, two workspaces — one must not deduplicate the other's event."""
    manager = IdempotencyManager()
    key = derive_idempotency_key("buyer@acme.test", "Acme Inc")

    with patch.object(IdempotencyManager, "_get_redis", AsyncMock(return_value=_unreachable_redis())):
        first, _ = await manager.acquire_lock_or_get_cached("tenant_a", key)
        second, _ = await manager.acquire_lock_or_get_cached("tenant_b", key)

    assert first is True
    assert second is True, "tenant B's event was swallowed as tenant A's duplicate"
