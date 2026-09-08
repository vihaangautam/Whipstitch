import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from temporalio import activity

from app.core.apollo_budget import ApolloBudgetGuard
from app.core.config import settings
from app.core.logging import bind_correlation_id, get_logger
from app.db.models import CRMSyncRecord, OutboundProspect, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import DecisionMaker, ICPCheck
from app.services.crm.hubspot import HubSpotCRMProvider
from app.services.enrichment.apollo import apollo_search_organizations
from app.services.profiling.serper_service import SerperService

logger = get_logger(__name__)

# Contact-confidence badge shown on the prospect card. The free discovery path (Serper /
# job-board hiring signals) has no verified-email source, so it is capped at "probable" —
# only paid providers with a verified contact may ever reach "verified".
_FREE_SOURCES = {"serper_hiring", "serper", "none", "unknown"}


def _confidence_label(source: str, has_contact: bool) -> str:
    if not has_contact:
        return "inferred"
    if source in _FREE_SOURCES:
        return "probable"
    return "probable"  # ponytail: bump to "verified" once email verification is wired


@activity.defn(name="discover_prospects_activity")
async def discover_prospects_activity(tenant_key: str, batch_size: int = 5) -> List[Dict[str, Any]]:
    """Temporal Activity (Pattern 3): Discovers real prospects matching the tenant ICP.

    Primary source is Apollo organization search (1 credit, budget-gated). When Apollo is
    unavailable (mock mode, no key, budget exhausted, or free-tier block), falls back to
    free hiring-signal discovery: companies posting for the tenant's `trigger_roles` on ATS
    job boards. Returns [] if neither yields anything — never a fabricated list.
    """
    logger.info("discover_prospects_activity_started", tenant_key=tenant_key, batch_size=batch_size)
    batch_size = max(1, min(batch_size, 15))

    async with AsyncSessionLocal() as session:
        tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
        tenant = tenant_res.scalar_one_or_none()
        if not tenant:
            logger.warning("discover_prospects_no_tenant", tenant_key=tenant_key)
            return []
        tenant_uuid = tenant.id
        config = tenant.config or {}
        icp = config.get("icp_criteria", {})
        industries = icp.get("target_industries", [])
        geographies = icp.get("geographies", []) or config.get("geographies", [])
        emp_min = icp.get("employee_count_min")
        emp_max = icp.get("employee_count_max")

        existing_res = await session.execute(
            select(OutboundProspect.domain).where(OutboundProspect.tenant_id == tenant_uuid)
        )
        existing_domains = {d.lower() for (d,) in existing_res.all() if d}

    # Apollo organization search (budget-gated, 1 credit)
    candidates: List[Dict[str, Any]] = []
    source = "none"
    guard = ApolloBudgetGuard()
    if settings.MOCK_APOLLO:
        logger.info("discover_prospects_skipped_apollo_mock_mode", tenant_key=tenant_key)
    elif not await guard.can_consume(tenant_key, 1):
        logger.warning("discover_prospects_apollo_budget_exhausted", tenant_key=tenant_key)
    else:
        apollo_orgs = await apollo_search_organizations(
            industries, geographies, emp_min, emp_max, per_page=batch_size + 5
        )
        if apollo_orgs:
            await guard.consume_credits(tenant_key, 1)
            candidates = apollo_orgs
            source = "apollo"

    # Free fallback: hiring-signal discovery via ATS job boards (no paid credits)
    if not candidates:
        trigger_roles = config.get("trigger_roles", [])
        if trigger_roles:
            hiring = await SerperService().discover_via_hiring_signals(
                trigger_roles, geographies, limit=batch_size + 5
            )
            if hiring:
                candidates = hiring
                source = "serper_hiring"
        else:
            logger.info("discover_prospects_no_trigger_roles_configured", tenant_key=tenant_key)

    logger.info("discover_prospects_source", source=source, count=len(candidates))
    if not candidates:
        logger.warning("discover_prospects_no_candidates", tenant_key=tenant_key)
        return []

    prospects: List[Dict[str, Any]] = []
    async with AsyncSessionLocal() as session:
        for item in candidates:
            domain = (item.get("domain") or "").lower().lstrip("www.")
            if not domain or domain in existing_domains:
                continue
            existing_domains.add(domain)
            sig: Dict[str, Any] = {
                "source": source,
                "employee_count": item.get("employee_count"),
                "confidence_label": "inferred",
            }
            hiring_signal = item.get("hiring_signal")
            if hiring_signal:
                sig["hiring_signal_label"] = hiring_signal.get("label")
                sig["hiring_signal_url"] = hiring_signal.get("evidence_url")
            prospect = OutboundProspect(
                id=uuid.uuid4(),
                tenant_id=tenant_uuid,
                company_name=item.get("name") or domain,
                domain=domain,
                industry=item.get("industry"),
                scrape_status="discovered",
                signals_json=sig,
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
            if len(prospects) >= batch_size:
                break
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
    prospect_id: str,
    company_name: str,
    domain: str,
    target_roles: Optional[List[str]] = None,
    tenant_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 2): Resolves a named executive + LinkedIn URL via Serper.

    `target_roles` (buyer titles) come from the tenant's onboarding config when not passed
    explicitly. No verified-email source is wired, so is_verified stays False and CRM staging
    parks the prospect for contact research rather than emailing a guessed address.
    """
    bind_correlation_id(prospect_id)
    logger.info("discover_decision_maker_started", prospect_id=prospect_id, company=company_name)

    roles = [r for r in (target_roles or []) if r]
    if not roles and tenant_key:
        try:
            async with AsyncSessionLocal() as session:
                t_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
                t = t_res.scalar_one_or_none()
                if t and t.config:
                    roles = [r for r in t.config.get("target_decision_maker_roles", []) if r]
        except Exception as e:
            logger.warning("decision_maker_roles_lookup_failed", error=str(e))
    if not roles:
        roles = ["Head of Marketing", "Founder", "VP Growth"]

    resolved = await SerperService().find_decision_maker(company_name, domain, roles)

    dm = DecisionMaker(
        full_name=resolved.get("full_name"),
        exact_title=resolved.get("exact_title") or (roles[0] if roles else None),
        linkedin_url=resolved.get("linkedin_url"),
        confidence_score=0.5 if resolved.get("full_name") else 0.0,
        is_verified=False,
    )

    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
            )
            p = res.scalar_one_or_none()
            if p:
                p.decision_maker_name = dm.full_name
                p.decision_maker_title = dm.exact_title
                p.decision_maker_linkedin = dm.linkedin_url
                await session.commit()
    except Exception as e:
        logger.warning("discover_decision_maker_persist_failed", error=str(e))

    logger.info(
        "discover_decision_maker_completed",
        prospect_id=prospect_id,
        resolved=bool(dm.full_name),
    )
    return dm.model_dump()


@activity.defn(name="research_prospect_activity")
async def research_prospect_activity(
    prospect_id: str, company_name: str, domain: str, bm25_query_terms: str
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 1): Pulls real company news/signals via Serper and builds
    a fit-markdown summary. Falls back to an explicit 'no signals found' note."""
    bind_correlation_id(prospect_id)
    logger.info("research_prospect_started", prospect_id=prospect_id, domain=domain)

    news = await SerperService().search_company_signals(company_name)

    blob = " ".join(
        (n.get("headline", "") + " " + n.get("snippet", "")) for n in news
    ).lower()
    signals = {
        "news": news[:4],
        "hiring_signal": any(k in blob for k in ("hiring", "job opening", "careers", "recruit", "we are hiring")),
        "funding_signal": any(k in blob for k in ("raised", "funding", "series a", "series b", "seed round", "investment round")),
        "expansion_signal": any(k in blob for k in ("expands", "expansion", "launches", "new office", "acquire", "acquisition")),
    }

    if news:
        lines = "\n".join(
            f"- **{n.get('headline', '')}** — {n.get('snippet', '')}" for n in news[:4]
        )
        fit_markdown = (
            f"# Company Research: {company_name}\nDomain: {domain}\n\n## Recent signals\n{lines}"
        )
    else:
        fit_markdown = (
            f"# Company Research: {company_name}\nDomain: {domain}\n\n_No external signals found via search._"
        )

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if prospect:
            prior = dict(prospect.signals_json or {})
            merged = {**prior, **signals}
            src = prior.get("source", "unknown")
            merged["source"] = src
            merged["confidence_label"] = _confidence_label(src, bool(prospect.decision_maker_name))
            prospect.fit_markdown = fit_markdown
            prospect.signals_json = merged
            prospect.scrape_status = "researched"
            await session.commit()

    logger.info("research_prospect_completed", prospect_id=prospect_id, signal_count=len(news))
    return {"fit_markdown": fit_markdown, "signals": signals}


@activity.defn(name="qualify_outbound_prospect_activity")
async def qualify_outbound_prospect_activity(
    prospect_id: str, tenant_key: str, company_name: str, domain: str, research_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Temporal Activity (Pattern 5): Generates 3-part structured cold outreach draft."""
    bind_correlation_id(prospect_id)
    logger.info("qualify_outbound_prospect_started", prospect_id=prospect_id, company=company_name)

    from app.activities.qualification_activity import call_real_llm_qualification

    signals = (research_data or {}).get("signals", {})
    industry = "Unknown"
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(OutboundProspect).where(OutboundProspect.id == uuid.UUID(prospect_id))
        )
        prospect = res.scalar_one_or_none()
        if prospect and prospect.industry:
            industry = prospect.industry

    enrichment_payload = {
        "company_name": company_name,
        "industry": industry,
        "geography": "Unknown",
        "recent_signals": signals.get("news", []),
        "hiring": signals.get("hiring_signal"),
        "funding": signals.get("funding_signal"),
    }

    qualification = await call_real_llm_qualification(
        company_name, industry, enrichment_payload, tenant_key=tenant_key
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

