import logging
import sys
import structlog


def setup_logging(log_level: str = "INFO") -> None:
    """Configures structured logging using structlog."""
    logging_level = getattr(logging, log_level.upper(), logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.JSONRenderer(),
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(logging_level)


def get_logger(name: str = "whipstitch"):
    return structlog.get_logger(name)


def bind_correlation_id(correlation_id: str):
    """Binds correlation_id (lead_id or run_id) to logger context.

    Only sets this one key — not clear_contextvars(), which would also wipe the
    request_id RequestObservabilityMiddleware binds for the whole HTTP request.
    """
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
