import uuid

import pytest
from app.core.apollo_budget import ApolloBudgetGuard


@pytest.mark.asyncio
async def test_apollo_budget_limit_enforcement():
    guard = ApolloBudgetGuard(monthly_limit=5)
    # A fixed tenant_id here shares one Redis key (60-day TTL) across every run against a
    # real Redis — this test passed only because it always ran against the in-memory
    # fallback before. A unique id per run makes it correct regardless of backend.
    tenant_id = f"test_budget_tenant_{uuid.uuid4().hex[:8]}"

    # Consume 4 credits (Allowed)
    assert await guard.can_consume(tenant_id, credits=4) is True
    assert await guard.consume_credits(tenant_id, credits=4) is True

    # Try to consume 2 more credits (Should exceed cap 5)
    assert await guard.can_consume(tenant_id, credits=2) is False
    assert await guard.consume_credits(tenant_id, credits=2) is False


@pytest.mark.asyncio
async def test_apollo_budget_usage_counter():
    guard = ApolloBudgetGuard(monthly_limit=50)
    tenant_id = f"counter_tenant_{uuid.uuid4().hex[:8]}"

    initial_usage = await guard.get_monthly_usage(tenant_id)
    await guard.consume_credits(tenant_id, credits=3)
    new_usage = await guard.get_monthly_usage(tenant_id)

    assert new_usage == initial_usage + 3
