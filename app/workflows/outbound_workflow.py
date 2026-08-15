from datetime import timedelta
from typing import Any, Dict, List
from temporalio import workflow

with workflow.unsafe.imports_passed_by_value():
    from app.activities.outbound_activity import (
        discover_decision_maker_activity,
        discover_prospects_activity,
        disqualify_prospect_gate_activity,
        qualify_outbound_prospect_activity,
        research_prospect_activity,
        stage_prospect_in_crm_activity,
    )


@workflow.defn(name="OutboundProspectingWorkflow")
class OutboundProspectingWorkflow:
    """Temporal Workflow: Signal-Based Deep Research Outbound Engine."""

    @workflow.run
    async def run(self, tenant_key: str, batch_size: int = 5) -> Dict[str, Any]:
        workflow.logger.info(f"OutboundProspectingWorkflow started for tenant {tenant_key}, batch_size={batch_size}")

        activity_timeout = timedelta(seconds=60)

        # 1. Discover Prospects
        discovered_prospects: List[Dict[str, Any]] = await workflow.execute_activity(
            discover_prospects_activity,
            args=[tenant_key, batch_size],
            start_to_close_timeout=activity_timeout,
        )

        staged_count = 0
        disqualified_count = 0

        # 2. Process each prospect with isolated error handling
        for p in discovered_prospects:
            prospect_id = p["prospect_id"]
            company_name = p["company_name"]
            domain = p["domain"]

            # Step A: Circuit Breaker Gate
            icp_check: Dict[str, Any] = await workflow.execute_activity(
                disqualify_prospect_gate_activity,
                args=[prospect_id, company_name, domain],
                start_to_close_timeout=activity_timeout,
            )

            if not icp_check.get("is_viable_prospect", True):
                disqualified_count += 1
                workflow.logger.info(f"Prospect {company_name} ({domain}) disqualified at circuit breaker gate.")
                continue

            # Step B: Decision-Maker Finder
            target_roles = ["Head of Marketing", "Founder", "VP Growth"]
            dm_info: Dict[str, Any] = await workflow.execute_activity(
                discover_decision_maker_activity,
                args=[prospect_id, company_name, domain, target_roles],
                start_to_close_timeout=activity_timeout,
            )

            # Step C: Deep Research (Crawl4AI BM25)
            bm25_query = "ugc creator marketing roas product features"
            research_data: Dict[str, Any] = await workflow.execute_activity(
                research_prospect_activity,
                args=[prospect_id, company_name, domain, bm25_query],
                start_to_close_timeout=activity_timeout,
            )

            # Step D: LLM Structured Outreach Drafting
            qualification_data: Dict[str, Any] = await workflow.execute_activity(
                qualify_outbound_prospect_activity,
                args=[prospect_id, tenant_key, company_name, domain, research_data],
                start_to_close_timeout=activity_timeout,
            )

            # Step E: Human-in-the-Loop CRM Staging (Awaiting Approval)
            prospect_data = {
                "prospect_id": prospect_id,
                "company_name": company_name,
                "domain": domain,
                "decision_maker": dm_info,
            }
            await workflow.execute_activity(
                stage_prospect_in_crm_activity,
                args=[prospect_id, tenant_key, prospect_data, qualification_data],
                start_to_close_timeout=activity_timeout,
            )

            staged_count += 1

        workflow.logger.info(
            f"OutboundProspectingWorkflow completed: {staged_count} staged, {disqualified_count} disqualified."
        )

        return {
            "tenant_key": tenant_key,
            "discovered_total": len(discovered_prospects),
            "staged_awaiting_approval": staged_count,
            "circuit_disqualified": disqualified_count,
        }
