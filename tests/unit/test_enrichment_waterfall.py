import pytest
from app.services.enrichment.waterfall import WaterfallEnricher


@pytest.mark.asyncio
async def test_waterfall_primary_success():
    enricher = WaterfallEnricher()
    profile = await enricher.execute_waterfall(
        email="lead@company.com",
        company_name="Acme Corp",
        waterfall_order=["apollo", "people_data_labs", "llm_fallback"],
    )
    assert profile is not None
    assert profile.provider_used == "apollo"
    assert profile.confidence_score == 0.95
    assert profile.raw_data.get("fallback_triggered") is False


@pytest.mark.asyncio
async def test_waterfall_primary_failure_fallback():
    enricher = WaterfallEnricher()
    profile = await enricher.execute_waterfall(
        email="fail@company.com",  # Triggers Apollo mock failure
        company_name="Fail Corp",
        waterfall_order=["apollo", "people_data_labs", "llm_fallback"],
    )
    assert profile is not None
    assert profile.provider_used == "people_data_labs"
    assert profile.raw_data.get("fallback_triggered") is True


@pytest.mark.asyncio
async def test_waterfall_all_failed_llm_fallback():
    enricher = WaterfallEnricher()
    profile = await enricher.execute_waterfall(
        email="fail_pdl_fail_hunter_fail_diffbot_fail_crawl_fail@company.com",
        company_name="fail_fail",
        waterfall_order=["apollo", "people_data_labs", "hunter", "diffbot", "crawl4ai", "llm_fallback"],
    )
    assert profile is not None
    assert profile.provider_used == "llm_fallback"
    assert profile.raw_data.get("fallback_triggered") is True



@pytest.mark.asyncio
async def test_waterfall_crawl4ai_bm25_filter():
    enricher = WaterfallEnricher(bm25_query_terms="ugc creator marketing roas")
    profile = await enricher.execute_waterfall(
        email="scrape@company.com",
        company_name="Scrape Corp",
        waterfall_order=["crawl4ai", "llm_fallback"],
    )
    assert profile is not None
    assert profile.provider_used == "crawl4ai"
    assert "bm25_query" in profile.raw_data
    assert profile.raw_data["bm25_query"] == "ugc creator marketing roas"
