from typing import Optional
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile

logger = get_logger(__name__)


class ApolloProvider(BaseEnrichmentProvider):
    name = "apollo"

    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> Optional[EnrichmentProfile]:
        logger.info("apollo_enrichment_attempt", email=email, company_name=company_name, mock=settings.MOCK_APOLLO)

        if settings.MOCK_APOLLO:
            # Mock provider response for dev/testing
            if "fail" in email.lower() or "fail" in company_name.lower():
                logger.warning("apollo_enrichment_mock_failed", email=email)
                return None

            return EnrichmentProfile(
                company_name=company_name,
                domain=domain or f"{company_name.lower().replace(' ', '')}.com",
                industry="D2C & E-Commerce",
                employee_count=120,
                geography="India",
                tech_stack=["HubSpot", "Shopify", "Klaviyo", "Google Analytics"],
                confidence_score=0.95,
                provider_used=self.name,
                raw_data={"source": "apollo_mock", "credit_used": 1},
                is_complete=True,
            )

        # Real Apollo API call
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    "https://api.apollo.io/v1/organizations/enrich",
                    json={"domain": domain or f"{company_name.lower()}.com"},
                    headers={"Cache-Control": "no-cache", "X-Api-Key": settings.APOLLO_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    org = data.get("organization", {})
                    if org:
                        return EnrichmentProfile(
                            company_name=org.get("name", company_name),
                            domain=org.get("primary_domain"),
                            industry=org.get("industry"),
                            employee_count=org.get("estimated_num_employees"),
                            geography=org.get("country"),
                            tech_stack=org.get("technology_names", []),
                            confidence_score=0.9,
                            provider_used=self.name,
                            raw_data=data,
                            is_complete=True,
                        )
        except Exception as e:
            logger.error("apollo_api_call_error", error=str(e))

        return None
