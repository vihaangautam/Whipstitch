from typing import Optional
from app.core.logging import get_logger
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile

logger = get_logger(__name__)


class DiffbotProvider(BaseEnrichmentProvider):
    name = "diffbot"

    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> Optional[EnrichmentProfile]:
        logger.info("diffbot_enrichment_attempt", email=email, company_name=company_name)

        if "diffbot_fail" in email.lower():
            return None

        return EnrichmentProfile(
            company_name=company_name,
            domain=domain or f"{company_name.lower().replace(' ', '')}.com",
            industry="E-Commerce",
            employee_count=150,
            geography="US",
            tech_stack=["Salesforce", "Google Cloud"],
            confidence_score=0.85,
            provider_used=self.name,
            raw_data={"source": "diffbot_mock"},
            is_complete=True,
        )
