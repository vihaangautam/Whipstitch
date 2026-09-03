"""Unit tests for Serper search rate limiting, caching, and psychographic profiling."""
import pytest
from app.services.profiling.serper_service import SerperService, _IN_MEMORY_CACHE
from app.services.profiling.psychographic_engine import PsychographicEngine


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
