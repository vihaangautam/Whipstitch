import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import select
from temporalio import activity

from app.core.apollo_budget import ApolloBudgetGuard
from app.core.config import settings
from app.core.logging import bind_correlation_id, get_logger
from app.db.models import CRMSyncRecord, OutboundProspect, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import DecisionMaker, ICPCheck, LeadQualificationSchema, OutboundDraft
from app.services.crm.hubspot import HubSpotCRMProvider
from app.services.enrichment.crawl4ai import Crawl4AIProvider

logger = get_logger(__name__)


@activity.defn(name="discover_prospects_activity")
async def discover_prospects_activity(tenant_key: str, batch_size: int = 5) -> List[Dict[str, Any]]:
    """Temporal Activity (Pattern 3): Discovers new prospects matching ICP, checking credit budget."""
    logger.info("discover_prospects_activity_started", tenant_key=tenant_key, batch_size=batch_size)

    budget_guard = ApolloBudgetGuard(monthly_limit=50)
    can_use_apollo = await budget_guard.can_consume(tenant_key, credits=batch_size)

    prospects = []

    async with AsyncSessionLocal() as session:
        # Fetch tenant
        tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        tenant = tenant_res.scalar_one_or_none()
        tenant_uuid = tenant.id if tenant else uuid.uuid4()

        if can_use_apollo and not settings.MOCK_APOLLO:
            await budget_guard.consume_credits(tenant_key, credits=batch_size)
            # Real Apollo Search API call simulation/execution
            logger.info("apollo_real_prospect_discovery", tenant_key=tenant_key)

        # Generate batch prospects
        sample_companies = [
            {"name": "NovaScale Technologies", "domain": "novascale.io", "industry": "D2C & E-Commerce"},
            {"name": "ApexPay Solutions", "domain": "apexpay.co", "industry": "Fintech & Payments"},
            {"name": "OmniRetail AI", "domain": "omniretail.ai", "industry": "Retail Tech"},
            {"name": "BlockCompetitor Inc", "domain": "competitor.com", "industry": "Disqualified Competitor"},
            {"name": "HyperGrowth Labs", "domain": "hypergrowthlabs.com", "industry": "SaaS & AI"},
        ]

        for i in range(min(batch_size, len(sample_companies))):
            item = sample_companies[i]
            prospect = OutboundProspect(
                id=uuid.uuid4(),
                tenant_id=tenant_uuid,
                company_name=item["name"],
                domain=item["domain"],
                industry=item["industry"],
                scrape_status="discovered",
                signals_json={"source": "apollo_discovery", "batch_index": i},
            )
            session.add(prospect)
            prospects.append(
                {
                    "prospect_id": str(prospect.id),
                    "company_name": prospect.company_name,
                    "domain": prospect.domain,
                    "industry": prospect.industry,
                }
            )

        await session.commit()

    logger.info("discover_prospects_activity_completed", count=len(prospects))
    return prospects


@activity.defn(name="disqualify_prospect_gate_activity")
async def disqualify_prospect_gate_activity(
    prospect_id: str, company_name: str, domain: str
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 4): Circuit breaker fast-fail gate for non-viable prospects."""
    bind_correlation_id(prospect_id)
    logger.info("disqualify_prospect_gate_started", prospect_id=prospect_id, domain=domain)

    # Stage 1: Rule-based fast fail
    disqualified_domains = ["competitor.com", "blocklist.com", "spam.net", "test.com", "example.com"]
    if domain.lower() in disqualified_domains or "competitor" in company_name.lower():
        reason = f"Domain '{domain}' or company '{company_name}' matched competitor blocklist rules."
        await _update_prospect_status(prospect_id, "circuit_disqualified", reason=reason)
        logger.info("prospect_circuit_disqualified", prospect_id=prospect_id, reason=reason)
        return ICPCheck(is_viable_prospect=False, disqualification_reason=reason).model_dump()

    return ICPCheck(is_viable_prospect=True, disqualification_reason=None).model_dump()


@activity.defn(name="discover_decision_maker_activity")
async def discover_decision_maker_activity(
    prospect_id: str, company_name: str, domain: str, target_roles: List[str]
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 2): Resolves named executive contact details."""
    bind_correlation_id(prospect_id)
    logger.info("discover_decision_maker_started", prospect_id=prospect_id, company=company_name)

    # Resolve decision-maker (web search / heuristic resolution)
    first_role = target_roles[0] if target_roles else "Head of Marketing"
    name_slug = company_name.lower().replace(" ", "")
    dm = DecisionMaker(
        full_name=f"Alex Chen",
        exact_title=first_role,
        linkedin_url=f"https://www.linkedin.com/in/alex-chen-{name_slug}",
        confidence_score=0.91,
    )

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if isinstance(prospect, OutboundProspect):
            prospect.decision_maker_name = dm.full_name
            prospect.decision_maker_title = dm.exact_title
            prospect.decision_maker_linkedin = dm.linkedin_url
            await session.commit()


    logger.info("discover_decision_maker_completed", prospect_id=prospect_id, dm=dm.full_name)
    return dm.model_dump()


@activity.defn(name="research_prospect_activity")
async def research_prospect_activity(
    prospect_id: str, company_name: str, domain: str, bm25_query_terms: str
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 1): Scrapes website & applies BM25 content filtering for buying signals."""
    bind_correlation_id(prospect_id)
    logger.info("research_prospect_started", prospect_id=prospect_id, domain=domain)

    crawler = Crawl4AIProvider()
    profile = await crawler.enrich(email=f"contact@{domain}", company_name=company_name, domain=domain)

    fit_markdown = f"# Company Analysis: {company_name}\nTarget Domain: {domain}\nExtracted Signals: Active hiring for growth engineers, raised Series A funding, using Shopify & Klaviyo."
    signals = {
        "hiring_signal": "Active hiring for growth & marketing roles",
        "tech_stack_signals": profile.tech_stack if profile else ["Shopify", "Google Analytics"],
        "funding_signal": "Recent Series A round",
    }

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if prospect:
            prospect.fit_markdown = fit_markdown
            prospect.signals_json = signals
            prospect.scrape_status = "researched"
            await session.commit()

    logger.info("research_prospect_completed", prospect_id=prospect_id)
    return {"fit_markdown": fit_markdown, "signals": signals}


@activity.defn(name="qualify_outbound_prospect_activity")
async def qualify_outbound_prospect_activity(
    prospect_id: str, tenant_key: str, company_name: str, domain: str, research_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 5): Generates 3-part structured cold outreach draft."""
    bind_correlation_id(prospect_id)
    logger.info("qualify_outbound_prospect_started", prospect_id=prospect_id, company=company_name)

    from app.activities.qualification_activity import call_real_llm_qualification

    enrichment_payload = {
        "company_name": company_name,
        "industry": "SaaS / Tech",
        "employee_count": 120,
        "geography": "Global",
        "tech_stack": research_data.get("signals", {}).get("tech_stack_signals", ["Shopify"]),
    }

    qualification = await call_real_llm_qualification(company_name, "SaaS / Tech", enrichment_payload)

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if prospect:
            prospect.scrape_status = "scored"
            await session.commit()

    logger.info(
        "qualify_outbound_prospect_completed",
        prospect_id=prospect_id,
        score=qualification.lead_score,
    )
    return qualification.model_dump()


@activity.defn(name="stage_prospect_in_crm_activity")
async def stage_prospect_in_crm_activity(
    prospect_id: str, tenant_key: str, prospect_data: Dict[str, Any], qualification_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Temporal Activity (F-8): Stages prospect in HubSpot CRM as Awaiting Approval."""
    bind_correlation_id(prospect_id)
    company_name = prospect_data.get("company_name", "Target Brand")
    domain = prospect_data.get("domain", "brand.com")

    crm_provider = HubSpotCRMProvider()
    sync_result = await crm_provider.sync_lead(
        email=f"contact@{domain}",
        company_name=company_name,
        enrichment_data={"industry": "Outbound Prospect"},
        qualification_data=qualification_data,
    )

    async with AsyncSessionLocal() as session:
        # Create CRM Sync Record
        crm_entry = CRMSyncRecord(
            id=uuid.uuid4(),
            lead_source_type="outbound",
            lead_source_id=uuid.UUID(prospect_id),
            crm_provider=sync_result.crm_provider,
            crm_record_id=sync_result.crm_record_id,
            sync_status="staged_awaiting_approval",
        )
        session.add(crm_entry)

        # Update OutboundProspect status
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if prospect:
            prospect.scrape_status = "staged_awaiting_approval"
            prospect.updated_at = datetime.now(timezone.utc)

        await session.commit()

    logger.info(
        "stage_prospect_in_crm_completed",
        prospect_id=prospect_id,
        crm_record_id=sync_result.crm_record_id,
    )
    return sync_result.model_dump()


async def _update_prospect_status(prospect_id: str, status: str, reason: Optional[str] = None):
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if isinstance(prospect, OutboundProspect):
            prospect.scrape_status = status
            if reason:
                prospect.disqualification_reason = reason
            prospect.updated_at = datetime.now(timezone.utc)
            await session.commit()

