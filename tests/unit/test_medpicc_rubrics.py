"""Unit tests validating MEDDPICC domain scoring rubrics and Pydantic schemas."""
import pytest
from app.core.llm_router import generate_mock_medpicc
from app.models.medpicc_schemas import (
    EvidenceQuote,
    QualificationModel,
    ValueSellingBox,
)


def test_qualification_model_structure():
    model = generate_mock_medpicc("Enterprise Alpha", "Acme Global")
    assert isinstance(model, QualificationModel)
    assert 0 <= model.overall_qualification_score_0_100 <= 100
    assert len(model.value_selling_boxes) == 8
    assert model.deal_category in ["Advance", "Rescue", "Nurture", "Disqualify"]
    assert model.next_best_action_email.subject != ""
    assert model.next_best_action_email.body_content != ""


def test_rule_6_2_economic_buyer_hard_cap():
    """Rule 6.2: If Economic Buyer access is unverified, score must be hard-capped at max 7."""
    model = generate_mock_medpicc("Strategic Account", "Tech Corp")
    eb_box = next((b for b in model.value_selling_boxes if b.box == "Economic Buyer"), None)
    assert eb_box is not None
    if eb_box.hard_cap_applied:
        assert eb_box.score <= 7


def test_rule_3_1_verbatim_quotes():
    """Rule 3.1: Evidence quotes must contain non-empty strings and attribution."""
    quote = EvidenceQuote(
        person_name="Sarah VP",
        evidence_date="2026-08-10",
        medium="Call",
        quote="We are burning 20 hours a week on manual CSV exports.",
    )
    assert quote.quote.startswith("We are burning")
    assert quote.person_name == "Sarah VP"


def test_score_sum_consistency():
    """Total score must equal the sum of the 8 individual boxes."""
    model = generate_mock_medpicc("Deal Beta", "Beta Corp")
    calculated_sum = sum(b.score for b in model.value_selling_boxes)
    assert model.overall_qualification_score_0_100 == calculated_sum
