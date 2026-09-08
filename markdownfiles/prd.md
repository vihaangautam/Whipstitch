# PipelineForge — Product Requirements Document

**Version:** 1.0
**Status:** Active build spec
**Author:** Vihaan Gautam
**Target Roles:** SDE1 / Backend Engineer, Forward-Deployed Engineer, GTM Engineer, Product Engineer, AI/LLM Engineer

---

## 1. Problem Statement

Modern B2B go-to-market stacks are assembled from disconnected tools: webforms (Typeform), CRMs (HubSpot, Salesforce), enrichment vendors (Apollo, Clearbit), LLM scoring layers (OpenAI, Gemini, Groq), and alerting (Slack). Gluing these together is usually done with no-code automation (Zapier, n8n), which has three recurring failure modes:

- **Lead decay** — inbound intent loses most of its value if first contact doesn't happen within minutes, not hours.
- **Silent webhook failure** — when an enrichment vendor times out or rate-limits, no-code flows drop the event instead of retrying or falling back.
- **Duplicate writes** — retried webhooks without idempotency guarantees create duplicate CRM records and confuse ownership.

PipelineForge is a code-first orchestration engine that replaces the fragile no-code layer with a durable, fault-tolerant system — while staying entirely on free-tier infrastructure.

---

## 2. Goals & Non-Goals

### Goals — v1.0 (Weeks 1–2, Inbound Core)
- Process inbound lead webhooks with guaranteed idempotency (no duplicate CRM writes, ever).
- Enrich, score, and route leads automatically, with vendor-fallback on failure.
- Enforce SLA on high-priority leads with automatic Slack escalation.
- Produce real, verifiable performance numbers (throughput, p95 latency, crash-recovery behavior) — not simulated claims.

### Goals — v2.0 (Weeks 3–4, Outbound Extension)
- Add a scheduled outbound prospecting workflow that sources and qualifies new leads proactively, reusing the same enrichment/scoring/CRM backbone as inbound.
- Demonstrate agentic web research (Crawl4AI) with graceful degradation when scraping fails.
- Stage outbound prospects for human approval before any outreach — no autonomous sending.

### Explicit Non-Goals (v1 and v2)
- **No frontend UI.** The system is headless. Visibility comes from OpenAPI docs (`/docs`), the Temporal Web UI, and structured logs.
- **No real payment or billing workflows.** Out of scope entirely — keeps the codebase focused on event processing.
- **No multi-user OAuth flows.** Static API keys / bearer tokens via environment variables only.
- **No autonomous outreach sending.** Outbound drafts are staged as "Awaiting Approval" — a human always sends the message.
- **No scraping of gated or ToS-restricted surfaces** (Instagram, LinkedIn profiles, WhatsApp). Crawl4AI is scoped to public company websites and press pages only — this is a deliberate legal/ethical boundary, not a technical limitation.
- **No horizontal auto-scaling or multi-region deployment.** Single-instance, single-region, portfolio-scale by design.
- **No per-tenant database isolation.** Multi-tenancy is pooled (shared tables, `tenant_id` column), not siloed — a documented simplification, not an oversight.

---

## 3. Target Personas

| Persona | Primary Need | What PipelineForge Gives Them |
|---|---|---|
| **RevOps / GTM Ops Lead** | Inbound leads enriched, scored, and assigned without manual triage or record loss | Zero-duplicate, auto-routed lead pipeline with SLA alerts |
| **Sales Rep / Account Manager** | Pre-researched outbound prospects with a draft already written | Daily queue of AI-qualified prospects staged for one-click approval |
| **Forward-Deployed Engineer** | A system re-configurable per customer stack without touching core code | JSON-driven tenant config for enrichment order, ICP criteria, routing rules |
| **Engineering Hiring Manager** | Evidence of production-grade distributed systems thinking | Idempotency, Saga-pattern fault tolerance, real load-test output |

---

## 4. Core Functional Requirements

### Inbound (v1.0)
| ID | Requirement |
|---|---|
| F-1 | Idempotent webhook ingestion via `POST /v1/events/ingest`; duplicate payloads within a 24h window return `202 Accepted` with cached state, no re-processing. |
| F-2 | Multi-tenant configuration engine — enrichment waterfall order, ICP scoring criteria, BM25 query terms, target executive roles, and routing matrix defined per tenant in Postgres/JSON. |
| F-3 | Asynchronous waterfall enrichment — sequential vendor queries with automatic fallback on 4xx/5xx or incomplete data. |
| F-4 | Type-safe LLM qualification — `instructor` + Pydantic schema enforcement producing a 3-part structured draft (`observation_hook`, `capability_link`, `low_friction_ask`), zero unstructured output accepted. |
| F-5 | CRM sync & SLA escalation — scored leads written to HubSpot sandbox; leads scoring >80 left uncontacted past 15 minutes trigger a Slack alert. |

### Outbound (v2.0)
| ID | Requirement |
|---|---|
| F-6 | Scheduled outbound prospecting — a Temporal cron workflow queries Apollo/Exa + Job Board / Funding / News buying signals for prospects matching tenant ICP criteria. |
| F-7 | Agentic web research & BM25 noise reduction — Crawl4AI scrapes prospect sites using `BM25ContentFilter` to generate clean `fit_markdown`; on scrape failure, the pipeline degrades gracefully to enrichment-API metadata only, and the workflow never aborts. |
| F-8 | Human-in-the-loop staging — outbound prospects are written to CRM with status `Awaiting Approval` containing resolved decision-maker contact details and 3-part draft; nothing is sent without explicit human action. |
| F-9 | Circuit-breaker disqualification gates — multi-stage qualification (Stage 1 rule-based fast fail + Stage 2 fast LLM binary check) halts execution early on non-viable leads before expensive scraping or full qualification. |
| F-10 | Decision-maker resolution — targeted executive role resolution via web search and LLM extraction to convert company-level leads into named contact records. |

---

## 5. Success Metrics & Validation Plan

| Phase | Objective | Method | Deliverable |
|---|---|---|---|
| **1. Load & Latency** | Real, quotable performance numbers | k6 script driving 1,000 req/min; kill a worker container mid-test (`docker stop`) to verify crash recovery | `BENCHMARK.md` with real p50/p90/p95 and zero-dropped-request confirmation |
| **2. CRM Sandbox E2E** | Prove interoperability with a real commercial stack | Wire to free HubSpot Developer Sandbox; process 50 synthetic payloads (mix of inbound + outbound) | Recorded demo (60–90s) showing live ingestion → fallback → CRM update → Slack alert |
| **3. Outreach Validation** *(optional, time-permitting)* | Sanity-check that the problem resonates with hiring managers | Send a handful of architecture-feedback messages to Bengaluru engineering managers / FDE leads | Qualitative feedback — treat any reply as a bonus, not a required metric |

Note on Phase 3: don't over-index on this. A 20%+ reply rate target from a cold list of 20 people is a nice-to-have signal, not something to chase at the expense of shipping Phases 1–2 with real data.

---

## 6. Positioning Strategy

PipelineForge is deliberately built as **a core distributed-systems engine wrapped in a GTM domain** — not a GTM product. This matters for how it's presented:

> "I studied how platforms like Clay and Artisan operate under the hood. To understand distributed event processing, I built PipelineForge — a lightweight, open-source orchestration engine that handles the hard systems problems inside those platforms: idempotent webhook ingestion, atomic rate limiting, worker-crash recovery via Temporal Sagas, and graceful degradation during scraping failures."

Never frame this as "a Clay competitor" — a portfolio project cannot replicate a $3B platform's breadth, and claiming otherwise reads as naive rather than ambitious. Framed as a systems study, it reads as an engineer who understands the domain well enough to be useful on day one at a company buying (or building) exactly this kind of tooling.

Resume bullets are role-specific and live in `tech_requirements_document.md` §3 — pull the variant matching the job description, and only after real benchmark numbers exist.

---

## 7. Roadmap

| Week | Focus | Milestone |
|---|---|---|
| 1 | Containerize FastAPI, Postgres, Redis, Temporal CLI. Get one activity executing end-to-end locally. | Health checks pass; "hello world" workflow runs. |
| 2 | Implement F-1 through F-5. Run k6 load test + crash simulation. | `BENCHMARK.md` published with real numbers. |
| 3 | Implement F-6/F-7 (outbound + Crawl4AI). Wire HubSpot sandbox for both flows. | Outbound workflow stages prospects successfully. |
| 4 | Record E2E demo video. Write tenant-config docs. Update resume with real-data bullets. | Live repo + demo ready for applications. |

---

## 8. Risks

- **Temporal has a real learning curve** — deterministic workflow constraints (no direct I/O, no `datetime.now()`, no randomness inside `@workflow.run`) take a few days to internalize. Budget this explicitly in Week 1, don't let it silently eat Week 2.
- **Crawl4AI reliability is inherently unpredictable** — anti-bot measures and inconsistent site structure are the norm, not the exception. This is why F-7's graceful-degradation requirement is load-bearing, not decorative.
- **Apollo's free tier is a hard 50 credits/month** — burn it in dev testing and there's nothing left for the actual demo recording. See `rules.md` for the required mocking discipline.
- **LLM latency is variable and provider-dependent** — the p95 latency target explicitly excludes LLM inference time for this reason; report it separately, don't let a slow Groq response corrupt your core systems benchmark.
