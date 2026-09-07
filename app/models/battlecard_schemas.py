"""Pydantic schemas and data contracts for Competitor Battlecards and 6-Signal Agent."""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class BattlecardKillShot(BaseModel):
    title: str = Field(..., description="Short title of the competitive landmine or kill-shot.")
    the_trap: str = Field(..., description="What the competitor claims to buyers.")
    the_vulnerability: str = Field(..., description="The hidden weakness, limitation, or gotcha in their product/category.")
    the_counter_strike: str = Field(..., description="The exact Socratic question or pivot for the sales rep to expose the weakness.")
    verbatim_soundbite: str = Field(..., description="Crisp, executive soundbite the rep can say word-for-word.")
    evidence_proof: Optional[str] = Field(default=None, description="Customer metric, technical benchmark, or case study proof.")
    evidence_basis: Literal["tenant_verified_intel", "category_structural_pattern", "socratic_inquiry"] = Field(
        default="category_structural_pattern",
        description="Legal safety categorization: verified tenant intel vs safe category structural pattern vs probing question."
    )


class ObjectionHandlingEntry(BaseModel):
    objection: str = Field(..., description="Common buyer pushback during the sales cycle.")
    root_cause: str = Field(..., description="The underlying fear, budget concern, or competitor influence.")
    talk_track: str = Field(..., description="Recommended multi-sentence rep response.")
    proof_point: str = Field(..., description="Concrete customer metric or architecture proof.")


class BlackboardStageResult(BaseModel):
    stage_number: int = Field(..., description="Stage 1 to 5.")
    stage_name: str = Field(..., description="Name of the reasoning engine.")
    executive_summary: str = Field(..., description="High-level finding from this stage.")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured attributes extracted in this stage.")


class CompetitorBattlecard(BaseModel):
    id: str = Field(..., description="Unique competitor ID (e.g. 'zoominfo', 'apollo-alone').")
    competitor_name: str = Field(..., description="Competitor or alternative name.")
    competitor_category: str = Field(..., description="Category (e.g. 'Legacy Contact Database', 'In-House Build').")
    summary_verdict: str = Field(..., description="One-sentence executive summary of our structural advantage.")
    pricing_weakness: str = Field(..., description="Competitor's commercial liability (per-seat markup, rigid lock-in).")
    feature_gaps: List[str] = Field(default_factory=list, description="Key functional capabilities they lack.")
    evidence_basis: str = Field(default="category_structural_pattern", description="Audit classification for claims safety.")
    leakage_calculation_basis: Optional[str] = Field(default=None, description="Transparent explanation of how financial impact was derived.")
    
    # Core Deliverables
    kill_shots: List[BattlecardKillShot] = Field(default_factory=list, description="Lethal landmines and trap questions.")
    objection_matrix: List[ObjectionHandlingEntry] = Field(default_factory=list, description="Top objections and talk-tracks.")
    blackboard_stages: List[BlackboardStageResult] = Field(default_factory=list, description="Trace of the 5 blackboard stages.")


SignalType = Literal[
    "leadership_shift",
    "capital_expansion",
    "tech_stack_migration",
    "compliance_infosec",
    "incumbent_churn",
    "velocity_surge",
    "seasonal_campaign_window",
]


class AccountSignal(BaseModel):
    id: str = Field(..., description="Unique signal ID.")
    account_name: str = Field(..., description="Target company name.")
    signal_type: SignalType = Field(..., description="1 of the 7 canonical revenue triggers.")
    headline: str = Field(..., description="News, job change, or telemetry alert headline.")
    snippet: str = Field(..., description="Context or quote from the signal source.")
    source: str = Field(default="Google Serper Radar", description="Signal origin.")
    detected_at: str = Field(default="Recent", description="Timestamp or freshness label.")
    confidence_score: int = Field(..., ge=0, le=100, description="Signal confidence score.")
    opportunity_viability_boost: int = Field(..., description="Impact on deal score (+10 to +30 pts).")
    recommended_sales_play: str = Field(..., description="Immediate prescriptive action for the rep.")
    pre_drafted_hook: str = Field(..., description="Ready-to-send conversation starter.")
    buyer_tier: int = Field(default=1, description="Buyer tier 1 (SMB/D2C), 2 (Growth/Unicorn), or 3 (Enterprise).")


class GenerateBattlecardRequest(BaseModel):
    competitor_name: str = Field(..., description="Name of the rival or in-house alternative.")
    buyer_company: Optional[str] = Field(default=None, description="Prospect evaluating this competitor.")
    seller_company: Optional[str] = Field(default="Whipstitch", description="Our product or agency name.")
    tenant_offering: Optional[str] = Field(default=None, description="What the tenant sells (e.g., Performance Creative Retainer).")
    tenant_value_props: Optional[List[str]] = Field(default=None, description="Core differentiators of the tenant.")
    tenant_rival_intel: Optional[str] = Field(default=None, description="Tenant-verified observations about this specific rival to avoid defamation.")
    avg_contract_value: Optional[float] = Field(default=None, description="Tenant's average deal value for honest leakage computation.")
    deal_context: Optional[str] = Field(default=None, description="Known context about the competitive evaluation.")
    buyer_tier: Optional[int] = Field(default=1, description="Buyer tier 1, 2, or 3.")
    currency: Optional[str] = Field(default="INR", description="Deal currency (INR, USD, EUR).")
    team_type: Optional[str] = Field(default="team", description="'team' or 'solo'.")

