# PipelineForge — Architecture Document

**Companion to:** `prd.md`, `tech_requirements_document.md`, `data_model.md`

---

## 1. System Overview

PipelineForge is a single-region, Docker-Composed system built around a Temporal-orchestrated Saga workflow. Two symmetric pipelines — inbound (reactive) and outbound (proactive) — share the same enrichment, LLM-scoring, CRM-sync, and rate-limiting backbone. The only difference between them is the trigger: a webhook for inbound, a scheduled cron for outbound.

```
                         ┌─────────────────────────┐
   External Webhook ───▶ │   Cloudflare Tunnel      │
  (Typeform/HubSpot)     │   (free public HTTPS)    │
                         └────────────┬─────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │   FastAPI Ingestion      │
                         │   /v1/events/ingest      │
                         └────────────┬─────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │   Redis — Idempotency    │
                         │   Atomic Lock Check      │
                         └────────────┬─────────────┘
                            duplicate │ new
                          202 Accepted│
                                      ▼
                         ┌─────────────────────────┐
                         │  Temporal Workflow       │
                         │  (Saga: enrich→score→    │
                         │   sync, with compensa-   │
                         │   tions on failure)      │
                         └────────────┬─────────────┘
                                      │
          ┌───────────────┬──────────┼──────────┬───────────────┐
          ▼               ▼          ▼          ▼               ▼
   Enrichment API   Crawl4AI    LLM (Instructor  HubSpot Sync   Slack SLA
   (waterfall +      (outbound  + Groq/Gemini,    (via Token     Escalation
    fallback)         only)      schema-safe)      Bucket)
          │               │          │              │
          └───────────────┴──────────┴──────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │   PostgreSQL             │
                         │   (audit log, tenant     │
                         │    config, event state)  │
                         └─────────────────────────┘
```

---

## 2. Component Responsibilities

| Component | Responsibility |
|---|---|
| Cloudflare Tunnel | Free public HTTPS ingress to a locally-running FastAPI instance, TLS termination |
| FastAPI app | Request validation, API-key auth, idempotency pre-check, workflow initiation |
| Redis | Idempotency locks (SHA-256 keyed), Token Bucket rate limiting, Apollo credit-budget counter |
| Temporal | Durable workflow orchestration, retry policy enforcement, Saga compensation, crash recovery |
| PostgreSQL | System of record — tenant config, execution audit log, lead/prospect state, LLM outputs, CRM sync records |
| Crawl4AI (v2) | Headless async scraping with `BM25ContentFilter` for noise-free `fit_markdown` extraction |
| Instructor + Groq/Gemini | Schema-enforced LLM qualification & 3-part structured drafts (`OutboundDraft`) — zero unstructured text accepted |
| HubSpot Sandbox | Target CRM — real REST API, not mocked |
| Slack | SLA escalation channel for uncontacted high-priority leads |

---

## 3. Event Flow — Inbound (F-1 → F-5)

1. A third-party webhook (Typeform, a form on a client's site) POSTs a JSON payload to the Cloudflare-tunneled `/v1/events/ingest` endpoint.
2. FastAPI validates the payload and API key, computes (or accepts) an `idempotency_key`.
3. Redis is checked via an atomic lock. If the key was processed within the last 24h, return `202 Accepted` with cached state — **no workflow is started, no downstream call is made.**
4. Otherwise, a `PipelineForgeLeadWorkflow` starts. Step 1: waterfall enrichment — query the primary provider; on 4xx/5xx/incomplete data, automatically fall back to the secondary provider, without aborting the parent workflow.
5. Step 2: the enriched profile is passed to the LLM qualification activity, which returns a schema-validated `lead_score`, `fit_reasoning`, and a 3-part `outreach_draft` (`observation_hook`, `capability_link`, `low_friction_ask`).
6. Step 3: the scored lead is written to the HubSpot sandbox, rate-limited through the Token Bucket.
7. If `lead_score > 80` and the CRM record shows no status change within 15 minutes, an automated Slack escalation fires.
8. Every step is logged with the `lead_id` as `correlation_id`, so the full trace is queryable after the fact.

---

## 4. Event Flow — Outbound (F-6 → F-10, v2)

1. A Temporal cron (`OutboundProspectingWorkflow`) fires on a configured schedule (e.g., daily 08:00 UTC), or manually via `POST /v1/outbound/trigger` for demos.
2. **Discovery & Intent Signals**: Queries Apollo.io (respecting budget guard) + Exa.ai + public buying signals (job postings, funding announcements, press releases).
3. **Circuit-Breaker Disqualification Gate**:
   - Stage 1: Rule-based fast fail (drop personal email domains, invalid domains, blocklisted competitors).
   - Stage 2: Fast LLM ICP check (Gemini Flash). If non-viable, workflow halts immediately and logs drop reason.
4. **Decision-Maker Resolution**: Queries web search for `site:linkedin.com/in/ "[Company]" "[Role]"` and extracts named decision-maker details via Instructor.
5. **Deep Web Research & BM25 Filtering**: Crawl4AI performs async web crawl applying `BM25ContentFilter` (`user_query` from tenant config) to yield clean `fit_markdown` free of website chrome/nav noise. **On scrape failure, degrades gracefully** to API metadata alone without failing the batch.
6. **Structured Qualification & Drafting**: LLM scores prospect and outputs a 3-part `OutboundDraft` (Observation Hook → Capability Link → Low-Friction Ask).
7. **Human-in-the-Loop Staging**: Prospect written to HubSpot with status `Awaiting Approval` and resolved contact details — outbound never sends automatically.
8. **SLA Escalation**: Unreviewed high-scoring prospects escalate via Slack if unacted upon past tenant SLA window.

The point of sharing this backbone: it's not two products, it's one event-processing core with two entry points. That reuse is itself part of the systems story worth narrating in an interview.

---

## 5. Idempotency Mechanics

- Every inbound payload is reduced to a deterministic key: either the caller-supplied `idempotency_key`, or a SHA-256 hash of `email + timestamp_window`.
- Redis stores this as an atomic lock with a 24-hour TTL. The check-and-set happens as a single atomic operation — there is no window in which two concurrent requests with the same key could both pass the check before either sets the lock (this is the exact race condition a naive "check then set" implementation would introduce, and exactly what an interviewer will probe for).
- On a hit, the cached execution state (not just a bare "duplicate" flag) is returned in the `202` response — the caller can see what happened to the original request.

---

## 6. Concurrency & Rate Limiting Architecture

The Token Bucket limiter is implemented as a single atomic Redis Lua script (see `tech_requirements_document.md` for the parameters). The reason it's a Lua script rather than separate Python-side GET/compare/SET calls: Lua scripts execute atomically inside Redis, so there's no race window between reading the current token count and decrementing it — two concurrent requests can't both read "1 token available" and both proceed. This is the same class of bug as the idempotency check above, solved the same way: push the check-and-mutate into a single atomic operation rather than doing it in application code across two round-trips.

---

## 7. Failure & Recovery Model (Saga Pattern)

- Every external interaction is wrapped in a Temporal `@activity.defn`, never called directly from workflow code.
- Retry policy (see `tech_requirements_document.md` §4) applies uniformly: 1s initial interval, 2.0 backoff coefficient, 5 max attempts.
- **Compensations:** if a later step in the Saga fails after an earlier step has already succeeded (e.g., CRM write partially completes, then a downstream step throws), the workflow executes registered compensating actions in reverse order — e.g., rolling back a staged CRM record.
- **Worker crash recovery** is Temporal's core value proposition here: workflow state is persisted as an event history, not held in worker process memory. If a worker dies mid-execution, a healthy worker picks up the workflow and replays its history to reconstruct state, then resumes from the exact next step — completed activities are never re-run. This must be demonstrated, not just described: the required test is starting a load run and killing a worker container (`docker stop`) mid-flight, then confirming zero data loss and zero duplicate side effects.

---

## 8. Multi-Tenancy Design

- **Pooled multi-tenancy**, not siloed: all tenants share the same database and tables, isolated by a `tenant_id` column present on every row. This is a deliberate, documented scope decision (see `prd.md` non-goals), not an oversight — enterprise-grade per-tenant DB isolation is out of scope for a portfolio build.
- Each tenant's behavior (enrichment provider order, ICP scoring criteria, routing matrix, SLA window) is driven entirely by a JSON config row in Postgres — changing tenant behavior never requires a code change or redeploy. This is the specific mechanic that maps to the "configurable multi-tenant systems" requirement in FDE-flavored job descriptions.

---

## 9. Observability

- `structlog` is used throughout. Every workflow run binds a `correlation_id` (the `lead_id` for inbound runs, the `run_id` for outbound batches) to the logger context at workflow start.
- Every activity — enrichment call, scrape attempt, LLM call, CRM sync, Slack alert — logs at least one structured line carrying that same `correlation_id`, so a single `grep` or log-query reconstructs the full lifecycle of one lead.
- The Temporal Web UI (local, not tunneled) provides a second, complementary observability surface — full workflow history, replay, and failure inspection — useful for demos and debugging without building a custom dashboard.

---

## 10. Deployment Topology

```
Local machine (Docker Compose):
  ├── fastapi-app     (also runs the Temporal worker process)
  ├── temporal        (dev server)
  ├── redis
  └── postgres

Cloudflare Tunnel (free):
  └── exposes fastapi-app:8000 → public HTTPS URL
      (used for HubSpot/Typeform webhook delivery during
       demo recording and live interview walkthroughs)

Not exposed publicly:
  └── Temporal Web UI (8233) — local-only, debugging surface
```

This topology is intentionally demo-oriented rather than always-on production — see `tech_requirements_document.md` §7 for the honest limitation and the (optional, not required) path to an always-on deployment later.

---

## 11. Security Notes

- The ingestion endpoint requires an `X-API-Key` header — a public webhook endpoint with no auth is a real vulnerability worth avoiding even in a portfolio project, and it's a cheap, visible thing to get right.
- All secrets (API keys, webhook URLs) live in `.env`, excluded from version control via `.gitignore`.
- Cloudflare Tunnel provides TLS termination on the public URL at no cost — no self-managed certificate handling required.

---

## 12. Explicit Architectural Non-Goals

- No horizontal auto-scaling — single-instance by design.
- No per-tenant database or schema isolation.
- No OAuth-based multi-user authentication.
- No production-grade secrets manager (Vault, AWS Secrets Manager) — `.env` is sufficient at this scope and explicitly acknowledged as a simplification, not a gap to defend.
