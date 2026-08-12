from typing import Dict, List, Optional
from app.core.logging import get_logger
from app.services.enrichment.apollo import ApolloProvider
from app.services.enrichment.base import BaseEnrichmentProvider, EnrichmentProfile
from app.services.enrichment.crawl4ai import Crawl4AIProvider
from app.services.enrichment.diffbot import DiffbotProvider
from app.services.enrichment.hunter import HunterProvider
from app.services.enrichment.llm_fallback import LLMFallbackProvider
from app.services.enrichment.pdl import PDLProvider

logger = get_logger(__name__)


class WaterfallEnricher:
    """Coordinates deep waterfall enrichment through tenant-configured provider order."""

    def __init__(self, bm25_query_terms: str = "product features value proposition pricing clients creator roster"):
        self.providers: Dict[str, BaseEnrichmentProvider] = {
            "apollo": ApolloProvider(),
            "people_data_labs": PDLProvider(),
            "hunter": HunterProvider(),
            "diffbot": DiffbotProvider(),
            "crawl4ai": Crawl4AIProvider(bm25_query_terms=bm25_query_terms),
            "llm_fallback": LLMFallbackProvider(),
        }

    async def execute_waterfall(
        self,
        email: str,
        company_name: str,
        domain: Optional[str] = None,
        waterfall_order: Optional[List[str]] = None,
    ) -> EnrichmentProfile:
        order = waterfall_order or [
            "apollo",
            "people_data_labs",
            "hunter",
            "diffbot",
            "crawl4ai",
            "llm_fallback",
        ]

        logger.info(
            "waterfall_enrichment_started",
            email=email,
            company_name=company_name,
            order=order,
        )

        fallback_triggered = False

        for idx, provider_key in enumerate(order):
            provider = self.providers.get(provider_key)
            if not provider:
                logger.warning("unknown_enrichment_provider_skipped", provider_key=provider_key)
                continue

            if idx > 0:
                fallback_triggered = True

            logger.info("waterfall_step_attempt", step=idx + 1, provider=provider_key)
            result = await provider.enrich(email=email, company_name=company_name, domain=domain)

            if result and result.is_complete:
                result.raw_data["fallback_triggered"] = fallback_triggered
                result.raw_data["provider_attempt_index"] = idx + 1
                logger.info(
                    "waterfall_enrichment_succeeded",
                    provider_used=result.provider_used,
                    fallback_triggered=fallback_triggered,
                )
                return result

        # Ultimate fallback if no provider returned a valid profile
        llm_fallback = self.providers["llm_fallback"]
        fallback_profile = await llm_fallback.enrich(email=email, company_name=company_name, domain=domain)
        fallback_profile.raw_data["fallback_triggered"] = True
        return fallback_profile
