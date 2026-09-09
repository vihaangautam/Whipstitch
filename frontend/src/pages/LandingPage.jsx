import React, { useState, useEffect, useRef } from 'react';
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

/* Film grain, as a filter-generated SVG. Overlaid on the gradients so they
   read as printed ink rather than a CSS mesh. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

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
    tag: 'Companies hiring for your category, the decision-maker resolved, and a first draft written.',
    Artifact: OutboundArtifact,
  },
  {
    icon: ShieldCheck,
    name: 'Deal Health',
    tag: 'An eight-box MEDDPICC scorecard built from the exact quotes in your call transcript.',
    Artifact: ScorecardArtifact,
  },
  {
    icon: Swords,
    name: 'Competitor Playbooks',
    tag: 'A battlecard per rival: the claim they make, the question that beats it, the line you say back.',
    Artifact: BattlecardArtifact,
  },
  {
    icon: CalendarClock,
    name: 'Call Prep',
    tag: 'Attendee priorities, three sharp questions, recent news, and a kit your champion uses without you.',
    Artifact: BriefingArtifact,
  },
];

/* Horizontal band of engine cards. Cruises left on its own; pointer or focus
   inside the strip eases it to a stop; leaving eases it back up to speed. */
function EngineMarquee() {
  const trackRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduce) return;

    const CRUISE = 40; // px/sec
    let x = 0;
    let speed = CRUISE;
    let target = CRUISE;
    let last = null;
    let raf = 0;

    const frame = (t) => {
      if (last == null) last = t;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      speed += (target - speed) * Math.min(dt * 2.5, 1); // ease toward target
      x -= speed * dt;
      const half = track.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const slow = () => { target = 0; };
    const go = () => { target = CRUISE; };
    track.addEventListener('pointerenter', slow);
    track.addEventListener('pointerleave', go);
    track.addEventListener('focusin', slow);
    track.addEventListener('focusout', go);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('pointerenter', slow);
      track.removeEventListener('pointerleave', go);
      track.removeEventListener('focusin', slow);
      track.removeEventListener('focusout', go);
    };
  }, [reduce]);

  return (
    <div
      className={`relative mt-14 ${
        reduce
          ? 'overflow-x-auto'
          : '[mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]'
      }`}
    >
      <div ref={trackRef} className="flex w-max gap-5 px-6">
        {[...ENGINES, ...ENGINES].map(({ icon: Icon, name, tag, Artifact }, i) => (
          <article
            key={i}
            aria-hidden={i >= ENGINES.length}
            tabIndex={i < ENGINES.length ? 0 : -1}
            className="w-[340px] shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_16px_36px_-18px_rgba(15,23,42,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <div className="flex items-center gap-2.5 text-slate-900">
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <h3 className="text-[16px] font-medium tracking-[-0.02em]">{name}</h3>
            </div>
            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed min-h-[54px]">{tag}</p>
            <div className="mt-3.5">
              <Artifact />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

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
    <div className="relative pb-28 sm:pb-40">
      {/* perspective grid floor — full-bleed, the laptop stands on it. Faded with
         a mask only (no solid fills) so the ambient field shows through it and
         there is no dividing line. */}
      <div className="pointer-events-none absolute inset-x-[-50vw] bottom-0 top-[14%]" aria-hidden="true">
        <div
          className="absolute inset-0 origin-bottom"
          style={{
            transform: 'perspective(560px) rotateX(60deg)',
            backgroundSize: '46px 46px',
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.12) 1px, transparent 1px)',
            maskImage:
              'radial-gradient(ellipse 70% 92% at 50% 0%, #000 0%, transparent 74%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 92% at 50% 0%, #000 0%, transparent 74%)',
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
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-geist">
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

      <main id="top" className="relative" style={{ '--mesh-fade': '#F8FAFC' }}>
       {/* One continuous ambient field behind the hero, the product shot and the
          engine row — a single set of blobs that all fade to transparent, so the
          three sections read as one surface with no dividing line anywhere. */}
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
                // mid — keeps colour continuous through the laptop band, no dead zone
                'radial-gradient(46% 26% at 22% 46%, rgba(139,92,246,0.13) 0%, rgba(139,92,246,0) 100%),' +
                'radial-gradient(42% 24% at 84% 50%, rgba(245,158,11,0.13) 0%, rgba(245,158,11,0) 100%),' +
                // lower — warm wash behind the engine row
                'radial-gradient(40% 24% at 90% 74%, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 100%),' +
                'radial-gradient(44% 26% at 76% 90%, rgba(139,92,246,0.17) 0%, rgba(139,92,246,0) 100%),' +
                'radial-gradient(34% 20% at 98% 96%, rgba(217,70,239,0.12) 0%, rgba(217,70,239,0) 100%)',
              filter: 'blur(58px)',
            }}
          />
          <div
            className="absolute inset-0 mix-blend-overlay opacity-[0.2]"
            style={{ backgroundImage: GRAIN }}
          />
          {/* dissolve into the plain page just before the infrastructure section */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#F8FAFC]" />
        </div>

        {/* Hero */}
        <section className="relative z-10">
          <div className="max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-14 text-center">
          <motion.h1
            {...rise}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-medium tracking-[-0.032em] leading-[1.02] text-[2.9rem] sm:text-[4rem] lg:text-[4.5rem]"
          >
            The sales work between a <i className="italic">signal</i> and a <i className="italic">booked call</i>.
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
          </div>
        </section>

        {/* Laptop */}
        <section className="relative z-10 px-6 overflow-x-clip">
          <LaptopMock />
        </section>

        {/* What each engine produces — a slow horizontal band of the actual
           output; pointer or focus inside eases it to a stop */}
        <section id="engines" className="relative z-10 overflow-x-clip">
          <div className="relative pt-10 sm:pt-14 pb-20 sm:pb-28">
            <div className="max-w-2xl mx-auto px-6 text-center">
              <h2 className="font-display text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">
                Four engines that produce work you can send.
              </h2>
              <p className="mt-5 text-[17px] text-slate-600 leading-[1.6] mx-auto max-w-[46ch]">
                Nothing leaves your workspace on its own. Each engine drafts, and you approve.
                Point at a card to stop the row and read it.
              </p>
            </div>

            <EngineMarquee />
          </div>
        </section>
       </div>

        {/* Infrastructure */}
        <section id="infra">
          <div className="max-w-5xl mx-auto px-6 pt-8 pb-20 sm:pb-24">
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">The infrastructure underneath</h2>
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
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06]">Sales AI can't fail silently.</h2>
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
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-medium tracking-[-0.028em] leading-[1.06] mb-10">Questions</h2>
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
              <h2 className="font-display text-[2.1rem] sm:text-[3.25rem] font-medium tracking-[-0.032em] leading-[1.04] max-w-[18ch] mx-auto text-white">
                Turn raw signals into <i className="italic">closed revenue</i>.
              </h2>
              <p className="mt-6 text-[15px] sm:text-base text-slate-300/90 leading-[1.65] max-w-[52ch] mx-auto">
                Register, answer a few questions about what you sell, and the engines start
                producing against your ICP — outbound, scorecards, battlecards and briefings.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={primary} className="w-full sm:w-auto bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-slate-100 transition-colors text-sm">
                  Get started
                </button>
                <button onClick={signIn} className="w-full sm:w-auto bg-white/10 hover:bg-white/[0.18] border border-white/20 text-white font-medium px-7 py-3.5 rounded-full transition-colors text-sm backdrop-blur-sm">
                  Sign in
                </button>
              </div>
              <p className="mt-8 font-mono text-[11px] sm:text-xs text-white/45">
                No token markup. Free-tier AI included. Cancel anytime.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
            <div>
              <div className="flex items-center gap-2.5">
                <Mark className="w-7 h-7" />
                <span className="font-semibold text-slate-900">Whipstitch</span>
              </div>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-[32ch]">
                The sales work between a signal and a booked call, generated and staged for your review.
              </p>
            </div>
            {[
              ['What it produces', [
                ['Outbound Queue', '#engines'],
                ['Deal Health', '#engines'],
                ['Competitor Playbooks', '#engines'],
                ['Call Prep', '#engines'],
              ]],
              ['Under the hood', [
                ['Logic & ICP Studio', '#infra'],
                ['Inbound Pipeline', '#infra'],
                ['BYOK Vault', '#infra'],
                ['Pipeline Analytics', '#infra'],
              ]],
              ['More', [
                ['API docs', '/docs'],
                ['Questions', '#faq'],
              ]],
            ].map(([heading, links]) => (
              <div key={heading}>
                <div className="text-[13px] font-semibold text-slate-900">{heading}</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  {links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="hover:text-slate-900 transition-colors">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Whipstitch</span>
            <div className="flex items-center gap-5">
              <button onClick={signIn} className="hover:text-slate-700 transition-colors">Sign in</button>
              <button onClick={primary} className="hover:text-slate-700 transition-colors">Get started</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
