"""Integration tests for the tenant-scoped, DB-backed Meeting Intelligence API (no seed data)."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_meetings_api_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. A fresh workspace has no meetings.
        res = await client.get("/v1/meetings?tenant_id=trifid_media")
        assert res.status_code == 200

        # 2. Create a real meeting from rep-entered details.
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
        meeting_id = created["id"]

        # 3. It now shows up in the list.
        listed = (await client.get("/v1/meetings?tenant_id=trifid_media")).json()
        assert any(m["id"] == meeting_id for m in listed)

        # 4. Pre-call briefing synthesises from the real attendees + signals.
        briefing = (await client.get(f"/v1/meetings/{meeting_id}/briefing")).json()
        assert briefing["company_name"] == "FinTech Scale"
        assert len(briefing["strategic_discovery_questions"]) == 3
        assert len(briefing["attendees"]) == 2

        # 5. 7-filter champion kit.
        kit = (await client.get(f"/v1/meetings/{meeting_id}/champion-kit")).json()
        for i in range(1, 8):
            assert any(k.startswith(f"filter_{i}_") for k in kit)

        # 6. Unknown meeting id -> 404, not a fake fallback.
        assert (await client.get("/v1/meetings/not-a-real-id/briefing")).status_code == 404
