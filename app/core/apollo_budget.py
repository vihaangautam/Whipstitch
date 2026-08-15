"""Apollo Credit Budget Guard using Redis counters with hard cap limits."""
from datetime import datetime, timezone
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Fallback in-memory counter if Redis is disconnected during unit tests
_in_memory_budget_store: dict[str, int] = {}


class ApolloBudgetGuard:
    def __init__(self, monthly_limit: int = 50):
        self.monthly_limit = monthly_limit
        self.redis_url = settings.REDIS_URL

    def _get_key(self, tenant_id: str) -> str:
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        return f"apollo_credit_budget:{tenant_id}:{current_month}"

    async def get_monthly_usage(self, tenant_id: str) -> int:
        key = self._get_key(tenant_id)
        try:
            r = aioredis.from_url(self.redis_url, decode_responses=True)
            val = await r.get(key)
            await r.aclose()
            return int(val) if val else 0
        except Exception:
            return _in_memory_budget_store.get(key, 0)

    async def can_consume(self, tenant_id: str, credits: int = 1) -> bool:
        usage = await self.get_monthly_usage(tenant_id)
        if usage + credits > self.monthly_limit:
            logger.warning(
                "apollo_credit_budget_exceeded",
                tenant_id=tenant_id,
                current_usage=usage,
                requested_credits=credits,
                monthly_limit=self.monthly_limit,
            )
            return False
        return True

    async def consume_credits(self, tenant_id: str, credits: int = 1) -> bool:
        if not await self.can_consume(tenant_id, credits):
            return False

        key = self._get_key(tenant_id)
        try:
            r = aioredis.from_url(self.redis_url, decode_responses=True)
            new_val = await r.incrby(key, credits)
            await r.expire(key, 60 * 24 * 3600)  # 60 days TTL
            await r.aclose()
            logger.info("apollo_credit_consumed", tenant_id=tenant_id, credits=credits, total_usage=new_val)
            return True
        except Exception:
            _in_memory_budget_store[key] = _in_memory_budget_store.get(key, 0) + credits
            logger.info(
                "apollo_credit_consumed_in_memory",
                tenant_id=tenant_id,
                credits=credits,
                total_usage=_in_memory_budget_store[key],
            )
            return True
