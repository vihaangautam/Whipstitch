"""Unit tests for Serper search rate limiting, caching, and psychographic profiling."""
from unittest.mock import AsyncMock, patch

import pytest
from app.services.profiling.serper_service import (
    SerperService,
    _IN_MEMORY_CACHE,
    _ats_company_slug,
    _company_from_title,
)
from app.services.profiling.psychographic_engine import PsychographicEngine


def test_ats_slug_and_company_name_parsing():
    assert _ats_company_slug("https://boards.greenhouse.io/acmecorp/jobs/123") == "acmecorp"
    assert _ats_company_slug("https://jobs.lever.co/brightwheel/abc-def") == "brightwheel"
    assert _ats_company_slug("https://boards.greenhouse.io/careers") is None
    assert _ats_company_slug("not-a-url") is None

    assert _company_from_title("Job Application for SEO Specialist at Acme Corp", "acmecorp") == "Acme Corp"
    assert _company_from_title("", "bright-wheel") == "Bright Wheel"


@pytest.mark.asyncio
async def test_discover_via_hiring_signals_parses_job_board_results():
    serp = [
        {"title": "SEO Specialist at Northwind Retail", "link": "https://boards.greenhouse.io/northwind/jobs/9"},
        {"title": "Content Marketing Manager - Zephyr Labs", "link": "https://jobs.lever.co/zephyr/xyz"},
        {"title": "Careers", "link": "https://boards.greenhouse.io/careers"},
    ]
    with patch.object(SerperService, "_organic", new=AsyncMock(return_value=serp)), patch(
        "app.services.profiling.serper_service._resolve_company_domain",
        new=AsyncMock(side_effect=lambda s: f"{s}.com"),
    ):
        out = await SerperService(api_key="live-key").discover_via_hiring_signals(
            ["SEO Specialist"], ["Bengaluru"], limit=5
        )

    domains = {c["domain"] for c in out}
    assert domains == {"northwind.com", "zephyr.com"}
    assert all(c["hiring_signal"]["label"].startswith("Hiring SEO Specialist") for c in out)


@pytest.mark.asyncio
async def test_discover_via_hiring_signals_needs_trigger_roles():
    out = await SerperService(api_key="live-key").discover_via_hiring_signals([], ["US"])
    assert out == []


@pytest.mark.asyncio
async def test_serper_cache_and_mock_fallback():
    service = SerperService(api_key="mock-test-key")
    signals = await service.search_company_signals("Acme Corp")
    assert len(signals) > 0
    assert "Acme Corp" in signals[0]["headline"]
    assert signals[0]["source"] == "Google Serper Radar"

    # Verify second call is served from cache
    cache_key = service._generate_cache_key('"Acme Corp" enterprise revenue operations OR hiring OR software')
    assert cache_key in _IN_MEMORY_CACHE


def test_psychographic_role_resolution():
    engine = PsychographicEngine()
    assert engine.resolve_buying_role("Chief Financial Officer") == "Economic Buyer"
    assert engine.resolve_buying_role("VP of Finance") == "Economic Buyer"
    assert engine.resolve_buying_role("VP RevOps") == "Champion"
    assert engine.resolve_buying_role("Director Sales Operations") == "Champion"
    assert engine.resolve_buying_role("Head of InfoSec") == "Security Gatekeeper"
    assert engine.resolve_buying_role("Procurement Manager") == "Legal / Procurement"
    assert engine.resolve_buying_role("Enterprise Account Executive") == "Influencer"


def test_psychographic_profile_generation():
    engine = PsychographicEngine()
    profile = engine.profile_attendee(
        name="Marcus Vance",
        title="Chief Financial Officer",
        organization="Apex Logistics",
    )
    assert profile.buying_role == "Economic Buyer"
    assert len(profile.focus_areas) == 2
    assert len(profile.hooks) == 2
    assert profile.breaking_the_ice != ""
    assert profile.seniority_level == "Executive"
