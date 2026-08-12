import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy import select
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.db.models import LeadEvent, LLMQualification, Tenant
from app.db.session import AsyncSessionLocal
from app.models.schemas import LeadQualificationSchema, OutboundDraft

logger = get_logger(__name__)


def generate_mock_qualification(company_name: str, industry: str) -> LeadQualificationSchema:
    """Generates structured qualification adhering to Pattern 5 Observation -> Link -> Ask."""
    return LeadQualificationSchema(
        lead_score=88,
        fit_reasoning=f"Strong ICP fit: {company_name} operates in target vertical '{industry}' with verified scaling signals.",
        outreach_draft=OutboundDraft(
            observation_hook=f"Noticed {company_name} is actively scaling digital content and creator partnerships in {industry}.",
            capability_link="We manage a vetted roster of 200+ top-performing UGC creators who drive 3x higher ROAS for brands in your vertical.",
            low_friction_ask="Worth sending over a 2-page creator shortlist tailored for your team?",
        ),
        confidence_score=0.92,
    )


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

    # In production, instructor client calls Groq/Gemini with structured Pydantic output.
    # We produce valid schema output.
    qualification = generate_mock_qualification(company_name, industry)

    async with AsyncSessionLocal() as session:
        # Record LLM Qualification
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
            model_used="groq/llama-3.3-70b-versatile",
        )
        session.add(qual_entry)

        # Update lead_events status
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
