# PipelineForge — Data Model / Backend Schema

**Companion to:** `prd.md`, `architecture.md`, `tech_requirements_document.md`

---

## 1. PostgreSQL Schema

### `tenants`
Configuration root for multi-tenancy (pooled model — see `architecture.md` §8).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text | |
| `config` | jsonb | `{enrichment_waterfall_order, icp_criteria, routing_matrix, sla_window_minutes}` |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |

### `lead_events` (inbound)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `tenant_id` | uuid, FK → tenants.id | indexed |
| `idempotency_key` | text | **unique, indexed** — the SHA-256 hash or caller-supplied key |
| `source` | text | `'inbound_webhook'` |
| `raw_payload` | jsonb | original webhook body |
| `status` | enum | `received`, `enriching`, `scoring`, `synced`, `failed` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `outbound_prospects` (v2)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `tenant_id` | uuid, FK → tenants.id | indexed |
| `company_domain` | text | |
| `discovered_via` | enum | `apollo`, `exa` |
| `scrape_status` | enum | `success`, `degraded`, `failed` — reflects F-7 graceful degradation |
| `status` | enum | `researching`, `scoring`, `staged_awaiting_approval`, `approved`, `rejected` |
| `created_at` | timestamptz | |

### `enrichment_results`
Polymorphic — attaches to either an inbound event or an outbound prospect.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `lead_source_type` | enum | `inbound`, `outbound` |
| `lead_source_id` | uuid | FK to `lead_events.id` or `outbound_prospects.id` depending on type (app-layer enforced, not a DB constraint, since it's polymorphic) |
| `provider_used` | text | e.g. `clearbit`, `apollo_fallback` |
| `raw_response` | jsonb | |
| `fallback_triggered` | boolean | |
| `created_at` | timestamptz | |

### `llm_qualifications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `lead_source_type` | enum | `inbound`, `outbound` |
| `lead_source_id` | uuid | see note above |
| `lead_score` | integer | `0–100`, matches `LeadQualificationSchema.lead_score` |
| `fit_reasoning` | text | |
| `suggested_outreach_draft` | text | |
| `confidence_score` | float | `0.0–1.0` |
| `model_used` | text | e.g. `groq/llama-3.3-70b-versatile` |
| `created_at` | timestamptz | |

### `crm_sync_records`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `lead_source_type` | enum | `inbound`, `outbound` |
| `lead_source_id` | uuid | |
| `crm_provider` | text | `hubspot` |
| `crm_record_id` | text | the ID returned by HubSpot |
| `sync_status` | enum | `synced`, `staged_awaiting_approval`, `failed` |
| `synced_at` | timestamptz | |

### `sla_escalations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `lead_source_type` | enum | `inbound`, `outbound` |
| `lead_source_id` | uuid | |
| `triggered_at` | timestamptz | |
| `resolved_at` | timestamptz, nullable | |
| `slack_message_id` | text | for traceability back to the actual alert |

### `execution_audit_log`
A durable, queryable trail independent of Temporal's own workflow history — useful for a demo dashboard or ad-hoc SQL query without needing the Temporal UI.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `workflow_id` | text | Temporal workflow ID |
| `workflow_type` | text | e.g. `PipelineForgeLeadWorkflow` |
| `activity_name` | text | |
| `status` | enum | `started`, `succeeded`, `failed`, `compensated` |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz, nullable | |
| `error_message` | text, nullable | |

---

## 2. Redis Key Schema

| Key Pattern | Purpose | TTL / Lifetime |
|---|---|---|
| `idempotency:{tenant_id}:{sha256_hash}` | Cached execution state for duplicate detection | 24 hours |
| `rate_limit:{tenant_id}:{provider}` | Token Bucket state (`tokens`, `last_updated`) — Lua-script-managed | Persistent, self-refilling |
| `apollo_credit_budget:{yyyy-mm}` | Hard monthly cap counter (max 50) | Resets monthly |

---

## 3. Pydantic Schemas (Data Contracts)

```python
class OutboundDraft(BaseModel):
    """Structured cold outreach following Pattern 5: Observation -> Link -> Ask."""
    observation_hook: str = Field(
        ..., 
        description="Verifiable fact extracted from Crawl4AI BM25 context (e.g., job post, funding)."
    )
    capability_link: str = Field(
        ..., 
        description="One sentence connecting the observation to our capability/roster."
    )
    low_friction_ask: str = Field(
        ..., 
        description="Soft call-to-value (e.g. 'Worth sending over a 2-page creator shortlist?')"
    )

    def to_email_body(self) -> str:
        return f"{self.observation_hook}\n\n{self.capability_link}\n\n{self.low_friction_ask}"

class LeadQualificationSchema(BaseModel):
    lead_score: int = Field(..., ge=0, le=100)
    fit_reasoning: str
    outreach_draft: OutboundDraft
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class DecisionMaker(BaseModel):
    """Resolved executive contact via Pattern 2."""
    full_name: str
    exact_title: str
    linkedin_url: str | None = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class ICPCheck(BaseModel):
    """Circuit-breaker fast-fail gate output via Pattern 4."""
    is_viable_prospect: bool
    disqualification_reason: str | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)

class TenantConfigSchema(BaseModel):
    enrichment_waterfall_order: list[str]      # e.g. ["apollo", "people_data_labs", "hunter", "diffbot", "crawl4ai", "llm_fallback"]
    icp_criteria: dict                          # industry, employee_count_range, geography
    bm25_query_terms: str = "product features value proposition pricing clients creator roster"  # Pattern 1
    target_decision_maker_roles: list[str] = ["Head of Marketing", "Founder", "VP Growth"]       # Pattern 2
    routing_matrix: dict                        # score-tier -> rep pool
    sla_window_minutes: int = 15

class IngestEventRequest(BaseModel):
    tenant_id: str
    idempotency_key: str | None = None
    email: str
    company_name: str
    raw_payload: dict

class IngestEventResponse(BaseModel):
    event_id: str
    status: Literal["received", "duplicate"]
    message: str
    cached_state: dict | None = None            # populated only on duplicate
```

---

## 4. Indexes & Constraints

- `UNIQUE INDEX` on `lead_events.idempotency_key` — this is the database-level backstop behind the Redis idempotency check; the two together mean a duplicate can't slip through even under a Redis outage.
- `INDEX` on `tenant_id` across every table — all queries are tenant-scoped, given the pooled multi-tenancy model.
- `FOREIGN KEY` constraints from `enrichment_results`, `llm_qualifications`, `crm_sync_records`, and `sla_escalations` back to their respective tenant, enforced at the application layer for the polymorphic `lead_source_id` (Postgres can't natively FK across two possible parent tables without a discriminator pattern — the `lead_source_type` column is that discriminator, checked in application code before every write).

---

## 5. Relationship Summary

```
tenants (1) ──< lead_events (many)
tenants (1) ──< outbound_prospects (many)

lead_events / outbound_prospects (1) ──< enrichment_results (many, usually 1-2: primary + fallback)
lead_events / outbound_prospects (1) ──< llm_qualifications (1, typically)
lead_events / outbound_prospects (1) ──< crm_sync_records (1)
lead_events / outbound_prospects (1) ──< sla_escalations (0 or 1)

Temporal workflow runs ──< execution_audit_log (many rows per run, one per activity)
```

Every lead or prospect fans out into its enrichment attempts, its single LLM qualification, its CRM sync record, and — conditionally — an SLA escalation. The audit log is the odd one out: it's keyed by `workflow_id`, not `lead_source_id`, because its job is tracing Temporal execution, not modeling business state.
