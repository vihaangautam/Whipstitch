import time
from typing import Optional, Tuple
from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Atomic Token Bucket Lua Script
# Keys: [rate_limit_key]
# ARGV: [capacity, refill_rate_per_sec, requested_tokens, current_timestamp]
TOKEN_BUCKET_LUA_SCRIPT = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local state = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(state[1])
local last_updated = tonumber(state[2])

if not tokens then
    tokens = capacity
    last_updated = now
else
    local delta = math.max(0, now - last_updated)
    tokens = math.min(capacity, tokens + (delta * refill_rate))
    last_updated = now
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
    redis.call('EXPIRE', key, 3600)
    return {1, 0}
else
    local missing = requested - tokens
    local wait_time = missing / refill_rate
    redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
    redis.call('EXPIRE', key, 3600)
    return {0, wait_time}
end
"""


class TokenBucketRateLimiter:
    """Atomic Redis Lua-backed Token Bucket rate limiter."""

    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client
        self._script_sha = None

    async def _get_redis(self) -> Redis:
        if self.redis_client:
            return self.redis_client
        return Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.5, socket_timeout=2.0)

    async def acquire_token(
        self,
        provider: str = "hubspot",
        tenant_id: str = "trifid_media",
        capacity: float = 10.0,
        refill_rate: float = 10.0,
        requested: float = 1.0,
    ) -> Tuple[bool, float]:
        """
        Atomically attempts to acquire tokens from the bucket.
        Returns: (allowed: bool, wait_time_seconds: float)
        """
        redis_conn = await self._get_redis()
        key = f"rate_limit:{tenant_id}:{provider}"
        now = time.time()

        try:
            res = await redis_conn.eval(
                TOKEN_BUCKET_LUA_SCRIPT,
                1,
                key,
                capacity,
                refill_rate,
                requested,
                now,
            )
            allowed = bool(res[0] == 1)
            wait_time = float(res[1])

            if not allowed:
                logger.warning(
                    "rate_limit_exceeded_queued",
                    provider=provider,
                    tenant_id=tenant_id,
                    wait_time=wait_time,
                )

            return allowed, wait_time
        finally:
            if not self.redis_client:
                await redis_conn.aclose()
