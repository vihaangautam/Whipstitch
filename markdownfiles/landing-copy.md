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
| Headline | The sales ***research team*** you don't have. | ≤ 9 words reads best at this size. Direction A selected for broad alignment with founder-led/agency sales. |
| Sub­head | Tell Whipstitch what you sell and who buys it. It finds companies hiring in your category, drafts the first message, scores your deals from call recordings, and briefs you before each meeting. You approve everything. | ≤ 45 words. Explains the 4 engines without SDR jargon and highlights the review gate. |
| Primary button | Get started | |
| Secondary button | See what it produces → jumps to the engine row | |
| Fine print | No credit card. Use the free model tiers, or bring your own keys. | Clear, immediate parse. |

### Hero rewrite — evaluated directions

Target audience: agencies, freelancers, and service businesses doing founder-led sales ("selling between delivering client work").

**A — the unifying idea (Shipped)**
> Headline: The sales ***research team*** you don't have.
> Sub: Tell Whipstitch what you sell and who buys it. It finds companies hiring in your category, drafts the first message, scores your deals from call recordings, and briefs you before each meeting. You approve everything.

**B — name the audience directly**
> Headline: Sales prep for people who **also do the work**.
> Sub: Whipstitch handles the research behind the deal — who to contact, what to open with, where the deal is weak, what to ask on the next call — so selling doesn't eat the day you needed for client work.

**C — plainest**
> Headline: Everything you'd do before a sales call, **already done**.
> Sub: Point Whipstitch at your ICP once. It surfaces companies worth contacting, drafts the outreach, turns call recordings into deal scorecards, and writes a battlecard for every competitor you run into.

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
| Heading | It drafts. **You** send. |
| Sub | Four things Whipstitch produces from your setup. Nothing leaves your workspace until you approve it. |
| Layout | Static 2×2 grid. No motion, no interaction copy — a visitor scans all four at once. |

Four cards. Each: **name**, one line, a small preview.

| Card | One-liner | Preview shows |
|---|---|---|
| Outbound Queue | A first message to a company that just started hiring in your category. | Northwind Retail · Priya Shah, Head of Growth · "Draft ready" · 2-line message snippet |
| Deal Health | A MEDDPICC scorecard, scored from what the buyer actually said. | CloudCube · Rescue 59/100 · 8-box grid (Metrics 13/15, Buyer 6/15, Criteria 8/10, Process 5/10, Paper 4/10, Pain 12/15, Champion 7/15, Rival 4/10) |
| Competitor Playbooks | A battlecard for each rival you keep losing to. | vs. Directive Consulting · "Does a senior person review the work, or does it queue behind twenty other accounts?" |
| Call Prep | A briefing for every meeting on your calendar. | FinTech Scale · Thu 10:00 · three questions to ask on the call |

---

## 4b. A closer look (Production Suite)

Two alternating deep-dive rows: one real product surface per row, prose beside it.

| Slot | Current |
|---|---|
| Heading | The two you'll use on **every deal**. |
| Row 1 — Deal Health | *A scorecard that won't flatter you.* Paste a call recording. Whipstitch reads it and fills in an eight-box MEDDPICC scorecard, and every box moves only on something the buyer actually said — a verbatim line you can click through to. Enthusiasm in a demo doesn't count. Economic Buyer and Champion stay capped until you have real access, so a deal that looks warm on the surface still reads as the rescue it is. |
| Row 2 — Competitor Playbooks | *Know the counter before they bring it up.* Whipstitch reads your company profile, works out who you actually lose deals to, and writes a battlecard for each one. Not a feature grid — the claim the rival makes, the question that turns it against them, and a line you can say back. Written for the deal in front of you, not a category. |

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
| Which call recording formats work? | Pasted text, WebVTT and SRT subtitle files, Word documents, and PDFs. |
| Is my data used for training? | No. Each workspace is an isolated tenant, and conversation data is never sent to a model for training. |

---

## 8. Closing CTA (dark gradient card)

| Slot | Current |
|---|---|
| Heading | Set up a workspace. See what the engines produce against your **own ICP**. |
| Body | Register, answer a few questions about what you sell, and the engines start producing — outbound, scorecards, battlecards and briefings. |
| Primary button | Get started |
| Secondary button | Sign in |
| Fine print | No credit card. Use the free model tiers, or bring your own keys. Cancel anytime. |

---

## 9. Footer

| Slot | Current |
|---|---|
| Tagline | The sales research team you don't have — generated, and staged for your review. |
| Status pill | Workflow engine operational |
| Column "What it produces" | Outbound Queue · Deal Health · Competitor Playbooks · Call Prep |
| Column "Under the hood" (mono) | ICP & logic studio · Gemini + Groq router · Redis idempotency lock · AES-256 key vault · API docs |
| Mini-card | **Set up a workspace** — A few questions about what you sell, then the engines run against your ICP. → Get started |
| Legal row | © 2026 Whipstitch. All rights reserved. · Privacy Policy · Terms of Service · Security Architecture |

Legal page content lives in `frontend/src/pages/LegalDoc.jsx`.
