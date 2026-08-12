from typing import Optional
from app.core.logging import get_logger
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile

logger = get_logger(__name__)


class PDLProvider(BaseEnrichmentProvider):
    name = "people_data_labs"

    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> Optional[EnrichmentProfile]:
        logger.info("pdl_enrichment_attempt", email=email, company_name=company_name)

        if "pdl_fail" in email.lower():
            return None

        # Return mock PDL profile
        return EnrichmentProfile(
            company_name=company_name,
            domain=domain or f"{company_name.lower().replace(' ', '')}.com",
            industry="Consumer Tech",
            employee_count=85,
            geography="UAE",
            tech_stack=["Shopify Plus", "Zapier", "Meta Ads"],
            confidence_score=0.88,
            provider_used=self.name,
            raw_data={"source": "pdl_mock"},
            is_complete=True,
        )
