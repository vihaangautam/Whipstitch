# PipelineForge — AI Build Rules

**Purpose:** this file guides any AI pair-programmer (Claude Code or similar) working on this repo. The entire point of PipelineForge as a portfolio project is that its concurrency, idempotency, and fault-tolerance guarantees are *real* — generated code that quietly violates them defeats the purpose, even if it "looks" like it works. Read `prd.md`, `architecture.md`, `tech_requirements_document.md`, and `data_model.md` before writing code against a new requirement.

---

## Non-negotiable rules

1. **All external I/O lives inside a Temporal `@activity.defn`, never inside `@workflow.run`.** Workflow code must be deterministic: no direct network calls, no `datetime.now()`, no `random`, no non-deterministic branching. If you catch yourself writing an `await httpx.get(...)` directly inside a `@workflow.run` method, stop — that call belongs in an activity.

2. **Every activity that calls an external API has an explicit `RetryPolicy`.** Use the canonical values from `tech_requirements_document.md` §4 (1s initial, 2.0 backoff coefficient, 10s max interval, 5 max attempts) unless a specific requirement documents a different value. Never rely on Temporal's bare defaults without a deliberate decision.

3. **Idempotency is checked at the FastAPI layer, before the workflow starts** — using the Redis atomic lock, not inside the workflow itself. A Temporal workflow ID collision and a business-level idempotency key are two different mechanisms; don't conflate them or assume one covers the other.

4. **No blocking calls inside `async def` handlers or activities.** Use `httpx.AsyncClient`, `asyncpg`, `redis.asyncio`. A `requests.get()` or a blocking `psycopg2` call inside an async function is a correctness bug (it blocks the event loop for every concurrent request), not a style preference — flag it as such.

5. **Never call the real Apollo.io API outside of a designated demo-recording session.** The free tier is a hard 50 credits/month. Default `MOCK_APOLLO=true` in `.env.example`, and all tests/dev runs must use fixture data. If you're generating test code that calls Apollo, it must call the mock, not the real client, unless explicitly told this is the demo recording run.

6. **Every Crawl4AI call has a timeout and a fallback path.** Wrap scrape attempts in try/except; on failure, degrade to enrichment-API metadata only, and let the parent workflow continue. A scrape failure must never fail the whole pipeline — this is a hard functional requirement (F-7), not an edge case to skip for later.

7. **Every LLM call goes through `instructor` with a Pydantic `response_model`.** Never accept a raw string completion and parse it with regex or manual `json.loads`. If schema validation fails after `max_retries`, raise a typed exception the workflow can catch — don't swallow it silently or return a partially-valid object.

8. **Postgres schema changes go through an Alembic migration**, never an ad-hoc `CREATE TABLE` run by hand, even during early prototyping. This is one of the cheapest, most visible "production-grade" signals in the repo — don't skip it to save five minutes.

9. **Every new activity or workflow ships with at least one test** before it's considered done — a unit test with mocked dependencies, or an integration test against `docker-compose.test.yml`. "I ran it once manually and it worked" is not done.

10. **Logging is structured, always.** Use `structlog`. Bind `correlation_id` (the `lead_id` for inbound, `run_id` for outbound) at workflow start, and pass it through every activity log line. No bare `print()`, no unstructured `logging.info(f"...")`.

---

## Code style & structure

**Proposed repo layout:**
```
pipelineforge/
├── app/
│   ├── main.py                 # FastAPI app entrypoint
│   ├── api/
│   │   ├── ingest.py            # /v1/events/ingest
│   │   ├── tenants.py           # /v1/tenants/{id}/config
│   │   └── outbound.py          # /v1/outbound/trigger
│   ├── workflows/
│   │   ├── inbound_lead.py      # PipelineForgeLeadWorkflow
│   │   └── outbound_prospect.py # OutboundProspectingWorkflow
│   ├── activities/
│   │   ├── enrichment.py
│   │   ├── scraping.py          # Crawl4AI wrapper
│   │   ├── llm_qualification.py
│   │   └── crm_sync.py
│   ├── core/
│   │   ├── idempotency.py       # Redis lock logic
│   │   ├── rate_limiter.py      # Token Bucket Lua wrapper
│   │   └── logging.py           # structlog setup
│   ├── models/                  # Pydantic schemas (see data_model.md)
│   └── db/
│       ├── models.py             # SQLAlchemy/asyncpg models
│       └── migrations/           # Alembic
├── tests/
│   ├── unit/
│   └── integration/
├── load_tests/
│   └── k6_benchmark.js
├── docker-compose.yml
├── docker-compose.test.yml
├── BENCHMARK.md                 # real k6 output lives here, not fabricated numbers
└── .env.example
```

**Naming conventions:**
- Files: `snake_case.py`
- Pydantic models: `PascalCase`, e.g. `LeadQualificationSchema`
- Temporal activities: `snake_case` function names ending in `_activity`, e.g. `enrich_lead_waterfall_activity`
- Temporal workflows: `PascalCase` classes ending in `Workflow`, e.g. `PipelineForgeLeadWorkflow`

**Commit messages:** `type(scope): description` — e.g. `feat(ingest): add idempotency check`, `fix(rate-limiter): correct Lua token refill math`, `test(saga): add worker-crash recovery integration test`.

---

## Definition of done, per requirement

Before marking any `F-` requirement from `prd.md` complete, confirm:

- [ ] The happy path works end-to-end, demonstrated with a real (not hand-typed) log trace.
- [ ] At least one failure path is tested (vendor timeout, schema validation failure, or scrape failure, as applicable).
- [ ] A unit or integration test exists and passes in CI.
- [ ] Structured logs carry the correct `correlation_id` through every step.
- [ ] Nothing in the implementation silently violates rules 1–10 above.

---

## Explicit anti-patterns — do not do these, even if they're faster

- Wrapping a model or business logic inside a single-threaded synchronous endpoint.
- Treating an API route as a bare database wrapper with no idempotency or circuit-breaking.
- Relying on Zapier/n8n-style no-code glue instead of custom resilient code for anything inside this repo's scope.
- Fabricating or hand-typing benchmark numbers in `BENCHMARK.md`. Every number in that file must come from a k6 run that was actually executed. If asked to "update the benchmark doc," the correct response is to run the script, not to edit numbers directly.
- Adding a frontend UI, payment integration, or OAuth flow "since we're in there anyway" — these are explicit non-goals in `prd.md`. Flag scope creep rather than quietly implementing it.
