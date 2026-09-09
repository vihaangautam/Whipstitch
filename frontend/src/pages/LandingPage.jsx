import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  Inbox,
  ShieldCheck,
  Swords,
  CalendarClock,
  KeyRound,
  SlidersHorizontal,
  BarChart3,
  Rocket,
} from 'lucide-react';

/* ── Brand mark ─────────────────────────────────────────────── */
function Mark({ className = 'w-8 h-8' }) {
  return (
    <div className={`${className} rounded-lg bg-slate-900 flex items-center justify-center text-white`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12l8 8 8-8" className="stroke-emerald-400" />
        <path d="M4 6l8 8 8-8" className="stroke-slate-400" />
      </svg>
    </div>
  );
}

const NAV = [
  { href: '#engines', label: 'What it produces' },
  { href: '#infra', label: 'Under the hood' },
  { href: '#faq', label: 'Questions' },
];

/* ── The four generation engines, each shown with its real output ── */
function OutboundArtifact() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-[13px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">Northwind Retail</div>
          <div className="text-xs text-slate-500">Hiring a Growth Marketing Manager · contact resolved: Priya Shah</div>
        </div>
        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0">
          Needs review
        </span>
      </div>
      <div className="space-y-1.5 border-t border-slate-100 pt-3 text-slate-700 leading-relaxed">
        <p><span className="text-slate-400">Observation.</span> You posted for a growth marketer to own paid and lifecycle — that split usually means the current mix has plateaued.</p>
        <p><span className="text-slate-400">Link.</span> We run that exact scope as a senior pod, live in two weeks, no ramp.</p>
        <p><span className="text-slate-400">Ask.</span> Worth 20 minutes to compare against hiring in-house?</p>
      </div>
    </div>
  );
}

function ScorecardArtifact() {
  const boxes = [
    ['Metrics', 13, 15], ['Economic Buyer', 6, 15], ['Decision Criteria', 8, 10], ['Decision Process', 5, 10],
    ['Paper Process', 4, 10], ['Implicated Pain', 12, 15], ['Champion', 7, 15], ['Competition', 4, 10],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-slate-900">CloudCube — SEO retainer</span>
        <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-xs shrink-0">
          Rescue · 59 / 100
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {boxes.map(([name, s, max]) => {
          const pct = s / max;
          const tone = pct >= 0.67 ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : pct >= 0.34 ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200';
          return (
            <div key={name} className={`rounded-md border px-1.5 py-1 text-center ${tone}`}>
              <div className="text-[10px] leading-tight truncate">{name}</div>
              <div className="text-xs font-bold">{s}/{max}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
        Economic Buyer capped — the founder signs, and you haven't spoken to them yet.
      </p>
    </div>
  );
}

function BattlecardArtifact() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-[13px]">
      <div className="font-semibold text-slate-900">vs. Directive Consulting</div>
      <div className="space-y-2.5 text-slate-700 leading-relaxed">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">The claim they make</div>
          <p>"We're a full-service agency — one team for everything."</p>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">Ask the buyer</div>
          <p className="text-slate-900 font-medium">"When your quarter is on the line, does a senior person review the work, or does it queue behind twenty other accounts?"</p>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">Say this</div>
          <p className="italic">"You get a dedicated senior pod on one scope, not a slot in a factory."</p>
        </div>
      </div>
    </div>
  );
}

function BriefingArtifact() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-[13px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">FinTech Scale — executive review</span>
        <span className="text-xs text-slate-500">2 attendees</span>
      </div>
      <p className="text-slate-600 leading-relaxed">
        Series A closed, scaling SDRs from two to eight. Goal: confirm scope and agree a next step before the founder travels.
      </p>
      <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-slate-700">
        <div className="text-xs text-slate-400">Ask on this call</div>
        <p>1. What's the fallback when Apollo rate-limits outbound?</p>
        <p>2. Who signs off on the CAC payback threshold?</p>
        <p>3. What breaks first if the two current reps stay two?</p>
      </div>
    </div>
  );
}

const ENGINES = [
  {
    icon: Rocket,
    name: 'Outbound Queue',
    body: 'It finds companies actively hiring the roles your buyers hire when they have budget in your category, resolves the decision-maker, and drafts the first message. Free — no paid data needed.',
    Artifact: OutboundArtifact,
  },
  {
    icon: ShieldCheck,
    name: 'Deal Health',
    body: 'Paste a call transcript. You get an eight-box MEDDPICC scorecard with the exact quotes it scored from. A positive tone never raises a box, and Economic Buyer stays capped until you have real access.',
    Artifact: ScorecardArtifact,
  },
  {
    icon: Swords,
    name: 'Competitor Playbooks',
    body: 'It reads your company profile, works out who you actually lose deals to, and writes a battlecard for each rival — the claim they make, the question that exposes it, and a line you can say back.',
    Artifact: BattlecardArtifact,
  },
  {
    icon: CalendarClock,
    name: 'Call Prep',
    body: 'Before each meeting: what the attendees care about, three questions aimed at your weakest MEDDPICC boxes, the company’s recent news, and a kit your champion uses in the room without you.',
    Artifact: BriefingArtifact,
  },
];

const INFRA = [
  { icon: SlidersHorizontal, name: 'Logic & ICP Studio', body: 'One place to set your offering, industries, geographies and buyer titles. Every engine reads from it.' },
  { icon: Inbox, name: 'Inbound Pipeline', body: 'Webhook ingestion behind a Redis lock, then a provider waterfall ending in a drafted reply.' },
  { icon: KeyRound, name: 'BYOK Vault', body: 'Your Gemini, Groq, Serper, Apollo and HubSpot keys, encrypted at rest, decrypted only mid-workflow.' },
  { icon: BarChart3, name: 'Pipeline Analytics', body: 'Conversion funnel, SLA compliance, and where the enrichment waterfall drops leads.' },
];

const FAQS = [
  { q: 'Which models run the generation?', a: 'Gemini Flash and Groq by default, with a deterministic template as a last resort so nothing ever comes back empty. Add your own keys in the vault to use them instead — nothing is resold or marked up.' },
  { q: 'What does it cost to try?', a: 'Nothing. The free tiers of Gemini, Groq and Serper cover generation and research. Outbound falls back to free hiring-signal discovery when there is no Apollo key. Apollo org search and HubSpot writes need your own keys.' },
  { q: 'How does the scorecard avoid false optimism?', a: 'A box only moves when there is a verbatim buyer quote behind it. Demo enthusiasm and polite curiosity are explicitly barred from raising a score, and Economic Buyer and Champion stay capped until direct access is confirmed.' },
  { q: 'Which transcript formats work?', a: 'Pasted text, WebVTT and SRT subtitle files, Word documents, and PDFs.' },
  { q: 'Is my data used for training?', a: 'No. Each workspace is an isolated tenant, and conversation data is never sent to a model for training.' },
];

/* ── The app itself, rendered on the laptop screen ──────────────
   Deliberately dense: this is a working dashboard, not a diagram. */
function ScreenMock() {
  const nav = ['Dashboard', 'Inbound', 'Outbound', 'Deal Health', 'Playbooks', 'Call Prep', 'Analytics'];
  const kpis = [
    ['Inbound this week', '142', '+18 vs last week', 'text-slate-900'],
    ['SLA compliance', '100%', '0 breaches', 'text-emerald-600'],
    ['Avg lead score', '84', 'Tier 1 threshold 70', 'text-slate-900'],
    ['Outbound staged', '18', 'awaiting your review', 'text-slate-900'],
  ];
  const rows = [
    ['Northwind Retail', 'Priya Shah · Head of Growth', 'Tier 1', '91', 'emerald'],
    ['CloudCube', 'Marcus Reid · VP Marketing', 'Tier 1', '87', 'emerald'],
    ['FinTech Scale', 'Ana Duarte · Founder', 'Tier 2', '74', 'slate'],
    ['Harborline Logistics', 'Sam Okonkwo · RevOps', 'Tier 2', '68', 'slate'],
    ['Bright Meridian', 'Lena Fischer · CMO', 'Tier 3', '52', 'slate'],
  ];
  return (
    <div className="bg-[#F8FAFC] text-left select-none flex h-full font-sans">
      {/* sidebar */}
      <div className="w-[132px] shrink-0 bg-white border-r border-slate-200 py-3 px-2.5 hidden sm:block">
        <div className="flex items-center gap-1.5 px-1.5 pb-3">
          <div className="w-4 h-4 rounded bg-slate-900" />
          <span className="text-[10px] font-bold text-slate-900">Whipstitch</span>
        </div>
        <div className="space-y-0.5">
          {nav.map((n, i) => (
            <div
              key={n}
              className={`px-1.5 py-1 rounded text-[9.5px] ${
                i === 0 ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="flex-1 min-w-0">
        <div className="h-8 bg-white border-b border-slate-200 flex items-center justify-between px-3">
          <span className="text-[10px] text-slate-400">
            Whipstitch <span className="text-slate-300">/</span>{' '}
            <span className="text-slate-700 font-semibold">Dashboard</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" /> Workflow engine running
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-4 gap-2">
            {kpis.map(([label, val, sub, color]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
                <div className="text-[8.5px] text-slate-500 truncate">{label}</div>
                <div className={`text-[15px] font-bold leading-tight ${color}`}>{val}</div>
                <div className="text-[8px] text-slate-400 truncate">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 rounded-md border border-slate-200 bg-white p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9.5px] font-semibold text-slate-900">Pipeline, last 7 days</span>
                <span className="text-[8px] text-slate-400 font-mono">inbound / outbound</span>
              </div>
              <div className="relative h-[86px] rounded bg-slate-50 border border-slate-100 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 120">
                  {[24, 48, 72, 96].map((y) => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#E2E8F0" strokeWidth="1" />
                  ))}
                  <path d="M0,96 C70,90 120,80 180,66 C240,52 300,28 400,14 L400,120 L0,120 Z" fill="#05966918" />
                  <path d="M0,96 C70,90 120,80 180,66 C240,52 300,28 400,14" fill="none" stroke="#059669" strokeWidth="2.5" />
                  <path d="M0,104 C80,98 150,92 220,80 C290,68 340,50 400,38" fill="none" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="1.75" />
                </svg>
              </div>
            </div>
            <div className="col-span-5 rounded-md border border-slate-200 bg-white p-2.5">
              <div className="text-[9.5px] font-semibold text-slate-900 mb-1.5">Live event stream</div>
              <div className="space-y-[3px] text-[8.5px] font-mono leading-tight">
                <div className="text-emerald-700">webhook parsed — northwind retail</div>
                <div className="text-slate-500">redis lock acquired · idem key ok</div>
                <div className="text-slate-500">waterfall → tier 1, drafting outreach</div>
                <div className="text-slate-500">battlecard generated · 3 rivals</div>
                <div className="text-slate-500">meddpicc scored · 59/100 rescue</div>
                <div className="text-slate-400">staged for review</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
              <span className="text-[9.5px] font-semibold text-slate-900">Outbound queue</span>
              <span className="text-[8px] text-slate-400">18 staged · you approve before send</span>
            </div>
            {rows.map(([co, person, tier, score, tone]) => (
              <div key={co} className="flex items-center gap-2 px-2.5 py-[5px] border-b border-slate-50 last:border-0">
                <div className="w-3.5 h-3.5 rounded bg-slate-100 shrink-0" />
                <span className="text-[9px] font-semibold text-slate-900 w-[110px] truncate">{co}</span>
                <span className="text-[8.5px] text-slate-500 flex-1 truncate">{person}</span>
                <span className="text-[8px] text-slate-400 w-9">{tier}</span>
                <span
                  className={`text-[8.5px] font-bold w-6 text-right ${
                    tone === 'emerald' ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The hero device: a MacBook standing on a perspective grid,
   annotated by two cards that overlap the screen. ────────────── */
function LaptopMock() {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  // Inner Labs' own treatment: fade up, laptop first, then the annotations.
  const lift = reduce
    ? {}
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };
  const drop = reduce
    ? {}
    : { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="relative pb-24 sm:pb-32">
      {/* perspective grid floor — full-bleed, the laptop stands on it */}
      <div className="pointer-events-none absolute inset-x-[-50vw] bottom-0 top-[38%] overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 origin-bottom"
          style={{
            transform: 'perspective(560px) rotateX(60deg)',
            backgroundSize: '46px 46px',
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.16) 1px, transparent 1px)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#F8FAFC]" />
        <div className="absolute inset-y-0 left-0 w-[38%] bg-gradient-to-r from-[#F8FAFC] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[38%] bg-gradient-to-l from-[#F8FAFC] to-transparent" />
      </div>

      <div className="relative mx-auto w-[88%] max-w-[980px]">
        <motion.div {...lift} transition={{ duration: 0.85, ease }}>
          {/* lid */}
          <div className="relative rounded-t-[16px] sm:rounded-t-[20px] bg-[#1C1C1E] px-[7px] pt-[7px] pb-[16px] sm:px-2.5 sm:pt-2.5 sm:pb-[22px] shadow-[0_44px_90px_-24px_rgba(15,23,42,0.42)]">
            {/* camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[13px] w-[104px] rounded-b-[9px] bg-[#1C1C1E] z-20 hidden sm:flex items-center justify-center">
              <span className="w-[5px] h-[5px] rounded-full bg-[#3A3A3C]" />
            </div>
            <div className="rounded-[7px] sm:rounded-[9px] overflow-hidden bg-white">
              <ScreenMock />
            </div>
            <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 text-[7px] tracking-[0.2em] text-[#5A5A5E] hidden sm:block">
              WHIPSTITCH
            </div>
          </div>

          {/* base — flares wider than the lid, with the hinge lip */}
          <div className="relative mx-auto w-[108%] -left-[4%]">
            <div className="h-[10px] sm:h-[13px] rounded-b-[7px] sm:rounded-b-[9px] bg-gradient-to-b from-[#C9CED6] via-[#AFB6C0] to-[#8D95A1] flex justify-center">
              <div className="w-[70px] sm:w-[92px] h-[4px] sm:h-[5px] rounded-b-[5px] bg-[#7C838F]" />
            </div>
            <div className="mx-auto w-[76%] h-6 rounded-[50%] bg-slate-900/20 blur-2xl -mt-1.5" />
          </div>
        </motion.div>

        {/* annotations, overlapping the screen */}
        <motion.div
          {...drop}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.45, ease }}
          className="absolute top-[24%] -left-[3%] lg:-left-[8%] w-[248px] lg:w-[300px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-14px_rgba(15,23,42,0.3)] hidden md:block"
        >
          <div className="text-[11px] font-mono text-slate-400">call prep</div>
          <div className="text-[13px] font-semibold text-slate-900 mt-1">FinTech Scale, Thursday 10:00</div>
          <p className="text-[12px] text-slate-600 leading-relaxed mt-1.5">
            Series A closed, scaling 2 to 8 SDRs. Ask who signs off on the CAC payback threshold.
          </p>
        </motion.div>

        <motion.div
          {...drop}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.6, ease }}
          className="absolute top-[10%] -right-[3%] lg:-right-[7%] w-[248px] lg:w-[292px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-14px_rgba(15,23,42,0.3)] hidden md:block"
        >
          <div className="text-[11px] font-mono text-slate-400">deal health</div>
          <div className="text-[13px] font-semibold text-slate-900 mt-1">CloudCube dropped to 59</div>
          <p className="text-[12px] text-slate-600 leading-relaxed mt-1.5">
            Economic Buyer capped at 6/15 — the founder signs, and no one has spoken to them.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function LandingPage({ onPrimary, onSignIn }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const primary = onPrimary || (() => {});
  const signIn = onSignIn || primary;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rise = reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-display">
      {/* Nav — floating pill, always solid, as on the reference sites */}
      <div className="sticky top-4 z-40 px-4">
        <nav className={`max-w-6xl mx-auto rounded-full border border-slate-200/90 bg-white/90 px-5 sm:px-6 py-3 flex items-center justify-between transition-shadow ${
          scrolled ? 'glass-panel shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]' : 'shadow-[0_2px_14px_-8px_rgba(15,23,42,0.14)]'
        }`}>
          <a href="#top" className="flex items-center gap-2.5">
            <Mark className="w-8 h-8" />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">Whipstitch</span>
          </a>
          <div className="hidden md:flex items-center gap-9 text-[14px] text-slate-600">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-slate-900 transition-colors">{n.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={signIn} className="text-[14px] text-slate-700 hover:text-slate-900 transition-colors">
              Sign in
            </button>
            <button onClick={primary} className="text-[14px] font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 sm:px-5 py-2 rounded-full transition-colors">
              Get started
            </button>
          </div>
        </nav>
      </div>

      <main id="top">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-14 text-center">
          <motion.h1
            {...rise}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-medium tracking-[-0.032em] leading-[1.02] text-[2.9rem] sm:text-[4rem] lg:text-[4.5rem]"
          >
            The sales work between a signal and a booked call.
          </motion.h1>
          <motion.p
            {...rise}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 text-[17px] sm:text-[19px] text-slate-600 leading-[1.6] mx-auto max-w-[52ch]"
          >
            Set up your workspace once. Whipstitch then finds accounts hiring for your category,
            scores your deals from call transcripts, writes battlecards for the rivals you lose to,
            and briefs you before every meeting.
          </motion.p>
          <motion.div
            {...rise}
            transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <button onClick={primary} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[15px] font-medium px-7 py-3.5 rounded-full transition-colors group">
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#engines" className="text-[15px] font-medium text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-7 py-3.5 rounded-full transition-colors">
              See what it produces
            </a>
          </motion.div>
          <motion.p {...rise} transition={{ duration: 0.65, delay: 0.24 }} className="mt-7 text-[13px] text-slate-500">
            Free-tier AI included. No credit card. Bring your own keys.
          </motion.p>
        </section>

        {/* Laptop */}
        <section className="px-6 overflow-x-clip">
          <LaptopMock />
        </section>

        {/* What each engine produces */}
        <section id="engines" className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
            <h2 className="text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06] max-w-3xl">
              Four engines that produce work you can send.
            </h2>
            <p className="mt-5 text-[17px] text-slate-600 leading-[1.6] max-w-[54ch]">
              Nothing leaves your workspace on its own. Each engine drafts, and you approve.
            </p>

            <div className="mt-16 space-y-14 sm:space-y-20">
              {ENGINES.map(({ icon: Icon, name, body, Artifact }, i) => (
                <div key={name} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                  <div className={i % 2 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-2.5 text-slate-900">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                      <span className="text-[21px] font-medium tracking-[-0.02em]">{name}</span>
                    </div>
                    <p className="mt-3 text-[15px] text-slate-600 leading-relaxed max-w-[52ch]">{body}</p>
                  </div>
                  <div className={i % 2 ? 'lg:order-1' : ''}>
                    <Artifact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Infrastructure */}
        <section id="infra" className="border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
            <h2 className="text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">The infrastructure underneath</h2>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-9">
              {INFRA.map(({ icon: Icon, name, body }) => (
                <div key={name} className="flex gap-3.5">
                  <Icon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{name}</div>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture — prose, dark */}
        <section className="bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 space-y-6">
            <h2 className="text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">Sales AI can't fail silently.</h2>
            <p className="text-slate-300 leading-relaxed text-[15px]">
              Whipstitch runs its multi-step work as durable Temporal workflows. If a provider rate-limits
              in the middle of enrichment, execution resumes on a fallback rather than leaving a deal
              half-processed. Duplicate webhooks and retries hit a Redis lock, so nothing runs twice or
              double-charges a credit.
            </p>
            <p className="text-slate-300 leading-relaxed text-[15px]">
              Every model response is validated against a schema before you see it. When the model gets it
              wrong, the deterministic template takes over. You never get an empty page or a malformed card.
            </p>
            <p className="text-slate-300 leading-relaxed text-[15px]">
              Secrets, keys, battlecards, deals and prospects are scoped to your workspace, and every prompt
              is built from your own onboarding answers — not a shared template.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24">
            <h2 className="text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06] mb-10">Questions</h2>
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q}>
                    <button
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      className="w-full text-left py-5 flex items-start justify-between gap-6"
                    >
                      <span className="text-[15px] font-semibold text-slate-900">{f.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <p className="pb-5 -mt-1 text-sm text-slate-600 leading-relaxed max-w-[62ch]">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-900 text-white border-t border-slate-800">
          <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24 text-center space-y-5">
            <h2 className="text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">Set up your workspace</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed max-w-[44ch] mx-auto">
              Register, answer a few questions about what you sell, and the engines run against your ICP.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={primary} className="w-full sm:w-auto bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-slate-100 transition-colors text-sm">
                Get started
              </button>
              <button onClick={signIn} className="w-full sm:w-auto border border-slate-700 text-white font-medium px-7 py-3.5 rounded-full hover:bg-slate-800 transition-colors text-sm">
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <Mark className="w-7 h-7" />
            <span className="font-semibold text-slate-900">Whipstitch</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">API docs</a>
            <button onClick={signIn} className="hover:text-slate-900 transition-colors">Sign in</button>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
