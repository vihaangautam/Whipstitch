import React, { useState } from 'react';
import {
  ArrowRight,
  Inbox,
  Rocket,
  ShieldCheck,
  Swords,
  CalendarClock,
  KeyRound,
  SlidersHorizontal,
  Activity,
  Zap,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

/* Brand mark — same two-stroke "stitch" used in the app header */
function Mark({ className = 'w-7 h-7' }) {
  return (
    <div className={`${className} rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12l8 8 8-8" className="stroke-emerald-400" />
        <path d="M4 6l8 8 8-8" className="stroke-blue-400" />
      </svg>
    </div>
  );
}

const STEPS = [
  { n: '01', title: 'Set up your workspace', desc: 'A short guided setup captures what your company sells and who you sell to. Everything downstream is generated from it.' },
  { n: '02', title: 'Connect keys (optional)', desc: 'Bring your own Gemini, Groq, Serper, Apollo or HubSpot keys. Free tiers run the AI and research out of the box.' },
  { n: '03', title: 'Run the engines', desc: 'Discover outbound accounts, generate competitor battlecards, score deals from call transcripts, prep for meetings.' },
  { n: '04', title: 'Review and act', desc: 'Every AI output is staged for a human. Approve, copy the script, push to CRM — you stay in control.' },
];

const CAPABILITIES = [
  {
    icon: SlidersHorizontal,
    badge: 'Workspace',
    title: 'Configured for your company',
    desc: 'Onboarding captures your company description, offering, ICP industries, geographies and target buyer titles. Battlecards, briefings and outbound all read from it — no generic templates.',
  },
  {
    icon: Inbox,
    badge: 'Inbound',
    title: 'Durable lead ingestion + waterfall enrichment',
    desc: 'Idempotent webhook processing (Redis atomic lock, Postgres backstop), then a provider cascade — Apollo → PeopleDataLabs → Hunter → Crawl4AI → LLM — ending in a 3-part Observation · Link · Ask outreach draft.',
  },
  {
    icon: Rocket,
    badge: 'Outbound',
    title: 'Hiring-signal discovery, no paid data required',
    desc: 'Finds companies actively hiring for the roles your buyers hire when they have budget in your category, resolves the decision-maker, and stages a structured draft for one-click approval. Uses Apollo org search when you connect a key.',
  },
  {
    icon: ShieldCheck,
    badge: 'Deal Health',
    title: 'Evidence-based MEDDPICC diagnostic',
    desc: 'Paste a call transcript (.txt, .vtt, .srt, .docx, .pdf) and get an 8-box scorecard with verbatim buyer quotes. Positive sentiment can’t raise scores — Economic Buyer and Champion are hard-capped without verified access.',
  },
  {
    icon: Swords,
    badge: 'Competitor Playbooks',
    title: 'Battlecards written for your real rivals',
    desc: 'The AI reads your profile, works out who you actually lose deals to, and writes a battlecard for each: the trap they set, the Socratic counter, word-for-word soundbites, an objection cheat sheet and a 5-stage deal strategy.',
  },
  {
    icon: CalendarClock,
    badge: 'Call Prep',
    title: 'Pre-call briefing + champion selling kit',
    desc: 'Per meeting: attendee psychographics and hooks, three discovery questions targeting your weakest MEDDPICC gaps, live company signals, and a 7-filter kit your champion uses in the closed-door buying meeting.',
  },
  {
    icon: Zap,
    badge: 'Signals',
    title: 'On-demand buying-signal scan',
    desc: 'Sweeps your pipeline accounts for recent leadership moves, funding, expansion and churn news, classifies each into a revenue trigger, and pairs it with a ready outreach hook.',
  },
  {
    icon: KeyRound,
    badge: 'Security · BYOK',
    title: 'Bring your own keys, zero markup',
    desc: 'API keys for Gemini, Groq, Serper, Apollo and HubSpot are encrypted at rest with AES-256 Fernet and decrypted in memory only during a workflow. Credit hard-caps prevent surprise spend.',
  },
];

const FAQS = [
  {
    q: 'Which models power the AI generation?',
    a: 'Google Gemini Flash and Groq (OpenAI gpt-oss) by default, with a deterministic template fallback so nothing breaks if a provider is unreachable. Add your own keys in the vault to use them instead — Whipstitch never resells or marks up third-party APIs.',
  },
  {
    q: 'Do I need to pay for anything to try it?',
    a: 'No. The free tiers of Gemini, Groq and Serper cover AI generation and web research. Outbound falls back to free hiring-signal discovery when no Apollo key is present. Apollo org search and HubSpot CRM writes need your own keys.',
  },
  {
    q: 'How does the diagnostic avoid false optimism?',
    a: 'Scores only rise when verbatim buyer evidence exists in the transcript. Demo enthusiasm, polite curiosity and positive tone are explicitly banned from raising a box. Economic Buyer and Champion are hard-capped until direct access or an internal selling action is verified.',
  },
  {
    q: 'Is each workspace isolated?',
    a: 'Yes. Registering with a company name provisions an isolated tenant. Battlecards, meetings, deals, prospects and config are all scoped to it, and every AI prompt is built from that workspace’s onboarding answers.',
  },
  {
    q: 'What runs the pipeline?',
    a: 'Temporal workflows orchestrate the multi-step sagas (enrichment, outbound, diagnostics, meeting prep) with retries and idempotency. When a Temporal worker isn’t running, the same activities execute inline so the product still works end to end.',
  },
];

export default function LandingPage({ setCurrentView }) {
  const [openFaq, setOpenFaq] = useState(null);
  const start = () => setCurrentView('dashboard');

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-sans flex flex-col items-center">

      {/* ── Hero ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          GTM engine for small B2B sales teams
        </div>

        <h1 className="mt-6 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Prospect, qualify and prep for the call —<br className="hidden sm:block" />
          all from what your company actually sells.
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whipstitch reads your workspace setup once, then generates real work: outbound accounts hiring for your
          category, competitor battlecards for the rivals you lose to, MEDDPICC scores from your call transcripts,
          and a briefing before every meeting.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={start} className="btn-primary px-5 py-2.5 text-sm">
            <span>Get started free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a href="#engine" className="btn-secondary px-5 py-2.5 text-sm">
            <span>See how it works</span>
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          {['No credit card', 'Free-tier AI included', 'Bring your own keys'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="engine" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">From setup to real usage in four steps</h2>
          <p className="text-xs text-slate-500 mt-1">Every step produces something a rep can act on the same day.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 hover:shadow-card-hover transition space-y-2"
            >
              <span className="text-xs font-extrabold text-emerald-700 font-mono tracking-tight">{s.n}</span>
              <h3 className="font-bold text-sm text-slate-900">{s.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section id="features" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">One workspace, eight engines</h2>
          <p className="text-xs text-slate-500 mt-1">Built on Temporal, FastAPI, PostgreSQL and Redis for distributed reliability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card hover:border-slate-300 hover:shadow-card-hover transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg border bg-slate-100 border-slate-200 text-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    {c.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Lifecycle strip ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold text-emerald-800">System mechanics</span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">The orchestration lifecycle</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            {[
              ['Ingest', 'Idempotent webhooks', 'Redis atomic lock + SHA-256 keys guarantee exactly-once processing.'],
              ['Discover & enrich', 'Waterfall cascade', 'Apollo · PDL · Hunter · Crawl4AI · Serper hiring signals · LLM synthesis.'],
              ['Reason', 'AI generation', 'Gemini / Groq write battlecards, MEDDPICC scores, briefings — schema-validated.'],
              ['Stage', 'Human-in-the-loop', 'Prospects, drafts, scores and CRM updates all wait for a rep to approve.'],
            ].map(([step, name, desc], i) => (
              <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs text-slate-500 font-bold">Step {i + 1} &bull; {step}</div>
                <div className="font-semibold text-slate-900">{name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200 space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Frequently asked questions</h2>
          <p className="text-xs text-slate-500 mt-1">How the platform actually works.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 border-t border-slate-200">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 text-center shadow-modal">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Set up your workspace in a couple of minutes</h2>
          <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto">
            Register, answer a few questions about what you sell, and the engines are ready to run against your ICP.
          </p>
          <button
            onClick={start}
            className="mt-6 inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <span>Create your workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Mark className="w-5 h-5" />
            <span className="font-semibold text-slate-900">Whipstitch</span>
            <span>&bull;</span>
            <span>B2B GTM &amp; Deal Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-slate-900 transition">Privacy Policy</button>
            <span>&bull;</span>
            <button onClick={() => setCurrentView('terms')} className="hover:text-slate-900 transition">Terms &amp; Conditions</button>
            <span>&bull;</span>
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition inline-flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
