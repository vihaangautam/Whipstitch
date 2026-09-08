"""Temporal Workflow: AI meeting prep (pre-call briefing + 7-filter champion kit)."""
from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.meeting_prep_activity import (
        build_champion_kit_activity,
        build_meeting_briefing_activity,
    )

_RETRY = RetryPolicy(
    initial_interval=timedelta(seconds=1),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=10),
    maximum_attempts=3,
)


@workflow.defn(name="MeetingPrepWorkflow")
class MeetingPrepWorkflow:
    """Regenerates a meeting's briefing and champion kit for a persisted meeting id."""

    @workflow.run
    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        meeting_id = payload["meeting_id"]

        briefing = await workflow.execute_activity(
            build_meeting_briefing_activity,
            args=[meeting_id],
            start_to_close_timeout=timedelta(seconds=90),
            retry_policy=_RETRY,
        )
        champion_kit = await workflow.execute_activity(
            build_champion_kit_activity,
            args=[meeting_id],
            start_to_close_timeout=timedelta(seconds=90),
            retry_policy=_RETRY,
        )
        return {"meeting_id": meeting_id, "briefing": briefing, "champion_kit": champion_kit, "status": "completed"}
