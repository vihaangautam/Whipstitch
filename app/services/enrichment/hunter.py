from typing import Optional
from app.core.logging import get_logger
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile

logger = get_logger(__name__)


class HunterProvider(BaseEnrichmentProvider):
    name = "hunter"

    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> Optional[EnrichmentProfile]:
        logger.info("hunter_enrichment_attempt", email=email, company_name=company_name)

        if "hunter_fail" in email.lower():
            return None

        return EnrichmentProfile(
            company_name=company_name,
            domain=domain or f"{company_name.lower().replace(' ', '')}.com",
            industry="Lifestyle & Apparel",
            employee_count=60,
            geography="UK",
            tech_stack=["WooCommerce", "Mailchimp"],
            confidence_score=0.82,
            provider_used=self.name,
            raw_data={"source": "hunter_mock"},
            is_complete=True,
        )
