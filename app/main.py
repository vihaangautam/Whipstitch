from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.LOG_LEVEL)
    logger.info("whipstitch_app_starting", environment=settings.ENVIRONMENT)
    yield
    logger.info("whipstitch_app_shutting_down")


app = FastAPI(
    title="Whipstitch — AI Lead Engine",
    description="Durable lead orchestration, enrichment, scoring, and CRM sync engine.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "Whipstitch API Engine",
        "status": "running",
        "docs": "/docs",
    }
