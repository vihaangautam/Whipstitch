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
