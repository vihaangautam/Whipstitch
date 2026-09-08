"""Temporal Workflow for Competitor Battlecard generation (LLM, tenant-specific)."""
from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.battlecard_activity import (
        auto_generate_tenant_battlecards_activity,
        generate_competitor_battlecard_activity,
    )

_RETRY = RetryPolicy(
    initial_interval=timedelta(seconds=1),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=10),
    maximum_attempts=3,
)


@workflow.defn(name="BattlecardWorkflow")
class BattlecardWorkflow:
    """Generates one named battlecard, or a full auto set, for a tenant."""

    @workflow.run
    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        tenant_key = payload.get("tenant_key", "trifid_media")
        competitor_name = payload.get("competitor_name")

        if competitor_name:
            card = await workflow.execute_activity(
                generate_competitor_battlecard_activity,
                args=[competitor_name, tenant_key, payload.get("buyer_company"), payload.get("deal_context")],
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=_RETRY,
            )
            return {"status": "completed", "battlecards": [card]}

        cards = await workflow.execute_activity(
            auto_generate_tenant_battlecards_activity,
            args=[tenant_key],
            start_to_close_timeout=timedelta(seconds=180),
            retry_policy=_RETRY,
        )
        return {"status": "completed", "battlecards": cards}
