import json
import hashlib
import time
from typing import Dict, Optional, Tuple

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Process-local fallback used only when Redis is unreachable. This is NOT the distributed
# guarantee the Redis path provides: with more than one worker process, two replicas can
# each accept the same event. It exists so a Redis outage degrades ingestion to
# single-process deduplication instead of failing every webhook with a 500 — which is what
# happened before, despite /health advertising graceful degradation.
# ponytail: in-process dict, swap for the Redis path the moment Redis is back.
_local_locks: Dict[str, float] = {}
_local_state: Dict[str, Tuple[float, dict]] = {}
_local_duplicates: Dict[str, int] = {}

# Connection failures are the degradation case; a bug in our own call is not.
_REDIS_DOWN = (RedisError, OSError, TimeoutError, ConnectionError)


def derive_idempotency_key(email: str, company_name: str, custom_key: Optional[str] = None) -> str:
    """Generates a deterministic idempotency key if caller didn't provide one."""
    if custom_key and custom_key.strip():
        return custom_key.strip()
    raw = f"{email.lower().strip()}:{company_name.lower().strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _purge_expired(now: float) -> None:
    for key, expires_at in list(_local_locks.items()):
        if expires_at <= now:
            _local_locks.pop(key, None)
    for key, (expires_at, _) in list(_local_state.items()):
        if expires_at <= now:
            _local_state.pop(key, None)


class IdempotencyManager:
    """Atomic idempotency locks and cached execution state, Redis-backed where available."""

    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client

    async def _get_redis(self) -> Redis:
        if self.redis_client:
            return self.redis_client
        # socket_connect_timeout bounds the initial TCP handshake specifically — measured at
        # 2.0s per call (matching socket_timeout) against an unreachable host before this was
        # set, and the ingest path opens two of these per request, so an unreachable Redis
        # cost every webhook 4+ seconds even with the process-local fallback in place below.
        return Redis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.5, socket_timeout=2.0
        )

    async def acquire_lock_or_get_cached(
        self, tenant_id: str, idempotency_key: str, ttl_seconds: int = 86400
    ) -> Tuple[bool, Optional[dict]]:
        """
        Attempts to acquire an atomic lock for the given idempotency_key.
        Returns:
            (is_acquired: bool, cached_state: Optional[dict])
            If is_acquired is True, this is a NEW event.
            If is_acquired is False, this is a DUPLICATE event and cached_state is populated.
        """
        lock_key = f"idempotency:{tenant_id}:{idempotency_key}"
        state_key = f"idempotency_state:{tenant_id}:{idempotency_key}"

        redis_conn = None
        try:
            redis_conn = await self._get_redis()
            # Atomic lock acquisition using SET NX
            acquired = await redis_conn.set(lock_key, "locked", nx=True, ex=ttl_seconds)
            if acquired:
                logger.info("idempotency_lock_acquired", lock_key=lock_key)
                return True, None

            # Duplicate hit: read cached state
            cached_json = await redis_conn.get(state_key)
            cached_state = json.loads(cached_json) if cached_json else {"status": "processing"}
            await redis_conn.incr(f"idempotency_duplicates_total:{tenant_id}")
            logger.info("idempotency_duplicate_detected", lock_key=lock_key, cached_state=cached_state)
            return False, cached_state
        except _REDIS_DOWN as e:
            logger.warning(
                "idempotency_redis_unavailable_using_process_local_lock",
                lock_key=lock_key,
                error=str(e),
            )
            return self._local_acquire(tenant_id, lock_key, state_key, ttl_seconds)
        finally:
            if redis_conn is not None and not self.redis_client:
                try:
                    await redis_conn.aclose()
                except _REDIS_DOWN:
                    pass

    def _local_acquire(
        self, tenant_id: str, lock_key: str, state_key: str, ttl_seconds: int
    ) -> Tuple[bool, Optional[dict]]:
        now = time.monotonic()
        _purge_expired(now)

        if lock_key not in _local_locks:
            _local_locks[lock_key] = now + ttl_seconds
            return True, None

        _local_duplicates[tenant_id] = _local_duplicates.get(tenant_id, 0) + 1
        cached = _local_state.get(state_key)
        return False, (cached[1] if cached else {"status": "processing"})

    async def get_duplicate_count(self, tenant_id: str) -> Optional[int]:
        """Count of duplicate ingest attempts blocked, or None if we genuinely can't tell."""
        redis_conn = None
        try:
            redis_conn = await self._get_redis()
            value = await redis_conn.get(f"idempotency_duplicates_total:{tenant_id}")
            return int(value) if value is not None else 0
        except _REDIS_DOWN as e:
            logger.warning("idempotency_duplicate_count_from_process_local", error=str(e))
            return _local_duplicates.get(tenant_id) if tenant_id in _local_duplicates else None
        except Exception as e:
            logger.warning("idempotency_duplicate_count_unavailable", error=str(e))
            return None
        finally:
            if redis_conn is not None and not self.redis_client:
                try:
                    await redis_conn.aclose()
                except _REDIS_DOWN:
                    pass

    async def set_cached_state(
        self, tenant_id: str, idempotency_key: str, state: dict, ttl_seconds: int = 86400
    ) -> None:
        """Cache execution state for returning in duplicate requests."""
        state_key = f"idempotency_state:{tenant_id}:{idempotency_key}"
        redis_conn = None
        try:
            redis_conn = await self._get_redis()
            await redis_conn.set(state_key, json.dumps(state), ex=ttl_seconds)
        except _REDIS_DOWN as e:
            logger.warning("idempotency_state_cached_process_local", error=str(e))
            _local_state[state_key] = (time.monotonic() + ttl_seconds, state)
        finally:
            if redis_conn is not None and not self.redis_client:
                try:
                    await redis_conn.aclose()
                except _REDIS_DOWN:
                    pass
