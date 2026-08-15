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



