from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import text
from temporalio.client import Client

from app.core.config import settings
from app.core.logging import get_logger
from app.db.session import AsyncSessionLocal

router = APIRouter()
logger = get_logger(__name__)


@router.get("/health", summary="Service Liveness and Health Check")
async def health_check():
    health_status = {
        "status": "healthy",
        "services": {
            "postgres": "unknown",
            "redis": "unknown",
            "temporal": "unknown",
        },
    }
    is_healthy = True

    # 1. Postgres Check
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        health_status["services"]["postgres"] = "ok"
    except Exception as e:
        logger.error("health_check_postgres_failed", error=str(e))
        health_status["services"]["postgres"] = f"failed: {str(e)}"
        is_healthy = False

    # 2. Redis Check
    try:
        redis_client = Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await redis_client.ping()
        await redis_client.aclose()
        health_status["services"]["redis"] = "ok"
    except Exception as e:
        logger.error("health_check_redis_failed", error=str(e))
        health_status["services"]["redis"] = f"failed: {str(e)}"
        is_healthy = False

    # 3. Temporal Check
    try:
        client = await Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE)
        health_status["services"]["temporal"] = "ok"
    except Exception as e:
        logger.error("health_check_temporal_failed", error=str(e))
        health_status["services"]["temporal"] = f"failed: {str(e)}"
        is_healthy = False

    if not is_healthy:
        health_status["status"] = "unhealthy"
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=health_status)

    return health_status
