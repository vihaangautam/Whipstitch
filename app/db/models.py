import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_key = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    config = Column(JSONB, nullable=False, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    lead_events = relationship("LeadEvent", back_populates="tenant", cascade="all, delete-orphan")


class LeadEvent(Base):
    __tablename__ = "lead_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)
    source = Column(String(64), nullable=False, default="inbound_webhook")
    email = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    raw_payload = Column(JSONB, nullable=False, default=dict)
    status = Column(
        String(32),
        nullable=False,
        default="received",
    )  # received, enriching, scoring, synced, failed
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    tenant = relationship("Tenant", back_populates="lead_events")


class ExecutionAuditLog(Base):
    __tablename__ = "execution_audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(String(255), nullable=False, index=True)
    workflow_type = Column(String(128), nullable=False)
    activity_name = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)  # started, succeeded, failed, compensated
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)


class EnrichmentResult(Base):
    __tablename__ = "enrichment_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_source_type = Column(String(32), nullable=False, default="inbound")  # inbound or outbound
    lead_source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    provider_used = Column(String(64), nullable=False)
    raw_response = Column(JSONB, nullable=False, default=dict)
    fallback_triggered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class LLMQualification(Base):
    __tablename__ = "llm_qualifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_source_type = Column(String(32), nullable=False, default="inbound")
    lead_source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    lead_score = Column(Integer, nullable=False)
    fit_reasoning = Column(Text, nullable=False)
    observation_hook = Column(Text, nullable=False)
    capability_link = Column(Text, nullable=False)
    low_friction_ask = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, default=1.0)
    model_used = Column(String(64), nullable=False, default="groq/llama-3.3-70b-versatile")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class CRMSyncRecord(Base):
    __tablename__ = "crm_sync_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_source_type = Column(String(32), nullable=False, default="inbound")
    lead_source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    crm_provider = Column(String(64), nullable=False, default="hubspot")
    crm_record_id = Column(String(255), nullable=False)
    sync_status = Column(String(32), nullable=False, default="synced")  # synced, staged_awaiting_approval, failed
    synced_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class SLAEscalation(Base):
    __tablename__ = "sla_escalations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_source_type = Column(String(32), nullable=False, default="inbound")
    lead_source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    triggered_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    slack_message_id = Column(String(255), nullable=True)


class OutboundProspect(Base):
    __tablename__ = "outbound_prospects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    industry = Column(String(255), nullable=True)
    scrape_status = Column(
        String(32),
        nullable=False,
        default="discovered",
    )  # discovered, circuit_disqualified, researched, scored, staged_awaiting_approval, approved, rejected
    disqualification_reason = Column(Text, nullable=True)
    decision_maker_name = Column(String(255), nullable=True)
    decision_maker_title = Column(String(255), nullable=True)
    decision_maker_linkedin = Column(String(255), nullable=True)
    signals_json = Column(JSONB, nullable=False, default=dict)
    fit_markdown = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    provider = Column(String(64), nullable=False)  # openai, gemini, groq, anthropic, apollo, hubspot, serper
    encrypted_key = Column(Text, nullable=False)
    key_masked = Column(String(32), nullable=False)  # e.g., sk-...4a9f
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class LLMUsageLog(Base):
    __tablename__ = "llm_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    feature = Column(String(64), nullable=False)  # qualification, medpicc, champion_note, battlecard
    provider = Column(String(64), nullable=False)
    model = Column(String(64), nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    estimated_cost_usd = Column(Float, default=0.0, nullable=False)
    latency_seconds = Column(Float, default=0.0, nullable=False)
    is_byok = Column(Boolean, default=False, nullable=False)
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    deal_name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    deal_size = Column(Float, nullable=True)
    currency = Column(String(8), default="USD", nullable=False)
    current_stage = Column(String(64), default="Discovery", nullable=False)
    hubspot_deal_id = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    diagnostics = relationship("DealDiagnostic", back_populates="deal", cascade="all, delete-orphan")


class DealDiagnostic(Base):
    __tablename__ = "deal_diagnostics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    transcript_source = Column(String(32), default="text_upload", nullable=False)  # file_upload, text_paste
    transcript_text = Column(Text, nullable=False)
    overall_score = Column(Integer, nullable=False)  # 0 to 100
    deal_category = Column(String(32), nullable=False)  # Advance, Rescue, Nurture, Disqualify
    next_best_action = Column(Text, nullable=False)
    follow_up_email_subject = Column(String(255), nullable=True)
    follow_up_email_body = Column(Text, nullable=True)
    closure_if_addressed = Column(JSONB, nullable=False, default=dict)  # {likelihood_range: "65-80%", rationale: "..."}
    closure_if_ignored = Column(JSONB, nullable=False, default=dict)    # {likelihood_range: "15-25%", rationale: "..."}
    top_blocking_boxes = Column(JSONB, nullable=False, default=list)    # ["Economic Buyer", "Decision Process"]
    seller_summary = Column(JSONB, nullable=False, default=dict)        # {headline: "", what_we_know: [], deal_risks: [], next_best_actions: []}
    model_used = Column(String(64), nullable=False)
    pdf_report_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    deal = relationship("Deal", back_populates="diagnostics")
    scores = relationship("MEDPICCScore", back_populates="diagnostic", cascade="all, delete-orphan")


class MEDPICCScore(Base):
    __tablename__ = "medpicc_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagnostic_id = Column(UUID(as_uuid=True), ForeignKey("deal_diagnostics.id"), nullable=False, index=True)
    box_name = Column(String(64), nullable=False)  # Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Implicated Pain, Champion, Competition
    score = Column(Integer, nullable=False)        # 0-15 or 0-10
    max_score = Column(Integer, nullable=False)    # 15 or 10
    rating = Column(String(32), nullable=False)   # Strong, Moderate, Weak, Missing
    evidence_basis = Column(String(32), default="direct", nullable=False)  # direct, inferred, none
    hard_cap_applied = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    missing_evidence = Column(Text, nullable=True)
    coaching_questions = Column(JSONB, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    diagnostic = relationship("DealDiagnostic", back_populates="scores")
    evidence_quotes = relationship("EvidenceQuote", back_populates="score_item", cascade="all, delete-orphan")


class EvidenceQuote(Base):
    __tablename__ = "evidence_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    score_id = Column(UUID(as_uuid=True), ForeignKey("medpicc_scores.id"), nullable=False, index=True)
    person_name = Column(String(255), nullable=True)
    evidence_date = Column(String(64), nullable=True)
    medium = Column(String(64), nullable=True)  # Call, Email, Meeting
    quote = Column(Text, nullable=False)        # Verbatim buyer words only
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    score_item = relationship("MEDPICCScore", back_populates="evidence_quotes")




