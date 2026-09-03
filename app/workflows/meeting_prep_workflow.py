"""Temporal Workflow for Meeting Intelligence, Calendar Prep & Champion Notes."""
from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.meeting_prep_activity import (
        fetch_company_signals_activity,
        generate_champion_selling_kit_activity,
        generate_pre_call_briefing_activity,
        profile_meeting_attendees_activity,
    )


@workflow.defn(name="MeetingPrepWorkflow")
class MeetingPrepWorkflow:
    """Temporal Workflow coordinating attendee profiling, Serper company signals, pre-call briefing, and champion kit."""

    @workflow.run
    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        meeting_id = payload.get("meeting_id", "meeting-unknown")
        deal_id = payload.get("deal_id")
        meeting_title = payload.get("title", "Discovery Call")
        company_name = payload.get("company_name", "Target Prospect")
        scheduled_time = payload.get("scheduled_time")
        raw_attendees = payload.get("attendees", [])
        champion_name = payload.get("champion_name", "Sarah Chen")
        champion_title = payload.get("champion_title", "VP RevOps")
        deal_gaps = payload.get("deal_gaps")

        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=10),
            maximum_attempts=3,
        )

        # Step 1: Profile Meeting Attendees
        enriched_attendees = await workflow.execute_activity(
            profile_meeting_attendees_activity,
            args=[raw_attendees, company_name],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )

        # Step 2: Fetch Google Serper Company Signals
        company_signals = await workflow.execute_activity(
            fetch_company_signals_activity,
            args=[company_name],
            start_to_close_timeout=timedelta(seconds=15),
            retry_policy=retry_policy,
        )

        # Step 3: Generate Pre-Call Executive Briefing
        briefing = await workflow.execute_activity(
            generate_pre_call_briefing_activity,
            args=[
                meeting_id,
                meeting_title,
                company_name,
                scheduled_time,
                enriched_attendees,
                company_signals,
                deal_gaps,
            ],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )

        # Step 4: Synthesize 7-Filter Champion Selling Kit
        champion_kit = await workflow.execute_activity(
            generate_champion_selling_kit_activity,
            args=[
                meeting_id,
                deal_id,
                champion_name,
                champion_title,
                company_name,
            ],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )

        return {
            "meeting_id": meeting_id,
            "briefing": briefing,
            "champion_kit": champion_kit,
            "status": "completed",
        }
