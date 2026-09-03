"""Unit tests for MultiLLMRouter and fallback handling."""
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
