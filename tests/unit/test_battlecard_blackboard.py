"""Unit tests for the 5-Stage Blackboard Competitor Battlecard Orchestrator."""
import pytest
from app.services.battlecards.blackboard_orchestrator import BlackboardBattlecardOrchestrator


def test_verified_battlecards_seeded():
    orchestrator = BlackboardBattlecardOrchestrator()
    cards = orchestrator.list_battlecards()
    assert len(cards) >= 4

    card_ids = [c.id for c in cards]
    assert "zoominfo" in card_ids
    assert "apollo-alone" in card_ids
    assert "in-house-build" in card_ids
    assert "status-quo" in card_ids


def test_battlecard_kill_shots_structure():
    orchestrator = BlackboardBattlecardOrchestrator()
    zoominfo_card = orchestrator.get_battlecard("zoominfo")
    assert zoominfo_card is not None
    assert len(zoominfo_card.kill_shots) >= 2

    first_ks = zoominfo_card.kill_shots[0]
    assert first_ks.title != ""
    assert first_ks.the_trap != ""
    assert first_ks.the_vulnerability != ""
    assert first_ks.the_counter_strike != ""
    assert first_ks.verbatim_soundbite != ""
    assert first_ks.evidence_proof is not None


def test_battlecard_objection_matrix():
    orchestrator = BlackboardBattlecardOrchestrator()
    card = orchestrator.get_battlecard("apollo-alone")
    assert card is not None
    assert len(card.objection_matrix) >= 1

    first_obj = card.objection_matrix[0]
    assert first_obj.objection != ""
    assert first_obj.root_cause != ""
    assert first_obj.talk_track != ""
    assert first_obj.proof_point != ""


def test_custom_battlecard_synthesis_all_5_stages():
    orchestrator = BlackboardBattlecardOrchestrator()
    custom_card = orchestrator.synthesize_custom_battlecard(
        competitor_name="Clay.com",
        buyer_company="Stripe Global",
        deal_context="Evaluating Clay vs Whipstitch for enterprise outbound",
    )

    assert custom_card.competitor_name == "Clay.com"
    assert len(custom_card.blackboard_stages) == 5

    stage_names = [s.stage_name for s in custom_card.blackboard_stages]
    assert "Opportunity Context Engine" in stage_names[0]
    assert "Pressure & Catalyst Engine" in stage_names[1]
    assert "Differentiation Engine" in stage_names[2]
    assert "Operational Data Engine" in stage_names[3]
    assert "Seller Action Brief" in stage_names[4]

    assert len(custom_card.kill_shots) >= 1
    assert len(custom_card.objection_matrix) >= 1


def test_defamation_prevention_evidence_basis():
    """Verify that absent tenant intel, claims are strictly category-level to prevent defamation."""
    orchestrator = BlackboardBattlecardOrchestrator()
    
    # 1. Unverified rival (Default safe path)
    safe_card = orchestrator.synthesize_custom_battlecard(
        competitor_name="RivalAgencyX",
        tenant_offering="Performance Creative Retainers",
    )
    assert safe_card.evidence_basis == "category_structural_pattern"
    assert safe_card.kill_shots[0].evidence_basis == "category_structural_pattern"
    assert "Category structural pattern" in safe_card.kill_shots[0].the_vulnerability

    # 2. Tenant-verified intel path
    verified_card = orchestrator.synthesize_custom_battlecard(
        competitor_name="RivalAgencyX",
        tenant_offering="Performance Creative Retainers",
        tenant_rival_intel="Requires 100% advance payment and withholds raw project files upon contract completion",
    )
    assert verified_card.evidence_basis == "tenant_verified_intel"
    assert verified_card.kill_shots[0].evidence_basis == "tenant_verified_intel"
    assert "Tenant-verified operational constraint" in verified_card.kill_shots[0].the_vulnerability


def test_transparent_computed_leakage_math():
    """Verify that leakage figures are mathematically computed from tenant contract value, not static placeholders."""
    orchestrator = BlackboardBattlecardOrchestrator()
    
    # Passing specific contract value: 20 Lakhs (2,000,000)
    card = orchestrator.synthesize_custom_battlecard(
        competitor_name="RivalX",
        avg_contract_value=2000000,
        currency="INR",
        buyer_tier=1,
    )
    assert "Computed from your configured Average Contract Value" in card.leakage_calculation_basis
    assert "2,500,000" in card.leakage_calculation_basis  # 2,000,000 * 1.25

    # Without contract value: transparently marked as benchmark reference
    card_bench = orchestrator.synthesize_custom_battlecard(
        competitor_name="RivalX",
        avg_contract_value=None,
        currency="INR",
        buyer_tier=1,
    )
    assert "Benchmark Reference" in card_bench.leakage_calculation_basis


def test_empty_known_competitors_empty_state():
    """Verify that an unconfigured tenant gets an explicit empty state rather than falling back to ZoomInfo."""
    orchestrator = BlackboardBattlecardOrchestrator()
    
    # 1. Empty competitors list
    res_empty = orchestrator.get_tenant_preset_battlecards(known_competitors=[])
    assert res_empty["has_configured_rivals"] is False
    assert len(res_empty["named_battlecards"]) == 0
    assert "Add your top 2-3 market rivals in Logic & ICP Studio" in res_empty["empty_state_message"]
    # Universal archetypes remain available
    assert len(res_empty["universal_archetypes"]) == 2

    # 2. Configured competitors
    res_configured = orchestrator.get_tenant_preset_battlecards(known_competitors=["Schbang", "Dentsu"])
    assert res_configured["has_configured_rivals"] is True
    assert len(res_configured["named_battlecards"]) == 2
    assert res_configured["empty_state_message"] is None

