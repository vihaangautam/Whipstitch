from datetime import datetime, timezone
import uuid
from temporalio import activity
from sqlalchemy import select

from app.core.logging import bind_correlation_id, get_logger
from app.db.models import ExecutionAuditLog
from app.db.session import AsyncSessionLocal

logger = get_logger(__name__)


@activity.defn(name="log_execution_step_activity")
async def log_execution_step_activity(
    workflow_id: str,
    workflow_type: str,
    activity_name: str,
    status: str,
    correlation_id: str,
    error_message: str | None = None,
) -> str:
    """Logs an execution step to structlog and Postgres execution_audit_log table."""
    bind_correlation_id(correlation_id)

    logger.info(
        "execution_step_audit",
        workflow_id=workflow_id,
        workflow_type=workflow_type,
        activity_name=activity_name,
        step_status=status,
        error_message=error_message,
    )

    now = datetime.now(timezone.utc)
    audit_entry = ExecutionAuditLog(
        id=uuid.uuid4(),
        workflow_id=workflow_id,
        workflow_type=workflow_type,
        activity_name=activity_name,
        status=status,
        started_at=now,
        completed_at=now if status in ["succeeded", "failed"] else None,
        error_message=error_message,
    )

    async with AsyncSessionLocal() as session:
        session.add(audit_entry)
        await session.commit()

    return str(audit_entry.id)
