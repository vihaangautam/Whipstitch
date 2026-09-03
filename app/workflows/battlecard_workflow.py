"""Temporal Workflow for Competitor Battlecard generation."""
from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.battlecard_activity import generate_competitor_battlecard_activity


@workflow.defn(name="BattlecardWorkflow")
class BattlecardWorkflow:
    """Orchestrates the 5-stage blackboard battlecard generation pipeline."""

    @workflow.run
    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        competitor_name = payload.get("competitor_name", "Unknown Competitor")
        buyer_company = payload.get("buyer_company")
        deal_context = payload.get("deal_context")

        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=10),
            maximum_attempts=3,
        )

        battlecard = await workflow.execute_activity(
            generate_competitor_battlecard_activity,
            args=[competitor_name, buyer_company, deal_context],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        return {
            "status": "completed",
            "battlecard": battlecard,
        }
