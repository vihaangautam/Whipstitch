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

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app.include_router(api_router)

# Mount static frontend assets from dist if available, else frontend/
dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

if os.path.exists(os.path.join(dist_path, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/dashboard", include_in_schema=False)
@app.get("/", include_in_schema=False)
async def serve_react_app():
    dist_index = os.path.join(dist_path, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    
    src_index = os.path.join(frontend_path, "index.html")
    if os.path.exists(src_index):
        return FileResponse(src_index)

    return {
        "name": "Whipstitch API Engine",
        "status": "running",
        "dashboard": "/dashboard",
        "docs": "/docs",
    }


@app.get("/api/info", include_in_schema=False)
async def api_info():
    return {
        "name": "Whipstitch API Engine",
        "status": "running",
        "dashboard": "/dashboard",
        "docs": "/docs",
    }




