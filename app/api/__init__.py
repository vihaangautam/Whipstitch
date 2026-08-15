from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.ingest import router as ingest_router
from app.api.tenant import router as tenant_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.leads import router as leads_router
from app.api.v1.outbound import router as outbound_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(ingest_router, tags=["Ingestion"])
api_router.include_router(tenant_router, tags=["Tenant Configuration"])
api_router.include_router(leads_router, tags=["Inbound Leads"])
api_router.include_router(outbound_router, tags=["Outbound Prospecting"])
api_router.include_router(analytics_router, tags=["Pipeline Analytics"])



