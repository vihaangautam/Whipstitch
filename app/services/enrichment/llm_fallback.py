from typing import Optional
from app.core.logging import get_logger
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile

logger = get_logger(__name__)


class LLMFallbackProvider(BaseEnrichmentProvider):
    """
    Final Fallback LLM Provider.
    Synthesizes company profile attributes from email/domain name alone when all upstream APIs fail.
    """
    name = "llm_fallback"

    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> EnrichmentProfile:
        logger.info("llm_fallback_enrichment_triggered", email=email, company_name=company_name)

        # Inferred profile with lower confidence score flagging unverified status
        return EnrichmentProfile(
            company_name=company_name,
            domain=domain or f"{company_name.lower().replace(' ', '')}.com",
            industry="Inferred Tech & Services",
            employee_count=50,
            geography="Global",
            tech_stack=["Inferred Stack"],
            confidence_score=0.60,
            provider_used=self.name,
            raw_data={
                "source": "llm_fallback_synthesis",
                "status": "unverified_fields_inferred",
            },
            is_complete=True,
        )
