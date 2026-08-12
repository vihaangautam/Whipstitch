from unittest.mock import AsyncMock, MagicMock, patch
import pytest


@pytest.mark.asyncio
async def test_get_event_status_invalid_uuid(async_client):
    response = await async_client.get(
        "/v1/events/invalid-uuid-string/status",
        headers={"X-API-Key": "whipstitch-dev-key-12345"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_event_status_not_found(async_client):
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Mock async context manager for AsyncSessionLocal()
    mock_session_ctx = MagicMock()
    mock_session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_ctx.__aexit__ = AsyncMock(return_value=None)

    with patch("app.api.ingest.AsyncSessionLocal", return_value=mock_session_ctx):
        response = await async_client.get(
            "/v1/events/00000000-0000-0000-0000-000000000000/status",
            headers={"X-API-Key": "whipstitch-dev-key-12345"},
        )
        assert response.status_code == 404
