import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
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

/* ── Dashboard mock for the laptop screen ─────────────────────── */
function ScreenMock() {
  const kpis = [
    ['Inbound this week', '142', 'text-slate-900'],
    ['SLA compliance', '100%', 'text-emerald-600'],
    ['Avg lead score', '84', 'text-slate-900'],
    ['Outbound staged', '18', 'text-slate-900'],
  ];
  return (
    <div className="bg-[#F8FAFC] text-left select-none">
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          <span className="hidden sm:inline text-slate-500 ml-1.5">Whipstitch — Dashboard</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Workspace active
        </span>
      </div>
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-4 gap-2.5">
          {kpis.map(([label, val, color]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="text-[10px] text-slate-500">{label}</div>
              <div className={`text-lg font-bold mt-0.5 ${color}`}>{val}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7 rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="text-xs font-semibold text-slate-900 mb-2">Inbound and outbound, last 7 days</div>
            <div className="relative h-28 rounded-md bg-slate-50 border border-slate-100 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 120">
                <path d="M0,96 C70,90 120,80 180,66 C240,52 300,28 400,14 L400,120 L0,120 Z" fill="#0596691a" />
                <path d="M0,96 C70,90 120,80 180,66 C240,52 300,28 400,14" fill="none" stroke="#059669" strokeWidth="2" />
                <path d="M0,104 C80,98 150,92 220,80 C290,68 340,50 400,38" fill="none" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="col-span-5 rounded-lg border border-slate-200 bg-white p-3.5 space-y-2 text-[11px]">
            <div className="font-semibold text-slate-900">Live event stream</div>
            <div className="space-y-1 text-slate-500">
              <div className="text-emerald-700">Webhook parsed — Northwind Retail</div>
              <div>Redis lock acquired</div>
              <div>Waterfall matched Tier 1, drafting outreach</div>
              <div>Staged for review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Laptop with a scroll-linked tilt (the one motion moment) ── */
function LaptopMock() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.4'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [2, 2] : [15, 2]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.945, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [44, 0]);

  return (
    <div ref={ref} className="relative max-w-3xl mx-auto" style={{ perspective: 1400 }}>
      <motion.div style={{ rotateX, scale, y, transformOrigin: 'center bottom' }}>
        <div className="rounded-t-xl border-[11px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20 overflow-hidden">
          <div className="rounded-t-md overflow-hidden border-b border-slate-200">
            <ScreenMock />
          </div>
        </div>
        <div className="relative mx-auto w-[103%] -left-[1.5%] h-4 rounded-b-lg bg-slate-800 flex justify-center">
          <div className="w-16 h-1.5 rounded-b bg-slate-900/60" />
        </div>
        <div className="mx-auto w-[80%] h-4 bg-slate-900/10 blur-lg rounded-full mt-1" />
      </motion.div>

      {/* two calm annotations, no glow */}
      <div className="absolute -bottom-3 left-2 md:-left-14 w-60 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg hidden sm:block">
        <div className="text-xs font-semibold text-slate-900">Pre-call dossier</div>
        <p className="text-[11px] text-slate-600 leading-snug mt-1">
          Scaling 2 to 8 SDRs after a Series A. Comparing Apollo and Clari.
        </p>
      </div>
      <div className="absolute -top-6 right-2 md:-right-12 w-60 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg hidden sm:block">
        <div className="text-xs font-semibold text-slate-900">Battlecard, ready</div>
        <p className="text-[11px] text-slate-600 leading-snug mt-1">
          Three rivals identified from your profile. One question each to displace them.
        </p>
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
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Nav */}
      <div className="sticky top-4 z-40 px-4">
        <nav className={`max-w-5xl mx-auto rounded-full border px-4 sm:px-5 py-2.5 flex items-center justify-between transition-colors ${
          scrolled ? 'glass-panel border-slate-200 shadow-sm' : 'bg-transparent border-transparent'
        }`}>
          <a href="#top" className="flex items-center gap-2.5">
            <Mark className="w-8 h-8" />
            <span className="text-base font-bold tracking-tight">Whipstitch</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-slate-600">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-slate-900 transition-colors">{n.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={signIn} className="text-[13px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Sign in
            </button>
            <button onClick={primary} className="text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-full transition-colors">
              Get started
            </button>
          </div>
        </nav>
      </div>

      <main id="top">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-16 sm:pt-24 pb-14 text-center">
          <motion.h1
            {...rise}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.6rem] sm:text-6xl font-bold tracking-[-0.035em] leading-[1.06]"
          >
            The sales work between a signal and a booked call.
          </motion.h1>
          <motion.p
            {...rise}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed mx-auto max-w-[46ch]"
          >
            Set up your workspace once. Whipstitch then finds accounts hiring for your category,
            scores your deals from call transcripts, writes battlecards for the rivals you lose to,
            and briefs you before every meeting.
          </motion.p>
          <motion.div
            {...rise}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <button onClick={primary} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-colors group">
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#engines" className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-3.5 transition-colors">
              See what it produces
            </a>
          </motion.div>
          <motion.p {...rise} transition={{ duration: 0.6, delay: 0.24 }} className="mt-6 text-xs text-slate-500">
            Free-tier AI included. No credit card. Bring your own keys.
          </motion.p>
        </section>

        {/* Laptop */}
        <section className="px-6 pb-24 sm:pb-32">
          <LaptopMock />
        </section>

        {/* What each engine produces */}
        <section id="engines" className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em] max-w-2xl">
              Four engines that generate work. You review the output before it goes anywhere.
            </h2>

            <div className="mt-16 space-y-16 sm:space-y-24">
              {ENGINES.map(({ icon: Icon, name, body, Artifact }, i) => (
                <div key={name} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                  <div className={i % 2 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-2.5 text-slate-900">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                      <span className="text-lg font-bold tracking-tight">{name}</span>
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
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em]">The infrastructure underneath</h2>
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
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.02em]">Sales AI can't fail silently.</h2>
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
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em] mb-10">Questions</h2>
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
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.02em]">Set up your workspace</h2>
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
