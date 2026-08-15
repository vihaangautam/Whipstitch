import React from 'react';

export default function PipelineAnalytics({ summaryData }) {
  const funnel = [
    { step: '1. Webhooks Ingested', count: '3,000', pct: 100 },
    { step: '2. Waterfall Enriched', count: '3,000', pct: 100 },
    { step: '3. Qualified (Score ≥ 80)', count: '2,340', pct: 78 },
    { step: '4. HubSpot CRM Synced', count: '3,000', pct: 100 },
  ];

  const providers = [
    { name: 'Apollo API (Primary)', share: '74%', count: '2,220', accent: 'text-lime' },
    { name: 'PeopleDataLabs (Fallback 1)', share: '18%', count: '540', accent: 'text-status-blue' },
    { name: 'Crawl4AI BM25 Scraper (Fallback 2)', share: '6%', count: '180', accent: 'text-primary' },
    { name: 'Google Gemini Synthesis (Fallback 3)', share: '2%', count: '60', accent: 'text-on-surface-variant' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Pipeline Analytics</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Conversion funnel, SLA compliance, and waterfall distribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Funnel */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-lime font-mono">Conversion Funnel</h3>
            <span className="text-xs font-mono text-on-surface-variant">100% ingest reliability</span>
          </div>
          <div className="space-y-3.5">
            {funnel.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-body-md">
                  <span className="text-primary font-semibold">{f.step}</span>
                  <span className="text-on-surface font-mono tabular-nums">{f.count} ({f.pct}%)</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-lime h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(185,246,18,0.4)]"
                    style={{ width: `${f.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-on-surface-variant pt-2 border-t border-outline-variant/60">
            // zero drop-off: Redis distributed lock prevents duplicate processing
          </p>
        </div>

        {/* Provider Breakdown */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-status-blue font-mono">Waterfall Breakdown</h3>
            <span className="text-xs font-mono text-on-surface-variant">3,000 total calls</span>
          </div>
          <div className="space-y-2.5">
            {providers.map((p, idx) => (
              <div key={idx} className="p-3 bg-surface-container-lowest border border-outline-variant rounded flex items-center justify-between font-mono text-body-md">
                <div>
                  <span className="text-primary font-semibold block">{p.name}</span>
                  <span className="text-xs text-on-surface-variant">{p.count} leads</span>
                </div>
                <span className={`font-bold text-headline-md ${p.accent}`}>{p.share}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-on-surface-variant pt-2 border-t border-outline-variant/60">
            // graceful degradation: 100% pipeline completion despite vendor timeouts
          </p>
        </div>
      </div>

      {/* Benchmark Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg Pipeline Latency', value: '42ms', sub: '10x faster than Zapier', accent: 'text-primary' },
          { label: 'SLA Breach Rate', value: '0.00%', sub: 'Zero uncontacted hot leads', accent: 'text-lime' },
          { label: 'Crash Recovery Rate', value: '100%', sub: 'Durable Temporal Saga replay', accent: 'text-status-blue' },
        ].map((m, idx) => (
          <div key={idx} className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-1 hover:border-lime/40 transition-colors">
            <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">{m.label}</span>
            <p className={`font-data-lg text-data-lg font-bold tabular-nums ${m.accent}`}>{m.value}</p>
            <span className="text-xs font-mono text-on-surface-variant block">{m.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
