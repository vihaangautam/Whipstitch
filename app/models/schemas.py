"""Pydantic Data Contracts for Whipstitch."""
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class IngestEventRequest(BaseModel):
    tenant_id: str = Field(default="trifid_media", description="Tenant identifier")
    idempotency_key: Optional[str] = Field(
        default=None, description="Optional caller-supplied idempotency key"
    )
    email: str = Field(..., description="Lead contact email")
    company_name: str = Field(..., description="Lead company name")
    raw_payload: dict = Field(default_factory=dict, description="Original webhook raw payload")


class IngestEventResponse(BaseModel):
    event_id: str
    status: Literal["received", "duplicate"]
    message: str
    cached_state: Optional[dict] = None


class OutboundDraft(BaseModel):
    """Structured cold outreach following Pattern 5: Observation -> Link -> Ask."""
    observation_hook: str = Field(
        ...,
        description="Verifiable fact derived from company website/signals context."
    )
    capability_link: str = Field(
        ...,
        description="One sentence connecting the observation to your capability/offer."
    )
    low_friction_ask: str = Field(
        ...,
        description="A low-friction call to value question (e.g. 'Worth sending over a 2-page creator shortlist?')"
    )

    def to_email_body(self) -> str:
        return f"{self.observation_hook}\n\n{self.capability_link}\n\n{self.low_friction_ask}"


class LeadQualificationSchema(BaseModel):
    lead_score: int = Field(..., ge=0, le=100)
    fit_reasoning: str
    outreach_draft: OutboundDraft
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class DecisionMaker(BaseModel):
    """Resolved executive contact via Pattern 2.

    Every field is optional because an unresolved contact must be representable.
    Only a contact with is_verified=True may be staged to CRM.
    """
    full_name: Optional[str] = None
    exact_title: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    is_verified: bool = False


class ICPCheck(BaseModel):
    """Circuit-breaker fast-fail gate output via Pattern 4."""
    is_viable_prospect: bool
    disqualification_reason: Optional[str] = None
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)


class TenantConfigSchema(BaseModel):
    enrichment_waterfall_order: list[str] = Field(
        default=["apollo", "people_data_labs", "hunter", "diffbot", "crawl4ai", "llm_fallback"]
    )
    icp_criteria: dict = Field(
        default={
            "target_industries": ["D2C", "E-commerce", "Lifestyle", "Consumer Tech"],
            "employee_count_min": 50,
            "employee_count_max": 500,
            "geographies": ["India", "UAE", "UK", "US"],
        }
    )
    bm25_query_terms: str = Field(
        default="product features value proposition pricing clients creator roster",
        description="Target keywords for Crawl4AI BM25 Fit Markdown filtering"
    )
    target_decision_maker_roles: list[str] = Field(
        default=["Head of Marketing", "Founder", "VP Growth", "UGC Lead"],
        description="Target roles for executive finder resolution"
    )
    routing_matrix: dict = Field(
        default={
            "high_priority": "enterprise_aef_pool",
            "medium_priority": "mid_market_pool",
            "low_priority": "nurture_campaign",
        }
    )
    sla_window_minutes: int = 15


class EventStatusResponse(BaseModel):
    event_id: str
    tenant_id: str
    email: str
    company_name: str
    status: str
    created_at: str
    enrichment_summary: Optional[dict] = None
    qualification_summary: Optional[dict] = None


class TriggerOutboundRequest(BaseModel):
    tenant_id: str = Field(default="trifid_media", description="Tenant identifier")
    batch_size: int = Field(default=5, ge=1, le=50, description="Number of prospects to discover and process")


class TriggerOutboundResponse(BaseModel):
    workflow_id: str
    status: str
    prospects_targeted: int
    message: str


class OutboundProspectResponse(BaseModel):
    id: str
    tenant_id: str
    company_name: str
    domain: str
    industry: Optional[str] = None
    scrape_status: str
    disqualification_reason: Optional[str] = None
    decision_maker_name: Optional[str] = None
    decision_maker_title: Optional[str] = None
    decision_maker_linkedin: Optional[str] = None
    signals_json: dict = Field(default_factory=dict)
    fit_markdown: Optional[str] = None
    created_at: str
    updated_at: str


class ApproveProspectRequest(BaseModel):
    action: Literal["approve", "reject"] = Field(..., description="Action to take on staged prospect")
    rejection_reason: Optional[str] = Field(default=None, description="Reason if rejecting")


class ApproveProspectResponse(BaseModel):
    prospect_id: str
    status: str
    message: str


