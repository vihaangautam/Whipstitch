"""Unit tests validating Track x Tier dynamic prompt building, Hinglish speech handling, and half-up caps."""
import os
import pytest
from app.core.prompts.medpicc_prompts import (
    build_medpicc_prompt,
    get_tier_weights_and_caps,
)
from app.models.medpicc_schemas import (
    EvidenceQuote,
    QualificationModel,
    ValueSellingBox,
)


def test_get_tier_weights_and_caps_tier_1():
    """Tier 1 (Founder-Led SMB): Decision Process=5, Paper=15, Metrics=20, EB=20; Caps half-up = 9 and 5."""
    config = get_tier_weights_and_caps("Tier 1: Founder-Led SMB")
    weights = config["weights"]
    assert weights["Metrics"] == 20
    assert weights["Economic Buyer"] == 20
    assert weights["Decision Process"] == 5
    assert weights["Paper Process"] == 15
    assert sum(weights.values()) == 100
    # Half-up rounding checks: 20 * 0.45 = 9.0 -> 9; 10 * 0.45 = 4.5 -> 5
    assert config["eb_cap"] == 9
    assert config["champ_cap"] == 5


def test_get_tier_weights_and_caps_tier_2():
    """Tier 2 (Growth Scale-Up): Sum=100, Caps half-up = 9 and 5."""
    config = get_tier_weights_and_caps("Tier 2: Growth Scale-up")
    weights = config["weights"]
    assert weights["Economic Buyer"] == 20
    assert weights["Decision Process"] == 10
    assert sum(weights.values()) == 100
    assert config["eb_cap"] == 9
    assert config["champ_cap"] == 5


def test_get_tier_weights_and_caps_tier_3():
    """Tier 3 (Enterprise MNC): Sum=100, Caps half-up = 7 and 5."""
    config = get_tier_weights_and_caps("Tier 3: Enterprise MNC")
    weights = config["weights"]
    assert weights["Economic Buyer"] == 15
    assert weights["Competition"] == 10
    assert sum(weights.values()) == 100
    # 15 * 0.45 = 6.75 -> floor(6.75 + 0.5) = 7
    assert config["eb_cap"] == 7
    assert config["champ_cap"] == 5


def test_build_medpicc_prompt_hinglish_and_tier_injection():
    """Validates dynamic prompt injection with Track, Tier, Currency, and Hinglish instructions."""
    fixture_path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "hinglish_call_sample.txt")
    with open(fixture_path, "r", encoding="utf-8") as f:
        transcript_text = f.read()

    prompt = build_medpicc_prompt(
        deal_name="Nykaa Festive Campaign",
        company_name="Nykaa E-Retail",
        transcript_text=transcript_text,
        tenant_track="Service / Retainer",
        deal_tier="Tier 1: Founder-Led SMB",
        deal_currency="INR",
    )

    # Assert Track, Tier, and Currency are injected
    assert "Business Model Track: Service / Retainer" in prompt
    assert "Buyer Sophistication Tier: Tier 1: Founder-Led SMB" in prompt
    assert "Currency: INR" in prompt

    # Assert Hinglish & Code-switched instructions exist
    assert "HINGLISH & CODE-SWITCHED SPEECH" in prompt
    assert "DO NOT translate code-switched Hindi to English" in prompt

    # Assert Tier 1 specific instructions exist
    assert "TIER 1 (FOUNDER-LED SMB / D2C) SPECIFIC CRITERIA" in prompt
    assert "50% advance payment terms" in prompt
    assert "RULE 6.2 HALF-UP HARD CAP: If Founder/sign-off is unverified, score is HARD-CAPPED at max 9/20" in prompt


def test_hinglish_verbatim_quote_model_preservation():
    """Evidence quotes with Hinglish phrases must serialize cleanly and preserve exact characters."""
    quote = EvidenceQuote(
        person_name="Sneha Kapoor",
        evidence_date="2026-09-07",
        medium="Call",
        quote="Haan, approval toh mil gaya hai, but 50% advance invoice release hone me 1 week lagega.",
    )
    assert "advance invoice release hone me" in quote.quote
    data = quote.model_dump()
    assert data["quote"] == quote.quote
