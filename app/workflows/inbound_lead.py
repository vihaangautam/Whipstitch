from datetime import timedelta
import asyncio
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.audit_activity import log_execution_step_activity
    from app.activities.crm_activity import sync_to_crm_activity
    from app.activities.enrichment_activity import enrich_lead_waterfall_activity
    from app.activities.qualification_activity import qualify_lead_llm_activity
    from app.activities.sla_activity import trigger_sla_escalation_activity


@workflow.defn(name="WhipstitchLeadWorkflow")
class WhipstitchLeadWorkflow:
    @workflow.run
    async def run(self, lead_event_data: dict) -> dict:
        event_id = lead_event_data.get("event_id", "unknown")
        tenant_id = lead_event_data.get("tenant_id", "trifid_media")
        email = lead_event_data.get("email", "")
        company_name = lead_event_data.get("company_name", "Unknown Company")
        sla_timer_override = lead_event_data.get("sla_timer_seconds")
        workflow_id = workflow.info().workflow_id

        # Canonical retry policy per tech_requirements_document.md §4
        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=10),
            maximum_attempts=5,
        )

        # Step 1: Log workflow execution start
        await workflow.execute_activity(
            log_execution_step_activity,
            args=[
                workflow_id,
                "WhipstitchLeadWorkflow",
                "inbound_lead_ingest_start",
                "started",
                event_id,
            ],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=retry_policy,
        )

        # Step 2: Deep Waterfall Enrichment Activity
        enrichment_profile = await workflow.execute_activity(
            enrich_lead_waterfall_activity,
            args=[event_id, tenant_id, email, company_name],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 3: Type-Safe 3-Part LLM Qualification Activity
        qualification_result = await workflow.execute_activity(
            qualify_lead_llm_activity,
            args=[event_id, tenant_id, enrichment_profile],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 4: HubSpot Sandbox CRM Sync Activity
        crm_result = await workflow.execute_activity(
            sync_to_crm_activity,
            args=[event_id, tenant_id, enrichment_profile, qualification_result],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 5: SLA Gate — If score > 80, start SLA timer for uncontacted lead escalation
        lead_score = qualification_result.get("lead_score", 0)
        escalated = False

        if lead_score > 80:
            sla_seconds = sla_timer_override if sla_timer_override is not None else 900  # Default 15 min
            workflow.logger.info(f"SLA timer started ({sla_seconds}s) for lead_score={lead_score}")

            # Wait for SLA timer window
            if sla_seconds > 0:
                await asyncio.sleep(sla_seconds)

            # Trigger Slack SLA escalation alert
            await workflow.execute_activity(
                trigger_sla_escalation_activity,
                args=[event_id, tenant_id, email, company_name, lead_score, qualification_result],
                start_to_close_timeout=timedelta(seconds=20),
                retry_policy=retry_policy,
            )
            escalated = True

        # Step 6: Log workflow completion audit record
        await workflow.execute_activity(
            log_execution_step_activity,
            args=[
                workflow_id,
                "WhipstitchLeadWorkflow",
                "inbound_lead_ingest_complete",
                "succeeded",
                event_id,
            ],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=retry_policy,
        )

        return {
            "status": "completed",
            "event_id": event_id,
            "tenant_id": tenant_id,
            "email": email,
            "company_name": company_name,
            "provider_used": enrichment_profile.get("provider_used"),
            "lead_score": lead_score,
            "crm_record_id": crm_result.get("crm_record_id"),
            "sla_escalated": escalated,
            "workflow_id": workflow_id,
        }
