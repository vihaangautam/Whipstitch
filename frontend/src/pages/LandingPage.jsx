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
import LegalDoc from './LegalDoc';

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

/* Film grain, as a filter-generated SVG. Overlaid on the gradients so they
   read as printed ink rather than a CSS mesh. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const NAV = [
  { href: '#engines', label: 'What it produces' },
  { href: '#suite', label: 'A closer look' },
  { href: '#infra', label: 'Under the hood' },
  { href: '#faq', label: 'Questions' },
];

/* ── Compact, glanceable previews of what each engine hands back ── */
function OutboundMini() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-[12px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">Northwind Retail</span>
        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
          Draft ready
        </span>
      </div>
      <div className="text-[10.5px] text-slate-400 mt-0.5">Priya Shah, Head of Growth</div>
      <p className="mt-2 text-slate-600 leading-snug border-t border-slate-200/70 pt-2">
        “You just posted for a growth marketer to own paid and lifecycle. We run
        that exact scope as a senior pod…”
      </p>
    </div>
  );
}

function ScorecardMini() {
  const boxes = [
    ['Metrics', 13, 15], ['Buyer', 6, 15], ['Criteria', 8, 10], ['Process', 5, 10],
    ['Paper', 4, 10], ['Pain', 12, 15], ['Champion', 7, 15], ['Rival', 4, 10],
  ];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-slate-900">CloudCube</span>
        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
          Rescue · 59/100
        </span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {boxes.map(([name, s, max]) => {
          const pct = s / max;
          const tone = pct >= 0.67 ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : pct >= 0.4 ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200';
          return (
            <div key={name} className={`rounded border px-1 py-1 text-center ${tone}`}>
              <div className="text-[9px] leading-none">{name}</div>
              <div className="text-[11px] font-bold leading-tight mt-0.5">{s}/{max}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BattlecardMini() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-[12px]">
      <div className="font-semibold text-slate-900">vs. Directive Consulting</div>
      <div className="mt-2 border-t border-slate-200/70 pt-2">
        <div className="text-[10.5px] text-slate-400">The question to ask</div>
        <p className="text-slate-700 leading-snug mt-1">
          “Does a senior person review the work, or does it queue behind twenty
          other accounts?”
        </p>
      </div>
    </div>
  );
}

function BriefingMini() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-[12px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">FinTech Scale</span>
        <span className="text-[10.5px] text-slate-400">Thu 10:00</span>
      </div>
      <div className="mt-2 border-t border-slate-200/70 pt-2 space-y-1 text-slate-600 leading-snug text-[11.5px]">
        <p>1. Fallback when Apollo rate-limits outbound?</p>
        <p>2. Who signs off on the CAC payback threshold?</p>
        <p>3. What breaks first if the two reps stay two?</p>
      </div>
    </div>
  );
}

const ENGINES = [
  {
    icon: Rocket,
    name: 'Outbound Queue',
    tag: 'A first message to a company that just started hiring in your category.',
    Artifact: OutboundMini,
  },
  {
    icon: ShieldCheck,
    name: 'Deal Health',
    tag: 'A MEDDPICC scorecard, scored from what the buyer actually said.',
    Artifact: ScorecardMini,
  },
  {
    icon: Swords,
    name: 'Competitor Playbooks',
    tag: 'A battlecard for each rival you keep losing to.',
    Artifact: BattlecardMini,
  },
  {
    icon: CalendarClock,
    name: 'Call Prep',
    tag: 'A briefing for every meeting on your calendar.',
    Artifact: BriefingMini,
  },
];

function EngineCard({ icon: Icon, name, tag, Artifact }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5 text-slate-900">
        <Icon className="w-[18px] h-[18px] text-slate-500" strokeWidth={1.75} />
        <h3 className="text-[16px] font-bold tracking-[-0.02em]">{name}</h3>
      </div>
      <p className="mt-2 text-[13px] text-slate-600 leading-snug">{tag}</p>
      <div className="mt-4">
        <Artifact />
      </div>
    </div>
  );
}

/* Static 2x2 grid — a visitor scans all four in one glance. */
function EngineGrid() {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto px-6">
      {ENGINES.map((e) => (
        <EngineCard key={e.name} {...e} />
      ))}
    </div>
  );
}

/* ── A closer look: two deep-dives in the Inner Labs register —
   one real product surface per row, plain prose beside it, nothing else. ── */
function ScorecardPanel() {
  const boxes = [
    ['Metrics', 13, 15], ['Economic Buyer', 6, 15], ['Decision Criteria', 8, 10], ['Decision Process', 5, 10],
    ['Paper Process', 4, 10], ['Identified Pain', 12, 15], ['Champion', 7, 15], ['Competition', 4, 10],
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(15,23,42,0.16)]">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[15px] font-bold text-slate-900">CloudCube</div>
          <div className="text-[12px] text-slate-500">SEO retainer · scored from the Mar 14 call</div>
        </div>
        <span className="text-[12px] font-semibold text-amber-700">Rescue · 59 / 100</span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {boxes.map(([name, s, max]) => {
          const pct = s / max;
          const tone = pct >= 0.67 ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : pct >= 0.4 ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-rose-200 bg-rose-50 text-rose-800';
          return (
            <div key={name} className={`rounded-lg border px-2.5 py-2 ${tone}`}>
              <div className="text-[11px] leading-tight">{name}</div>
              <div className="text-[15px] font-bold mt-0.5">{s}<span className="text-[11px] font-medium opacity-60"> / {max}</span></div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
        <p className="text-[13px] text-slate-700 leading-relaxed">
          “The VP is on board, but the CFO signs and that goes to the board on the 18th.”
        </p>
        <p className="mt-1.5 text-[11.5px] text-slate-500">
          Economic Buyer stays at 6/15 until you have spoken to the CFO — a positive line from the VP can't raise it.
        </p>
      </div>
    </div>
  );
}

function BattlecardPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(15,23,42,0.16)]">
      <div className="text-[15px] font-bold text-slate-900">vs. Directive Consulting</div>
      <div className="text-[12px] text-slate-500">Identified from your profile as a rival you lose to</div>

      <div className="mt-4 space-y-4 text-[13px] leading-relaxed">
        <div>
          <div className="text-[12px] text-slate-400">What they tell the buyer</div>
          <p className="mt-1 text-slate-700">“We're full-service — one team handles everything.”</p>
        </div>
        <div>
          <div className="text-[12px] text-slate-400">The question that exposes it</div>
          <p className="mt-1 font-medium text-slate-900">
            “When your quarter is on the line, does a senior person review the work,
            or does it queue behind twenty other accounts?”
          </p>
        </div>
        <div>
          <div className="text-[12px] text-slate-400">Your line back</div>
          <p className="mt-1 text-slate-700">“One senior pod, one scope — not a slot in a factory.”</p>
        </div>
      </div>
    </div>
  );
}

function ProductionSuite() {
  const rows = [
    {
      Panel: ScorecardPanel,
      name: 'Deal Health',
      heading: 'A scorecard that won’t flatter you.',
      body: [
        'Paste a call recording. Whipstitch reads it and fills in an eight-box MEDDPICC scorecard, and every box moves only on something the buyer actually said — a verbatim line you can click through to.',
        'Enthusiasm in a demo doesn’t count. Economic Buyer and Champion stay capped until you have real access, so a deal that looks warm on the surface still reads as the rescue it is.',
      ],
    },
    {
      Panel: BattlecardPanel,
      name: 'Competitor Playbooks',
      heading: 'Know the counter before they bring it up.',
      body: [
        'Whipstitch reads your company profile, works out who you actually lose deals to, and writes a battlecard for each one.',
        'Not a feature grid — the claim the rival makes, the question that turns it against them, and a line you can say back. Written for the deal in front of you, not a category.',
      ],
    },
  ];

  return (
    <section id="suite" className="scroll-mt-24 w-full py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-display text-[2rem] sm:text-[3rem] font-light tracking-[-0.03em] leading-[1.1] max-w-[20ch]">
          The two you’ll use on <span className="font-extrabold">every deal</span>.
        </h2>

        <div className="mt-16 sm:mt-20 space-y-16 sm:space-y-24">
          {rows.map(({ Panel, name, heading, body }, i) => (
            <div
              key={name}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
            >
              <div className={i % 2 ? 'lg:order-2' : ''}>
                <div className="text-[13px] font-semibold text-slate-500">{name}</div>
                <h3 className="mt-2 font-display text-[1.6rem] sm:text-[2rem] font-light tracking-[-0.025em] leading-[1.15]">
                  {heading}
                </h3>
                <div className="mt-4 space-y-3 max-w-[46ch]">
                  {body.map((p, j) => (
                    <p key={j} className="text-[15px] text-slate-600 leading-relaxed">{p}</p>
                  ))}
                </div>
              </div>
              <div className={i % 2 ? 'lg:order-1' : ''}>
                <Panel />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const INFRA = [
  { icon: SlidersHorizontal, name: 'Logic & ICP Studio', body: 'One place to set your offering, industries, geographies and buyer titles. Every engine reads from it.' },
  { icon: Inbox, name: 'Inbound Pipeline', body: 'Webhook ingestion behind a Redis lock, then a provider waterfall ending in a drafted reply.' },
  { icon: KeyRound, name: 'BYOK Vault', body: 'Your Gemini, Groq, Serper, Apollo and HubSpot keys, encrypted at rest, decrypted only mid-workflow.' },
  { icon: BarChart3, name: 'Pipeline Analytics', body: 'Where accounts convert, where they stall, and where enrichment drops a lead before you see it.' },
];

const FAQS = [
  { q: 'Which models run the generation?', a: 'Gemini Flash and Groq by default, with a deterministic template as a last resort so nothing ever comes back empty. Add your own keys in the vault to use them instead — nothing is resold or marked up.' },
  { q: 'What does it cost to try?', a: 'Nothing. The free tiers of Gemini, Groq and Serper cover generation and research. Outbound falls back to free hiring-signal discovery when there is no Apollo key. Apollo org search and HubSpot writes need your own keys.' },
  { q: 'How does the scorecard avoid false optimism?', a: 'A box only moves when there is a verbatim buyer quote behind it. Demo enthusiasm and polite curiosity are explicitly barred from raising a score, and Economic Buyer and Champion stay capped until direct access is confirmed.' },
  { q: 'Which call recording formats work?', a: 'Pasted text, WebVTT and SRT subtitle files, Word documents, and PDFs.' },
  { q: 'Is my data used for training?', a: 'No. Each workspace is an isolated tenant, and conversation data is never sent to a model for training.' },
];

/* ── The app itself, rendered on the laptop screen ──────────────
   Deliberately dense: this is a working dashboard, not a diagram. */
function ScreenMock() {
  const nav = ['Dashboard', 'Accounts', 'Outbound', 'Deal Health', 'Playbooks', 'Call Prep'];
  const kpis = [
    ['Accounts surfaced', '9', 'this week', 'text-slate-900'],
    ['Deals scored', '4', 'from call recordings', 'text-slate-900'],
    ['Drafts to review', '6', 'waiting on you', 'text-amber-600'],
    ['Next meeting', 'Thu 10:00', 'FinTech Scale', 'text-slate-900'],
  ];
  const rows = [
    ['Northwind Retail', 'Priya Shah · Head of Growth', 'Strong', '91', 'emerald'],
    ['CloudCube', 'Marcus Reid · VP Marketing', 'Strong', '87', 'emerald'],
    ['FinTech Scale', 'Ana Duarte · Founder', 'Good', '74', 'slate'],
    ['Harborline Logistics', 'Sam Okonkwo · RevOps', 'Good', '68', 'slate'],
    ['Bright Meridian', 'Lena Fischer · CMO', 'Weak', '52', 'slate'],
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
              className={`px-1.5 py-1 rounded text-[9.5px] ${i === 0 ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500'
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
                <div className="text-slate-500">waterfall → strong match, drafting outreach</div>
                <div className="text-slate-500">battlecard generated · 3 rivals</div>
                <div className="text-slate-500">meddpicc scored · 59/100 rescue</div>
                <div className="text-slate-400">staged for review</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
              <span className="text-[9.5px] font-semibold text-slate-900">Outbound queue</span>
              <span className="text-[8px] text-slate-400">6 staged · you approve before send</span>
            </div>
            {rows.map(([co, person, tier, score, tone]) => (
              <div key={co} className="flex items-center gap-2 px-2.5 py-[5px] border-b border-slate-50 last:border-0">
                <div className="w-3.5 h-3.5 rounded bg-slate-100 shrink-0" />
                <span className="text-[9px] font-semibold text-slate-900 w-[110px] truncate">{co}</span>
                <span className="text-[8.5px] text-slate-500 flex-1 truncate">{person}</span>
                <span className="text-[8px] text-slate-400 w-9">{tier}</span>
                <span
                  className={`text-[8.5px] font-bold w-6 text-right ${tone === 'emerald' ? 'text-emerald-600' : 'text-slate-500'
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
    <div className="relative pb-28 sm:pb-40">
      {/* perspective grid floor — full-bleed, the laptop stands on it. Faded with
         a mask only (no solid fills) so the ambient field shows through it and
         there is no dividing line. */}
      <div className="pointer-events-none absolute inset-x-[-50vw] bottom-[-24px] sm:bottom-[-40px] top-[8%]" aria-hidden="true">
        <div
          className="absolute inset-0 origin-bottom"
          style={{
            transform: 'perspective(620px) rotateX(58deg)',
            backgroundSize: '68px 68px',
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.15) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(15,23,42,0.15) 1.2px, transparent 1.2px)',
            maskImage:
              'radial-gradient(ellipse 84% 94% at 50% 18%, #000 0%, rgba(0,0,0,0.8) 46%, transparent 84%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 84% 94% at 50% 18%, #000 0%, rgba(0,0,0,0.8) 46%, transparent 84%)',
          }}
        />
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
          <div className="text-[11px] text-slate-400">Call prep</div>
          <div className="text-[13px] font-semibold text-slate-900 mt-1">FinTech Scale, Thursday 10:00</div>
          <p className="text-[12px] text-slate-600 leading-relaxed mt-1.5">
            Ana runs sales herself. Ask who else needs to see the price before she can sign.
          </p>
        </motion.div>

        <motion.div
          {...drop}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.6, ease }}
          className="absolute top-[10%] -right-[3%] lg:-right-[7%] w-[248px] lg:w-[292px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_-14px_rgba(15,23,42,0.3)] hidden md:block"
        >
          <div className="text-[11px] text-slate-400">Deal health</div>
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
  const [doc, setDoc] = useState(null);
  const reduce = useReducedMotion();
  const primary = onPrimary || (() => { });
  const signIn = onSignIn || primary;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rise = reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  if (doc) return <LegalDoc slug={doc} onBack={() => setDoc(null)} />;

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Nav — floating pill, always solid, as on the reference sites */}
      <div className="sticky top-4 z-40 px-4">
        <nav className={`max-w-6xl mx-auto rounded-full border border-slate-200/90 bg-white/90 px-5 sm:px-6 py-3 flex items-center justify-between transition-shadow ${scrolled ? 'glass-panel shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]' : 'shadow-[0_2px_14px_-8px_rgba(15,23,42,0.14)]'
          }`}>
          <a href="#top" className="flex items-center gap-2.5">
            <Mark className="w-8 h-8" />
            <span className="text-[17px] font-extrabold tracking-[-0.02em]">Whipstitch</span>
          </a>
          <div className="hidden md:flex items-center gap-5 lg:gap-8 text-[14px] text-slate-600 whitespace-nowrap">
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

      <main id="top" className="relative" style={{ '--mesh-fade': '#F8FAFC' }}>
        {/* Ambient field behind hero and laptop — ends smoothly above the card containers */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                background:
                  // hero glow, top
                  'radial-gradient(40% 24% at 34% 7%, rgba(139,92,246,0.30) 0%, rgba(139,92,246,0) 100%),' +
                  'radial-gradient(38% 22% at 66% 5%, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0) 100%),' +
                  'radial-gradient(44% 24% at 52% 20%, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 100%),' +
                  // mid — keeps colour continuous through the laptop band
                  'radial-gradient(46% 26% at 22% 54%, rgba(139,92,246,0.13) 0%, rgba(139,92,246,0) 100%),' +
                  'radial-gradient(42% 24% at 84% 58%, rgba(245,158,11,0.13) 0%, rgba(245,158,11,0) 100%)',
                filter: 'blur(58px)',
              }}
            />
            <div
              className="absolute inset-0 mix-blend-overlay opacity-[0.2]"
              style={{ backgroundImage: GRAIN }}
            />
            {/* dissolve into the plain page smoothly under the laptop */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[#F8FAFC]" />
          </div>

          {/* Hero */}
          <section className="relative z-10">
            <div className="max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-14 text-center">
              <motion.h1
                {...rise}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-light tracking-[-0.035em] leading-[1.04] text-[2.9rem] sm:text-[4rem] lg:text-[4.5rem]"
              >
                The sales <span className="font-extrabold italic">research team</span> you don't have.
              </motion.h1>
              <motion.p
                {...rise}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7 text-[17px] sm:text-[19px] text-slate-600 leading-[1.6] mx-auto max-w-[54ch]"
              >
                Tell Whipstitch what you sell and who buys it. It finds companies hiring in your category,
                drafts the first message, scores your deals from call recordings, and briefs you before each
                meeting. You approve everything.
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
                No credit card. Use the free model tiers, or bring your own keys.
              </motion.p>
            </div>
          </section>

          {/* Laptop */}
          <section className="relative z-10 px-6 overflow-x-clip">
            <LaptopMock />
          </section>
        </div>

        {/* What each engine produces */}
        <section id="engines" className="scroll-mt-24 w-full pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-light tracking-[-0.03em] leading-[1.08]">
              It drafts. <span className="font-extrabold">You</span> send.
            </h2>
            <p className="mt-4 text-[17px] text-slate-600 leading-[1.6] mx-auto max-w-[48ch]">
              Four things Whipstitch produces from your setup. Nothing leaves your workspace until you approve it.
            </p>
          </div>

          <EngineGrid />
        </section>

        {/* Infrastructure */}
        <section id="infra" className="scroll-mt-24 w-full py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-light tracking-[-0.03em] leading-[1.08]">
              The <span className="font-extrabold">infrastructure</span> underneath
            </h2>
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

        {/* Production Suite — Inner Labs-style executive capability bento */}
        <ProductionSuite />

        {/* Architecture — prose, dark */}
        <section className="bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 space-y-6">
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-light tracking-[-0.03em] leading-[1.08]">Sales AI can't <span className="font-extrabold">fail silently</span>.</h2>
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
        <section id="faq" className="scroll-mt-24 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24">
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-light tracking-[-0.03em] leading-[1.08] mb-10">Common <span className="font-extrabold">questions</span></h2>
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

        {/* CTA — inset gradient card */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 pt-4">
          <div className="relative max-w-6xl mx-auto rounded-[26px] sm:rounded-[34px] overflow-hidden text-white">
            {/* deep navy base, violet on the right, warm rust in the corners */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(72% 108% at 93% 46%, rgba(139,68,245,0.95) 0%, rgba(88,32,178,0.52) 34%, rgba(20,16,43,0) 68%),' +
                  'radial-gradient(56% 72% at 2% 94%, rgba(158,92,60,0.60) 0%, rgba(158,92,60,0) 62%),' +
                  'radial-gradient(44% 54% at 0% 2%, rgba(132,74,58,0.42) 0%, rgba(132,74,58,0) 64%),' +
                  'linear-gradient(112deg, #17122F 0%, #131028 52%, #1D1540 100%)',
              }}
            />
            <div className="absolute inset-0 mix-blend-overlay opacity-[0.20]" style={{ backgroundImage: GRAIN }} />

            <div className="relative px-6 sm:px-10 py-20 sm:py-24 text-center">
              <h2 className="font-display text-[2.1rem] sm:text-[3.25rem] font-light tracking-[-0.035em] leading-[1.08] max-w-[20ch] mx-auto text-white">
                See what the engines produce against your <span className="font-extrabold">own ICP</span>.
              </h2>
              <p className="mt-6 text-[15px] sm:text-base text-slate-300/90 leading-[1.65] max-w-[50ch] mx-auto">
                Set up a workspace — a few questions about what you sell — and the engines
                run: outbound, scorecards, battlecards, briefings.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={primary} className="w-full sm:w-auto bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-slate-100 transition-colors text-sm">
                  Get started
                </button>
                <button onClick={signIn} className="w-full sm:w-auto bg-white/10 hover:bg-white/[0.18] border border-white/20 text-white font-medium px-7 py-3.5 rounded-full transition-colors text-sm backdrop-blur-sm">
                  Sign in
                </button>
              </div>
              <p className="mt-8 text-[12px] text-white/50">
                No credit card. Use the free model tiers, or bring your own keys. Cancel anytime.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-x-8 gap-y-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Mark className="w-7 h-7" />
                <span className="font-extrabold text-slate-900">Whipstitch</span>
              </div>
              <p className="mt-3 text-[13px] text-slate-500 leading-relaxed max-w-[34ch]">
                The sales research team you don't have — generated, and
                staged for your review.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Workflow engine operational
              </div>
            </div>

            {/* What it produces */}
            <div>
              <div className="text-[13px] font-semibold text-slate-900">What it produces</div>
              <ul className="mt-4 space-y-2.5 text-[13px] text-slate-500">
                {['Outbound Queue', 'Deal Health', 'Competitor Playbooks', 'Call Prep'].map((l) => (
                  <li key={l}><a href="#engines" className="hover:text-slate-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Under the hood — mono */}
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Under the hood</div>
              <ul className="mt-4 space-y-2.5 text-[12px] font-mono text-slate-500">
                <li><a href="#infra" className="hover:text-slate-900 transition-colors">ICP &amp; logic studio</a></li>
                <li><a href="#infra" className="hover:text-slate-900 transition-colors">Gemini + Groq router</a></li>
                <li><a href="#infra" className="hover:text-slate-900 transition-colors">Redis idempotency lock</a></li>
                <li><a href="#infra" className="hover:text-slate-900 transition-colors">AES-256 key vault</a></li>
                <li><a href="/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">API docs</a></li>
              </ul>
            </div>

            {/* Start card */}
            <div className="col-span-2 lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[13px] font-bold text-slate-900">Set up a workspace</div>
                <p className="mt-1 text-[12px] text-slate-500 leading-snug">
                  A few questions about what you sell, then the engines run against your ICP.
                </p>
                <button
                  onClick={primary}
                  className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold py-2 rounded-lg transition-colors"
                >
                  Get started
                </button>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-400">
            <span>© {new Date().getFullYear()} Whipstitch. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <button onClick={() => setDoc('privacy')} className="hover:text-slate-700 transition-colors">Privacy Policy</button>
              <button onClick={() => setDoc('terms')} className="hover:text-slate-700 transition-colors">Terms of Service</button>
              <button onClick={() => setDoc('security')} className="hover:text-slate-700 transition-colors">Security Architecture</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
