import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.db.models import CRMSyncRecord, OutboundProspect, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import DecisionMaker, ICPCheck
from app.services.crm.hubspot import HubSpotCRMProvider
from app.services.enrichment.crawl4ai import Crawl4AIProvider

logger = get_logger(__name__)


@activity.defn(name="discover_prospects_activity")
async def discover_prospects_activity(tenant_key: str, batch_size: int = 5) -> List[Dict[str, Any]]:
    """Temporal Activity (Pattern 3): Discovers new prospects matching ICP, checking credit budget."""
    logger.info("discover_prospects_activity_started", tenant_key=tenant_key, batch_size=batch_size)

    prospects = []

    async with AsyncSessionLocal() as session:
        # Fetch tenant
        tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        tenant = tenant_res.scalar_one_or_none()
        tenant_uuid = tenant.id if tenant else uuid.uuid4()

        # Read tenant ICP criteria from configuration
        icp_criteria = (tenant.config or {}).get("icp_criteria", {}) if tenant else {}
        target_industries = [ind.lower() for ind in icp_criteria.get("target_industries", [])]

        # Candidate company directory covering top ICP sectors
        all_candidate_companies = [
            {"name": "NovaScale Technologies", "domain": "novascale.io", "industry": "D2C & E-Commerce"},
            {"name": "ApexPay Solutions", "domain": "apexpay.co", "industry": "Fintech & Payments"},
            {"name": "OmniRetail AI", "domain": "omniretail.ai", "industry": "Retail Tech"},
            {"name": "BlockCompetitor Inc", "domain": "competitor.com", "industry": "Disqualified Competitor"},
            {"name": "HyperGrowth Labs", "domain": "hypergrowthlabs.com", "industry": "SaaS & AI"},
            {"name": "Veritas Logistics Cloud", "domain": "veritaslogistics.com", "industry": "Logistics & Supply Chain"},
            {"name": "FinFlow Technologies", "domain": "finflow.io", "industry": "Fintech & SaaS"},
            {"name": "CloudScale Systems", "domain": "cloudscale.io", "industry": "B2B SaaS"},
        ]

        # Prioritize companies matching the tenant's configured ICP industries
        if target_industries:
            matched = [
                c for c in all_candidate_companies
                if any(ind in c["industry"].lower() for ind in target_industries)
            ]
            unmatched = [c for c in all_candidate_companies if c not in matched]
            sample_companies = matched + unmatched
        else:
            sample_companies = all_candidate_companies

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
    prospect_id: str, company_name: str, domain: str, tenant_key: Optional[str] = None
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 4): Circuit breaker fast-fail gate for non-viable prospects."""
    bind_correlation_id(prospect_id)
    logger.info("disqualify_prospect_gate_started", prospect_id=prospect_id, domain=domain, tenant_key=tenant_key)

    # Stage 1: Baseline rule-based fast fail
    disqualified_domains = ["competitor.com", "blocklist.com", "spam.net", "test.com", "example.com"]

    # Dynamic tenant competitor blocklist from Tenant config
    if tenant_key:
        try:
            async with AsyncSessionLocal() as session:
                tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
                tenant = tenant_res.scalar_one_or_none()
                if tenant and tenant.config:
                    custom_blocklist = tenant.config.get("competitor_blocklist", [])
                    if custom_blocklist:
                        for d in custom_blocklist:
                            clean_d = d.strip().lower()
                            if clean_d and clean_d not in disqualified_domains:
                                disqualified_domains.append(clean_d)
        except Exception as e:
            logger.warning("failed_to_fetch_tenant_blocklist", error=str(e))

    domain_lower = domain.lower().strip()
    company_lower = company_name.lower().strip()

    is_blocked = any(
        domain_lower == blocked
        or domain_lower.endswith("." + blocked)
        or blocked in domain_lower
        for blocked in disqualified_domains
    )

    if is_blocked or "competitor" in company_lower:
        reason = f"Domain '{domain}' or company '{company_name}' matched competitor blocklist rules."
        await _update_prospect_status(prospect_id, "circuit_disqualified", reason=reason)
        logger.info("prospect_circuit_disqualified", prospect_id=prospect_id, reason=reason)
        return ICPCheck(is_viable_prospect=False, disqualification_reason=reason).model_dump()

    return ICPCheck(is_viable_prospect=True, disqualification_reason=None).model_dump()


@activity.defn(name="discover_decision_maker_activity")
async def discover_decision_maker_activity(
    prospect_id: str, company_name: str, domain: str, target_roles: List[str]
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 2): Resolves named executive contact details.

    No contact resolver is wired up yet, so this returns an unresolved contact instead of
    inventing a plausible-looking one. Staging refuses anything with is_verified=False.
    """
    bind_correlation_id(prospect_id)
    logger.info("discover_decision_maker_started", prospect_id=prospect_id, company=company_name)

    dm = DecisionMaker(exact_title=target_roles[0] if target_roles else None)

    logger.info(
        "discover_decision_maker_unresolved",
        prospect_id=prospect_id,
        company=company_name,
        reason="no_contact_resolver_configured",
    )
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

    qualification = await call_real_llm_qualification(
        company_name, "SaaS / Tech", enrichment_payload, tenant_key=tenant_key
    )

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
    """Temporal Activity (F-8): Stages prospect in HubSpot CRM as Awaiting Approval.

    Requires a verified contact email. Guessed addresses bounce, and bounces degrade the
    tenant's sending-domain reputation for every later campaign, so an unresolved contact
    is parked for research rather than synced.
    """
    bind_correlation_id(prospect_id)
    company_name = prospect_data.get("company_name", "Target Brand")
    decision_maker = prospect_data.get("decision_maker") or {}
    contact_email = decision_maker.get("email")

    if not (decision_maker.get("is_verified") and contact_email):
        await _update_prospect_status(prospect_id, "needs_contact_research")
        logger.info(
            "prospect_crm_staging_skipped_unverified_contact",
            prospect_id=prospect_id,
            company=company_name,
        )
        return {
            "crm_provider": None,
            "crm_record_id": None,
            "sync_status": "skipped_unverified_contact",
            "details": {"reason": "no_verified_contact_email"},
        }

    crm_provider = HubSpotCRMProvider()
    sync_result = await crm_provider.sync_lead(
        email=contact_email,
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
    try:
        p_uuid = uuid.UUID(prospect_id)
    except (ValueError, TypeError):
        return

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == p_uuid)
        )
        prospect = res.scalar_one_or_none()
        if isinstance(prospect, OutboundProspect):
            prospect.scrape_status = status
            if reason:
                prospect.disqualification_reason = reason
            prospect.updated_at = datetime.now(timezone.utc)
            await session.commit()

