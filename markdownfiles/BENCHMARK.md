# Whipstitch — Performance Benchmarks & Reliability Metrics

> **Every number below was actually measured on 2026-09-12** using `k6` (via `load_tests/k6_benchmark.js`) against a real stack running locally in Docker: Postgres 16, Redis 7, and `temporalio/auto-setup` — not the containerized production image, but the same application code, against real backing services. The previous version of this file was hand-typed and never run; see the note at the bottom for what that cost.

---

## 1. Load Test Throughput & Latency

### Scenario: Inbound Webhook Burst (`POST /v1/events/ingest`, 1,000 req/min for 3 minutes)
Run twice, once per backend configuration, same script, same 50 max VUs:

| Metric | **Temporal unreachable** (bounded fallback) | **Temporal + worker running** (real saga dispatch) |
|---|---|---|
| Total requests | 3,001 | 3,001 |
| Error rate | 0.00% | 0.00% |
| avg | 534 ms | 417 ms |
| p50 | 540 ms | 284 ms |
| p90 | 546 ms | 954 ms |
| p95 | 546 ms | 1.16 s |
| max | 723 ms | 2.65 s |

Neither number is "the" ingestion latency — they're two honest answers to two different questions. The fallback path is flatter because it's bounded by a fixed timeout (see below); the real-Temporal path is faster at the median but has a longer tail because it's doing more real work per request (a live gRPC round trip to start a durable workflow, competing with everything else Temporal is doing for that Postgres connection).

### What running this for real found and fixed
The first time this script was run (against the fallback path), p95 wasn't 546 ms — it was over **6.4 seconds**. Two root causes, both now fixed:

1. **`Client.connect()` to Temporal had no timeout.** Every route with a "try Temporal, fall back to inline execution" pattern (`ingest.py`, `deals.py`, `outbound.py`, `meetings.py`, `health.py`) called `Client.connect()` directly. Against an unreachable host — which is every deployment of this app today — that call took ~6.4s to fail before the fallback ran. Fixed with a shared `app/core/temporal_client.py` helper that bounds the connect at 0.5s via `asyncio.wait_for`.
2. **Redis connections had a 2.0s timeout but no separate connect timeout.** `socket_timeout` bounds an established connection's operations, not the initial TCP handshake — `socket_connect_timeout` does that, and it wasn't set. The ingest path opens two Redis connections per request (lock acquire, then cache the state), so an unreachable Redis cost 4+ seconds on top of Temporal's. Fixed by adding `socket_connect_timeout=0.5` to all three `Redis.from_url()` call sites (`idempotency.py`, `rate_limiter.py`, `health.py`).

A third bug was found in the process, unrelated to latency: **`docker-compose.yml`'s Temporal service had an invalid `DB` driver value** (`postgresql` instead of `postgres12`) — meaning the Temporal container defined in this repo's own compose file could never have started. Fixed. This strongly suggests nobody had run the full docker-compose stack successfully before this pass.

---

## 2. Worker Crash Recovery — actually tested

**Method**: started a real Temporal server + worker (see setup above), fired a 25-second k6 run at 5 VUs against `/v1/events/ingest`, killed the worker process ~5s in, left it dead for ~8s, restarted it, then inspected the worker's structured logs.

- **Requests during the crash window**: all 491 ingest calls returned `200`, 0% failures. This is expected, not surprising: ingestion only needs the Temporal *server* to accept a `start_workflow` call and queue the task — the worker being down doesn't block that.
- **The real question — did the backlog drain correctly once the worker came back**: 311 distinct `WhipstitchLeadWorkflow` executions were queued during and after the outage; the restarted worker picked them up and progressed them through enrichment → LLM qualification (real Gemini calls, `200 OK`) → CRM sync → SLA timer, with **zero duplicate `sync_to_crm_activity_completed` events per lead_id** (checked directly — every lead_id appears exactly once) and no `NonDeterministicWorkflowError` or worker crash-loop.
- **One benign, expected artifact**: the Temporal SDK logged `WARN ... Activity not found on completion` a handful of times — this is the *old* (killed) worker process's in-flight activity call landing after Temporal's server had already reassigned that task to the new worker on timeout. That's the crash-recovery mechanism visibly working, not a bug; documenting it here so it isn't mistaken for one later.
- **Honest limitation**: this run wasn't watched to 100% backlog completion (real Gemini/HubSpot HTTP calls take real wall-clock time per workflow) — what's verified above is "no loss, no duplication, worker resumes cleanly," which is the actual claim this section exists to support. `scripts/crash_test.sh` exists in the repo but — before this pass — had never been run and unconditionally printed a success message regardless of outcome; it's a stub, not a test, and shouldn't be trusted as one.

---

## 3. What wasn't measured in this pass

Named explicitly so silence doesn't get mistaken for a passing result:

- **Token-bucket rate limiter** (`app/core/rate_limiter.py`, Redis Lua script): covered by `tests/unit/test_rate_limiter.py` (passing), but not separately load-tested for real burst/throttle behavior under concurrency.
- **Buying Committee SSE stream, Apollo budget guard overhead, Pipeline Analytics aggregation latency**: no benchmarks exist for these. The previous version of this file listed specific millisecond figures for all of them (`480ms`, `12ms`, `1.8ms`, `38ms`) — those were invented, not measured, and are removed rather than carried forward.

---

## Why this file was rewritten

The version of this document before 2026-09-12 claimed p50 latency of 42ms, referenced a `docker stop whipstitch_app` crash test with "0 events lost," and cited a rate limiter mechanism ("Redis Streams") that doesn't exist anywhere in the codebase. None of it was run. `scripts/crash_test.sh` — the script that document claimed to be driven by — has no verification logic; it stops a container, restarts it, and prints "All Temporal Sagas Resumed Successfully!" unconditionally. This is exactly the failure mode `CLAUDE.md`'s own rule 8 warns against: *"Fabricating or hand-typing benchmark numbers in `BENCHMARK.md`. Every number in that file must come from a k6 run that was actually executed."* Every number above now does.
