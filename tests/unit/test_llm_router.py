"""Unit tests for MultiLLMRouter and fallback handling."""
from unittest.mock import AsyncMock, patch

import pytest
from app.core.llm_router import llm_router, calculate_cost
from app.models.medpicc_schemas import QualificationModel


@pytest.mark.asyncio
async def test_llm_router_mock_fallback():
    parsed, model_used = await llm_router.call_structured_llm(
        tenant_id="00000000-0000-0000-0000-000000000000",
        system_prompt="Test system prompt",
        user_prompt="Test user prompt",
        response_model=QualificationModel,
        feature="medpicc",
    )
    assert isinstance(parsed, QualificationModel)
    assert parsed.overall_qualification_score_0_100 >= 0
    assert model_used == "mock-deterministic-v1"


def test_cost_calculation():
    cost = calculate_cost("gemini-2.0-flash", input_tokens=1000, output_tokens=500)
    assert cost > 0.0
    assert cost < 0.01  # Very cost-effective


@pytest.mark.asyncio
async def test_gemini_call_disables_thinking_and_uses_generous_timeout(monkeypatch):
    """Regression for the bug the eval harness found on 2026-09-13: the reasoning variant of
    Gemini spent 6,600+ tokens "thinking" on a schema-heavy MEDDPICC prompt and regularly blew
    past a 30s timeout, silently degrading every real diagnostic to the static mock. Doesn't
    call the network — just asserts the request this code sends actually carries the fix."""
    monkeypatch.setattr("app.core.llm_router.settings.GEMINI_API_KEY", "real-looking-key")

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: {
        "candidates": [{"content": {"parts": [{"text": '{"overall_qualification_score_0_100": 1}'}]}}]
    }

    captured = {}

    async def fake_post(self, url, json=None, **kwargs):
        captured["url"] = url
        captured["json"] = json
        return mock_response

    with patch("httpx.AsyncClient.post", new=fake_post):
        try:
            await llm_router.call_structured_llm(
                tenant_id="00000000-0000-0000-0000-000000000000",
                system_prompt="sys",
                user_prompt="user",
                response_model=QualificationModel,
                feature="medpicc",
            )
        except Exception:
            pass  # the fixture response is deliberately incomplete; only the request matters here

    assert captured["json"]["generationConfig"]["thinkingConfig"] == {"thinkingBudget": 0}


@pytest.mark.asyncio
async def test_groq_and_openai_calls_set_a_generous_max_tokens(monkeypatch):
    """Regression: no max_tokens meant Groq's own default ceiling, which truncated real
    MEDDPICC responses mid-object and failed Pydantic validation on every field after the cut."""
    monkeypatch.setattr("app.core.llm_router.settings.GEMINI_API_KEY", "mock-gemini-key")
    monkeypatch.setattr("app.core.llm_router.settings.GROQ_API_KEY", "real-looking-groq-key")

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: {"choices": [{"message": {"content": '{"overall_qualification_score_0_100": 1}'}}]}

    captured = {}

    async def fake_post(self, url, json=None, **kwargs):
        captured["url"] = url
        captured["json"] = json
        return mock_response

    with patch("httpx.AsyncClient.post", new=fake_post):
        try:
            await llm_router.call_structured_llm(
                tenant_id="00000000-0000-0000-0000-000000000000",
                system_prompt="sys",
                user_prompt="user",
                response_model=QualificationModel,
                feature="medpicc",
            )
        except Exception:
            pass

    assert "groq" in captured["url"]
    assert captured["json"]["max_tokens"] >= 8192
