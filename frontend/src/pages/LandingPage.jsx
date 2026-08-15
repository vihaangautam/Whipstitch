import React, { useState } from 'react';
import SeamAnimation from '../components/SeamAnimation';
import BentoGridFeatures from '../components/BentoGridFeatures';

export default function LandingPage({ setCurrentView, onSimulateEvent }) {
  const [activeTab, setActiveTab] = useState('inbound');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'Is this production-ready for Enterprise?',
      a: 'Yes. Whipstitch is built on scalable, fault-tolerant infrastructure designed to handle tens of thousands of concurrent orchestrations. We provide SLA guarantees and dedicated support for enterprise tiers.',
    },
    {
      q: 'How do you prevent duplicates in the CRM?',
      a: 'We use a multi-stage deduplication engine before pushing to your CRM. It checks primary keys, secondary identifiers, and employs fuzzy matching on company names and domains to merge data rather than duplicate it.',
    },
    {
      q: 'What CRMs do you support natively?',
      a: 'We offer deep, bi-directional sync with Salesforce, HubSpot, and Pipedrive natively. For custom setups, our robust API and webhook capabilities allow integration with virtually any system of record.',
    },
  ];

  return (
    <div className="flex-grow z-10 relative flex flex-col items-center bg-[#0C0D10] text-on-surface">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION (Spline Plain Background & Exact Pill CTAs)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full max-w-7xl mx-auto px-container-padding pt-4 md:pt-6 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: High Impact Copy & CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-[1.12] mb-6 tracking-tight">
              Your fast lane to intelligent lead orchestration.
            </h1>

            <p className="text-zinc-400 text-lg sm:text-xl font-normal mb-10 leading-relaxed max-w-xl">
              Experience ultra-low latency, global reach, and instant scalability. All through a single, intelligent pipeline.
            </p>

            <div className="flex flex-row gap-3 items-center">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-white hover:bg-zinc-200 text-black px-7 py-3.5 rounded-full font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Book a demo
              </button>
              <button
                onClick={() => setCurrentView('config')}
                className="bg-transparent hover:bg-white/5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-7 py-3.5 rounded-full font-medium text-sm transition-all active:scale-95 cursor-pointer"
              >
                View Documentation
              </button>
            </div>
          </div>

          {/* Right Column: 3D Revolving Fluid Noise Sphere */}
          <div className="lg:col-span-6 w-full flex items-center justify-center relative">
            <SeamAnimation />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUSTED BY SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full border-y border-outline-variant bg-surface-container-low py-10 relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-container-padding flex flex-col items-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-8">
            Trusted by Revenue Operations at
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
              <span className="material-symbols-outlined text-3xl">token</span>
              <span>NexaCore</span>
            </div>
            <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
              <span className="material-symbols-outlined text-3xl">hive</span>
              <span>Synapse Systems</span>
            </div>
            <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
              <span className="material-symbols-outlined text-3xl">architecture</span>
              <span>Vertex AI</span>
            </div>
            <div className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
              <span className="material-symbols-outlined text-3xl">language</span>
              <span>Global Data Grid</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CORE ORCHESTRATION VECTORS (MINIMALIST BENTO GRID)
          ═══════════════════════════════════════════════════════════════ */}
      <BentoGridFeatures setCurrentView={setCurrentView} />

      {/* ═══════════════════════════════════════════════════════════════
          "THE ENGINE" BENTO GRID SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-surface-container-low py-24 mt-16 border-y border-outline-variant z-10" id="engine">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-display-lg font-bold text-primary mb-4 tracking-tight">The Orchestration Engine</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Built on enterprise-grade architecture. We frame technical reliability as budget protection and absolute data integrity.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap auto-rows-[minmax(200px,auto)]">
            {/* Feature 1: Large Span */}
            <div className="md:col-span-2 border border-outline-variant rounded-lg bg-surface p-6 flex flex-col justify-between group hover:border-lime/50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary group-hover:text-lime transition-colors">memory</span>
                  <span className="px-2 py-1 rounded bg-surface-container border border-outline-variant font-label-sm text-label-sm text-on-surface-variant">Architecture</span>
                </div>
                <h3 className="font-headline-lg text-headline-lg font-bold text-primary mb-2">Temporal Saga Pattern</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-lg leading-relaxed">
                  Long-running workflows demand resilience. Our engine uses the Saga pattern to handle distributed transactions. If a step fails (e.g., API timeout), the system autonomously executes compensating logic, ensuring no lead is ever left in a phantom state.
                </p>
              </div>
              <div className="h-2 w-full bg-surface-container rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lime to-status-blue w-full animate-[pulse_3s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {/* Feature 2: Tall Span */}
            <div className="md:row-span-2 border border-outline-variant rounded-lg bg-surface p-6 flex flex-col group hover:border-status-blue/50 transition-colors relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-status-blue/5 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="material-symbols-outlined text-3xl text-primary group-hover:text-status-blue transition-colors">filter_alt</span>
                <span className="px-2 py-1 rounded bg-surface-container border border-outline-variant font-label-sm text-label-sm text-on-surface-variant">Data Integrity</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg font-bold text-primary mb-2 relative z-10">Zero Duplicates Guarantee</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 relative z-10 flex-grow leading-relaxed">
                Duplicate records destroy CRM integrity and AE trust. Whipstitch employs deterministic hashing on composite keys (Email + Domain + Source) before any commit.
              </p>
              <div className="bg-surface-container rounded border border-outline-variant p-4 mt-auto relative z-10">
                <div className="flex justify-between items-center mb-2 border-b border-outline-variant pb-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Incoming Lead</span>
                  <span className="material-symbols-outlined text-[16px] text-lime">arrow_downward</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] text-on-secondary-container">Hash: a7b89f21c...</span>
                  <span className="px-1.5 py-0.5 rounded bg-error/10 text-error text-[10px] border border-error/30 font-bold">Collision</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Action</span>
                  <span className="font-label-sm text-label-sm text-status-blue font-bold">Merge & Update</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="border border-outline-variant rounded-lg bg-surface p-6 group hover:border-status-pink/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-3xl text-primary group-hover:text-status-pink transition-colors">speed</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-primary mb-2">Rate Limit Protection</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Intelligent queuing and backoff algorithms protect your API budgets and ensure compliance with external service limits automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-outline-variant rounded-lg bg-surface p-6 group hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-3xl text-primary transition-colors">webhook</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-primary mb-2">Agnostic Webhooks</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Consume signals from any modern application. If it can send a POST request, Whipstitch can orchestrate it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TECHNICAL FAQ ACCORDION SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full max-w-3xl mx-auto px-container-padding py-section-margin mt-8 mb-24 z-10" id="faq">
        <h2 className="font-display-lg text-display-lg font-bold text-primary mb-8 text-center tracking-tight">Technical FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border border-outline-variant bg-surface-container rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="font-headline-md text-headline-md text-primary font-semibold">{f.q}</span>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-lime' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-on-surface-variant font-body-md text-body-md leading-relaxed animate-fade-in border-t border-outline-variant/40 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER CTA SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest py-16 mt-auto relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-lime/5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-container-padding text-center relative z-10">
          <h2 className="font-display-lg text-display-lg font-bold text-primary mb-4 tracking-tight">Ready to architect your revenue engine?</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-xl mx-auto leading-relaxed">
            Deploy structured logic to your pipeline today. Stop manually stitching tools together.
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-lime text-charcoal font-nav-item text-nav-item px-8 py-3 rounded border border-lime hover:bg-[#a6de10] transition-all active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 mx-auto cursor-pointer font-semibold"
          >
            <span>Get Started</span>
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          </button>
          <div className="mt-16 flex flex-col md:flex-row justify-between items-center border-t border-outline-variant pt-8 text-on-surface-variant font-body-md text-body-md">
            <div>© 2026 Whipstitch AI. All rights reserved.</div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a className="hover:text-primary transition-colors" href="#features">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#features">Terms of Service</a>
              <a className="hover:text-primary transition-colors" href="/docs" target="_blank" rel="noreferrer">API Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
