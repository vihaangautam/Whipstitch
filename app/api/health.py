from fastapi import APIRouter, status
from fastapi.responses import JSONResponse, PlainTextResponse
from redis.asyncio import Redis
from sqlalchemy import text
from temporalio.client import Client

from app.core.config import settings
from app.core.logging import get_logger
from app.db.session import AsyncSessionLocal

router = APIRouter()
logger = get_logger(__name__)


@router.get("/ping", summary="Minimal keep-alive ping", include_in_schema=False)
async def ping():
    """A handful of bytes, nothing else — for uptime pingers (cron-job.org etc).
    Some of them abort with "output too large" on anything bigger than a trivial
    body, per their own docs: output as little as possible. /health still does
    the real Postgres/Redis/Temporal diagnostic for humans and dashboards."""
    return PlainTextResponse("ok")


@router.get("/health", summary="Service Liveness and Health Check")
async def health_check():
    """Postgres (or its SQLite fallback) is required. Redis and Temporal are optional —
    the app degrades to in-memory locks and inline workflow execution without them, so a
    missing Redis/Temporal reports 'degraded' (200), not 'unhealthy' (503)."""
    services = {"postgres": "unknown", "redis": "unknown", "temporal": "unknown"}
    db_ok = True

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        services["postgres"] = "ok"
    except Exception as e:
        logger.error("health_check_postgres_failed", error=str(e))
        services["postgres"] = f"failed: {str(e)}"
        db_ok = False

    try:
        redis_client = Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await redis_client.ping()
        await redis_client.aclose()
        services["redis"] = "ok"
    except Exception as e:
        logger.warning("health_check_redis_unavailable", error=str(e))
        services["redis"] = "unavailable (using in-memory fallback)"

    try:
        await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE)
        services["temporal"] = "ok"
    except Exception as e:
        logger.warning("health_check_temporal_unavailable", error=str(e))
        services["temporal"] = "unavailable (running workflows inline)"

    if not db_ok:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            content={"status": "unhealthy", "services": services})

    degraded = any(v != "ok" for v in services.values())
    return {"status": "degraded" if degraded else "healthy", "services": services}
