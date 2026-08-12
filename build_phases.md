# Whipstitch — Complete Build & Testing Phases

---

## What Changed From the Original Docs

| Original (PipelineForge) | Updated (Whipstitch) |
|---|---|
| Product name: PipelineForge | **Whipstitch** |
| Enrichment: Clearbit → Apollo (2-step waterfall) | **5+ provider deep waterfall + LLM-powered enrichment as final fallback** |
| Outbound: Basic Apollo query → scrape → score | **Signal-based deep research agent (Pattern 1 BM25, Pattern 2 Executive Finder, Pattern 3 Buying Signals, Pattern 4 Circuit Breaker, Pattern 5 Structured Drafts)** |
| No frontend, headless only | **Frontend dashboard in Phase 5** |
| Portfolio project positioning | **Production SaaS trajectory — each phase is a shippable product increment** |

---

## Phase 1: Foundation — Containerized Skeleton
**Status:** ✅ **COMPLETED**
**Duration:** Days 1–3
**Goal:** A running Docker stack where a webhook triggers a Temporal workflow and writes to Postgres.

### Build Tasks
| Task | Details | Status |
|------|---------|:---:|
| Docker Compose | `fastapi-app`, `temporal` (dev server), `redis`, `postgres` | ✅ **DONE** |
| Docker Compose Test | `docker-compose.test.yml` for isolated test runs | ✅ **DONE** |
| Environment | `.env.example` with all variables | ✅ **DONE** |
| Database | Alembic init, first migration `0001_initial_schema`: `tenants`, `lead_events`, `execution_audit_log` | ✅ **DONE** |
| DB Models | `Tenant`, `LeadEvent`, `ExecutionAuditLog` SQLAlchemy models | ✅ **DONE** |
| Health endpoint | `GET /health` — checks Postgres, Redis, Temporal connectivity | ✅ **DONE** |
| Logging | `structlog` configured with `correlation_id` binding | ✅ **DONE** |
| Skeleton workflow | `WhipstitchLeadWorkflow` — starts, runs `log_execution_step_activity`, logs success | ✅ **DONE** |
| Ingestion endpoint | `POST /v1/events/ingest` — validates payload, starts workflow, returns 200 | ✅ **DONE** |
| FastAPI docs | `GET /docs` auto-generated OpenAPI | ✅ **DONE** |

### Tests Passed
| Test | What it proves | Status |
|------|---------------|:---:|
| `docker compose up` → all services healthy | Infrastructure works | ✅ **DONE** |
| `curl POST /v1/events/ingest` → workflow visible in Temporal UI | End-to-end plumbing | ✅ **DONE** |
| Audit log row appears in Postgres | Database layer works | ✅ **DONE** |
| Structured log output with `correlation_id` | Observability works | ✅ **DONE** |
| `pytest tests/unit/test_health.py` | Health check logic | ✅ **DONE** |
| `pytest tests/unit/test_ingest_payload.py` | Ingestion schema validation | ✅ **DONE** |

### Exit Criteria
✅ **ACHIEVED**: `docker compose up` → `curl /v1/events/ingest` → workflow in Temporal Web UI → audit log row in Postgres → structured log with `correlation_id`.

---

## Phase 2: Inbound Core — Idempotency + Deep Enrichment + LLM Scoring
**Status:** ✅ **COMPLETED**
**Duration:** Days 4–10
**Goal:** Idempotent ingestion → deep waterfall enrichment → type-safe 3-part LLM scoring (Pattern 5).

### Build Tasks
| Task | Details | Status |
|------|---------|:---:|
| **F-1: Idempotency** | Redis atomic lock (`SET NX`, 24h TTL), SHA-256 key derivation, cached state return on duplicate, Postgres `UNIQUE INDEX` backstop | ✅ **DONE** |
| **F-2: Multi-tenant config** | `POST /v1/tenants/{id}/config`, `GET /v1/tenants/{id}/config`, `TenantConfigSchema` validation | ✅ **DONE** |
| **F-3: Deep waterfall enrichment** | `enrich_lead_waterfall_activity` — configurable provider chain: Apollo → PDL → Hunter → Diffbot → Crawl4AI BM25 → LLM fallback | ✅ **DONE** |
| Provider abstractions | `BaseEnrichmentProvider` interface & mock/real providers (`Apollo`, `PDL`, `Hunter`, `Diffbot`, `Crawl4AI`, `LLMFallback`) | ✅ **DONE** |
| **F-4: LLM qualification** | `qualify_lead_llm_activity` producing **Pattern 5 Structured Outreach** (`observation_hook`, `capability_link`, `low_friction_ask`) | ✅ **DONE** |
| Event status endpoint | `GET /v1/events/{id}/status` returning lead status, enrichment summary, and qualification summary | ✅ **DONE** |
| Alembic migration | `0002_phase2_tables`: `enrichment_results` + `llm_qualifications` tables | ✅ **DONE** |

### Tests Passed
| Test | What it proves | Status |
|------|---------------|:---:|
| Duplicate webhooks return 202 with cached state | **Idempotency works** | ✅ **DONE** |
| Primary enrichment provider failure → fallback kicks in automatically | **Waterfall fallback works** | ✅ **DONE** |
| Upstream provider failures → LLM fallback synthesizes profile with confidence scores | **Graceful degradation works** | ✅ **DONE** |
| Crawl4AI BM25 filter query filtering | **BM25 noise reduction works** | ✅ **DONE** |
| Schema enforcement produces 3-part `OutboundDraft` | **Structured outreach works** | ✅ **DONE** |
| Tenant config update via API updates pipeline behavior | **Multi-tenant config works** | ✅ **DONE** |
| `pytest tests/unit/test_idempotency.py` | Key generation, duplicate detection | ✅ **DONE** |
| `pytest tests/unit/test_enrichment_waterfall.py` | Waterfall chain execution | ✅ **DONE** |
| `pytest tests/unit/test_llm_qualification.py` | 3-part draft schema validation | ✅ **DONE** |
| `pytest tests/unit/test_tenant_config.py` | Config CRUD endpoints | ✅ **DONE** |
| `pytest tests/unit/test_event_status.py` | Event status query endpoint | ✅ **DONE** |

### Exit Criteria
✅ **ACHIEVED**: Duplicate webhooks return 202. Provider fallback chains correctly. LLM returns schema-enforced 3-part structured drafts (`OutboundDraft`). Tenant configuration alters pipeline execution. All unit tests pass cleanly.

---

## Phase 3: CRM Sync + SLA + Load Testing + Crash Testing
**Status:** ✅ **COMPLETED**
**Duration:** Days 11–15
**Goal:** Complete inbound pipeline with real CRM writes, SLA alerts, and **proven** performance numbers. After this phase, inbound is production-ready.

### Build Tasks
| Task | Details | Status |
|------|---------|:---:|
| **F-5: CRM sync** | `sync_to_crm_activity` writing to HubSpot Sandbox REST API. Token Bucket rate limiter (`token_bucket.lua`). `crm_sync_records` table | ✅ **DONE** |
| **F-5: SLA escalation** | Temporal timer gate (`sla_window_minutes`). Slack webhook alert (`SlackAlerter`). `sla_escalations` table | ✅ **DONE** |
| Token Bucket Lua script | `app/core/rate_limiter.py` atomic check-and-decrement (10 req/sec limit) | ✅ **DONE** |
| Rate limit config | Per-tenant, per-provider rate limits in tenant config JSON | ✅ **DONE** |
| k6 load test script | `load_tests/k6_benchmark.js` — drives 1,000 req/min burst | ✅ **DONE** |
| Crash test script | `scripts/crash_test.sh` — simulates worker crash (`docker stop whipstitch_app`) mid-flight | ✅ **DONE** |
| Benchmark doc | `BENCHMARK.md` — documents p50 (42ms), p90 (115ms), p95 (185ms) and 0% drop rate | ✅ **DONE** |
| Alembic migration | `0003_phase3_tables`: `crm_sync_records` + `sla_escalations` tables | ✅ **DONE** |

### Tests Passed
| Test | What it proves | Status |
|------|---------------|:---:|
| Scored lead syncs to HubSpot Sandbox with structured draft | **CRM sync works** | ✅ **DONE** |
| High-score lead uncontacted past SLA window → Slack alert fires | **SLA escalation works** | ✅ **DONE** |
| Burst requests passing through Redis Lua script → rate limited at 10 req/sec | **Rate limiting works** | ✅ **DONE** |
| k6 run: 1,000 req/min for 3 minutes → 0 dropped requests | **Throughput proven** | ✅ **DONE** |
| k6 run + `docker stop whipstitch_app` mid-flight → 0 lost events | **Crash recovery proven** | ✅ **DONE** |
| `pytest tests/unit/test_rate_limiter.py` | Token bucket capacity/refill logic | ✅ **DONE** |
| `pytest tests/unit/test_crm_sync.py` | HubSpot CRM provider integration | ✅ **DONE** |
| `pytest tests/unit/test_sla_escalation.py` | Slack SLA alert delivery | ✅ **DONE** |

### Exit Criteria
✅ **ACHIEVED**: `BENCHMARK.md` published with real numbers (p95 = 185ms, 0 dropped events). Crash test passes with zero data loss. Inbound pipeline is **a complete, working, battle-tested production system**.

---

## Phase 4: Outbound — Signal-Based Deep Research Agent (Enhanced)
**Duration:** Days 16–22
**Goal:** Add signal-based outbound prospecting with circuit-breaker gating, BM25 web research, decision-maker resolution, and structured 3-part drafting.

### Build
| Task | Details |
|------|---------|
| **F-6: Outbound workflow** | `OutboundProspectingWorkflow` as Temporal cron. Apollo credit budget counter in Redis. `POST /v1/outbound/trigger`. |
| **Discovery activity (Pattern 3)** | `discover_prospects_activity` — queries Apollo + Exa.ai + Job Board / Funding / News intent triggers. |
| **Circuit Breaker Gate (Pattern 4)** | `disqualify_prospect_gate_activity` — Stage 1 rule check + Stage 2 fast LLM (Gemini Flash) ICP check. Early abort if non-viable. |
| **Decision-Maker (Pattern 2)** | `discover_decision_maker_activity` — search queries (`site:linkedin.com/in/ "[Company]" "[Role]"`) + LLM title resolution. |
| **Deep Research (Pattern 1)** | `research_prospect_activity` — Crawl4AI + `BM25ContentFilter` (`user_query` from tenant config) → clean `fit_markdown`. Extracts hiring, funding, tech stack signals. |
| **Structured Draft (Pattern 5)** | Same `qualify_lead_llm_activity` producing `OutboundDraft` (Observation Hook → Capability Link → Low-Friction Ask). |
| **F-8: Human-in-the-loop** | Prospects staged as `Awaiting Approval` in CRM with resolved contact name + 3-part draft. |
| Alembic migration | `outbound_prospects` table with `scrape_status` enum |
| Apollo budget guard | Redis counter `apollo_credit_budget:{yyyy-mm}`, hard stop at 50, fallback to mock data with warning log |

### Test
| Test | What it proves |
|------|---------------|
| Manual trigger → Apollo query → prospects discovered | **Discovery works** |
| Apollo budget at 49 → one real call → budget at 50 → next call returns mock data with warning | **Budget guard prevents overspend** |
| Crawl4AI scrapes a real public website → signals extracted | **Deep research works** |
| Crawl4AI timeout on a site → pipeline continues with API-only data | **Graceful degradation (F-7)** |
| LLM drafts reference specific signals ("Saw you raised Series B...") not generic fluff | **Research-informed personalization** |
| Prospect appears in HubSpot as "Awaiting Approval" | **Human-in-the-loop works** |
| Same enrichment waterfall + scoring + CRM sync code used for outbound | **Backbone reuse proven** |
| `pytest tests/unit/test_apollo_budget.py` | Credit counter logic |
| `pytest tests/unit/test_signal_extraction.py` | Signal schema validation |
| `pytest tests/integration/test_outbound_pipeline.py` | Full: trigger → discover → research → score → stage |
| Updated k6 script covering outbound flow | **Outbound performance measured** |

### Exit Criteria
✅ Manual trigger → prospects discovered → researched (with real signals) → scored → staged in CRM. Apollo budget guard works. Scrape failures degrade gracefully. Outbound drafts reference real signals, not generic templates.

---

## Phase 5: Frontend Dashboard
**Duration:** Days 23–30
**Goal:** A real UI that makes Whipstitch usable by non-technical users. The backend already works — this puts a face on it.

### Build
| Page/Component | What it shows |
|---|---|
| **Dashboard (home)** | Total leads, pipeline health, SLA compliance rate, lead volume chart, recent activity feed |
| **Inbound Leads table** | All leads with status, score, enrichment source, CRM sync status. Sortable/filterable. Click to expand detail. |
| **Lead Detail view** | Full enrichment data, LLM score + reasoning, CRM sync record, SLA status, timeline of all pipeline steps |
| **Outbound Queue** | Prospects awaiting approval. Each shows: score, research signals, AI-drafted message. Approve/Reject buttons. |
| **Prospect Detail view** | Company profile, scraped signals (hiring, funding, tech stack), enrichment data, LLM reasoning, draft message |
| **Tenant Config page** | Edit ICP criteria, enrichment waterfall order, SLA window, routing matrix — all via form, no JSON editing |
| **Activity Feed** | Real-time stream of pipeline events (new lead, enrichment complete, CRM sync, SLA alert) |
| **Analytics** | Lead volume over time, avg score distribution, SLA compliance %, enrichment source breakdown, conversion funnel |

### New API endpoints needed
| Endpoint | Purpose |
|---|---|
| `GET /v1/leads` | Paginated, filterable lead list |
| `GET /v1/leads/{id}` | Full lead detail with enrichment + LLM + CRM data |
| `GET /v1/outbound/prospects` | Paginated outbound queue |
| `GET /v1/outbound/prospects/{id}` | Full prospect detail |
| `POST /v1/outbound/prospects/{id}/approve` | Approve a staged prospect |
| `POST /v1/outbound/prospects/{id}/reject` | Reject a staged prospect |
| `GET /v1/analytics/summary` | Dashboard metrics |
| `GET /v1/analytics/leads-over-time` | Time-series data |
| `GET /v1/tenants/{id}/config` | Read tenant config |
| `WebSocket /v1/feed` | Real-time activity stream |

### Test
| Test | What it proves |
|------|---------------|
| Load dashboard → shows real data from existing pipeline | **Frontend connects to backend** |
| Submit a webhook → lead appears in table within seconds | **Real-time updates work** |
| Click "Approve" on outbound prospect → CRM status changes | **Approve flow works end-to-end** |
| Edit tenant config via UI → next pipeline run uses new config | **Config UI is functional, not decorative** |
| All pages responsive on mobile/tablet | **Usable on any device** |

### Exit Criteria
✅ A non-technical user can: see their leads, review outbound prospects, approve/reject drafts, edit their ICP config, and monitor pipeline health — all from the browser.

---

## Phase 6: Demo, Polish & Production Prep
**Duration:** Days 31–35
**Goal:** Portfolio-ready artifact with a recorded demo, battle-tested numbers, and documentation.

### Build
| Task | Details |
|------|---------|
| Cloudflare Tunnel | Configured for demo recording + webhook delivery |
| E2E demo recording | 60–90s video: webhook in → enrichment (show fallback) → LLM score → CRM record → Slack alert → dashboard view |
| 50 synthetic payloads | Mix of inbound + outbound through real CRM |
| Tenant onboarding docs | How to create a tenant, configure ICP, set up webhooks |
| README | Architecture diagram, quickstart (`docker compose up`), positioning statement |
| Resume bullets | **Only** from real BENCHMARK.md numbers |
| Final test suite | All unit + integration + load + crash tests passing |
| (Optional) Always-on deploy | Free tier Render/Fly.io for FastAPI layer if you want a live demo link |

### Test
| Test | What it proves |
|------|---------------|
| Clone repo → `docker compose up` → working system | **Reproducible setup** |
| Demo video shows complete lifecycle | **It actually works** |
| All tests green | **Regression-free** |
| README is accurate and complete | **Onboarding works** |

### Exit Criteria
✅ Repo is clone-and-run. Demo video tells the story. All benchmark numbers are real and reproducible. Resume bullets are backed by measured data.

---

## Summary: What Each Phase Delivers

| Phase | Duration | What you have at the end |
|-------|----------|------------------------|
| **1. Foundation** | Days 1–3 | Running Docker stack, skeleton workflow, structured logging |
| **2. Inbound Core** | Days 4–10 | Idempotent ingestion, 5+ provider waterfall, LLM scoring |
| **3. CRM + Benchmarks** | Days 11–15 | **Complete inbound product** — CRM sync, SLA alerts, proven perf numbers, crash-tested |
| **4. Outbound Agent** | Days 16–22 | Signal-based deep research, human-in-the-loop staging, full outbound pipeline |
| **5. Frontend** | Days 23–30 | Dashboard, lead views, outbound approval queue, config UI, analytics |
| **6. Ship** | Days 31–35 | Demo recording, docs, resume-ready artifact, optionally deployed |

> [!IMPORTANT]
> **Every phase produces a working, testable system.** Phase 3 alone is a complete, production-grade inbound pipeline. Phase 4 adds outbound. Phase 5 puts a face on it. You can stop at any phase and have something real — not a half-finished POC.
