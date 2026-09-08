import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.config import settings


@pytest.fixture(autouse=True)
def _no_external_apis(monkeypatch):
    """Guarantee tests never touch real Apollo / Serper / LLM endpoints."""
    monkeypatch.setattr(settings, "MOCK_APOLLO", True, raising=False)
    monkeypatch.setenv("SERPER_API_KEY", "mock")
    for key in ("SERPER_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
        monkeypatch.setattr(settings, key, "mock-test-key", raising=False)


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

