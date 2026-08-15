import React, { useState } from 'react';

export default function BentoGridFeatures({ setCurrentView }) {
  const [activeStep, setActiveStep] = useState('slack');

  const actionSteps = [
    { id: 'webhook', title: 'Demo Form Ingested', detail: 'Instant webhook trigger (< 5s)', color: 'text-blue-300 border-blue-500/40 bg-blue-950/40' },
    { id: 'enrich', title: 'Verified Work Email', detail: 'Job title, size & tech stack added', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' },
    { id: 'route', title: 'Assigned to Rep', detail: 'Matched directly to Alex Wang (AE)', color: 'text-amber-300 border-amber-500/40 bg-amber-950/40' },
    { id: 'slack', title: 'Slack Deal Alert', detail: 'Instant notification in #sales-leads', color: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/40' },
    { id: 'crm', title: 'Auto-Synced to CRM', detail: 'Logged cleanly in HubSpot & Salesforce', color: 'text-lime border-lime/50 bg-lime/10' },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-container-padding py-16 relative z-10" id="features">
      {/* Section Header */}
      <div className="mb-12 text-left">
        <h2 className="text-3xl sm:text-4xl font-medium text-white mb-3 tracking-tight">
          Built for High-Velocity Sales Teams
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl font-normal">
          From first form submit to signed deal — automate lead enrichment, rep routing, and CRM updates in real time.
        </p>
      </div>

      {/* 4-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CARD 1: Instant Inbound Capture (Col 7) */}
        <div className="md:col-span-7 rounded-2xl bg-[#121319] border border-white/10 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[380px]">
          <div className="z-10">
            <h3 className="text-xl sm:text-2xl font-medium text-white mb-2 group-hover:text-lime transition-colors">
              Instant Inbound Capture
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-md leading-relaxed">
              When a high-intent buyer fills out a demo form, Whipstitch captures their intent and alerts your team in under 5 seconds.
            </p>
          </div>

          {/* Graphic: 3D Stacked Translucent Glass Cards */}
          <div className="relative h-48 w-full mt-6 flex items-end justify-center pointer-events-none">
            {/* Card Stack 1 (Blue Glow) */}
            <div className="absolute bottom-2 left-4 sm:left-8 w-48 h-36 rounded-xl bg-[#1a1f2c]/90 border border-blue-500/60 p-4 transform -rotate-12 shadow-2xl backdrop-blur-md transition-all duration-500 group-hover:-translate-y-2 group-hover:-rotate-14">
              <div className="text-xs text-blue-400 font-semibold mb-1">01. Form Submitted</div>
              <div className="text-xs text-white font-medium">Enterprise Demo Request</div>
              <div className="text-[11px] text-zinc-400 mt-2">Source: Website Inbound</div>
            </div>

            {/* Card Stack 2 (Green Glow) */}
            <div className="absolute bottom-4 left-20 sm:left-32 w-52 h-40 rounded-xl bg-[#16231a]/90 border border-emerald-400/60 p-4 transform -rotate-3 shadow-2xl backdrop-blur-md transition-all duration-500 group-hover:-translate-y-3 group-hover:rotate-0">
              <div className="text-xs text-emerald-400 font-semibold mb-1">02. Auto-Enriched</div>
              <div className="text-xs text-white font-medium">FinScale ($22M ARR)</div>
              <div className="text-[11px] text-emerald-300/80 mt-2">VP Engineering • 180 Emps</div>
            </div>

            {/* Card Stack 3 (Dark Foreground) */}
            <div className="absolute bottom-0 right-4 sm:right-8 w-44 h-32 rounded-xl bg-[#181920]/95 border border-white/20 p-4 transform rotate-6 shadow-2xl backdrop-blur-md transition-all duration-500 group-hover:-translate-y-1 group-hover:rotate-8">
              <div className="text-xs text-zinc-300 font-semibold mb-1">03. Rep Assigned</div>
              <div className="text-xs text-white font-medium">@alex.wang (West AE)</div>
            </div>
          </div>
        </div>

        {/* CARD 2: Instant Rep Routing (Col 5) */}
        <div className="md:col-span-5 rounded-2xl bg-[#121319] border border-white/10 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[380px]">
          <div className="z-10">
            <h3 className="text-xl sm:text-2xl font-medium text-white mb-2 group-hover:text-lime transition-colors">
              Zero-Delay Rep Routing
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base font-normal leading-relaxed">
              Never let a qualified lead sit untouched. Automatically hand off high-value prospects to the right account executive instantly.
            </p>
          </div>

          {/* Graphic: Glowing Vector Curve over Dark Glow Arc */}
          <div className="relative h-48 w-full mt-4 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 160" fill="none">
              {/* Globe Arc Background */}
              <path
                d="M 20 160 A 130 130 0 0 1 280 160"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 50 160 A 100 100 0 0 1 250 160"
                fill="url(#sphereGradient)"
                opacity="0.3"
              />

              {/* Vector Curve */}
              <path
                d="M 40 120 Q 150 25 260 90"
                stroke="#3b82f6"
                strokeWidth="2.5"
                fill="none"
              />

              {/* Node Points */}
              <circle cx="40" cy="120" r="5" fill="#3b82f6" />
              <circle cx="150" cy="51" r="7" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
              <circle cx="260" cy="90" r="5" fill="#3b82f6" />
              
              <defs>
                <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* CARD 3: Verified Contact Intelligence (Col 5) */}
        <div className="md:col-span-5 rounded-2xl bg-[#121319] border border-white/10 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[380px]">
          <div className="z-10">
            <h3 className="text-xl sm:text-2xl font-medium text-white mb-2 group-hover:text-lime transition-colors">
              Verified Lead Intelligence
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base font-normal leading-relaxed">
              Automatically fills in verified work emails, direct phone numbers, and company tech stacks before your reps reach out.
            </p>
          </div>

          {/* Graphic: Concentric Glowing Neon Halos */}
          <div className="relative h-44 w-full mt-4 overflow-hidden flex items-end justify-end">
            <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-blue-600/30 blur-2xl group-hover:bg-blue-500/40 transition-all duration-500"></div>
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/30 blur-xl group-hover:bg-emerald-400/40 transition-all duration-500"></div>
            
            <svg className="w-full h-full relative z-10" viewBox="0 0 240 140" fill="none">
              <circle cx="240" cy="140" r="120" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
              <circle cx="240" cy="140" r="85" stroke="rgba(110, 229, 71, 0.6)" strokeWidth="2" />
              <circle cx="240" cy="140" r="50" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* CARD 4: Automated Outreach & CRM Sync (Col 7) */}
        <div className="md:col-span-7 rounded-2xl bg-[#121319] border border-white/10 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[380px]">
          <div className="z-10">
            <h3 className="text-xl sm:text-2xl font-medium text-white mb-2 group-hover:text-lime transition-colors">
              Automated Outreach & CRM Sync
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-md leading-relaxed">
              Send instant Slack deal alerts, draft personalized outreach sequences, and sync clean records directly to HubSpot & Salesforce.
            </p>
          </div>

          {/* Graphic: Interactive Staggered Live Flow State Cards */}
          <div className="relative h-48 w-full mt-6 flex flex-wrap gap-3 items-center justify-start z-10">
            {actionSteps.map((step) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md flex flex-col gap-0.5 ${
                  step.color
                } ${
                  activeStep === step.id
                    ? 'ring-2 ring-lime scale-105 shadow-lime/20'
                    : 'opacity-85 hover:opacity-100 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-white">{step.title}</span>
                  {activeStep === step.id && (
                    <span className="w-2 h-2 rounded-full bg-lime animate-ping"></span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-300 font-normal">{step.detail}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
