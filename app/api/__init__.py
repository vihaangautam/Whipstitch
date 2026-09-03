from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.ingest import router as ingest_router
from app.api.tenant import router as tenant_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.deals import router as deals_router
from app.api.v1.leads import router as leads_router
from app.api.v1.outbound import router as outbound_router
from app.api.v1.settings import router as settings_router

from app.api.v1.meetings import router as meetings_router
from app.api.v1.battlecards import router as battlecards_router
from app.api.v1.signals import router as signals_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(ingest_router, tags=["Ingestion"])
api_router.include_router(tenant_router, tags=["Tenant Configuration"])
api_router.include_router(leads_router, tags=["Inbound Leads"])
api_router.include_router(outbound_router, tags=["Outbound Prospecting"])
api_router.include_router(deals_router, tags=["Deal Intelligence & MEDDPICC"])
api_router.include_router(meetings_router, tags=["Meeting Intelligence & Calendar Prep"])
api_router.include_router(battlecards_router, tags=["Competitor Battlecards"])
api_router.include_router(signals_router, tags=["6-Signal Autonomous Account Agent"])
api_router.include_router(settings_router, tags=["BYOK Settings"])
api_router.include_router(analytics_router, tags=["Pipeline Analytics"])




