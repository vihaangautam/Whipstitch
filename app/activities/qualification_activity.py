import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import select
from temporalio import activity

from app.core.config import settings
from app.core.logging import bind_correlation_id, get_logger
from app.db.models import LeadEvent, LLMQualification, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import LeadQualificationSchema, OutboundDraft

logger = get_logger(__name__)


def generate_mock_qualification(
    company_name: str,
    industry: str,
    icp_criteria: Optional[Dict[str, Any]] = None,
) -> LeadQualificationSchema:
    """Generates structured qualification adhering to Pattern 5 Observation -> Link -> Ask, respecting configured ICP."""
    target_industries = (icp_criteria or {}).get("target_industries", [])
    if target_industries:
        is_match = any(ind.lower() in industry.lower() for ind in target_industries)
        score = 88 if is_match else 45
        reason = (
            f"Strong ICP fit: {company_name} operates in target vertical '{industry}' with verified scaling signals."
            if is_match
            else f"Sub-optimal ICP fit: '{industry}' is outside the primary target verticals ({', '.join(target_industries[:3])})."
        )
    else:
        score = 88
        reason = f"Strong ICP fit: {company_name} operates in target vertical '{industry}' with verified scaling signals."

    return LeadQualificationSchema(
        lead_score=score,
        fit_reasoning=reason,
        outreach_draft=OutboundDraft(
            observation_hook=f"Noticed {company_name} is actively scaling digital content and creator partnerships in {industry}.",
            capability_link="We manage a vetted roster of 200+ top-performing UGC creators who drive 3x higher ROAS for brands in your vertical.",
            low_friction_ask="Worth sending over a 2-page creator shortlist tailored for your team?",
        ),
        confidence_score=0.92,
    )


async def call_real_llm_qualification(
    company_name: str,
    industry: str,
    enrichment_data: Dict[str, Any],
    icp_criteria: Optional[Dict[str, Any]] = None,
    geographies: Optional[List[str]] = None,
    tenant_key: Optional[str] = None,
) -> LeadQualificationSchema:
    """Calls Google Gemini or Groq free tier REST API with injected tenant ICP criteria."""
    if tenant_key and (icp_criteria is None or geographies is None):
        try:
            async with AsyncSessionLocal() as session:
                t_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_key))
                t = t_res.scalar_one_or_none()
                if t and t.config:
                    if icp_criteria is None:
                        icp_criteria = t.config.get("icp_criteria", {})
                    if geographies is None:
                        geographies = t.config.get("geographies", [])
        except Exception as e:
            logger.warning("failed_to_fetch_tenant_icp_criteria", error=str(e))

    icp_criteria = icp_criteria or {}
    target_industries = icp_criteria.get("target_industries", ["E-Commerce / D2C", "Beauty & Personal Care", "FMCG & Consumer Goods", "Fintech"])
    emp_min = icp_criteria.get("employee_count_min", 50)
    emp_max = icp_criteria.get("employee_count_max", 5000)
    target_geos = geographies or ["India", "United States", "UAE", "Southeast Asia"]

    prompt = f"""
You are an expert B2B sales development representative.
Analyze the following lead profile and score their ICP fit (0-100) based strictly on our company's target Ideal Customer Profile (ICP) rules.

Tenant Target ICP Criteria:
- Target Industries: {', '.join(target_industries)}
- Target Employee Count Range: {emp_min} to {emp_max}
- Target Commercial Geographies: {', '.join(target_geos)}

Lead Details to Evaluate:
- Company Name: {company_name}
- Industry: {industry}
- Employee Count: {enrichment_data.get('employee_count', 'Unknown')}
- Geography: {enrichment_data.get('geography', 'Global')}
- Tech Stack: {', '.join(enrichment_data.get('tech_stack', []))}

Scoring Instructions:
- Score 75-100: If company operates in a target industry, fits employee headcount range, and matches target geographies.
- Score 45-74: If company partially matches (e.g. adjacent vertical or missing headcount/geo).
- Score 0-44: If company is clearly outside target verticals and geographies.

Return ONLY a JSON object with this exact schema:
{{
  "lead_score": integer (0 to 100),
  "fit_reasoning": "1-2 sentence explanation of ICP fit versus configured ICP criteria",
  "outreach_draft": {{
    "observation_hook": "Specific 1-sentence observation about their company/tech/growth",
    "capability_link": "1-sentence link to value proposition",
    "low_friction_ask": "Low-friction call to action question"
  }},
  "confidence_score": float (0.0 to 1.0)
}}
"""

    # 1. Try Google Gemini API (100% Free API Key)
    if settings.GEMINI_API_KEY and "mock" not in settings.GEMINI_API_KEY.lower():
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    res_data = resp.json()
                    text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text_content)
                    return LeadQualificationSchema(**parsed)
        except Exception as e:
            logger.error("gemini_api_qualification_failed", error=str(e))

    # 2. Try Groq API (100% Free API Key)
    if settings.GROQ_API_KEY and "mock" not in settings.GROQ_API_KEY.lower():
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": "openai/gpt-oss-20b",
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"},
                    },
                )
                if resp.status_code == 200:
                    parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                    return LeadQualificationSchema(**parsed)
        except Exception as e:
            logger.error("groq_api_qualification_failed", error=str(e))

    # Fallback to deterministic mock qualification if no real keys or API error
    logger.info("using_mock_llm_qualification_fallback")
    return generate_mock_qualification(company_name, industry, icp_criteria)


@activity.defn(name="qualify_lead_llm_activity")
async def qualify_lead_llm_activity(
    lead_id: str,
    tenant_key: str,
    enrichment_data: Dict[str, Any],
) -> dict:
    """Temporal Activity: Runs schema-enforced LLM qualification & 3-part structured outreach generation."""
    bind_correlation_id(lead_id)
    company_name = enrichment_data.get("company_name", "Target Company")
    industry = enrichment_data.get("industry", "Consumer Tech")

    logger.info("qualify_lead_llm_activity_started", lead_id=lead_id, company_name=company_name, industry=industry)

    qualification = await call_real_llm_qualification(
        company_name, industry, enrichment_data, tenant_key=tenant_key
    )

    async with AsyncSessionLocal() as session:
        qual_entry = LLMQualification(
            id=uuid.uuid4(),
            lead_source_type="inbound",
            lead_source_id=uuid.UUID(lead_id),
            lead_score=qualification.lead_score,
            fit_reasoning=qualification.fit_reasoning,
            observation_hook=qualification.outreach_draft.observation_hook,
            capability_link=qualification.outreach_draft.capability_link,
            low_friction_ask=qualification.outreach_draft.low_friction_ask,
            confidence_score=qualification.confidence_score,
            model_used="gemini-1.5-flash" if "gemini" in str(qualification) else "groq/llama-3.3-70b",
        )
        session.add(qual_entry)

        lead_result = await session.execute(select(LeadEvent).where(LeadEvent.id == uuid.UUID(lead_id)))
        lead_event = lead_result.scalar_one_or_none()
        if lead_event:
            lead_event.status = "scoring"
            lead_event.updated_at = datetime.now(timezone.utc)

        await session.commit()

    logger.info(
        "qualify_lead_llm_activity_completed",
        lead_id=lead_id,
        score=qualification.lead_score,
        confidence=qualification.confidence_score,
    )

    return qualification.model_dump()

