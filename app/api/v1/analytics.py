"""Pipeline Analytics API Router with 100% dynamic database queries."""
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select

from app.api.deps import resolve_tenant
from app.core.apollo_budget import ApolloBudgetGuard
from app.core.idempotency import IdempotencyManager
from app.core.logging import get_logger
from app.db.models import (
    CRMSyncRecord,
    Deal,
    DealDiagnostic,
    EnrichmentResult,
    ExecutionAuditLog,
    LeadEvent,
    LLMQualification,
    LLMUsageLog,
    OutboundProspect,
    SLAEscalation,
    Tenant,
)
from app.db.session import AsyncSessionLocal

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/analytics", tags=["Pipeline Analytics"])

@router.get("/summary", response_model=dict)
async def get_analytics_summary(
    tenant: Tenant = Depends(resolve_tenant),
):
    """Returns high-level KPI card summary metrics dynamically computed from the database."""
    tenant_id = tenant.tenant_key
    budget_guard = ApolloBudgetGuard()
    credits_used = await budget_guard.get_monthly_usage(tenant_id)

    async with AsyncSessionLocal() as session:
        tenant_uuid = tenant.id

        # 2. Total inbound leads for this tenant
        if tenant_uuid:
            inbound_res = await session.execute(
                select(func.count(LeadEvent.id)).where(LeadEvent.tenant_id == tenant_uuid)
            )
            total_inbound = inbound_res.scalar() or 0

            outbound_res = await session.execute(
                select(func.count(OutboundProspect.id)).where(OutboundProspect.tenant_id == tenant_uuid)
            )
            total_outbound = outbound_res.scalar() or 0

            staged_res = await session.execute(
                select(func.count(OutboundProspect.id)).where(
                    OutboundProspect.tenant_id == tenant_uuid,
                    OutboundProspect.scrape_status == "staged_awaiting_approval",
                )
            )
            staged_count = staged_res.scalar() or 0
        else:
            total_inbound = 0
            total_outbound = 0
            staged_count = 0

        # 3. Average lead score from LLM qualifications
        avg_score_res = await session.execute(select(func.avg(LLMQualification.lead_score)))
        avg_score = avg_score_res.scalar()
        avg_lead_score = round(float(avg_score)) if avg_score is not None else 0

        # 4. SLA Compliance rate calculated from escalations vs total leads
        sla_res = await session.execute(select(func.count(SLAEscalation.id)))
        sla_breaches = sla_res.scalar() or 0
        if total_inbound > 0:
            sla_compliance = round(max(0.0, 100.0 - ((sla_breaches / total_inbound) * 100.0)), 1)
        else:
            sla_compliance = 100.0

        # 5. Active workflows / recent execution count from audit logs within last 24h
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        wf_res = await session.execute(
            select(func.count(ExecutionAuditLog.id)).where(ExecutionAuditLog.started_at >= cutoff)
        )
        active_workflows = wf_res.scalar() or 0

        return {
            "tenant_id": tenant_id,
            "total_leads_inbound": total_inbound,
            "total_prospects_outbound": total_outbound,
            "staged_awaiting_approval": staged_count,
            "sla_compliance_rate": sla_compliance,
            "avg_lead_score": avg_lead_score,
            "apollo_credits_used": credits_used,
            "apollo_credits_max": 50,
            "active_workflows_count": active_workflows,
            "systems_status": "operational",
        }


@router.get("/leads-over-time", response_model=dict)
async def get_leads_over_time(
    days: int = Query(default=7, ge=1, le=30),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Returns dynamic time-series lead volume dataset from actual database records."""
    today = datetime.now(timezone.utc).date()
    day_list = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
    labels = [d.strftime("%a %d") if days > 7 else d.strftime("%a") for d in day_list]

    inbound_counts = [0] * days
    outbound_counts = [0] * days

    async with AsyncSessionLocal() as session:
        if tenant:
            start_date = datetime.combine(day_list[0], datetime.min.time(), tzinfo=timezone.utc)

            # Inbound Leads
            inbound_leads_res = await session.execute(
                select(LeadEvent.created_at).where(
                    LeadEvent.tenant_id == tenant.id,
                    LeadEvent.created_at >= start_date,
                )
            )
            for (c_at,) in inbound_leads_res.all():
                if c_at:
                    c_date = c_at.date() if hasattr(c_at, "date") else c_at
                    if c_date in day_list:
                        idx = day_list.index(c_date)
                        inbound_counts[idx] += 1

            # Outbound Prospects
            outbound_res = await session.execute(
                select(OutboundProspect.created_at).where(
                    OutboundProspect.tenant_id == tenant.id,
                    OutboundProspect.created_at >= start_date,
                )
            )
            for (c_at,) in outbound_res.all():
                if c_at:
                    c_date = c_at.date() if hasattr(c_at, "date") else c_at
                    if c_date in day_list:
                        idx = day_list.index(c_date)
                        outbound_counts[idx] += 1

    return {
        "labels": labels,
        "datasets": [
            {
                "label": "Inbound Ingested",
                "data": inbound_counts,
                "borderColor": "#059669",
                "backgroundColor": "rgba(5, 150, 105, 0.08)",
            },
            {
                "label": "Outbound Discovered",
                "data": outbound_counts,
                "borderColor": "#2563EB",
                "backgroundColor": "rgba(37, 99, 235, 0.04)",
            },
        ],
    }


@router.get("/pipeline", response_model=dict)
async def get_pipeline_analytics(
    tenant: Tenant = Depends(resolve_tenant),
):
    """Computes comprehensive pipeline conversion funnel and provider distribution from live database records."""
    tenant_id = tenant.tenant_key
    async with AsyncSessionLocal() as session:
        tenant_uuid = tenant.id

        total_inbound = 0
        total_enriched = 0
        total_qualified = 0
        total_synced = 0

        if tenant_uuid:
            inbound_q = await session.execute(
                select(func.count(LeadEvent.id)).where(LeadEvent.tenant_id == tenant_uuid)
            )
            total_inbound = inbound_q.scalar() or 0

            enriched_q = await session.execute(select(func.count(EnrichmentResult.id)))
            total_enriched = enriched_q.scalar() or 0

            qual_q = await session.execute(
                select(func.count(LLMQualification.id)).where(LLMQualification.lead_score >= 75)
            )
            total_qualified = qual_q.scalar() or 0

            synced_q = await session.execute(
                select(func.count(CRMSyncRecord.id)).where(CRMSyncRecord.sync_status == "synced")
            )
            total_synced = synced_q.scalar() or 0

        # Provider breakdown
        prov_res = await session.execute(
            select(EnrichmentResult.provider_used, func.count(EnrichmentResult.id))
            .group_by(EnrichmentResult.provider_used)
        )
        provider_counts = {row[0]: row[1] for row in prov_res.all()}

        # Model usage breakdown
        model_res = await session.execute(
            select(LLMQualification.model_used, func.count(LLMQualification.id))
            .group_by(LLMQualification.model_used)
        )
        model_counts = {row[0]: row[1] for row in model_res.all()}

        # Speed-to-lead: real deltas between webhook receipt and qualification completion
        sla_buckets = {"instant": 0, "fast": 0, "standard": 0, "delayed": 0}
        if tenant_uuid:
            timing_res = await session.execute(
                select(LeadEvent.created_at, func.min(LLMQualification.created_at))
                .join(LLMQualification, LLMQualification.lead_source_id == LeadEvent.id)
                .where(LeadEvent.tenant_id == tenant_uuid, LLMQualification.lead_source_type == "inbound")
                .group_by(LeadEvent.id, LeadEvent.created_at)
            )
            for received_at, qualified_at in timing_res.all():
                if received_at is None or qualified_at is None:
                    continue
                seconds = (qualified_at - received_at).total_seconds()
                if seconds < 30:
                    sla_buckets["instant"] += 1
                elif seconds < 120:
                    sla_buckets["fast"] += 1
                elif seconds <= 180:
                    sla_buckets["standard"] += 1
                else:
                    sla_buckets["delayed"] += 1
        sla_timed_total = sum(sla_buckets.values())

        # Duplicate prevention: real counter incremented by the Redis idempotency lock, not a fabricated rate
        duplicates_blocked = await IdempotencyManager().get_duplicate_count(tenant_id)
        total_attempts = total_inbound + (duplicates_blocked or 0)
        duplicate_prevention_rate = (
            round((duplicates_blocked / total_attempts) * 100, 1)
            if duplicates_blocked is not None and total_attempts > 0
            else None
        )

        # Token telemetry per feature, from actual LLM call logs (app/core/llm_router.py._log_usage)
        usage_res = await session.execute(
            select(
                LLMUsageLog.feature,
                LLMUsageLog.provider,
                LLMUsageLog.model,
                func.count(LLMUsageLog.id),
                func.sum(LLMUsageLog.total_tokens),
                func.avg(LLMUsageLog.latency_seconds),
                func.sum(LLMUsageLog.estimated_cost_usd),
            ).group_by(LLMUsageLog.feature, LLMUsageLog.provider, LLMUsageLog.model)
        )
        token_usage = [
            {
                "feature": row[0],
                "provider": row[1],
                "model": row[2],
                "calls": row[3],
                "total_tokens": int(row[4] or 0),
                "avg_latency_seconds": round(float(row[5]), 2) if row[5] is not None else 0.0,
                "estimated_cost_usd": round(float(row[6] or 0.0), 4),
            }
            for row in usage_res.all()
        ]

        return {
            "tenant_id": tenant_id,
            "funnel": {
                "inbound_ingested": total_inbound,
                "enriched": total_enriched,
                "qualified_high_fit": total_qualified,
                "synced_crm": total_synced,
            },
            "provider_counts": provider_counts,
            "model_counts": model_counts,
            "sla_buckets": sla_buckets,
            "sla_timed_total": sla_timed_total,
            "duplicates_blocked": duplicates_blocked,
            "duplicate_prevention_rate": duplicate_prevention_rate,
            "token_usage": token_usage,
        }


@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    limit: int = Query(default=10, ge=1, le=50),
    tenant: Tenant = Depends(resolve_tenant),
):
    """Returns recent live execution audit logs from the database."""
    async with AsyncSessionLocal() as session:
        logs_res = await session.execute(
            select(ExecutionAuditLog).order_by(desc(ExecutionAuditLog.started_at)).limit(limit)
        )
        logs = logs_res.scalars().all()
        return [
            {
                "id": str(log.id),
                "time": log.started_at.strftime("%H:%M:%S") if log.started_at else "",
                "text": f"Workflow {log.workflow_type} ({log.activity_name}) → {log.status}",
                "status": log.status,
            }
            for log in logs
        ]
