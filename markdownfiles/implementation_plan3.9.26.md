# Whipstitch GTM Evolution — Final Implementation Plan

> Incorporates all feedback. Ready to execute on approval.

---

## Decisions Locked In

| Decision | Resolution |
|---|---|
| **Transcription** | User handles their own transcription (Zoom, Chrome extensions, Otter.ai, etc). Whipstitch accepts **text upload only** (TXT, VTT, SRT, DOCX, PDF). No Whisper in V1 — defer to Phase 11 as optional. |
| **MS Teams OAuth** | **Not in V1.** Too heavy for initial release. Meeting prep triggers via manual "Prep This Meeting" button or optional lightweight Google Calendar read-only. Teams OAuth is Phase 11 optional. |
| **Free tier defaults** | Ship with **pre-configured free Groq + Gemini Flash + Serper keys**. Product works out of the box at ₹0 with no user setup. |
| **BYOK upgrade** | Users can add their own OpenAI/Anthropic/Groq/Gemini keys via settings. **Model selection dropdown** in UI. Bulletproof error handling (invalid key, rate limit, timeout — all graceful). |
| **Serper rate limiting** | Redis-backed rate limiter for Serper (same pattern as HubSpot Token Bucket). 2,500 queries/month hard cap on platform key, unlimited on BYOK keys. |
| **Code from GTMtool** | Lift domain logic (prompts, schemas, frameworks). Rewrite infrastructure for Whipstitch patterns (Temporal, Postgres, Instructor). Never copy-paste verbatim. |
| **Dashboard UI** | Ship with each phase. User will provide style inspirations. |
| **Trade data (Module 4)** | Excluded from core product. Optional vertical plugin later. |
| **Whisper** | Phase 11 optional. Functionality first, then nice-to-haves. |

---

## Tech Stack (Final — All ₹0)

### Already In Whipstitch
| Tool | Role |
|---|---|
| FastAPI + Python 3.11 | App server |
| Temporal (local dev) | Durable workflow orchestration |
| Redis (Docker) | Cache, locks, rate limiting |
| PostgreSQL (Docker) | State, config, audit |
| Gemini Flash (free) | LLM qualification (default) |
| Groq Llama 3.3 (free) | LLM fallback |
| Apollo (50 credits/mo) | Enrichment |
| Crawl4AI (OSS) | Web research |
| HubSpot Sandbox (free) | CRM |
| Slack Webhooks (free) | Alerting |

### Adding in New Phases
| Tool | Role | Phase | Notes |
|---|---|---|---|
| `cryptography` (Fernet) | BYOK encrypted key vault | 7 | AES-256 for user API keys |
| `tiktoken` | Token counting for cost tracking | 7 | Accurate LLM usage metering |
| `instructor` (full adoption) | Structured LLM output enforcement | 7 | Replace raw JSON parsing with Pydantic |
| `weasyprint` | HTML → PDF rendering | 7 | MEDPICC reports, Champion Notes, Battlecards |
| `PyPDF2` + `python-docx` | Document parsing for transcript uploads | 7 | Parse user-uploaded files |
| Google Serper (free 2,500/mo) | Web search for signals + profiling | 8 | **Rate-limited via Redis Token Bucket** |
| `faiss-cpu` | Vector similarity search | 9 | Signal clustering, battlecard matching |
| `sentence-transformers` | Local embeddings (`all-MiniLM-L6-v2`) | 9 | CPU-only, zero API cost |
| `rank-bm25` | Keyword relevance scoring | 9 | Extend signal noise filtering |
| SSE (`StreamingResponse`) | Real-time UI streaming | 10 | Built into FastAPI, zero cost |

### LLM Strategy
```
┌──────────────────────────────────────────────────────────┐
│  DEFAULT (Free, works out of box)                        │
│                                                          │
│  Gemini 2.0 Flash ──► Groq Llama 3.3 ──► Mock fallback  │
│  (1M context,          (fast, free           (deterministic,│
│   free tier)            tier)                  always works)│
└──────────────────────────┬───────────────────────────────┘
                           │ User adds BYOK key
                           ▼
┌──────────────────────────────────────────────────────────┐
│  BYOK UPGRADE (User's key, user's bill)                  │
│                                                          │
│  Model dropdown: GPT-4o │ Claude Sonnet │ Gemini Pro │   │
│                  GPT-4o-mini │ Llama 3.3 │ Custom       │
│                                                          │
│  Error handling:                                         │
│  • Invalid key → clear error message + revert to free    │
│  • Rate limit → queue + retry + user notification        │
│  • Timeout → fallback to next provider in chain          │
│  • Quota exceeded → alert + graceful degradation         │
│  • Network error → retry 3x with exponential backoff     │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 7: BYOK Vault + MEDPICC Deal Diagnostic

**Duration:** Days 36–50 (15 days)  
**Goal:** BYOK foundation + the single highest-value GTMtool feature.

### Phase 7A: BYOK + Multi-LLM Infrastructure (Days 36–42)

| # | Task | Details |
|---|---|---|
| 1 | **BYOK Key Vault** | Fernet-encrypted (AES-256) storage in Postgres. `user_api_keys` table: `user_id`, `provider` (openai/gemini/groq/anthropic/apollo/hubspot/serper), `encrypted_key`, `is_active`, `created_at`. Decrypt at runtime only, never log plaintext. |
| 2 | **Multi-LLM Provider Router** | `get_llm_client(tenant_id, purpose)` → checks BYOK keys first → falls back to platform free-tier. Supports: OpenAI, Gemini, Groq, Anthropic. Each call wraps with `instructor` for structured output. |
| 3 | **Model Selection Config** | Per-tenant model preferences in tenant config JSON: `{"preferred_model": "gpt-4o", "fallback_model": "gemini-flash"}`. Dropdown in UI. |
| 4 | **Error Handling Layer** | Comprehensive error handling for every LLM failure mode: `InvalidAPIKeyError`, `RateLimitError`, `QuotaExceededError`, `TimeoutError`, `ModelNotFoundError`. Each error returns a structured response to the UI with clear user-facing message + auto-fallback behavior. |
| 5 | **LLM Usage Tracking** | `llm_usage_logs` table: tokens in/out, cost estimate, model used, latency, feature (medpicc/battlecard/champion_note), tenant_id. |
| 6 | **Serper Rate Limiter** | Redis Token Bucket for Google Serper: 100 queries/day platform key (2,500/mo ÷ 25 days buffer). BYOK Serper keys bypass platform limit. |
| 7 | **BYOK Settings API** | `POST /v1/settings/api-keys` (store), `GET /v1/settings/api-keys` (list providers + status, never return key values), `DELETE /v1/settings/api-keys/{provider}` (revoke). |
| 8 | **BYOK Settings Dashboard** | New "Settings" page in dashboard: provider cards (OpenAI, Gemini, Groq, Apollo, HubSpot, Serper), text input for API key, "Connected ✓" / "Not Connected" status badges, model preference dropdown, "Test Connection" button. |
| 9 | **Alembic migration** | `0007_byok_tables`: `user_api_keys`, `llm_usage_logs` |

**What to lift from GTMtool:**
- Token/cost tracking logic from [llm_wrapper.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/6_shared_infra_and_core_utilities/llm_wrapper.py) L38-57 (pricing table) and L144-168 (cost calculation)
- Rewrite: replace MongoDB logging with Postgres `llm_usage_logs`, replace raw OpenAI calls with `instructor` + Pydantic, replace `python-decouple` with Whipstitch's `pydantic-settings`

---

### Phase 7B: MEDPICC Deal Diagnostic Engine (Days 43–50)

| # | Task | Details |
|---|---|---|
| 1 | **Transcript Upload Endpoint** | `POST /v1/deals/{deal_id}/transcript` — accepts file upload (TXT, VTT, SRT, DOCX, PDF) or raw text body. Parses using PyPDF2 (PDF), python-docx (DOCX), or plain text extraction. Stores in `deal_diagnostics.transcript_text`. |
| 2 | **MEDPICC Pydantic Models** | Instructor-enforced models: `EvidenceQuote` (person_name, date, medium, verbatim quote), `ValueSellingBox` (box name, score 0-15, evidence_quotes[], notes, missing_evidence, coaching_questions[]), `ClosureLikelihood` (if_addressed range + rationale, if_ignored range + rationale), `SellerSummary` (headline, what_we_know[], deal_risks[], next_best_actions[]), `QualificationModel` (overall score 0-100, deal_category, follow-up email, top 2 blocking boxes). |
| 3 | **MEDPICC Scoring Workflow** | `DealDiagnosticWorkflow` (Temporal). Activities: `parse_transcript_activity` → `extract_medpicc_scores_activity` → `generate_follow_up_email_activity` → `update_crm_deal_stage_activity` → `log_diagnostic_audit_activity`. |
| 4 | **Scoring Rubrics (from GTMtool)** | **Rule 1.4:** Ban demo enthusiasm, trial requests, polite sentiment from boosting scores. **Rule 3.1:** `evidence_quotes` must contain ONLY verbatim external buyer words. **Rule 6.2:** If Economic Buyer is unverified/access unproven → score hard-capped at 7/15. **Rule 10.1:** Stage Matrix maps qualification to CRM stage (Advance/Rescue/Nurture/Disqualify). |
| 5 | **Next-Best-Action Email** | Auto-draft follow-up email targeting the weakest MEDDPICC box. Subject + body stored in diagnostic record. Displayed in dashboard for rep to copy/send. |
| 6 | **CRM Deal Stage Update** | After scoring, auto-update HubSpot deal stage per Rule 10.1 Stage Matrix. Uses existing `HubSpotCRMProvider`. |
| 7 | **PDF Report Export** | WeasyPrint-rendered MEDPICC diagnostic: 8-box scores, evidence quotes, coaching questions, win probability, follow-up email. Styled HTML → downloadable PDF. |
| 8 | **Deal Health Dashboard View** | New dashboard view: MEDPICC 8-box radar/bar chart (Chart.js), evidence quotes panel with source attribution, coaching questions accordion, win probability gauge (if-addressed vs if-ignored), next-action email preview with "Copy" button, deal category badge (Advance/Rescue/Nurture/Disqualify). |
| 9 | **Alembic migration** | `0008_medpicc_tables`: `deal_diagnostics`, `medpicc_scores`, `evidence_quotes` |

**New Postgres tables:**
```sql
-- Core diagnostic record
deal_diagnostics (
  id UUID PK,
  tenant_id UUID FK → tenants,
  deal_name TEXT,
  transcript_source TEXT,          -- 'file_upload', 'text_paste'
  transcript_text TEXT,            -- Full transcript content
  overall_score INT,               -- 0-100
  deal_category TEXT,              -- 'Advance', 'Rescue', 'Nurture', 'Disqualify'
  next_best_action TEXT,
  follow_up_email_subject TEXT,
  follow_up_email_body TEXT,
  closure_if_addressed JSONB,      -- {range: "65-80%", rationale: "..."}
  closure_if_ignored JSONB,        -- {range: "15-25%", rationale: "..."}  
  top_blocking_boxes JSONB,        -- ["Economic Buyer", "Decision Process"]
  model_used TEXT,
  created_at TIMESTAMPTZ
)

-- Individual MEDDPICC box scores
medpicc_scores (
  id UUID PK,
  diagnostic_id UUID FK → deal_diagnostics,
  box_name TEXT,                   -- 'Metrics', 'Economic Buyer', etc.
  score INT,                       -- 0-15 per box
  notes TEXT,
  missing_evidence TEXT,
  coaching_questions JSONB,        -- ["Question 1", "Question 2"]
  created_at TIMESTAMPTZ
)

-- Verbatim buyer evidence
evidence_quotes (
  id UUID PK,
  score_id UUID FK → medpicc_scores,
  person_name TEXT,
  evidence_date TEXT,
  medium TEXT,                     -- 'Call', 'Email', 'Meeting'
  quote TEXT,                      -- Verbatim buyer words only
  created_at TIMESTAMPTZ
)
```

**New API endpoints:**
```
POST /v1/deals                          — Create a deal record
POST /v1/deals/{id}/transcript          — Upload transcript (file or text)
POST /v1/deals/{id}/diagnose            — Trigger MEDPICC analysis workflow
GET  /v1/deals/{id}/medpicc             — Get scores + evidence + coaching Qs
GET  /v1/deals/{id}/medpicc/pdf         — Download PDF diagnostic report
GET  /v1/deals/{id}/follow-up           — Get auto-drafted follow-up email
GET  /v1/deals                          — List deals with latest MEDPICC scores
```

**Tests:**
| Test | What It Proves |
|---|---|
| `test_byok_key_encryption.py` | Keys encrypted at rest, decrypted correctly at runtime, never logged |
| `test_multi_llm_fallback.py` | BYOK key used first → free tier fallback → mock fallback. Invalid key handled gracefully |
| `test_model_selection.py` | Tenant model preference respected, dropdown options validated |
| `test_medpicc_models.py` | Pydantic model validation: score ranges, required fields, evidence quote structure |
| `test_scoring_rubrics.py` | Rule 1.4 (no polite sentiment), Rule 3.1 (verbatim only), Rule 6.2 (EB hard cap) |
| `test_transcript_parsing.py` | PDF, DOCX, TXT, VTT all parse correctly |
| `test_deal_diagnostic_workflow.py` | Integration: upload → MEDPICC scores → follow-up email → CRM stage update |
| `test_serper_rate_limit.py` | Platform Serper calls rate-limited; BYOK keys bypass |

### Exit Criteria (Phase 7)
✅ BYOK settings page works: add/remove API keys, test connection, select preferred model.  
✅ Upload a call transcript (any format) → 8-box MEDPICC scores with verbatim buyer quotes → win probability → auto-drafted follow-up email → CRM deal stage updated → PDF downloadable.  
✅ LLM calls use BYOK key if available, free tier if not, mock fallback if all fail.  
✅ Invalid API key → clear error message, automatic fallback, no crash.  
✅ Platform cost: ₹0.

---

## Phase 8: Pre-Meeting Executive Intelligence

**Duration:** Days 51–65 (15 days)  
**Goal:** Manual or calendar-triggered meeting prep. Champion Notes with the 7-Filter Framework.

> [!NOTE]
> **V1 approach:** No MS Teams OAuth. Meetings are created manually ("Prep This Meeting" button with attendee emails + company name) OR via lightweight Google Calendar read-only API (free, simpler OAuth than Teams). Teams OAuth deferred to Phase 11.

### Build Tasks

| # | Task | Details |
|---|---|---|
| 1 | **Manual Meeting Creation** | `POST /v1/meetings` — user inputs: title, company_name, attendee_emails[], meeting_datetime, objective. No OAuth required. Stores in `meetings` table. |
| 2 | **Optional Google Calendar Sync** | Lightweight OAuth2 for Google Calendar (read-only scope). List upcoming meetings. Auto-populate attendee emails. User can opt in/out. |
| 3 | **Meeting Prep Workflow** | `MeetingPrepWorkflow` (Temporal). Activities: `extract_attendees_activity` → `lookup_crm_history_activity` → `web_research_attendees_activity` → `generate_champion_note_activity` → `generate_custom_sections_activity`. Can be triggered manually (button) or via optional calendar cron (T-15 min). |
| 4 | **7-Filter Champion Note Engine** | LLM-generated executive influence brief. 7 filters: (1) KPI Context — board targets, exec bonuses, M&A outcomes. (2) Behavioral Signal — ambition, risk appetite, decision style. (3) Time Trigger — budget deadlines, fiscal year-end, QBRs. (4) Power Structure — economic buyer vs. tech evaluator vs. blocker. (5) Vendor Bias — loyalty, fatigue with incumbents. (6) Career Narrative — how championing this advances their career. (7) Shadow Influence — hidden committee members. |
| 5 | **Psychographic Profiling** | Serper web search → public LinkedIn/bio data → LLM synthesis: communication style preferences, risk appetite, decision-making patterns, "do/don't" tips for the rep. |
| 6 | **Customizable Briefing Sections** | Per-tenant config: `meeting_prep_sections` array in tenant config JSON. Default sections: Executive Summary, Attendee Profiles, Company Context, Champion Note, Discovery Questions. Tenants can add custom prompts (e.g., "Competitor History", "Open Support Tickets"). |
| 7 | **CRM History Lookup** | Pull existing HubSpot contact/deal records for attendee emails. Show past interactions, deal stage, notes. |
| 8 | **HTML + PDF Rendering** | Champion Note as styled HTML table. Full meeting brief as downloadable PDF via WeasyPrint. |
| 9 | **Meeting Intelligence Dashboard** | New view: upcoming meetings list with prep status (Prepped ✓ / Pending), meeting card with attendee profiles + psychographic tips, champion note viewer (7-filter sections), custom sections, "Download PDF" button, "Prep This Meeting" action button. |
| 10 | **Serper Rate Limiting Integration** | All Serper calls (psychographic profiling, company research) go through the Redis Token Bucket from Phase 7. Track per-tenant usage. |

**What to lift from GTMtool:**
- 7-Filter framework prompts from [champion_note.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/champion_note.py)
- Psychographic profiling prompts from [psychographic_profile.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/psychographic_profile.py)
- Custom section architecture from [MeetingPrepCustomizable.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/MeetingPrepCustomizable.py) + [MeetingPrepCustomSection.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/MeetingPrepCustomSection.py)
- Meeting prep orchestration pattern from [meeting_prep.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/meeting_prep.py)
- HTML/PDF rendering from [sp_download_service.py](file:///c:/Users/ASUS/Downloads/GTMtool/GTMtool/2_champion_note_and_calendar_prep/sp_download_service.py)
- **Rewrite:** All MongoDB → Postgres, Celery → Temporal activities, raw OpenAI → Instructor + Pydantic, python-decouple → pydantic-settings, add Serper rate limiting

**New Postgres tables:**
```sql
meetings (
  id UUID PK,
  tenant_id UUID FK → tenants,
  title TEXT,
  company_name TEXT,
  attendee_emails JSONB,
  meeting_datetime TIMESTAMPTZ,
  objective TEXT,
  calendar_source TEXT,           -- 'manual', 'google_calendar'
  external_meeting_id TEXT,       -- Google Calendar event ID (if synced)
  prep_status TEXT,               -- 'pending', 'preparing', 'ready'
  created_at TIMESTAMPTZ
)

meeting_briefs (
  id UUID PK,
  meeting_id UUID FK → meetings,
  champion_note_html TEXT,
  champion_note_sections JSONB,   -- {kpi_context: "...", behavioral: "...", ...}
  custom_sections JSONB,
  model_used TEXT,
  generated_at TIMESTAMPTZ
)

contact_profiles (
  id UUID PK,
  tenant_id UUID FK → tenants,
  email TEXT,
  full_name TEXT,
  linkedin_url TEXT,
  company TEXT,
  title TEXT,
  psychographic_summary TEXT,
  communication_style TEXT,
  risk_appetite TEXT,
  do_tips JSONB,                  -- ["Be data-heavy", "Lead with ROI"]
  dont_tips JSONB,                -- ["Avoid high-level fluff", "Don't rush"]
  source TEXT,                    -- 'serper', 'crm', 'manual'
  created_at TIMESTAMPTZ
)

calendar_connections (
  id UUID PK,
  tenant_id UUID FK → tenants,
  provider TEXT,                  -- 'google_calendar'
  oauth_tokens_encrypted TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
```

**New API endpoints:**
```
POST /v1/meetings                       — Create meeting manually
POST /v1/meetings/{id}/prep             — Trigger meeting prep workflow
GET  /v1/meetings                       — List meetings with prep status
GET  /v1/meetings/{id}/brief            — Get generated champion note + brief
GET  /v1/meetings/{id}/brief/pdf        — Download meeting brief PDF
GET  /v1/contacts/{email}/profile       — Get psychographic profile
POST /v1/calendar/connect               — Initiate Google Calendar OAuth (optional)
GET  /v1/calendar/events                — List upcoming calendar events
```

### Exit Criteria (Phase 8)
✅ Rep enters meeting details (attendees + company) → clicks "Prep This Meeting" → 7-Filter Champion Note generated → psychographic profiles for each attendee → custom briefing sections → all visible in dashboard → PDF downloadable.  
✅ Optional Google Calendar sync auto-populates meetings (not required for functionality).  
✅ Serper calls rate-limited. BYOK Serper key bypasses platform limit.  
✅ Rep goes from "I didn't prep" to "I have a detailed executive dossier" in ~30 seconds.

---

## Phase 9: Battlecard Engine + Enhanced Signal Agent

**Duration:** Days 66–80 (15 days)

### Phase 9A: AI Battlecard Engine (Days 66–73)

| # | Task | Details |
|---|---|---|
| 1 | **Battlecard Workflow** | `GenerateBattlecardWorkflow` (Temporal). Triggered on deal creation OR manual "Generate Battlecard" button. |
| 2 | **Blackboard Engine (5 stages)** | Sequential Temporal activities, each building on previous output: `opportunity_context_activity` → `competitive_pressure_activity` → `differentiation_activity` → `engagement_strategy_activity` → `objection_rebuttal_activity` |
| 3 | **5-Section Battlecard Output** | (1) What is this opportunity? (2) Why this matters now (3) What to pitch (4) Who to engage (5) Objection rebuttals with counter-arguments |
| 4 | **Value Selling Prompters** | Per-deal discovery questions that historically win in this industry/persona combination |
| 5 | **Auto-Refresh** | When MEDPICC scores change or new signals detected → battlecard queued for refresh |
| 6 | **Battlecard Dashboard View** | Full 5-section viewer linked from deal detail. Print-friendly. "Refresh Battlecard" button |

### Phase 9B: Enhanced Signal Agent (Days 74–80)

| # | Task | Details |
|---|---|---|
| 1 | **6 Signal Collectors** | Parallel Temporal activities: Strategic (M&A, restructuring), Operating (hiring, plant openings), Technographic (tech stack changes), Financial (CAPEX, budget), Buyer Motion (RFPs, procurement), Competitive (contract expiries) |
| 2 | **FAISS Signal Clustering** | Embed signals with `all-MiniLM-L6-v2` → FAISS `IndexFlatIP` → cluster related signals into opportunity narratives |
| 3 | **News Monitoring** | Serper News API → relevance scoring → corporate event extraction → noise filtering (rate-limited) |
| 4 | **Custom Signal Rules** | Per-tenant: "Flag when a fintech account announces a funding round" → stored as trigger conditions → evaluated against incoming signals |
| 5 | **Signal Dashboard** | Live signal feed, signal-to-deal linking, custom rule editor |

**New dependencies:** `faiss-cpu`, `sentence-transformers`, `rank-bm25`

**New tables:** `battlecards`, `signals`, `signal_clusters`, `custom_signal_rules`

### Exit Criteria (Phase 9)
✅ Every deal gets an auto-generated 5-section battlecard. Battlecards auto-refresh. Signal agent discovers opportunities across 6 categories. Custom signal rules work per tenant.

---

## Phase 10: Buying Committee Expansion + Real-Time SSE

**Duration:** Days 81–92 (12 days)

| # | Task | Details |
|---|---|---|
| 1 | **Buying Committee Mapper** | Given MEDPICC scores, identify missing personas (Economic Buyer, Champion, Tech Evaluator, Coach). Auto-search for matching contacts. |
| 2 | **Persona-Aware Enrichment** | Extend existing waterfall with seniority/department/title filters per MEDDPICC role |
| 3 | **SSE Streaming** | FastAPI `StreamingResponse` → live enrichment status in dashboard: `enrichmentStarted`, `providerQueried`, `contactFound`, `enrichmentComplete` |
| 4 | **Credit Metering** | Per-tenant credit ledger. Hard caps with alerts. |
| 5 | **Buying Committee Dashboard** | Org chart visualization, persona-gap indicators, SSE progress bar |

**New tables:** `buying_committees`, `credit_ledger`

### Exit Criteria (Phase 10)
✅ MEDPICC identifies "Economic Buyer missing" → auto-search finds VP/C-level contacts → SSE streams live progress → contacts mapped to personas → credits tracked.

---

## Phase 11: Analytics + Optional Enhancements + Production Hardening

**Duration:** Days 93–105 (13 days)

| # | Task | Priority |
|---|---|---|
| 1 | Pipeline Analytics Engine (conversion funnel, time-in-stage) | P0 |
| 2 | Win/Loss Pattern Analysis (FAISS-powered historical pattern matching) | P0 |
| 3 | LLM Cost Dashboard (per-tenant token usage, cost breakdown by feature) | P0 |
| 4 | Webhook Delivery (notify external systems on events) | P1 |
| 5 | Production load test with full feature stack | P0 |
| 6 | BYOK Onboarding Wizard (guided setup flow) | P1 |
| 7 | **Optional: Faster Whisper** local transcription (audio upload → text) | P2 |
| 8 | **Optional: MS Teams OAuth** calendar integration | P2 |
| 9 | **Optional: SEC 10-K Filing Ingestion** (Map-Reduce chunking) | P2 |

---

## Full Dashboard Views (Running Total)

| Phase | View | Key Components |
|---|---|---|
| 5 (done) | Executive Dashboard | KPI cards, Chart.js throughput, execution log |
| 5 (done) | Inbound Leads | High-density grid, score badges, lead detail drawer |
| 5 (done) | Outbound Queue | Prospect cards, approve/reject buttons |
| 5 (done) | Tenant Config | ICP sliders, waterfall reorder, SLA controls |
| 5 (done) | Pipeline Analytics | Conversion funnel, SLA compliance |
| **7** | **BYOK Settings** | API key cards, connection status, model dropdown, "Test Connection" |
| **7** | **Deal Health** | MEDPICC radar chart, evidence quotes, coaching Qs, win probability, follow-up email |
| **8** | **Meeting Intelligence** | Upcoming meetings, champion note cards, psychographic profiles, PDF download |
| **9** | **Battlecards** | 5-section viewer, refresh button, linked from deal detail |
| **9** | **Signal Feed** | Live signal stream, custom rule editor, signal-to-deal links |
| **10** | **Buying Committee** | Org chart, persona gaps, SSE enrichment progress bar, credit balance |
| **11** | **Analytics+** | Win/loss patterns, LLM cost breakdown, onboarding wizard |

---

## Summary Timeline

```
Phase 7   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ Days 36-50   BYOK + MEDPICC
Phase 8   │               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ Days 51-65   Meeting Intelligence
Phase 9   │                               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ Days 66-80   Battlecards + Signals
Phase 10  │                                               ▓▓▓▓▓▓▓▓▓▓▓▓│ Days 81-92   Contacts + SSE
Phase 11  │                                                            ▓▓▓▓▓▓▓▓▓▓▓▓▓│ Days 93-105  Analytics + Harden
```

**After Phase 11, Whipstitch is:**
- A full-lifecycle GTM engine (lead → deal → meeting → win)
- Running at ₹0 platform cost (BYOK model)
- 12+ dashboard views
- 50+ automated tests
- Production-hardened and demo-ready

> [!IMPORTANT]
> **Ready to execute.** Phase 7A (BYOK infrastructure) is the foundation everything else depends on. On your approval, I'll create the task checklist and start with the BYOK vault + Multi-LLM provider router.
