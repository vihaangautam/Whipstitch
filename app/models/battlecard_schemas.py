"""Pydantic schemas and data contracts for Competitor Battlecards and 6-Signal Agent."""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class BattlecardKillShot(BaseModel):
    title: str = Field(..., description="Short title of the competitive landmine or kill-shot.")
    the_trap: str = Field(..., description="What the competitor claims to buyers.")
    the_vulnerability: str = Field(..., description="The hidden weakness, limitation, or gotcha in their product.")
    the_counter_strike: str = Field(..., description="The exact question or pivot for the sales rep to expose the weakness.")
    verbatim_soundbite: str = Field(..., description="Crisp, executive soundbite the rep can say word-for-word.")
    evidence_proof: Optional[str] = Field(default=None, description="Customer metric, technical benchmark, or case study proof.")


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
]


class AccountSignal(BaseModel):
    id: str = Field(..., description="Unique signal ID.")
    account_name: str = Field(..., description="Target company name.")
    signal_type: SignalType = Field(..., description="1 of the 6 canonical revenue triggers.")
    headline: str = Field(..., description="News, job change, or telemetry alert headline.")
    snippet: str = Field(..., description="Context or quote from the signal source.")
    source: str = Field(default="Google Serper Radar", description="Signal origin.")
    detected_at: str = Field(default="Recent", description="Timestamp or freshness label.")
    confidence_score: int = Field(..., ge=0, le=100, description="Signal confidence score.")
    opportunity_viability_boost: int = Field(..., description="Impact on deal score (+10 to +30 pts).")
    recommended_sales_play: str = Field(..., description="Immediate prescriptive action for the rep.")
    pre_drafted_hook: str = Field(..., description="Ready-to-send conversation starter.")


class GenerateBattlecardRequest(BaseModel):
    competitor_name: str = Field(..., description="Name of the rival or in-house alternative.")
    buyer_company: Optional[str] = Field(default=None, description="Prospect evaluating this competitor.")
    seller_company: Optional[str] = Field(default="Whipstitch", description="Our product name.")
    deal_context: Optional[str] = Field(default=None, description="Known context about the competitive evaluation.")
