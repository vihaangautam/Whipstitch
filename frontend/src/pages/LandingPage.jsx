import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Inbox,
  Rocket,
  ShieldCheck,
  Swords,
  CalendarClock,
  KeyRound,
  SlidersHorizontal,
  BarChart3,
  GitBranch,
  Lock,
  Boxes,
} from 'lucide-react';
import Reveal from '../components/Reveal';

/* ── Brand mark ─────────────────────────────────────────────── */
function Mark({ className = 'w-8 h-8' }) {
  return (
    <div className={`${className} rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-md shadow-slate-900/10`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12l8 8 8-8" className="stroke-emerald-400" />
        <path d="M4 6l8 8 8-8" className="stroke-violet-400" />
      </svg>
    </div>
  );
}

/* ── Content ────────────────────────────────────────────────── */
const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#engines', label: 'Engines' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#faq', label: 'FAQ' },
];

const STEPS = [
  { n: '01', t: 'Set up your workspace', d: 'A short guided setup captures what your company sells, your offering, and your ideal customer. Every engine reads from it.' },
  { n: '02', t: 'Connect keys — optional', d: 'Bring your own Gemini, Groq, Serper, Apollo or HubSpot keys. The free tiers run the AI and research out of the box.' },
  { n: '03', t: 'Run the engines', d: 'Discover outbound accounts, generate competitor battlecards, score deals from transcripts, prep for every meeting.' },
  { n: '04', t: 'Review and act', d: 'Every AI output is staged for a human. Approve it, copy the script, push it to CRM — you stay in control.' },
];

const ENGINES = [
  { n: '01', icon: SlidersHorizontal, tag: 'Workspace', t: 'Logic & ICP Studio', d: 'The configuration core — offering, target industries, geographies, buyer titles, disqualification rules. Change it here and everything downstream follows.' },
  { n: '02', icon: Inbox, tag: 'Inbound', t: 'Inbound Pipeline', d: 'Idempotent webhook ingestion behind a Redis atomic lock, then a provider waterfall ending in a three-part outreach draft.' },
  { n: '03', icon: Rocket, tag: 'Outbound', t: 'Outbound Queue', d: 'Finds companies hiring the roles your buyers hire when they have budget in your category, resolves the decision-maker, stages a draft for approval.' },
  { n: '04', icon: ShieldCheck, tag: 'Deal Health', t: 'Deal Health & Risks', d: 'Paste a call transcript and get an 8-box MEDDPICC scorecard with verbatim buyer quotes. Positive sentiment can never raise a score.' },
  { n: '05', icon: Swords, tag: 'Playbooks', t: 'Competitor Playbooks', d: 'The AI works out who you actually lose deals to and writes a battlecard for each — the trap, the Socratic counter, the word-for-word soundbite.' },
  { n: '06', icon: CalendarClock, tag: 'Call Prep', t: 'Call Prep & Meetings', d: 'Per meeting: attendee psychographics, three discovery questions targeting your weakest gaps, and a seven-filter champion selling kit.' },
  { n: '07', icon: KeyRound, tag: 'Security', t: 'BYOK Key Vault', d: 'API keys encrypted at rest with AES-256 Fernet, decrypted in memory only during a workflow. Credit hard-caps prevent surprise spend. Zero markup.' },
  { n: '08', icon: BarChart3, tag: 'Analytics', t: 'Pipeline Analytics', d: 'Conversion funnel, SLA compliance, and enrichment-waterfall drop-off — tracked per workspace.' },
];

const ARCH = [
  { icon: GitBranch, t: 'Multi-LLM router', d: 'Structured calls try Gemini Flash, then Groq, then a deterministic template. Every response is validated against a JSON schema before it reaches you.' },
  { icon: Lock, t: 'Idempotent by design', d: 'Redis atomic locks and SHA-256 keys mean a duplicate webhook or a retry never double-charges enrichment or fires the same draft twice.' },
  { icon: Boxes, t: 'Per-workspace isolation', d: 'Secrets, keys, battlecards, deals and prospects are scoped to a tenant. Every AI prompt is built from that workspace’s own onboarding answers.' },
];

const FAQS = [
  { q: 'Which models power the AI generation?', a: 'Google Gemini Flash and Groq by default, with a deterministic template fallback so nothing breaks if a provider is unreachable. Add your own keys in the vault to use them instead — Whipstitch never resells or marks up third-party APIs.' },
  { q: 'Do I need to pay for anything to try it?', a: 'No. The free tiers of Gemini, Groq and Serper cover AI generation and web research. Outbound falls back to free hiring-signal discovery when no Apollo key is present. Apollo org search and HubSpot CRM writes need your own keys.' },
  { q: 'How does the diagnostic avoid false optimism?', a: 'Scores only rise when verbatim buyer evidence exists in the transcript. Demo enthusiasm, polite curiosity and a positive tone are explicitly banned from raising a box. Economic Buyer and Champion are hard-capped until direct access is verified.' },
  { q: 'What transcript formats are supported?', a: 'Raw text paste, WebVTT (.vtt) and SRT (.srt) subtitle exports with timestamp stripping, Microsoft Word (.docx), and multi-page PDF.' },
  { q: 'Is each workspace isolated?', a: 'Yes. Registering with a company name provisions an isolated tenant. Battlecards, meetings, deals, prospects and config are all scoped to it, and conversation data is never used to train a model.' },
];

/* ── Laptop screen mock (built from real dashboard components) ── */
function ScreenMock() {
  return (
    <div className="bg-[#FAF9F6] text-left font-sans select-none">
      {/* app chrome */}
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="hidden sm:flex items-center gap-2 text-slate-500 ml-1">
            <span className="font-semibold text-slate-800">Whipstitch</span>
            <span className="text-slate-300">/</span>
            <span>Executive Dashboard</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Workspace active
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* KPI ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            ['Inbound leads', '142', 'text-slate-900', '+28% this week'],
            ['SLA compliance', '100%', 'text-emerald-600', '15-min target'],
            ['Avg lead score', '84', 'text-violet-700', 'Tier 1 fit'],
            ['Outbound staged', '18', 'text-slate-900', 'Awaiting review'],
          ].map(([label, val, color, sub]) => (
            <div key={label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-card">
              <div className="text-[11px] text-slate-500">{label}</div>
              <div className={`text-xl font-extrabold mt-0.5 ${color}`}>{val}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* telemetry curve */}
          <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Inbound vs. outbound, last 7 days</span>
              <div className="flex items-center gap-2.5 text-[10px] text-slate-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Inbound</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-600" /> Outbound</span>
              </div>
            </div>
            <div className="relative h-32 w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 140">
                <defs>
                  <linearGradient id="lpV" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,110 C70,105 120,95 180,80 C240,65 300,35 400,15 L400,140 L0,140 Z" fill="url(#lpV)" />
                <path d="M0,110 C70,105 120,95 180,80 C240,65 300,35 400,15" fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
                <path d="M0,122 C80,116 150,110 220,96 C290,82 340,60 400,44" fill="none" stroke="#10B981" strokeDasharray="4 4" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 pt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((d) => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* calendar dossier */}
          <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900">Pre-call dossier</span>
              <span className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Ready</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">FinTech Scale — Executive review</span>
                <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Tier 1</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug bg-white p-1.5 rounded border border-slate-200">
                “What’s your fallback when Apollo rate-limits outbound?”
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-violet-600 text-white flex items-center justify-center text-[10px]">⚡</span>
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block">Hiring spike — Northwind</span>
                  <span className="text-[9px] text-slate-500">Growth & RevOps roles open</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-violet-700 bg-white px-1.5 py-0.5 rounded border border-violet-100">Staged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function LandingPage({ onPrimary, onSignIn }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const primary = onPrimary || (() => {});
  const signIn = onSignIn || primary;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="w-full bg-[#FAF9F6] text-slate-950 font-sans">
      {/* ── Floating pill nav ── */}
      <div className="sticky top-4 z-40 px-4">
        <nav
          className={`max-w-5xl mx-auto rounded-full border px-4 sm:px-5 py-2.5 flex items-center justify-between transition-all duration-200 ${
            scrolled
              ? 'glass-panel border-slate-200/80 shadow-glass'
              : 'bg-white/60 border-slate-200/60 shadow-sm'
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5 group">
            <Mark className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="text-base font-extrabold tracking-tight">Whipstitch</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-slate-950 transition-colors">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={signIn} className="text-xs font-semibold text-slate-700 hover:text-slate-950 px-3 py-2 transition-colors">
              Sign in
            </button>
            <button
              onClick={primary}
              className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-sm transition-all group"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </nav>
      </div>

      <main id="top">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-14 sm:pt-20 pb-24 md:pb-32">
          <div className="absolute inset-0 -z-10 flex justify-center pointer-events-none">
            <div className="w-[1000px] h-[720px] landing-aura rounded-full blur-3xl opacity-80" />
          </div>

          <div className="max-w-5xl mx-auto px-6 text-center">
            <Reveal className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              A GTM engine for small B2B sales teams
            </Reveal>

            <Reveal as="h1" delay={60} className="mt-7 text-4xl sm:text-6xl lg:text-[4.2rem] font-light tracking-[-0.035em] leading-[1.08] max-w-3xl mx-auto text-balance">
              Prospect, qualify and prep for the call —{' '}
              <span className="font-extrabold italic">from what your company actually sells.</span>
            </Reveal>

            <Reveal as="p" delay={120} className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto text-balance">
              Whipstitch reads your workspace setup once, then generates real work: outbound accounts hiring for your
              category, competitor battlecards for the rivals you lose to, MEDDPICC scores from your call transcripts,
              and a briefing before every meeting.
            </Reveal>

            <Reveal delay={180} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button onClick={primary} className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-sm transition-all group">
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a href="#how" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold px-6 py-3.5 rounded-full border border-slate-200 shadow-sm transition-all">
                See how it works
              </a>
            </Reveal>

            <Reveal delay={240} className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
              {['No credit card', 'Free-tier AI included', 'Bring your own keys'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* ── Laptop mock ── */}
          <div className="mt-16 relative max-w-5xl mx-auto px-4">
            <div className="absolute -inset-6 bg-gradient-to-r from-violet-500/15 via-blue-500/10 to-emerald-500/15 rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

            <div className="relative mx-auto max-w-3xl">
              <Reveal className="laptop-reveal">
                {/* lid + screen */}
                <div className="relative rounded-t-2xl sm:rounded-t-[26px] border-[10px] sm:border-[12px] border-slate-900 bg-slate-950 shadow-2xl shadow-slate-950/30 overflow-hidden">
                  <div className="rounded-t-lg sm:rounded-t-xl overflow-hidden border-b border-slate-200">
                    <ScreenMock />
                  </div>
                </div>
                {/* base */}
                <div className="relative mx-auto -mt-px w-[104%] -left-[2%] h-4 sm:h-5 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 rounded-b-xl sm:rounded-b-2xl shadow-xl flex items-start justify-center">
                  <div className="w-20 h-1.5 bg-slate-950/70 rounded-b-md" />
                </div>
                <div className="mx-auto w-[86%] h-5 bg-slate-950/15 blur-lg rounded-full mt-1" />
              </Reveal>

              {/* floating callout — left */}
              <Reveal delay={220} className="absolute -bottom-4 -left-3 md:-left-16 z-20 w-64 sm:w-72 glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-2xl hidden sm:block">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-950 text-emerald-400 flex items-center justify-center text-[11px] font-bold">AI</span>
                    <span className="text-xs font-bold text-slate-900">Pre-call dossier</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">Resolved</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mt-2">
                  Scaling from 2 to 8 SDRs after a Series A. Evaluating Apollo and Clari.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium pt-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Pitching: growth retainer</span>
                  <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-800">Waterfall-enriched</span>
                </div>
              </Reveal>

              {/* floating callout — right */}
              <Reveal delay={340} className="absolute -top-8 -right-3 md:-right-14 z-20 w-64 sm:w-72 glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-2xl hidden sm:block">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-[11px]">✦</div>
                    <span className="text-xs font-bold text-slate-900">Live call prep</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">You ask</span>
                    What’s their pipeline bottleneck?
                  </div>
                  <div className="bg-violet-50 p-2 rounded-lg text-slate-700 border border-violet-100">
                    <span className="block text-[9px] uppercase tracking-wider text-violet-700 font-bold mb-0.5">Whipstitch</span>
                    SDR outbound is hitting daily caps; the VP Sales seat is open; CAC payback needs board sign-off.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="max-w-6xl mx-auto px-6 py-20 sm:py-24 border-t border-slate-200">
          <Reveal className="max-w-xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-light tracking-[-0.03em]">
              From setup to real usage in <span className="font-extrabold">four steps</span>
            </h2>
            <p className="text-sm text-slate-600 mt-3">Every step produces something a rep can act on the same day.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all space-y-2">
                <span className="text-sm font-extrabold text-violet-700">{s.n}</span>
                <h3 className="font-bold text-sm text-slate-900">{s.t}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Engines bento ── */}
        <section id="engines" className="max-w-6xl mx-auto px-6 py-20 sm:py-24 border-t border-slate-200">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">The engine suite</span>
              <h2 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] mt-2">
                One workspace, <span className="font-extrabold">eight engines.</span>
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              No black box. Every engine returns a schema-validated result that’s staged in your workspace for a human to review before anything goes out.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ENGINES.map((e, i) => {
              const Icon = e.icon;
              return (
                <Reveal
                  key={e.n}
                  delay={(i % 4) * 70}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{e.tag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 mb-1.5">{e.t}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{e.d}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Deep dive ── */}
        <section className="bg-white border-y border-slate-200 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="max-w-2xl mx-auto text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Inside the product</span>
              <h2 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] mt-2">
                You review the output — <span className="font-extrabold">never blind execution.</span>
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* card 1 */}
              <Reveal className="bg-[#FAF9F6] rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 text-emerald-400 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Call Prep & Meetings</h3>
                    <span className="text-[11px] text-slate-500">Briefing + 7-filter champion kit, per meeting</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">FinTech Scale — Executive review</span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Tier 1</span>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 text-xs space-y-1.5">
                    <div className="font-bold text-violet-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-600" /> What this call is about
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Prospect raised a Series A and is scaling sales development from two reps to eight. Goal: confirm the growth retainer scope and next step.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Three discovery questions to ask:</span>
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div>1. What’s your fallback when Apollo rate-limits outbound?</div>
                      <div>2. Who signs off on the CAC payback threshold?</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Attendee psychographics, targeted questions against your weakest MEDDPICC boxes, live company news, and a kit your champion uses in the closed-door meeting.
                </p>
              </Reveal>

              {/* card 2 */}
              <Reveal delay={120} className="bg-[#FAF9F6] rounded-3xl border border-slate-200 p-6 shadow-card space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 text-emerald-400 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Executive dashboard</h3>
                    <span className="text-[11px] text-slate-500">Pipeline telemetry and the SLA queue</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">SLA compliance</div>
                      <div className="text-xl font-extrabold text-emerald-600 mt-0.5">100%</div>
                      <div className="text-[10px] text-slate-400">15-minute target</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">Outbound staged</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">18</div>
                      <div className="text-[10px] text-amber-600 font-semibold">Awaiting review</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 text-white rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Live event stream
                    </span>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div className="text-emerald-300">Webhook parsed — Northwind Retail</div>
                      <div className="text-slate-400">Redis lock acquired</div>
                      <div className="text-slate-400">Waterfall: Tier-1 match, drafting outreach</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tracks the sub-15-minute qualification target, live lead scores, and staged outbound waiting for a rep to sign off.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Architecture (dark) ── */}
        <section id="architecture" className="relative bg-slate-950 text-white py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:26px_26px]" />
          <div className="max-w-6xl mx-auto px-6 relative">
            <Reveal className="max-w-2xl space-y-4 mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-semibold border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Built on FastAPI + Temporal
              </span>
              <h2 className="text-2xl sm:text-4xl font-light tracking-tight">
                Sales AI can’t <span className="font-bold">fail silently.</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Whipstitch runs its multi-step work as durable Temporal workflows with retries and idempotency. If a
                provider rate-limits, execution resumes on a fallback — no manual intervention, no half-finished state.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ARCH.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Reveal key={a.t} delay={i * 90} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/70 transition-colors space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="text-sm font-bold text-white">{a.t}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{a.d}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="max-w-3xl mx-auto px-6 py-20 sm:py-24">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Transparency</span>
            <h2 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] mt-2">Frequently asked questions</h2>
          </Reveal>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} className="py-1">
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="w-full text-left py-5 flex items-center justify-between gap-4 group"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-950">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <p className="pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="max-w-6xl mx-auto px-6 pb-20 sm:pb-24">
          <Reveal className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-[#1c1b34] to-slate-950 text-white p-10 sm:p-16 text-center overflow-hidden shadow-modal">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="relative max-w-xl mx-auto space-y-5">
              <h2 className="text-3xl sm:text-5xl font-light tracking-tight">
                Set up your workspace in <span className="font-extrabold">a couple of minutes.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Register, answer a few questions about what you sell, and the engines are ready to run against your ICP.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={primary} className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-950 font-bold px-8 py-3.5 rounded-full shadow-lg transition-all text-sm">
                  Create your workspace
                </button>
                <button onClick={signIn} className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold px-8 py-3.5 rounded-full transition-all text-sm">
                  Sign in
                </button>
              </div>
              <p className="text-xs text-slate-400 pt-1">No credit card · free-tier AI included</p>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mark className="w-7 h-7" />
                <span className="text-sm font-extrabold tracking-tight">Whipstitch</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                A GTM engine for small B2B sales teams — configured from what your company sells.
              </p>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <span className="text-slate-950 font-bold uppercase tracking-wider text-[11px]">Engines</span>
              <ul className="space-y-2">
                <li><a href="#engines" className="hover:text-slate-950 transition-colors">All eight engines</a></li>
                <li><a href="#how" className="hover:text-slate-950 transition-colors">How it works</a></li>
                <li><a href="#architecture" className="hover:text-slate-950 transition-colors">Architecture</a></li>
              </ul>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <span className="text-slate-950 font-bold uppercase tracking-wider text-[11px]">Built with</span>
              <ul className="space-y-2">
                <li>FastAPI + Temporal</li>
                <li>PostgreSQL · Redis</li>
                <li>Gemini &amp; Groq (BYOK)</li>
                <li>AES-256 Fernet vault</li>
              </ul>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <span className="text-slate-950 font-bold uppercase tracking-wider text-[11px]">Get started</span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[11px] text-slate-600">Set up an isolated workspace and run the engines against your ICP.</p>
                <button onClick={primary} className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                  Create workspace
                </button>
              </div>
            </div>
          </div>
          <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Whipstitch</p>
            <div className="flex items-center gap-5">
              <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-slate-950 transition-colors">API Docs</a>
              <button onClick={signIn} className="hover:text-slate-950 transition-colors">Sign in</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
