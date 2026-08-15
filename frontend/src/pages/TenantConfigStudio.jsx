import React, { useState } from 'react';
import { saveTenantConfig } from '../api';

export default function TenantConfigStudio({ currentTenant }) {
  const [minEmp, setMinEmp] = useState(50);
  const [maxEmp, setMaxEmp] = useState(500);
  const [slaWindow, setSlaWindow] = useState(15);
  const [industries, setIndustries] = useState(['Fintech', 'D2C', 'SaaS', 'B2B Software']);
  const [newIndustry, setNewIndustry] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const waterfall = [
    { rank: 1, name: 'Apollo API (Primary)', latency: '42ms' },
    { rank: 2, name: 'PeopleDataLabs (Fallback 1)', latency: '85ms' },
    { rank: 3, name: 'Crawl4AI BM25 Scraper (Fallback 2)', latency: '350ms' },
    { rank: 4, name: 'Google Gemini LLM (Final Fallback)', latency: '400ms' },
  ];

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveTenantConfig(currentTenant, {
        enrichment_waterfall_order: ['apollo', 'people_data_labs', 'crawl4ai', 'llm_fallback'],
        icp_criteria: { target_industries: industries, employee_count_min: parseInt(minEmp), employee_count_max: parseInt(maxEmp) },
        sla_window_minutes: parseInt(slaWindow),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) { console.warn(err); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">ICP & Logic Studio</h1>
        <p className="text-body-md text-on-surface-variant mt-1">ICP boundaries, waterfall priority, and SLA escalation thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. Employee Count */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-lime">
            <span className="material-symbols-outlined text-xl">tune</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider font-mono">01 · Employee Count Boundaries</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-on-surface-variant block" htmlFor="min-emp">Minimum Employees</label>
              <input
                id="min-emp"
                type="number"
                value={minEmp}
                onChange={(e) => setMinEmp(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-body-md text-primary font-mono focus:border-lime focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-on-surface-variant block" htmlFor="max-emp">Maximum Employees</label>
              <input
                id="max-emp"
                type="number"
                value={maxEmp}
                onChange={(e) => setMaxEmp(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-body-md text-primary font-mono focus:border-lime focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Target Industries */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-lime">
            <span className="material-symbols-outlined text-xl">category</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider font-mono">02 · Target Industries</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {industries.map((ind, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant text-body-md font-mono text-primary flex items-center gap-2">
                <span>{ind}</span>
                <button
                  type="button"
                  onClick={() => setIndustries(industries.filter((i) => i !== ind))}
                  className="text-on-surface-variant hover:text-error transition-colors cursor-pointer text-base"
                  aria-label={`Remove ${ind}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-sm pt-1">
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="Add industry..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-body-md text-primary font-mono focus:border-lime focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddIndustry}
              className="bg-surface-container-high hover:bg-surface-container border border-outline-variant text-primary px-3 py-1.5 rounded text-sm font-nav-item cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* 3. Waterfall Order */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-lime">
            <span className="material-symbols-outlined text-xl">water_drop</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider font-mono">03 · Enrichment Waterfall</h3>
          </div>
          <div className="space-y-2">
            {waterfall.map((item) => (
              <div key={item.rank} className="p-3 bg-surface-container-lowest border border-outline-variant rounded flex items-center justify-between font-mono text-body-md">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-bold text-on-surface-variant">
                    {item.rank}
                  </span>
                  <span className="text-primary font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant text-xs">{item.latency}</span>
                  <span className="badge-lime font-bold">active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SLA Window */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-lime">
            <span className="material-symbols-outlined text-xl">timer</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider font-mono">04 · SLA Escalation Timer</h3>
          </div>
          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-mono text-on-surface-variant block" htmlFor="sla-window">Alert Window (Minutes)</label>
            <input
              id="sla-window"
              type="number"
              value={slaWindow}
              onChange={(e) => setSlaWindow(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-body-md text-primary font-mono focus:border-lime focus:outline-none"
            />
            <span className="text-xs text-on-surface-variant font-mono block mt-1">
              Fires Slack alert if hot lead (score≥80) unassigned after {slaWindow}m.
            </span>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
          {isSaved && (
            <span className="text-xs font-mono text-lime flex items-center gap-1.5 animate-fade-in font-bold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Saved to PostgreSQL & Redis</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
