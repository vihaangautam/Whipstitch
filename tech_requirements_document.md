# PipelineForge — Technical Requirements Document

**Companion to:** `prd.md`, `architecture.md`, `data_model.md`

---

## 1. Technology Stack

| Layer | Tool | Tier | Notes |
|---|---|---|---|
| Application server | FastAPI + Python 3.11+ | Free | Async endpoints, native Pydantic V2 |
| Workflow orchestration | Temporal (local dev server) | Free | `temporal server start-dev` — no cloud account needed |
| Cache & lock manager | Redis (Docker) | Free | Idempotency locks, Token Bucket rate limiting |
| Persistence | PostgreSQL (Docker) | Free | Tenant config, audit logs, event history |
| Structured LLM engine | Instructor + Groq / Gemini Flash | Free tier | Pattern 5: 3-part structured drafts (`OutboundDraft`), Pattern 4: circuit-breaker ICP checks, automatic retry on schema failure |
| Agentic web scraper (v2) | Crawl4AI (v0.8+) | Free / OSS | Pattern 1: `BM25ContentFilter` inside `CrawlerRunConfig` to generate noise-free `fit_markdown` |
| Prospect sourcing (v2) | Apollo.io API | Free — **50 credits/month hard cap** | See §5 for budget-guard requirement |
| Target CRM | HubSpot Developer Sandbox | Free | Real REST API, not a mock |
| Load testing | k6 | Free / OSS | Local execution |
| Public ingress | Cloudflare Tunnel (`cloudflared`) | Free | Exposes local FastAPI endpoint via public HTTPS — see §7 |
| Logging | structlog | Free / OSS | Structured, correlation-ID-bound logs |

**Total infra cost: ₹0.** Everything above runs on your machine or a free-tier API quota.

---

## 2. Non-Functional Requirements

### NFR-1 — Fault Tolerance & Durable Execution (Saga Pattern)
- All external interactions (enrichment APIs, Crawl4AI, LLM calls, CRM writes) run inside `@activity.defn` functions, wrapped by a Temporal Saga workflow with compensating actions.
- Retry policy: initial interval 1s, backoff coefficient 2.0, max interval 10s, max attempts 5.
- **Worker crash recovery:** if a worker process dies mid-execution, Temporal must reassign the workflow to a healthy worker and resume from the exact failed step — no re-running of already-completed activities. This must be demonstrated live (`docker stop` mid-test), not asserted.

### NFR-2 — Rate Limiting & Concurrency Control
- All outbound third-party calls pass through a Redis-backed Token Bucket limiter (atomic Lua script — see `architecture.md` §6 for why atomicity matters here).
- Default: HubSpot Sandbox capped at 10 req/sec; excess requests queue in Redis Streams rather than being dropped.

### NFR-3 — Performance Benchmarks
- **Throughput:** system must process a burst of 1,000 inbound webhooks/minute without memory exhaustion or dropped requests.
- **Latency:** end-to-end p95 (ingestion → enrichment → LLM scoring → CRM sync) under 2.5s, **excluding external LLM inference time** — LLM latency is reported as a separate, distinct metric, since it depends on a third party's response time, not your system's engineering.
- Every claimed number must come from a real, re-runnable k6 script and be logged in `BENCHMARK.md` — no target numbers get copied onto the resume until they're measured.

### NFR-4 — Observability *(added — not present in the original PRDs, and worth treating as a first-class requirement)*
- Use `structlog` for all logging; plain `print()` or unstructured `logging.info(f"...")` is not acceptable.
- Bind a `correlation_id` (the `lead_id` for inbound, the `run_id` for outbound) to the logger context at the start of every workflow, and thread it through every activity log line.
- Rationale: the first question in almost any systems interview after "how does it work" is "how do you know when it's broken?" A correlation ID that follows a lead through every pipeline stage turns your terminal output into a demoable trace, not a black box.

### NFR-5 — Security
- The ingestion endpoint requires an API key header even though the project is otherwise "zero-capital" — an unauthenticated public webhook endpoint is a real vulnerability, not just a nitpick.
- Secrets live in `.env`, which is git-ignored; never commit API keys.
- Cloudflare Tunnel provides free TLS termination on the public endpoint — no self-managed certificates needed.

---

## 3. API Contract

### `POST /v1/events/ingest`
Inbound lead webhook receiver.

```
Headers: X-API-Key: <tenant key>
Body:
{
  "tenant_id": "string",
  "idempotency_key": "string (optional — derived from email+timestamp_window if absent)",
  "email": "string",
  "company_name": "string",
  "raw_payload": { ...arbitrary form fields... }
}

Responses:
200 OK        — new event accepted, workflow started
202 Accepted  — duplicate detected, cached execution state returned
400           — malformed payload
401           — missing/invalid API key
```

### `GET /v1/events/{event_id}/status`
Returns current pipeline stage for a given event (`received`, `enriching`, `scoring`, `synced`, `failed`).

### `POST /v1/tenants/{tenant_id}/config`
Upserts a tenant's enrichment waterfall order, ICP scoring criteria, and routing matrix. Admin-only, same API key auth.

### `POST /v1/outbound/trigger` *(v2, demo/manual-run convenience — production behavior is cron-scheduled)*
Manually fires the `OutboundProspectingWorkflow` for a given tenant, useful for demo recording without waiting for the 08:00 UTC cron.

### `GET /health`
Liveness check — used by Docker Compose healthchecks and the Cloudflare Tunnel uptime story.

### `GET /docs`
Auto-generated OpenAPI docs (FastAPI default) — this is your "status visibility" surface per the no-frontend-UI non-goal.

---

## 4. Retry & Backoff Policy (canonical values — apply everywhere)

| Parameter | Value |
|---|---|
| Initial interval | 1 second |
| Backoff coefficient | 2.0 |
| Maximum interval | 10 seconds |
| Maximum attempts | 5 |
| Applies to | Enrichment API calls, Crawl4AI scrape calls, LLM calls, CRM sync calls |

---

## 5. Rate Limiting & Quota Specification

| Provider | Guard Mechanism | Limit |
|---|---|---|
| HubSpot Sandbox | Token Bucket (Redis Lua) | 10 req/sec, configurable per tenant |
| Groq / Gemini Flash | Token Bucket + provider fallback | Per free-tier documented limits; fallback to secondary provider on 429 |
| **Apollo.io** | **Monthly credit counter, not a rate limiter** | **50 credits/month, hard stop** |

Apollo's constraint is a *quota*, not a *rate* — conflating the two is a real bug risk. A Token Bucket that refills every second does nothing to stop you from burning 50 monthly credits in an afternoon of testing. Implement a separate Redis counter (`apollo_credit_budget:{yyyy-mm}`) that increments on every real API call and hard-stops (falls back to mock data, logs a warning) once it hits 50. **During development, `MOCK_APOLLO=true` is the default** — real Apollo calls are reserved for the final demo recording session only.

---

## 6. Testing Requirements

- **Unit tests:** idempotency-key generation and lookup logic, the Token Bucket Lua script (run against a real Redis test instance, not mocked — this logic is exactly what needs to be proven correct), LLM schema validation failure/retry paths.
- **Integration test:** one full happy-path run (webhook in → CRM record out) against `docker-compose.test.yml`, run in CI.
- **Load test:** the k6 script itself is a deliverable, not throwaway — commit it to the repo alongside `BENCHMARK.md` so the numbers are reproducible by anyone who clones the repo.
- **Crash test:** documented, scripted procedure — start the load test, `docker stop` a worker container partway through, confirm zero dropped events and correct resumption. This is the single most important test in the whole project; don't skip or approximate it.

---

## 7. Deployment & Local Dev Setup

### Docker Compose services
```
fastapi-app   — the API + Temporal worker process
temporal      — Temporal dev server (temporal server start-dev)
redis         — cache/lock/rate-limit store
postgres      — tenant config, audit logs, event history
```

### Cloudflare Tunnel (public ingress, free)
For the CRM Sandbox E2E phase, HubSpot/Typeform need a real public HTTPS URL to send webhooks to. Rather than paying for hosting:

```bash
# quick, ephemeral URL for demo recording sessions:
cloudflared tunnel --url http://localhost:8000

# for a stable, reusable URL (requires a domain you own, DNS proxied through Cloudflare — also free):
cloudflared tunnel create pipelineforge
cloudflared tunnel route dns pipelineforge api.<yourdomain>.dev
cloudflared tunnel run pipelineforge
```

**Honest limitation:** a tunnel only stays up while your machine and the `cloudflared` process are running — it is not an always-on deployment. This is fine for scheduled demo recordings and live interview walkthroughs. If you want a link recruiters can hit at 2am without your laptop being on, that's a separate, later decision — a free tier on Render or Fly.io for just the FastAPI layer (Temporal/Redis/Postgres stay local, or you'd need to reconsider the whole topology). Don't solve for that unless it actually comes up.

Only the FastAPI ingestion endpoint is tunneled — the Temporal Web UI (port 8233) stays local, both for security and because it's a debugging tool, not a public interface.

---

## 8. Environment Variables

```
# API
API_KEY=
TENANT_DEFAULT_ID=

# Postgres
POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=

# Temporal
TEMPORAL_HOST=
TEMPORAL_NAMESPACE=

# LLM providers
GROQ_API_KEY=
GEMINI_API_KEY=

# Third-party
HUBSPOT_SANDBOX_API_KEY=
APOLLO_API_KEY=
MOCK_APOLLO=true   # flip to false only for demo recording sessions

# Alerting
SLACK_WEBHOOK_URL=

# Cloudflare
CLOUDFLARE_TUNNEL_TOKEN=   # only if using a named (persistent) tunnel
```

---

## 9. Core Dependencies (`requirements.txt` outline)

```
fastapi
uvicorn[standard]
pydantic>=2.0
temporalio
redis
asyncpg
instructor
groq
google-generativeai
crawl4ai          # v2 only
httpx
structlog
alembic           # Postgres migrations
pytest
pytest-asyncio
```

k6 and `cloudflared` are external binaries, not Python packages — install separately per their official docs.
