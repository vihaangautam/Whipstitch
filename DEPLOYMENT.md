# Whipstitch — Production Deployment

Goal: a real URL where anyone can register an account and use the product, so you
can start getting real usage and feedback. Not "scale" — "live and testable".

---

## The shape

```
                    ┌───────────────────────────────┐
 users ──HTTPS──►   │  Cloudflare  (DNS + proxy/CDN) │
                    └───────────────┬───────────────┘
                                    │  app.whipstitch.com
                                    ▼
                    ┌───────────────────────────────┐
                    │  Railway service               │
                    │  Docker image (this repo)       │
                    │  • FastAPI  (API + serves the   │
                    │    built React app, same origin)│
                    │  • alembic upgrade head on boot │
                    └───────┬───────────────┬─────────┘
                            │               │
                   DATABASE_URL         REDIS_URL
                            ▼               ▼
                  ┌──────────────┐   ┌──────────────┐
                  │  Supabase    │   │  Upstash     │
                  │  Postgres    │   │  Redis (free)│
                  └──────────────┘   └──────────────┘
```

**One Railway service.** The Dockerfile already builds the React app and FastAPI
serves it from `frontend/dist` at `/`, so the browser talks to one origin and
there is no CORS or `VITE_API_URL` to wire. Keep it this way until there's a
reason not to.

### What we are *not* deploying yet

| Deferred | Why it's safe to skip | When to add it |
|---|---|---|
| **Temporal + the worker** | Every workflow entry point already has an inline-execution fallback (`app/api/v1/deals.py:203`, battlecards, meetings…). Without a worker they just run in-process. | When a single generation run gets long enough that you want it durable/retryable across restarts, or when you need cron-scheduled outbound. Then: Temporal Cloud (paid) or a self-hosted Temporal service + a second Railway service running `python -m app.worker`. |
| **Redis** (optional) | Falls back to in-process locks/rate-limits. Fine for one instance. | The moment you run more than one API replica — then idempotency and rate limits must be shared. Upstash free tier covers it; wire it from day one if it's easy. |
| **Apollo** | `MOCK_APOLLO=true`; outbound discovery falls back to free Serper hiring-signal search. | When you have paying users and want richer org data. 50 credits/month hard cap. |
| **Split frontend on Cloudflare Pages** | Monolith works and is simpler. | If the static site needs its own release cadence or edge caching. Then set `CORS_ORIGINS` and add a `VITE_API_URL` build arg. |

---

## Step by step

### 1. Supabase — the database

1. New project. Pick the region closest to your Railway region.
2. Project Settings → Database → **Connection string** → **Session pooler** (port
   `5432`, not the transaction pooler on `6543` — migrations need a real session).
3. Copy it. It looks like:
   `postgresql://postgres.abcdefgh:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`
4. Convert the scheme for SQLAlchemy async:
   `postgresql+asyncpg://postgres.abcdefgh:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

   That's your `DATABASE_URL`. TLS is added automatically for non-localhost hosts
   (`app/db/session.py`), so you do **not** need `?sslmode=` on the end.
5. Nothing else to do here — `alembic upgrade head` on the first Railway boot
   creates every table.

### 2. Upstash — Redis (optional but do it)

1. New Redis database, same region.
2. Copy the **`rediss://`** connection URL (TLS). That's your `REDIS_URL`.

### 3. Railway — the app

1. New project → Deploy from GitHub repo → pick this repo / the branch you want live.
2. Railway auto-detects `Dockerfile` (and `railway.json` pins the health check to
   `/health` and the start command).
3. **Variables** — set these (see the full table below). At minimum:
   `ENVIRONMENT=production`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`,
   `ENCRYPTION_MASTER_KEY`, and the three LLM keys.
4. First deploy: watch the logs for `alembic upgrade head` → then
   `Uvicorn running`. Hit `https://<railway-subdomain>.up.railway.app/health` —
   expect `{"status":"healthy"}` or `"degraded"` (degraded just means Redis or
   Temporal is absent, which is fine).
5. Register a test account at `/` and click through the product.

### 4. Cloudflare — the domain

1. Add your domain to Cloudflare (change nameservers at your registrar).
2. Railway service → Settings → Networking → **Custom Domain** → enter
   `app.whipstitch.com` (or the apex). Railway shows a target.
3. In Cloudflare DNS: `CNAME  app  →  <the railway target>`, **proxied** (orange
   cloud on). That gives you Cloudflare's TLS, CDN and DDoS in front of Railway.
4. SSL/TLS mode → **Full (strict)**.
5. Update `ENVIRONMENT`-adjacent vars if needed and redeploy. Done.

---

## Environment variables (Railway)

Generate the two secrets first:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"                       # JWT_SECRET_KEY
python -c "import base64,os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"  # ENCRYPTION_MASTER_KEY
```

| Variable | Value | Notes |
|---|---|---|
| `ENVIRONMENT` | `production` | Disables `/v1/auth/demo-login`; tightens a few defaults. |
| `DATABASE_URL` | `postgresql+asyncpg://…pooler.supabase.com:5432/postgres` | Session pooler. Scheme must be `+asyncpg`. |
| `REDIS_URL` | `rediss://…upstash.io:6379` | Omit to run on the in-process fallback (single instance only). |
| `JWT_SECRET_KEY` | *(generated)* | Long random string. If this leaks, every session is forgeable. |
| `ENCRYPTION_MASTER_KEY` | *(generated, 32 url-safe base64 bytes)* | Encrypts users' BYOK provider keys at rest. **Losing this makes stored keys unrecoverable** — save it somewhere durable. |
| `GEMINI_API_KEY` | real key — aistudio.google.com/apikey | Free tier. Primary generator. Any value containing `mock` = treated as absent. |
| `GROQ_API_KEY` | real key — console.groq.com/keys | Free tier. Fallback generator. |
| `SERPER_API_KEY` | real key — serper.dev | Free tier (2,500/mo). Powers hiring-signal discovery + company signals. |
| `OPENAI_API_KEY` | optional | Only if you want GPT as a platform default; users can BYOK without it. |
| `MOCK_APOLLO` | `true` | Leave true until you add a real `APOLLO_API_KEY` (50 credits/mo cap). |
| `HUBSPOT_SANDBOX_API_KEY` | optional | CRM sync is off without it; product still works. |
| `SLACK_WEBHOOK_URL` | optional | SLA/alerting. |
| `CORS_ORIGINS` | *(leave empty)* | Only set if you split the frontend onto another domain. |
| `TENANT_DEFAULT_ID` | `trifid_media` | Leave as-is. |
| `LOG_LEVEL` | `INFO` | |

`PORT` is injected by Railway — don't set it.

---

## Gotchas checked / fixed in this repo

- **`$PORT`** — Dockerfile `CMD` and `railway.json` both use `${PORT:-8000}`.
- **Supabase TLS** — `app/db/session.py` adds `ssl=require` as a connect arg for
  any non-localhost Postgres host (asyncpg ignores `?sslmode=` URL params).
- **Migrations on boot** — `app/db/migrations/env.py` now reuses the app engine
  (so TLS applies) and falls back to the local SQLite file if Postgres is
  unreachable, so a bad `DATABASE_URL` degrades instead of crash-looping.
- **CORS** — was `allow_origins=["*"]` + `allow_credentials=True` (invalid combo).
  Now credentials off (auth is a Bearer header, not a cookie) and origins are
  `CORS_ORIGINS`-driven, wildcard only when unset.
- **`demo-login`** — returns 404 when `ENVIRONMENT=production`.

Still worth doing before you share the link widely:

- [ ] Rotate `.env` locally too — it currently has the same dev secrets committed
      in `.env.example`; make sure production values only live in Railway.
- [ ] Point a real Slack webhook or set `SLACK_WEBHOOK_URL` to a dead value so SLA
      alerts don't spam an old channel.
- [ ] `git` — make sure `.env`, `whipstitch_local.db`, `venv/` are git-ignored
      (they should be) so nothing sensitive rides along in the image.
- [ ] Add a simple rate limit / captcha on `/v1/auth/register` if you get abuse.

---

## Getting real accounts + usage

1. Deploy as above with the three real LLM keys set.
2. Register yourself at `https://app.whipstitch.com`. Run the onboarding wizard —
   that's what feeds every engine's prompts, so fill it like a real customer.
3. Exercise each engine once and confirm it returns real (not template) output:
   the response payloads carry `model_used` — it should say `gemini-…` or
   `groq/…`, not `template`.
4. Share the link. Each new registration is an isolated tenant (workspace-scoped
   by `tenant_id`), so accounts don't see each other's data.
5. Watch: Railway logs (structlog JSON, `correlation_id` per request), Supabase
   table growth, and the free-tier counters (Gemini/Groq RPM, Serper 2,500/mo).

---

## When you outgrow the monolith

- **Durable workflows** → stand up Temporal (Temporal Cloud, or a self-hosted
  `temporalio/auto-setup` service on Railway with its own Postgres) and a second
  Railway service: same image, `startCommand: python -m app.worker`. Set
  `TEMPORAL_HOST`. The API auto-switches from inline to Temporal when it can
  connect.
- **More than one API replica** → `REDIS_URL` becomes mandatory (shared
  idempotency + rate limits), and move sessions off any in-process state.
- **Static edge hosting** → build the frontend separately, deploy `frontend/dist`
  to Cloudflare Pages, set `CORS_ORIGINS=https://whipstitch.com` on the API, and
  add `VITE_API_URL` as a Pages build var + read it in `frontend/src/api.js`
  (`const BASE_URL = import.meta.env.VITE_API_URL ?? ""`).
