import asyncio
import sys
from temporalio.client import Client
from temporalio.worker import Worker

from app.activities.audit_activity import log_execution_step_activity
from app.activities.crm_activity import sync_to_crm_activity
from app.activities.enrichment_activity import enrich_lead_waterfall_activity
from app.activities.qualification_activity import qualify_lead_llm_activity
from app.activities.sla_activity import trigger_sla_escalation_activity
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.workflows.inbound_lead import WhipstitchLeadWorkflow

logger = get_logger(__name__)


async def run_worker():
    setup_logging(settings.LOG_LEVEL)
    logger.info(
        "starting_temporal_worker",
        temporal_host=settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
    )

    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE,
    )

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=[WhipstitchLeadWorkflow],
        activities=[
            log_execution_step_activity,
            enrich_lead_waterfall_activity,
            qualify_lead_llm_activity,
            sync_to_crm_activity,
            trigger_sla_escalation_activity,
        ],
    )

    logger.info("temporal_worker_running")
    await worker.run()


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("worker_stopped_by_user")
        sys.exit(0)
