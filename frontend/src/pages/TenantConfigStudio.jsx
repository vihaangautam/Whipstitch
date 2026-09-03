import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, Layers, Clock, Building2, Plus, X } from 'lucide-react';
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
    { rank: 1, name: 'Apollo.io API (Primary)', latency: '42ms' },
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

  const handleRemoveIndustry = (ind) => {
    setIndustries(industries.filter((i) => i !== ind));
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
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">ICP & Logic Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure Ideal Customer Profile boundaries, waterfall enrichment priorities, and SLA escalation thresholds.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* 1. Employee Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>01 &bull; Employee Count Boundaries</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-slate-600">Minimum Employees</label>
              <input
                type="number"
                value={minEmp}
                onChange={(e) => setMinEmp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-slate-600">Maximum Employees</label>
              <input
                type="number"
                value={maxEmp}
                onChange={(e) => setMaxEmp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Target Industries */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>02 &bull; Target ICP Industries</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {industries.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs sm:text-sm font-medium border border-slate-200"
              >
                <span>{ind}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIndustry(ind)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-3 max-w-md pt-2">
            <input
              type="text"
              placeholder="Add industry (e.g. Healthcare Tech)"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddIndustry}
              className="btn-secondary text-xs sm:text-sm px-4"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* 3. Waterfall Priority */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>03 &bull; Waterfall Enrichment Sequence</span>
          </div>
          <div className="space-y-2.5">
            {waterfall.map((w) => (
              <div
                key={w.rank}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {w.rank}
                  </span>
                  <span className="font-semibold text-slate-900">{w.name}</span>
                </div>
                <span className="text-slate-500 text-xs font-medium">~{w.latency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SLA Window */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>04 &bull; SLA Escalation Timer</span>
          </div>
          <div className="max-w-xs space-y-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-600">Uncontacted Lead Escalation Window (Minutes)</label>
            <input
              type="number"
              value={slaWindow}
              onChange={(e) => setSlaWindow(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved && (
            <span className="text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tenant configuration saved successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
