import pytest
from app.activities.qualification_activity import generate_mock_qualification
from app.models.schemas import LeadQualificationSchema, OutboundDraft


def test_structured_outreach_draft_schema():
    draft = OutboundDraft(
        observation_hook="Noticed company raised Series B funding.",
        capability_link="We scale UGC creator teams for high-growth DTC brands.",
        low_friction_ask="Worth sending over a 2-page creator shortlist?",
    )
    email_body = draft.to_email_body()
    assert "Noticed company raised Series B funding." in email_body
    assert "We scale UGC creator teams" in email_body
    assert "Worth sending over" in email_body


def test_qualification_schema_validation():
    qual = generate_mock_qualification("Acme Inc", "D2C")
    assert isinstance(qual, LeadQualificationSchema)
    assert 0 <= qual.lead_score <= 100
    assert qual.outreach_draft.observation_hook.startswith("Noticed")
    assert qual.confidence_score >= 0.0
