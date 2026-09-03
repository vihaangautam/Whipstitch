"""Unit tests for the 6-Signal Autonomous Account Agent."""
import pytest
from app.services.signals.autonomous_signal_agent import AutonomousSignalAgent


def test_seed_signals_loaded():
    agent = AutonomousSignalAgent()
    signals = agent.list_signals()
    assert len(signals) >= 6

    types = {s.signal_type for s in signals}
    assert "leadership_shift" in types
    assert "capital_expansion" in types
    assert "tech_stack_migration" in types
    assert "compliance_infosec" in types
    assert "incumbent_churn" in types
    assert "velocity_surge" in types


def test_classify_leadership_shift():
    agent = AutonomousSignalAgent()
    sig = agent.classify_signal(
        account_name="Acme Corp",
        headline="Acme Corp Hires New Chief Marketing Officer",
        snippet="Former Snowflake VP joins to lead global demand generation.",
    )
    assert sig.signal_type == "leadership_shift"
    assert sig.opportunity_viability_boost == 25
    assert "congrats" in sig.pre_drafted_hook.lower() or "congratulations" in sig.pre_drafted_hook.lower()


def test_classify_capital_expansion():
    agent = AutonomousSignalAgent()
    sig = agent.classify_signal(
        account_name="NextGen AI",
        headline="NextGen AI Closes $50M Series C Funding Round",
        snippet="Capital will be deployed to accelerate sales hiring and enterprise expansion.",
    )
    assert sig.signal_type == "capital_expansion"
    assert sig.opportunity_viability_boost == 30


def test_classify_compliance_infosec():
    agent = AutonomousSignalAgent()
    sig = agent.classify_signal(
        account_name="HealthData Inc",
        headline="HealthData Inc Mandates SOC2 Type II Audit Across Vendors",
        snippet="Requires all third-party software to provide zero data training guarantees.",
    )
    assert sig.signal_type == "compliance_infosec"
    assert sig.opportunity_viability_boost == 25


def test_opportunity_score_calculation():
    agent = AutonomousSignalAgent()
    score = agent.calculate_account_opportunity_score("Apex Logistics Global")
    assert 50 <= score <= 100
