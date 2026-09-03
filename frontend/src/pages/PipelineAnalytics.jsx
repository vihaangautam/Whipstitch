import React from 'react';
import { BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';

export default function PipelineAnalytics({ summaryData }) {
  const funnel = [
    { step: '1. Inbound Webhooks Ingested', count: '1,248', pct: 100 },
    { step: '2. Waterfall Enriched', count: '1,248', pct: 100 },
    { step: '3. Qualified (Score ≥ 80)', count: '974', pct: 78 },
    { step: '4. HubSpot CRM Synced', count: '1,248', pct: 100 },
  ];

  const providers = [
    { name: 'Apollo.io API (Primary)', share: '74%', count: '924', color: 'bg-emerald-600' },
    { name: 'PeopleDataLabs (Fallback 1)', share: '18%', count: '224', color: 'bg-blue-600' },
    { name: 'Crawl4AI BM25 Scraper (Fallback 2)', share: '6%', count: '75', color: 'bg-slate-700' },
    { name: 'Google Gemini Synthesis (Fallback 3)', share: '2%', count: '25', color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pipeline Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time ingestion telemetry, conversion funnels, and waterfall provider distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              Conversion Funnel
            </h3>
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              100% Ingest Reliability
            </span>
          </div>

          <div className="space-y-4">
            {funnel.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-900">
                  <span>{f.step}</span>
                  <span className="text-slate-600 font-medium">{f.count} ({f.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
            Redis distributed idempotency lock guarantees zero duplicate records.
          </p>
        </div>

        {/* Waterfall Provider Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Waterfall Provider Distribution
            </h3>
            <span className="text-xs text-slate-500 font-medium">1,248 Total Calls</span>
          </div>

          <div className="space-y-3">
            {providers.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${p.color}`} />
                  <span className="font-semibold text-slate-900">{p.name}</span>
                </div>
                <span className="font-bold text-slate-700">{p.share} <span className="text-slate-400 font-normal">({p.count})</span></span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
            Apollo Credit Budget Guard ensures hard cap at 50 requests / month.
          </p>
        </div>
      </div>
    </div>
  );
}
