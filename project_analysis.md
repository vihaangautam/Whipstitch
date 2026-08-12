# PipelineForge — Complete Project Analysis & Phased Build Plan

---

## File-by-File Summary

### 1. [CLAUDE.md](file:///c:/Users/ASUS/OneDrive/Desktop/vscProgram/Whipstitch/CLAUDE.md) (Rules File)
**Purpose:** Engineering guardrails — the "don't cut corners" constitution for AI-assisted development.

**10 non-negotiable rules**, boiled down:
| # | Rule | Why it matters |
|---|---|---|
| 1 | All I/O in Temporal `@activity.defn`, never in `@workflow.run` | Workflow determinism — Temporal replays workflows on crash; non-deterministic code breaks replay |
| 2 | Every activity has an explicit `RetryPolicy` | No hidden behavior from Temporal defaults |
| 3 | Idempotency checked at FastAPI layer (Redis lock), before workflow starts | Prevents workflow duplication at the gate, not inside the expensive pipeline |
| 4 | No blocking calls in `async def` | `requests.get()` in async = event loop freeze = correctness bug |
| 5 | Never call real Apollo outside demo recording | 50 credits/month is the hard wall; `MOCK_APOLLO=true` is default |
| 6 | Every Crawl4AI call has timeout + fallback | Scrape failure ≠ pipeline failure (F-7) |
| 7 | All LLM calls via `instructor` + Pydantic `response_model` | Zero unstructured output accepted; fail loudly, not silently |
| 8 | Schema changes via Alembic migrations only | Cheap "production-grade" signal; never ad-hoc DDL |
| 9 | Every new activity/workflow ships with ≥1 test | "Ran it manually" ≠ done |
| 10 | Structured logging only (`structlog` + `correlation_id`) | No `print()`, no unstructured logs |

Also defines: repo layout, naming conventions, commit message format, definition of done checklist, and explicit anti-patterns to avoid.

---

### 2. [prd.md](file:///c:/Users/ASUS/OneDrive/Desktop/vscProgram/Whipstitch/prd.md) (Product Requirements Document)
**Purpose:** The *what* and *why* — defines the problem, goals, personas, and success metrics.

**Core Problem:**
> B2B GTM stacks are Frankensteined together with no-code tools (Zapier/n8n) that have 3 fatal failure modes: **lead decay** (slow first contact), **silent webhook failure** (dropped events on vendor timeout), and **duplicate writes** (no idempotency).

**Solution:** PipelineForge — a code-first orchestration engine replacing fragile no-code glue with durable, fault-tolerant pipelines, running entirely on free-tier infra.

**Functional Requirements (8 total):**

| ID | What | Phase |
|----|------|-------|
| F-1 | Idempotent webhook ingestion (Redis atomic lock + 24h TTL) | v1 |
| F-2 | Multi-tenant config engine (JSON-driven per tenant) | v1 |
| F-3 | Waterfall enrichment with auto-fallback | v1 |
| F-4 | Type-safe LLM qualification (instructor + Pydantic) | v1 |
| F-5 | CRM sync + SLA escalation (HubSpot + Slack) | v1 |
| F-6 | Scheduled outbound prospecting (Temporal cron + Apollo) | v2 |
| F-7 | Agentic web research (Crawl4AI + graceful degradation) | v2 |
| F-8 | Human-in-the-loop staging (Awaiting Approval, never auto-send) | v2 |

**Key non-goals:** No frontend UI, no payments, no OAuth, no autonomous sending, no LinkedIn/Instagram scraping, no horizontal scaling.

**Positioning:** This is a *distributed-systems portfolio project* wrapped in a GTM domain — **not** a Clay/Artisan competitor. Frame it as "I studied how those platforms work under the hood and built the hard systems layer."

---

### 3. [architecture.md](file:///c:/Users/ASUS/OneDrive/Desktop/vscProgram/Whipstitch/architecture.md)
**Purpose:** The *how* — system topology, component responsibilities, event flows, failure model.

**Key architectural decisions:**
- **Single Docker Compose stack:** FastAPI + Temporal + Redis + Postgres, all local
- **Cloudflare Tunnel** for free public HTTPS (demo/webhook delivery only)
- **Two symmetric pipelines** (inbound = webhook-triggered, outbound = cron-triggered) sharing one enrichment→score→sync backbone
- **Idempotency:** SHA-256 key → Redis atomic SET NX → 24h TTL; returns cached execution state on duplicate (not just "duplicate" flag)
- **Rate limiting:** Token Bucket as Redis Lua script (atomic check-and-decrement, no race window)
- **Saga pattern:** Temporal workflows with compensating actions; worker crash recovery via event history replay
- **Pooled multi-tenancy:** `tenant_id` column everywhere, JSON config per tenant in Postgres
- **Observability:** `structlog` with `correlation_id` bound at workflow start, threaded through all activities

---

### 4. [data_model.md](file:///c:/Users/ASUS/OneDrive/Desktop/vscProgram/Whipstitch/data_model.md)
**Purpose:** The exact schema — Postgres tables, Redis keys, Pydantic contracts.

**7 Postgres tables:**
| Table | Role |
|-------|------|
| `tenants` | Config root (JSON config column) |
| `lead_events` | Inbound webhook records + idempotency key |
| `outbound_prospects` | v2 prospects with scrape/pipeline status |
| `enrichment_results` | Polymorphic (attaches to inbound or outbound) |
| `llm_qualifications` | Score, reasoning, draft, confidence, model used |
| `crm_sync_records` | HubSpot sync status tracking |
| `sla_escalations` | Escalation tracking with Slack message ID |
| `execution_audit_log` | Independent of Temporal history; keyed by workflow_id |

**3 Redis key patterns:**
- `idempotency:{tenant_id}:{hash}` — 24h TTL
- `rate_limit:{tenant_id}:{provider}` — persistent, self-refilling Token Bucket
- `apollo_credit_budget:{yyyy-mm}` — hard monthly cap (50)

**4 Pydantic schemas:** `LeadQualificationSchema`, `TenantConfigSchema`, `IngestEventRequest`, `IngestEventResponse`

---

### 5. [tech_requirements_document.md](file:///c:/Users/ASUS/OneDrive/Desktop/vscProgram/Whipstitch/tech_requirements_document.md)
**Purpose:** Technical specifications — stack, NFRs, API contract, testing, deployment.

**Tech stack:** All free-tier — FastAPI, Temporal (local), Redis, Postgres, Instructor+Groq/Gemini, Crawl4AI, Apollo (50 credits/month), HubSpot Sandbox, k6, Cloudflare Tunnel, structlog. **Total cost: ₹0.**

**5 NFRs:**
1. **Fault tolerance** — Saga workflows, retry policy (1s/2.0/10s/5 attempts), worker crash recovery (must be demonstrated, not claimed)
2. **Rate limiting** — Token Bucket via Lua; HubSpot 10 req/sec; excess queued in Redis Streams
3. **Performance** — 1,000 req/min burst; p95 < 2.5s (excluding LLM); all numbers from real k6 runs
4. **Observability** — structlog, correlation_id throughout
5. **Security** — API key required on ingestion, .env for secrets, Cloudflare TLS

**API endpoints:** `POST /v1/events/ingest`, `GET /v1/events/{id}/status`, `POST /v1/tenants/{id}/config`, `POST /v1/outbound/trigger`, `GET /health`, `GET /docs`

**Testing requirements:** Unit tests, integration tests (docker-compose.test.yml), k6 load test (committed to repo), crash test (docker stop mid-load — the most important test).

---

## The Core Problem & Solution

### THE PROBLEM
B2B companies use disconnected SaaS tools (CRM, enrichment, forms, LLMs, Slack) glued together by Zapier/n8n. This creates three **production-critical failures**:

1. **Lead decay** — minutes matter for inbound intent; no-code pipelines introduce hours of delay
2. **Silent failure** — when an API times out, the webhook just drops; no retry, no fallback, no alert
3. **Duplicate writes** — retried webhooks create duplicate CRM records; no idempotency

### THE SOLUTION
A **code-first, durable orchestration engine** that:
- Guarantees **zero duplicates** via atomic idempotency (Redis + Postgres backstop)
- Guarantees **zero dropped events** via Temporal's durable execution + Saga compensations
- **Falls back gracefully** on vendor failure (waterfall enrichment, Crawl4AI degradation)
- Is **configurable per customer** without code changes (JSON tenant config)
- Runs on **₹0 infrastructure** (all free tier)

### THE REAL GOAL
This is a **portfolio project** targeting SDE1/Backend/FDE/GTM Engineer roles at companies like Clay, Artisan, Apollo, HubSpot. The distributed-systems engineering is the point — the GTM domain is the vehicle.

---

## Phased Production Build Plan

> [!IMPORTANT]
> The original docs propose a 4-week timeline. Below I've restructured this into **5 phases** optimized for a **working pipeline at every checkpoint** — not a POC that needs "one more week" to actually run.

### Phase 1: Foundation — Containerized Skeleton (Days 1–3)
**Goal:** A running Docker Compose stack where a webhook triggers a Temporal workflow that writes to Postgres. Nothing fancy, but the plumbing is real.

**Deliverables:**
- [ ] `docker-compose.yml` — FastAPI, Temporal dev server, Redis, Postgres
- [ ] `docker-compose.test.yml` — isolated test environment
- [ ] `.env.example` with all variables from tech_requirements_document.md §8
- [ ] Alembic initialized, first migration creates `tenants` + `lead_events` + `execution_audit_log` tables
- [ ] `GET /health` endpoint returns 200 with service connectivity checks
- [ ] `structlog` configured with `correlation_id` binding
- [ ] One "hello world" `PipelineForgeLeadWorkflow` that starts, runs one no-op activity, and logs success
- [ ] `POST /v1/events/ingest` endpoint — validates payload, starts workflow, returns 200

**Exit criteria:** `docker compose up` → `curl /v1/events/ingest` → workflow appears in Temporal Web UI → audit log row in Postgres.

---

### Phase 2: Inbound Core — F-1 through F-4 (Days 4–8)
**Goal:** Idempotent ingestion → waterfall enrichment → LLM scoring, all with real retry/fallback.

**Deliverables:**
- [ ] **F-1: Idempotency** — Redis atomic lock (`SET NX` with 24h TTL), SHA-256 key derivation, cached state return on duplicate, Postgres `UNIQUE INDEX` backstop
- [ ] **F-2: Multi-tenant config** — `POST /v1/tenants/{id}/config` endpoint, `TenantConfigSchema` validation, config loaded at workflow start
- [ ] **F-3: Waterfall enrichment** — `enrich_lead_waterfall_activity` with mock providers (Clearbit → Apollo fallback), `RetryPolicy` per CLAUDE.md rule 2, `enrichment_results` table writes
- [ ] **F-4: LLM qualification** — `qualify_lead_llm_activity` using `instructor` + `LeadQualificationSchema`, mock LLM in tests, real Groq/Gemini in dev
- [ ] `GET /v1/events/{id}/status` endpoint
- [ ] Alembic migration for `enrichment_results` + `llm_qualifications` tables
- [ ] Unit tests: idempotency key generation, duplicate detection, enrichment fallback, LLM schema validation failure
- [ ] Integration test: full happy path (ingest → enrich → score → Postgres records)

**Exit criteria:** Send the same webhook twice → first processes fully, second returns 202 with cached state. Kill a provider mock → fallback kicks in. Send malformed LLM output → retry with schema correction.

---

### Phase 3: CRM + SLA + Load Test — F-5 + Benchmarks (Days 9–12)
**Goal:** Complete inbound pipeline end-to-end with real CRM writes and proven performance numbers.

**Deliverables:**
- [ ] **F-5: CRM sync** — `sync_to_crm_activity` writing to HubSpot Sandbox, Token Bucket rate limiter (Redis Lua script), `crm_sync_records` table
- [ ] **F-5: SLA escalation** — Temporal timer (15 min default), Slack webhook alert, `sla_escalations` table
- [ ] Token Bucket Lua script with unit test against real Redis
- [ ] Rate limit excess queuing via Redis Streams
- [ ] k6 load test script — 1,000 req/min burst
- [ ] **Crash test** — scripted `docker stop` mid-load, zero dropped events
- [ ] `BENCHMARK.md` with real p50/p90/p95 numbers
- [ ] Alembic migrations for `crm_sync_records` + `sla_escalations`

**Exit criteria:** `BENCHMARK.md` has real numbers. Crash test passes. Inbound pipeline is a **production-ready working system**, not a POC.

---

### Phase 4: Outbound Extension — F-6 through F-8 (Days 13–18)
**Goal:** Add outbound prospecting reusing the existing backbone. The cron pipeline discovers, researches, scores, and stages prospects.

**Deliverables:**
- [ ] **F-6: Outbound prospecting** — `OutboundProspectingWorkflow` as Temporal cron, Apollo mock (default), Apollo credit budget counter in Redis, `POST /v1/outbound/trigger` for manual runs
- [ ] **F-7: Web research** — Crawl4AI activity with timeout + graceful degradation (scrape failure → enrichment-only metadata), `scrape_status` enum tracking
- [ ] **F-8: Human-in-the-loop** — prospects staged as `Awaiting Approval` in HubSpot, never auto-sent
- [ ] Alembic migration for `outbound_prospects` table
- [ ] Outbound reuses: enrichment activities, LLM qualification, CRM sync, SLA escalation — **same code, different entry point**
- [ ] Unit tests: Apollo credit budget guard, Crawl4AI timeout/fallback, outbound status transitions
- [ ] Integration test: outbound trigger → prospect staged in CRM with correct status
- [ ] Updated k6 script covering outbound flow

**Exit criteria:** Manual trigger → Apollo query → Crawl4AI scrape (or graceful degradation) → LLM score → HubSpot record with "Awaiting Approval". Apollo budget counter prevents overspend.

---

### Phase 5: Demo, Docs & Polish (Days 19–22)
**Goal:** A presentable, portfolio-ready artifact with a recorded demo and battle-tested numbers.

**Deliverables:**
- [ ] Cloudflare Tunnel configured for demo recording
- [ ] Wire HubSpot Sandbox for both inbound + outbound flows with real API
- [ ] Record 60–90s E2E demo: ingestion → fallback → CRM update → Slack alert
- [ ] Process 50 synthetic payloads (mix of inbound + outbound) through the real CRM
- [ ] Tenant config documentation (how to onboard a new tenant)
- [ ] README with architecture diagram, quickstart, and positioning statement
- [ ] Resume bullets updated with **real measured numbers** from BENCHMARK.md
- [ ] Final test suite pass (unit + integration + load + crash)

**Exit criteria:** Repo is clone → `docker compose up` → working system. Demo video shows the full lifecycle. All benchmark numbers are real and reproducible.

---

## Key Architectural Principles (From All Docs)

| Principle | Implementation |
|-----------|---------------|
| **Idempotency** | Redis atomic lock (SET NX) + Postgres UNIQUE INDEX backstop |
| **Durability** | Temporal event-sourced workflows — state survives worker crashes |
| **Graceful degradation** | Waterfall enrichment, Crawl4AI fallback, LLM provider fallback |
| **Atomicity** | Redis Lua scripts for rate limiting and idempotency (no race conditions) |
| **Observability** | structlog + correlation_id from ingestion to CRM sync |
| **Configurability** | JSON tenant config in Postgres — change behavior without code changes |
| **Zero cost** | Every component runs on free tier or local Docker |
| **Real proof** | All benchmarks from actual k6 runs; crash recovery demonstrated, not claimed |

---

## Risk Awareness

| Risk | Mitigation |
|------|------------|
| Temporal learning curve | Budget 2–3 days explicitly in Phase 1; don't let it silently eat Phase 2 |
| Crawl4AI unreliability | F-7's graceful degradation is load-bearing — build the fallback first |
| Apollo 50 credits/month | `MOCK_APOLLO=true` default; real calls only during demo recording |
| LLM latency variance | Report LLM latency separately from system p95; don't let Groq latency corrupt benchmarks |
| Scope creep | No frontend, no payments, no OAuth — flag it, don't build it |
