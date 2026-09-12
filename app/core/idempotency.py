import json
import hashlib
from typing import Optional, Tuple
from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def derive_idempotency_key(email: str, company_name: str, custom_key: Optional[str] = None) -> str:
    """Generates a deterministic idempotency key if caller didn't provide one."""
    if custom_key and custom_key.strip():
        return custom_key.strip()
    raw = f"{email.lower().strip()}:{company_name.lower().strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class IdempotencyManager:
    """Handles atomic Redis idempotency locks and cached execution state retrieval."""

    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client

    async def _get_redis(self) -> Redis:
        if self.redis_client:
            return self.redis_client
        return Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=2.0)

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
        redis_conn = await self._get_redis()
        lock_key = f"idempotency:{tenant_id}:{idempotency_key}"
        state_key = f"idempotency_state:{tenant_id}:{idempotency_key}"

        try:
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
        finally:
            if not self.redis_client:
                await redis_conn.aclose()

    async def get_duplicate_count(self, tenant_id: str) -> Optional[int]:
        """Real count of duplicate ingest attempts blocked by the Redis lock, or None if Redis is unreachable."""
        try:
            redis_conn = await self._get_redis()
        except Exception as e:
            logger.warning("idempotency_duplicate_count_unavailable", error=str(e))
            return None
        try:
            value = await redis_conn.get(f"idempotency_duplicates_total:{tenant_id}")
            return int(value) if value is not None else 0
        except Exception as e:
            logger.warning("idempotency_duplicate_count_unavailable", error=str(e))
            return None
        finally:
            if not self.redis_client:
                await redis_conn.aclose()

    async def set_cached_state(
        self, tenant_id: str, idempotency_key: str, state: dict, ttl_seconds: int = 86400
    ) -> None:
        """Cache execution state for returning in duplicate requests."""
        redis_conn = await self._get_redis()
        state_key = f"idempotency_state:{tenant_id}:{idempotency_key}"
        try:
            await redis_conn.set(state_key, json.dumps(state), ex=ttl_seconds)
        finally:
            if not self.redis_client:
                await redis_conn.aclose()
