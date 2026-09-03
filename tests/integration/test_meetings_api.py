"""Integration tests for Meeting Intelligence & Champion Notes API."""
from unittest.mock import AsyncMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db_session
from app.main import app


@pytest.mark.asyncio
async def test_meetings_api_lifecycle():
    mock_session = AsyncMock()

    async def override_get_db_session():
        yield mock_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List Meetings (seeds default mock meetings)
        res = await client.get("/v1/meetings?tenant_id=trifid_media")
        assert res.status_code == 200
        meetings = res.json()
        assert len(meetings) >= 2
        first_meeting_id = meetings[0]["id"]

        # 2. Get Pre-Call Briefing
        briefing_res = await client.get(f"/v1/meetings/{first_meeting_id}/briefing")
        assert briefing_res.status_code == 200
        briefing = briefing_res.json()
        assert "strategic_discovery_questions" in briefing
        assert len(briefing["strategic_discovery_questions"]) == 3
        assert len(briefing["attendees"]) > 0

        # 3. Get 7-Filter Champion Selling Kit
        kit_res = await client.get(f"/v1/meetings/{first_meeting_id}/champion-kit")
        assert kit_res.status_code == 200
        kit = kit_res.json()
        assert "filter_1_wiifm_career_narrative" in kit
        assert "filter_2_cfo_business_case_roi" in kit
        assert "filter_3_infosec_architecture" in kit
        assert "filter_4_time_triggers_urgency" in kit
        assert "filter_5_power_structure_dynamics" in kit
        assert "filter_6_vendor_disqualification" in kit
        assert "filter_7_shadow_influence_landmines" in kit

        # 4. Trigger Prep Refresh
        prep_res = await client.post(f"/v1/meetings/{first_meeting_id}/prep")
        assert prep_res.status_code == 200
        assert prep_res.json()["status"] == "ready"

        # 5. Create a New Meeting
        create_res = await client.post(
            "/v1/meetings?tenant_id=trifid_media",
            json={
                "title": "FinTech Scale: Executive Review",
                "company_name": "FinTech Scale",
                "scheduled_time": "Friday, 2:00 PM EST",
                "attendee_emails": ["alex.cfo@fintechscale.com", "sarah.ops@fintechscale.com"],
            },
        )
        assert create_res.status_code == 201
        created = create_res.json()
        assert created["company_name"] == "FinTech Scale"
        assert len(created["attendees"]) == 2

    app.dependency_overrides.clear()
