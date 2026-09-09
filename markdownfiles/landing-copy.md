# Whipstitch landing page — all copy

Every user-facing string on `frontend/src/pages/LandingPage.jsx`, in page order.
Edit the text here, hand it back, and it goes into the component verbatim.

**Type convention:** headings are Plus Jakarta Sans, weight 300, with the key
phrase wrapped in weight 800. In the tables below that phrase is written in
**bold**. Keep one bold phrase per heading.

---

## 1. Nav

| Slot | Current |
|---|---|
| Wordmark | Whipstitch |
| Link 1 | What it produces → jumps to the engine row |
| Link 2 | Under the hood → jumps to the infrastructure list |
| Link 3 | Questions → jumps to the FAQ |
| Button (ghost) | Sign in |
| Button (solid) | Get started |

---

## 2. Hero

| Slot | Current | Notes |
|---|---|---|
| Headline | The sales work between a **signal** and a **booked call**. | ≤ 9 words reads best at this size. Two bold phrases here is an exception; one is the norm. |
| Sub­head | Set up your workspace once. Whipstitch then finds accounts hiring for your category, scores your deals from call transcripts, writes battlecards for the rivals you lose to, and briefs you before every meeting. | ≤ 45 words. This is the "what is this" line — the most important thing for a new visitor. |
| Primary button | Get started | |
| Secondary button | See what it produces → jumps to the engine row | |
| Fine print | Free-tier AI included. No credit card. Bring your own keys. | |

### Hero rewrite — candidates

Pick one, or write your own. Goal: a first-time visitor understands what
Whipstitch *is* and *who it's for* within two lines.

**A — plain**
> Headline: The busywork between a **signal** and a **booked call**.
> Sub: Whipstitch watches for companies moving into your market, then drafts
> the outreach, scores the deal from your call, and briefs you for the next
> meeting. You review everything before it goes anywhere.

**B — role-first**
> Headline: For reps who'd rather **sell** than research.
> Sub: Point Whipstitch at your ICP once. It finds accounts worth chasing,
> writes the first message, turns call transcripts into MEDDPICC scorecards,
> and hands you a battlecard for every competitor — all staged for your review.

**C — outcome-first**
> Headline: Show up to every call **already prepared**.
> Sub: Whipstitch turns raw market signals into reviewed outbound, deal
> scorecards, competitor battlecards, and pre-call briefings — generated from
> your own ICP, not a template.

---

## 3. Product shot (laptop)

Non-editable UI mock. The two floating cards read:

| Card | Text |
|---|---|
| Left | **call prep** — FinTech Scale, Thursday 10:00. Series A closed, scaling 2 to 8 SDRs. Ask who signs off on the CAC payback threshold. |
| Right | **deal health** — CloudCube dropped to 59. Economic Buyer capped at 6/15 — the founder signs, and no one has spoken to them. |

The mock dashboard also contains: KPI tiles (Inbound this week 142, SLA
compliance 100%, Avg lead score 84, Outbound staged 18), an event stream, and
an outbound queue table (Northwind Retail / CloudCube / FinTech Scale /
Harborline Logistics / Bright Meridian).

---

## 4. Engine row ("What it produces")

| Slot | Current |
|---|---|
| Heading | Four engines that produce **work you can send**. |
| Sub | Every engine drafts. You review, then it goes out. Hover the row to pause it. |

Four cards. Each: **name**, one line, a small preview.

| Card | One-liner | Preview shows |
|---|---|---|
| Outbound Queue | A first message to a company that's hiring in your space. | Northwind Retail · Priya Shah, Head of Growth · "Draft ready" · 2-line message snippet |
| Deal Health | A MEDDPICC scorecard, scored from your call transcript. | CloudCube · Rescue 59/100 · 8-box grid (Metrics 13/15, Buyer 6/15, Criteria 8/10, Process 5/10, Paper 4/10, Pain 12/15, Champion 7/15, Rival 4/10) |
| Competitor Playbooks | A battlecard for every rival you lose deals to. | vs. Directive Consulting · "Does a senior person review the work, or does it queue behind twenty other accounts?" |
| Call Prep | A briefing before every meeting on your calendar. | FinTech Scale · Thu 10:00 · three questions to ask on the call |

---

## 5. Infrastructure ("Under the hood")

| Slot | Current |
|---|---|
| Heading | The **infrastructure** underneath |

| Item | Body |
|---|---|
| Logic & ICP Studio | One place to set your offering, industries, geographies and buyer titles. Every engine reads from it. |
| Inbound Pipeline | Webhook ingestion behind a Redis lock, then a provider waterfall ending in a drafted reply. |
| BYOK Vault | Your Gemini, Groq, Serper, Apollo and HubSpot keys, encrypted at rest, decrypted only mid-workflow. |
| Pipeline Analytics | Conversion funnel, SLA compliance, and where the enrichment waterfall drops leads. |

---

## 6. Architecture (dark section)

| Slot | Current |
|---|---|
| Heading | Sales AI can't **fail silently**. |
| Para 1 | Whipstitch runs its multi-step work as durable Temporal workflows. If a provider rate-limits in the middle of enrichment, execution resumes on a fallback rather than leaving a deal half-processed. Duplicate webhooks and retries hit a Redis lock, so nothing runs twice or double-charges a credit. |
| Para 2 | Every model response is validated against a schema before you see it. When the model gets it wrong, the deterministic template takes over. You never get an empty page or a malformed card. |
| Para 3 | Secrets, keys, battlecards, deals and prospects are scoped to your workspace, and every prompt is built from your own onboarding answers — not a shared template. |

---

## 7. FAQ

| Slot | Current |
|---|---|
| Heading | Common **questions** |

| Question | Answer |
|---|---|
| Which models run the generation? | Gemini Flash and Groq by default, with a deterministic template as a last resort so nothing ever comes back empty. Add your own keys in the vault to use them instead — nothing is resold or marked up. |
| What does it cost to try? | Nothing. The free tiers of Gemini, Groq and Serper cover generation and research. Outbound falls back to free hiring-signal discovery when there is no Apollo key. Apollo org search and HubSpot writes need your own keys. |
| How does the scorecard avoid false optimism? | A box only moves when there is a verbatim buyer quote behind it. Demo enthusiasm and polite curiosity are explicitly barred from raising a score, and Economic Buyer and Champion stay capped until direct access is confirmed. |
| Which transcript formats work? | Pasted text, WebVTT and SRT subtitle files, Word documents, and PDFs. |
| Is my data used for training? | No. Each workspace is an isolated tenant, and conversation data is never sent to a model for training. |

---

## 8. Closing CTA (dark gradient card)

| Slot | Current |
|---|---|
| Heading | Turn raw signals into **closed revenue**. |
| Body | Register, answer a few questions about what you sell, and the engines start producing against your ICP — outbound, scorecards, battlecards and briefings. |
| Primary button | Get started |
| Secondary button | Sign in |
| Fine print | No token markup. Free-tier AI included. Cancel anytime. |

---

## 9. Footer

| Slot | Current |
|---|---|
| Tagline | The sales work between a signal and a booked call — generated, and staged for your review. |
| Status pill | Workflow engine operational |
| Column "What it produces" | Outbound Queue · Deal Health · Competitor Playbooks · Call Prep |
| Column "Under the hood" (mono) | ICP & logic studio · Gemini + Groq router · Redis idempotency lock · AES-256 key vault · API docs |
| Mini-card | **Set up a workspace** — A few questions about what you sell, then the engines run against your ICP. → Get started |
| Legal row | © 2026 Whipstitch. All rights reserved. · Privacy Policy · Terms of Service · Security Architecture |

Legal page content lives in `frontend/src/pages/LegalDoc.jsx`.
