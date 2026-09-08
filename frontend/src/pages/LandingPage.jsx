import React, { useState } from 'react';
import {
  ShieldCheck,
  Inbox,
  Rocket,
  KeyRound,
  Database,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Layers,
  FileText,
  Activity,
  ChevronDown
} from 'lucide-react';

export default function LandingPage({ setCurrentView }) {
  const [openFaq, setOpenFaq] = useState(null);

  const capabilities = [
    {
      title: 'Evidence-Based MEDDPICC Diagnostic',
      desc: 'Ingest raw sales transcripts (.vtt, .txt, .docx, .pdf) and evaluate deals across 8 scoring rubrics with verbatim buyer quotes and anti-sentiment filters.',
      icon: ShieldCheck,
      badge: 'Deal Intelligence',
    },
    {
      title: '5-Stage Waterfall Enrichment',
      desc: 'Automatically enrich inbound webhooks through Apollo, PeopleDataLabs, Crawl4AI BM25 scraping, and LLM fallbacks with deterministic deduplication.',
      icon: Inbox,
      badge: 'Inbound Ingestion',
    },
    {
      title: 'Outbound Discovery & Human-in-the-Loop',
      desc: 'Identify high-fit decision makers, verify company signals, and stage structured Observation-Link-Ask outreach drafts for one-click approval.',
      icon: Rocket,
      badge: 'Outbound Staging',
    },
    {
      title: 'Zero-Capital BYOK Security Vault',
      desc: 'Bring your own API keys for OpenAI, Gemini, Groq, Anthropic, Apollo, and HubSpot with AES-256 Fernet encryption at rest and zero platform markup.',
      icon: KeyRound,
      badge: 'Security & BYOK',
    },
  ];

  const faqs = [
    {
      q: 'How does the zero-capital BYOK model work?',
      a: 'Whipstitch does not resell or mark up third-party APIs. You can either use pre-configured free-tier limits (Gemini 2.0 Flash, Groq Llama 3.3, Google Serper free credits) or provide your own API keys. All keys are encrypted at rest with AES-256 Fernet and decrypted in memory only during workflow execution.',
    },
    {
      q: 'How does the MEDDPICC engine prevent false optimism?',
      a: 'The qualification prompt enforces Rule 1.4: positive meeting sentiment, demo enthusiasm, and polite curiosity are banned from raising scores. Scores only increase when verbatim buyer evidence exists in the transcript. Economic Buyer and Champion scores are hard-capped at 7/15 if direct access or internal selling actions are unverified.',
    },
    {
      q: 'What transcript formats are supported?',
      a: 'Whipstitch accepts raw text paste, WebVTT (.vtt) and SRT (.srt) subtitle exports with automatic timestamp stripping, Microsoft Word (.docx) documents, and multi-page PDF files.',
    },
    {
      q: 'How is data synchronized to HubSpot CRM?',
      a: 'We use bidirectional HubSpot API integration. Inbound leads are staged or synced with enriched firmographic properties, while MEDDPICC diagnostic runs update deal stages (Advance, Rescue, Nurture, Disqualify) and attach executive follow-up drafts directly to the CRM record.',
    },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Production-Grade B2B Lead & Deal Orchestration Engine
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Ingest leads durably, enrich them through a waterfall, and score deals on the evidence in the transcript.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whipstitch automates inbound webhook processing, waterfall contact enrichment, outbound prospect discovery, and strict 8-box MEDDPICC deal diagnostics with zero platform markup.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <span>Open Interactive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentView('deal-health')}
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            <span>Test MEDDPICC Diagnostic</span>
          </button>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Engine Architecture & Features</h2>
          <p className="text-xs text-slate-500">Built on Temporal, FastAPI, PostgreSQL, and Redis for distributed reliability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800 border border-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Workflow Diagram / Mechanics */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold text-emerald-800">System Mechanics</span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">End-to-End Orchestration Lifecycle</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs text-slate-500 font-bold">Step 1 &bull; Ingest</div>
              <div className="font-semibold text-slate-900">Idempotent Webhooks</div>
              <p className="text-xs text-slate-600 leading-relaxed">Redis Lua token bucket & SHA-256 keys guarantee deduplication.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs text-slate-500 font-bold">Step 2 &bull; Enrich</div>
              <div className="font-semibold text-slate-900">Waterfall Cascade</div>
              <p className="text-xs text-slate-600 leading-relaxed">Apollo &rarr; PeopleDataLabs &rarr; Crawl4AI &rarr; Gemini LLM fallback.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs text-slate-500 font-bold">Step 3 &bull; Score</div>
              <div className="font-semibold text-slate-900">8-Box MEDDPICC</div>
              <p className="text-xs text-slate-600 leading-relaxed">Evidence quotes verified against strict anti-sentiment rubrics.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs text-slate-500 font-bold">Step 4 &bull; Sync</div>
              <div className="font-semibold text-slate-900">HubSpot CRM Sync</div>
              <p className="text-xs text-slate-600 leading-relaxed">Stage recommendations, executive notes & follow-up emails synced.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Technical and operational details about Whipstitch.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between text-xs font-semibold text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

      {/* Clean Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
              W
            </div>
            <span className="font-semibold text-slate-900">Whipstitch</span>
            <span>&bull;</span>
            <span>B2B GTM & Deal Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('privacy')}
              className="hover:text-slate-900 transition"
            >
              Privacy Policy
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-900 transition"
            >
              Terms and Conditions
            </button>
            <span>&bull;</span>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
