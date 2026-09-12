"""Bounded Temporal connection helper.

Every "try Temporal, fall back to inline execution" call site called `Client.connect()`
directly with no timeout. Measured against an unreachable Temporal host (the actual state
of every non-local deployment of this app — there is no Temporal server running anywhere
it's hosted), that call takes ~6.4 seconds to fail before the except block's fallback runs.
That is not a fast, resilient fallback; it is a 6-second stall on every inbound webhook,
every outbound trigger, every meeting-prep call, and the /health check itself.

Found via k6 load testing on 2026-09-12 — the exact kind of thing a fabricated
BENCHMARK.md hides.
"""
import asyncio
from typing import Optional

from temporalio.client import Client

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# A reachable Temporal server (local or managed) completes the gRPC handshake in well
# under this; a genuinely absent one is what every deployment of this app hits today (see
# Section 0 of the product guide), so the timeout is tuned to make that the common case
# cheap, not to accommodate a slow-but-present server.
DEFAULT_CONNECT_TIMEOUT_SECONDS = 0.5


async def get_temporal_client(timeout: float = DEFAULT_CONNECT_TIMEOUT_SECONDS) -> Optional[Client]:
    """Connects to Temporal with a hard timeout. Returns None instead of raising so every
    call site's existing `if client: ... else: run inline` fallback needs no other change."""
    try:
        return await asyncio.wait_for(
            Client.connect(settings.TEMPORAL_HOST, namespace=settings.TEMPORAL_NAMESPACE),
            timeout=timeout,
        )
    except Exception as e:
        logger.warning("temporal_connect_unavailable", error=str(e), timeout_seconds=timeout)
        return None
