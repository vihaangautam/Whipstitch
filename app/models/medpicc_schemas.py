"""Pydantic schemas and structured contracts for MEDDPICC Deal Diagnostic & BYOK."""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class EvidenceQuote(BaseModel):
    person_name: Optional[str] = Field(default=None, description="Name of the external customer who made the statement.")
    evidence_date: Optional[str] = Field(default=None, description="Date of the email/meeting.")
    medium: Optional[str] = Field(default="Call", description="Email or Meeting or Call.")
    quote: str = Field(..., description="Verbatim quote from the external customer.")


class ValueSellingBox(BaseModel):
    box: str = Field(..., description="MEDDPICC box name: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Implicated Pain, Champion, Competition.")
    score: int = Field(..., ge=0, le=15, description="Numeric score achieved for this box.")
    max_score: int = Field(default=15, description="Maximum possible score (15 for M, E, I, C; 10 for D, D, P, C).")
    rating: Literal["Strong", "Moderate", "Weak", "Missing"] = Field(..., description="Rating label derived from score.")
    evidence_basis: Literal["direct", "inferred", "none"] = Field(default="direct", description="Grounded in verbatim buyer quotes, role hypothesis, or none.")
    hard_cap_applied: bool = Field(default=False, description="Whether rule hard-cap was applied (e.g. EB unverified -> max 7).")
    evidence_quotes: List[EvidenceQuote] = Field(default_factory=list, description="Verbatim buyer quotes confirming this box.")
    notes: Optional[str] = Field(default=None, description="Strategic interpretation or rationale.")
    missing_evidence: Optional[str] = Field(default=None, description="Identified gaps preventing a higher score.")
    coaching_questions: List[str] = Field(default_factory=list, description="2-3 targeted discovery questions for the rep.")


class ClosureLikelihoodDetail(BaseModel):
    likelihood_range: str = Field(..., description="Estimated percentage range (e.g. '65-80%').")
    rationale: str = Field(..., description="Justification based on evidence and risk factors.")


class ClosureLikelihood(BaseModel):
    if_addressed: ClosureLikelihoodDetail = Field(..., description="Outcome if critical qualification gaps are resolved.")
    if_ignored: ClosureLikelihoodDetail = Field(..., description="Outcome if gaps remain unaddressed (status quo risk).")


class SellerSummary(BaseModel):
    headline: str = Field(..., description="One-sentence executive deal summary.")
    what_we_know: List[str] = Field(default_factory=list, description="Confirmed facts backed by evidence.")
    deal_risks: List[str] = Field(default_factory=list, description="Identified deal vulnerabilities.")
    next_best_actions: List[str] = Field(default_factory=list, description="Immediate steps the seller should take.")


class NextBestActionEmail(BaseModel):
    subject: str = Field(..., description="Non-salesy, executive subject line.")
    body_content: str = Field(..., description="Strategic follow-up email targeting the weakest qualification area.")


class QualificationModel(BaseModel):
    overall_qualification_score_0_100: int = Field(..., ge=0, le=100, description="Sum of all 8 MEDDPICC box scores.")
    deal_category: Literal["Advance", "Rescue", "Nurture", "Disqualify"] = Field(..., description="Overall disposition per Rule 10.1.")
    deal_health: Literal["Strong", "Moderate", "At Risk", "Critical"] = Field(default="Moderate")
    recommended_stage_action: str = Field(..., description="Concrete CRM pipeline action per Stage Matrix.")
    next_best_action: str = Field(..., description="Single highest-priority task for the account executive.")
    next_best_action_email: NextBestActionEmail = Field(..., description="Auto-drafted follow-up email.")
    top_2_missing_boxes_blocking_closure: List[str] = Field(default_factory=list, description="Weakest sections blocking progress.")
    closure_likelihood: ClosureLikelihood = Field(..., description="Dual-path closure probability.")
    seller_summary: SellerSummary = Field(..., description="Executive briefing.")
    value_selling_boxes: List[ValueSellingBox] = Field(..., description="The 8 individual MEDDPICC scorecards.")
    evidence_coverage: int = Field(default=0, ge=0, le=8, description="Number of boxes with direct verbatim evidence.")
    outcome_trajectory: Optional[str] = Field(default="On Track once primary gate is confirmed", description="Trajectory status reflecting gate completion.")
    rubric_version: Optional[str] = Field(default="track1-tier1-v1.0", description="Granular track-tier version key.")


# ==========================================
# REST API DTOs
# ==========================================

class CreateDealRequest(BaseModel):
    tenant_id: str = Field(default="trifid_media")
    deal_name: str = Field(..., description="Name of the deal or project.")
    company_name: str = Field(..., description="Target buyer company.")
    domain: Optional[str] = Field(default=None)
    deal_size: Optional[float] = Field(default=1500000.0)
    currency: str = Field(default="INR")
    buyer_tier: Literal["Tier 1: Founder-Led SMB", "Tier 2: Growth Scale-up", "Tier 3: Enterprise MNC"] = Field(
        default="Tier 1: Founder-Led SMB"
    )
    tenant_track: str = Field(default="Service / Retainer")
    current_stage: str = Field(default="Discovery")


class DealResponse(BaseModel):
    id: str
    tenant_id: str
    deal_name: str
    company_name: str
    domain: Optional[str] = None
    deal_size: Optional[float] = None
    currency: str
    buyer_tier: Optional[str] = "Tier 1: Founder-Led SMB"
    tenant_track: Optional[str] = "Service / Retainer"
    current_stage: str
    latest_score: Optional[int] = None
    latest_category: Optional[str] = None
    rubric_version: Optional[str] = None
    created_at: str


class TranscriptUploadRequest(BaseModel):
    transcript_text: str = Field(..., description="Raw text of the sales call or email thread.")
    transcript_source: Literal["file_upload", "text_paste"] = Field(default="text_paste")


class TriggerDiagnoseRequest(BaseModel):
    tenant_id: str = Field(default="trifid_media")
    deal_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    preferred_model: Optional[str] = Field(default=None)
    transcript_text: Optional[str] = Field(default=None)


class DealDiagnosticResponse(BaseModel):
    id: str
    deal_id: str
    overall_score: int
    deal_category: str
    next_best_action: str
    outcome_trajectory: Optional[str] = None
    rubric_version: Optional[str] = None
    closure_if_addressed: Dict[str, Any]
    closure_if_ignored: Dict[str, Any]
    top_blocking_boxes: List[str]
    seller_summary: Dict[str, Any]
    follow_up_email: Dict[str, str]
    boxes: List[Dict[str, Any]]
    model_used: str
    pdf_report_url: Optional[str] = None
    created_at: str


class SaveAPIKeyRequest(BaseModel):
    tenant_id: str = Field(default="trifid_media")
    provider: Literal["openai", "gemini", "groq", "anthropic", "apollo", "hubspot", "serper"]
    api_key: str = Field(..., description="Raw API key plaintext")


class TestAPIKeyRequest(BaseModel):
    provider: str
    api_key: str = Field(..., description="Raw API key plaintext, sent in the body — never a query param")


class APIKeyInfoResponse(BaseModel):
    id: str
    provider: str
    key_masked: str
    is_active: bool
    created_at: str


class TestKeyResponse(BaseModel):
    provider: str
    valid: bool
    message: str
