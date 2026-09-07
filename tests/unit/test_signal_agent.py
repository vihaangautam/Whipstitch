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


def test_pitching_false_positive_prevention():
    """Verify that bare 'pitching' in normal business news does NOT trigger churn, while tight phrases do."""
    agent = AutonomousSignalAgent()
    
    # 1. Normal business news with 'pitching' -> should NOT be incumbent_churn
    sig_normal = agent.classify_signal(
        account_name="VentureFlow",
        headline="VentureFlow Founder Seen Pitching Top Silicon Valley Investors for Series A",
        snippet="Management is currently pitching venture capitalists across Sand Hill Road.",
    )
    assert sig_normal.signal_type != "incumbent_churn"

    # 2. Genuine churn news with tight phrase 'in a pitch process' -> SHOULD be incumbent_churn
    sig_churn = agent.classify_signal(
        account_name="BrandCorp",
        headline="BrandCorp Confirms It Is In A Pitch Process For New Creative Partners",
        snippet="Dissatisfied with current creative execution, CMO opens formal agency review.",
    )
    assert sig_churn.signal_type == "incumbent_churn"


def test_configurable_seasonal_calendar():
    """Verify that seasonal calendars are tenant and geography configurable."""
    agent = AutonomousSignalAgent()

    # 1. US Geography with Black Friday
    sig_us = agent.classify_signal(
        account_name="Nordic Retail US",
        headline="Nordic Retail Prepares Supply Chain for Black Friday Rush",
        snippet="E-commerce retailer ramps inventory for upcoming holiday campaign.",
        geography="US",
        buyer_tier=1,
    )
    assert sig_us.signal_type == "seasonal_campaign_window"
    assert sig_us.opportunity_viability_boost == 30

    # 2. India Geography with Diwali
    sig_in = agent.classify_signal(
        account_name="Delhi Brands",
        headline="Delhi Brands Initiates Festive Season Diwali Video Production",
        snippet="Locking agency deliverables for Q3 festival ramp.",
        geography="India",
        buyer_tier=1,
    )
    assert sig_in.signal_type == "seasonal_campaign_window"
    assert sig_in.opportunity_viability_boost == 30

    # 3. Custom tenant calendar
    sig_custom = agent.classify_signal(
        account_name="Brewery Co",
        headline="Brewery Co Launches Summer Peak Beverage Campaign",
        snippet="Aggressive outdoor promotional push across stadiums.",
        seasonal_calendar=["summer peak", "octoberfest"],
        buyer_tier=1,
    )
    assert sig_custom.signal_type == "seasonal_campaign_window"

