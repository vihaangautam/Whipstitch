"""Request-scoped correlation IDs and Prometheus metrics.

Every inbound HTTP request gets a request_id bound into structlog's contextvars (so every
log line emitted while handling it — across routers, services, activities run inline —
carries the same id) and echoed back as `X-Request-ID`, so a user-reported error and a
server log line can be tied together without grepping timestamps.

Metrics are the minimum that answers "is the service healthy and how fast is it" from
outside the process: request count and latency by route and status. Deliberately not
wired up: per-business-metric counters (leads qualified, deals diagnosed, etc.) — those
belong in Pipeline Analytics, which already computes them from the database, not in a
second, parallel counting system that can drift from the source of truth.
"""
import time
import uuid

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger(__name__)

REQUEST_ID_HEADER = "X-Request-ID"

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests handled",
    ["method", "route", "status"],
)
http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "route"],
)


class RequestObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())

        import structlog

        structlog.contextvars.bind_contextvars(request_id=request_id)
        start = time.perf_counter()

        def _route_path() -> str:
            # Route pattern (e.g. "/v1/deals/{deal_id}"), not the raw path — otherwise every
            # distinct deal id becomes its own Prometheus time series, which is how a metrics
            # backend quietly falls over (unbounded label cardinality). Only resolved in
            # request.scope once routing has run, i.e. after call_next() returns below.
            route = request.scope.get("route")
            return route.path if route is not None else request.url.path

        try:
            response = await call_next(request)
        except Exception:
            duration = time.perf_counter() - start
            route_path = _route_path()
            http_requests_total.labels(request.method, route_path, "500").inc()
            http_request_duration_seconds.labels(request.method, route_path).observe(duration)
            logger.error(
                "http_request_unhandled_exception",
                method=request.method,
                path=route_path,
                duration_ms=round(duration * 1000, 1),
            )
            raise
        finally:
            structlog.contextvars.unbind_contextvars("request_id")

        duration = time.perf_counter() - start
        route_path = _route_path()
        http_requests_total.labels(request.method, route_path, str(response.status_code)).inc()
        http_request_duration_seconds.labels(request.method, route_path).observe(duration)
        response.headers[REQUEST_ID_HEADER] = request_id
        logger.info(
            "http_request_completed",
            method=request.method,
            path=route_path,
            status=response.status_code,
            duration_ms=round(duration * 1000, 1),
        )
        return response


def metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
