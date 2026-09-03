"""Temporal Workflow for MEDDPICC Deal Diagnostic orchestration."""
from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from app.activities.audit_activity import log_execution_step_activity
    from app.activities.deal_diagnostic_activity import (
        extract_medpicc_scores_activity,
        parse_transcript_activity,
        render_medpicc_pdf_activity,
        update_crm_deal_stage_activity,
    )


@workflow.defn(name="DealDiagnosticWorkflow")
class DealDiagnosticWorkflow:
    """Temporal Workflow coordinating MEDDPICC parsing, multi-LLM evaluation, CRM stage sync, and PDF compilation."""

    @workflow.run
    async def run(self, deal_payload: Dict[str, Any]) -> Dict[str, Any]:
        deal_id = deal_payload.get("deal_id", "unknown-deal")
        tenant_id = deal_payload.get("tenant_id", "trifid_media")
        deal_name = deal_payload.get("deal_name", "Enterprise Deal")
        company_name = deal_payload.get("company_name", "Target Company")
        raw_transcript = deal_payload.get("transcript_text", "")
        filename = deal_payload.get("filename")
        deal_context = deal_payload.get("deal_context", {})
        preferred_model = deal_payload.get("preferred_model")
        workflow_id = workflow.info().workflow_id

        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=10),
            maximum_attempts=3,
        )

        # Step 1: Audit Log Start
        await workflow.execute_activity(
            log_execution_step_activity,
            args=[
                workflow_id,
                "DealDiagnosticWorkflow",
                "medpicc_diagnostic_start",
                "started",
                deal_id,
            ],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=retry_policy,
        )

        # Step 2: Parse Transcript Content
        parse_res = await workflow.execute_activity(
            parse_transcript_activity,
            args=[deal_id, raw_transcript, filename],
            start_to_close_timeout=timedelta(seconds=20),
            retry_policy=retry_policy,
        )
        cleaned_transcript = parse_res.get("cleaned_text", raw_transcript)

        # Step 3: Extract MEDDPICC Scores via Multi-LLM Router
        score_res = await workflow.execute_activity(
            extract_medpicc_scores_activity,
            args=[
                deal_id,
                tenant_id,
                deal_name,
                company_name,
                cleaned_transcript,
                deal_context,
                preferred_model,
            ],
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=retry_policy,
        )
        diagnostic_id = score_res["diagnostic_id"]
        qualification_model = score_res["qualification_model"]
        model_used = score_res["model_used"]

        # Step 4: Sync to CRM Pipeline Stage (HubSpot)
        crm_res = await workflow.execute_activity(
            update_crm_deal_stage_activity,
            args=[deal_id, tenant_id, company_name, qualification_model],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 5: Render PDF / HTML Report
        pdf_res = await workflow.execute_activity(
            render_medpicc_pdf_activity,
            args=[
                deal_id,
                diagnostic_id,
                deal_name,
                company_name,
                qualification_model,
                model_used,
            ],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )

        # Step 6: Audit Log Complete
        await workflow.execute_activity(
            log_execution_step_activity,
            args=[
                workflow_id,
                "DealDiagnosticWorkflow",
                "medpicc_diagnostic_complete",
                "succeeded",
                deal_id,
            ],
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=retry_policy,
        )

        return {
            "status": "completed",
            "deal_id": deal_id,
            "diagnostic_id": diagnostic_id,
            "overall_score": qualification_model.get("overall_qualification_score_0_100"),
            "deal_category": qualification_model.get("deal_category"),
            "crm_stage": crm_res.get("stage"),
            "report_path": pdf_res.get("report_path"),
            "model_used": model_used,
        }
