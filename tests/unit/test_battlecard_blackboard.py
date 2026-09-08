"""Unit tests for the tenant-specific Competitor Battlecard orchestrator (no fixtures)."""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.battlecards.blackboard_orchestrator import (
    BlackboardBattlecardOrchestrator,
    CompetitorShortlist,
    TenantContext,
    slugify,
)


def test_slugify():
    assert slugify("Clay.com") == "clay-com"
    assert slugify("Building In-House") == "building-in-house"


def test_evidence_basis_coercion():
    from app.models.battlecard_schemas import BattlecardKillShot

    def basis(v):
        return BattlecardKillShot(
            title="t", the_trap="t", the_vulnerability="v", the_counter_strike="c",
            verbatim_soundbite="s", evidence_basis=v,
        ).evidence_basis

    assert basis("category_structural_pattern") == "category_structural_pattern"
    assert basis("Category Structural Pattern") == "category_structural_pattern"
    assert basis("Verified from our closed-won deals") == "tenant_verified_intel"
    assert basis("Ask the buyer a probing question") == "socratic_inquiry"
    assert basis("some freeform explanation") == "category_structural_pattern"
    assert basis(None) == "category_structural_pattern"


@pytest.mark.asyncio
async def test_generate_battlecard_normalises_llm_output_to_five_stages():
    from app.models.battlecard_schemas import (
        BattlecardKillShot, BlackboardStageResult, CompetitorBattlecard, ObjectionHandlingEntry,
    )
    partial = CompetitorBattlecard(
        id="x", competitor_name="X", competitor_category="c", summary_verdict="v",
        pricing_weakness="p", feature_gaps=["g"],
        kill_shots=[BattlecardKillShot(title="t", the_trap="t", the_vulnerability="v",
                                       the_counter_strike="c", verbatim_soundbite="s")],
        objection_matrix=[ObjectionHandlingEntry(objection="o", root_cause="r", talk_track="t", proof_point="p")],
        blackboard_stages=[BlackboardStageResult(stage_number=9, stage_name="weird", executive_summary="e")],
    )
    orch = BlackboardBattlecardOrchestrator()
    with patch(
        "app.services.battlecards.blackboard_orchestrator.llm_router.call_structured_llm",
        new=AsyncMock(return_value=(partial, "gemini-flash-latest")),
    ):
        card, by, model = await orch.generate_battlecard("Gartner", TenantContext(offering="x"), "acme")
    assert by == "llm"
    assert [s.stage_number for s in card.blackboard_stages] == [1, 2, 3, 4, 5]
    assert card.competitor_name == "Gartner" and card.id == "gartner"


def test_template_fallback_has_all_5_stages_and_safe_basis():
    orch = BlackboardBattlecardOrchestrator()
    card = orch.synthesize_custom_battlecard(
        competitor_name="RivalAgencyX",
        seller_company="Acme",
        tenant_offering="Performance Creative Retainers",
    )
    assert card.competitor_name == "RivalAgencyX"
    assert len(card.blackboard_stages) == 5
    names = [s.stage_name for s in card.blackboard_stages]
    assert names == [
        "Opportunity Context Engine",
        "Pressure & Catalyst Engine",
        "Differentiation Engine",
        "Operational Data Engine",
        "Seller Action Brief",
    ]
    assert card.kill_shots and card.objection_matrix
    # No tenant intel -> claims stay category-level (defamation safety)
    assert card.evidence_basis == "category_structural_pattern"
    assert card.kill_shots[0].evidence_basis == "category_structural_pattern"


def test_template_uses_tenant_verified_intel_when_provided():
    orch = BlackboardBattlecardOrchestrator()
    card = orch.synthesize_custom_battlecard(
        competitor_name="RivalAgencyX",
        tenant_rival_intel="Requires 100% advance and withholds raw files on completion",
    )
    assert card.evidence_basis == "tenant_verified_intel"
    assert "Tenant-verified operational constraint" in card.kill_shots[0].the_vulnerability


def test_template_leakage_math_is_computed_from_contract_value():
    orch = BlackboardBattlecardOrchestrator()
    card = orch.synthesize_custom_battlecard(
        competitor_name="RivalX", avg_contract_value=2_000_000, currency="INR"
    )
    assert "2,000,000" in card.leakage_calculation_basis and "1.25" in card.leakage_calculation_basis
    assert "2,500,000" in card.objection_matrix[0].proof_point  # 2,000,000 * 1.25
    card_bench = orch.synthesize_custom_battlecard(competitor_name="RivalX")
    assert "Set an average contract value" in card_bench.leakage_calculation_basis


@pytest.mark.asyncio
async def test_identify_competitors_uses_llm_then_falls_back():
    orch = BlackboardBattlecardOrchestrator()
    ctx = TenantContext(seller_company="Acme", offering="SEO retainers", industry="Marketing")

    with patch(
        "app.services.battlecards.blackboard_orchestrator.llm_router.call_structured_llm",
        new=AsyncMock(return_value=(CompetitorShortlist(competitors=["Gartner", "Forrester"]), "gemini-2.0-flash")),
    ):
        names = await orch.identify_competitors(ctx)
    assert names == ["Gartner", "Forrester"]

    with patch(
        "app.services.battlecards.blackboard_orchestrator.llm_router.call_structured_llm",
        new=AsyncMock(side_effect=RuntimeError("no provider")),
    ):
        fallback = await orch.identify_competitors(ctx)
    assert fallback and all(isinstance(n, str) for n in fallback)


@pytest.mark.asyncio
async def test_generate_battlecard_falls_back_to_template_on_llm_failure():
    orch = BlackboardBattlecardOrchestrator()
    ctx = TenantContext(seller_company="Acme", offering="SEO retainers")
    with patch(
        "app.services.battlecards.blackboard_orchestrator.llm_router.call_structured_llm",
        new=AsyncMock(side_effect=RuntimeError("no provider")),
    ):
        card, generated_by, model = await orch.generate_battlecard("Gartner", ctx, "acme")
    assert generated_by == "template"
    assert model is None
    assert card.competitor_name == "Gartner"
    assert card.id == "gartner"
    assert len(card.blackboard_stages) == 5
