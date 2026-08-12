import pytest
from app.core.rate_limiter import TokenBucketRateLimiter


@pytest.mark.asyncio
async def test_token_bucket_rate_limiter_local_logic():
    # Unit verification of TokenBucketRateLimiter instantiation
    limiter = TokenBucketRateLimiter(redis_client=None)
    assert limiter is not None
