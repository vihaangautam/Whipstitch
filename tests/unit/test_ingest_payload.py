import pytest
from pydantic import ValidationError
from app.models.schemas import IngestEventRequest, IngestEventResponse


def test_ingest_request_valid():
    payload = IngestEventRequest(
        tenant_id="trifid_media",
        email="contact@brand.com",
        company_name="Acme Brand",
        raw_payload={"campaign": "influencer_2026"},
    )
    assert payload.tenant_id == "trifid_media"
    assert payload.email == "contact@brand.com"
    assert payload.company_name == "Acme Brand"


def test_ingest_request_missing_required_fields():
    with pytest.raises(ValidationError):
        IngestEventRequest(email="missing_company@brand.com")


def test_ingest_response_schema():
    resp = IngestEventResponse(
        event_id="test-id-123",
        status="received",
        message="Event accepted",
    )
    assert resp.status == "received"
    assert resp.event_id == "test-id-123"
