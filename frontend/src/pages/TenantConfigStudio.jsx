import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, Layers, Clock, Building2, Globe, ShieldAlert, Plus, X, RefreshCw } from 'lucide-react';
import { fetchTenantConfig, saveTenantConfig } from '../api';

export default function TenantConfigStudio({ currentTenant }) {
  const [minEmp, setMinEmp] = useState(50);
  const [maxEmp, setMaxEmp] = useState(500);
  const [slaWindow, setSlaWindow] = useState(15);
  const [industries, setIndustries] = useState(['Fintech', 'D2C', 'SaaS', 'B2B Software']);
  const [newIndustry, setNewIndustry] = useState('');
  const [geographies, setGeographies] = useState(['India', 'UAE', 'UK', 'US']);
  const [newGeography, setNewGeography] = useState('');
  const [blocklist, setBlocklist] = useState(['competitor.com', 'blocklist.com', 'spam.net']);
  const [newBlocklistDomain, setNewBlocklistDomain] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const config = await fetchTenantConfig(currentTenant);
        if (!isMounted || !config) return;

        const icp = config.icp_criteria || {};
        if (icp.employee_count_min !== undefined) setMinEmp(icp.employee_count_min);
        if (icp.employee_count_max !== undefined) setMaxEmp(icp.employee_count_max);
        if (Array.isArray(icp.target_industries)) setIndustries(icp.target_industries);
        if (Array.isArray(icp.geographies)) setGeographies(icp.geographies);
        if (config.sla_window_minutes !== undefined) setSlaWindow(config.sla_window_minutes);
        if (Array.isArray(config.competitor_blocklist)) setBlocklist(config.competitor_blocklist);
      } catch (e) {
        console.warn('Failed to load tenant config', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [currentTenant]);

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

  const handleAddGeography = () => {
    if (newGeography.trim() && !geographies.includes(newGeography.trim())) {
      setGeographies([...geographies, newGeography.trim()]);
      setNewGeography('');
    }
  };

  const handleRemoveGeography = (geo) => {
    setGeographies(geographies.filter((g) => g !== geo));
  };

  const handleAddBlocklist = () => {
    const clean = newBlocklistDomain.trim().toLowerCase().replace('https://', '').replace('http://', '').replace('/', '');
    if (clean && !blocklist.includes(clean)) {
      setBlocklist([...blocklist, clean]);
      setNewBlocklistDomain('');
    }
  };

  const handleRemoveBlocklist = (domain) => {
    setBlocklist(blocklist.filter((d) => d !== domain));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveTenantConfig(currentTenant, {
        enrichment_waterfall_order: ['apollo', 'people_data_labs', 'crawl4ai', 'llm_fallback'],
        icp_criteria: {
          target_industries: industries,
          employee_count_min: parseInt(minEmp) || 50,
          employee_count_max: parseInt(maxEmp) || 500,
          geographies: geographies,
        },
        sla_window_minutes: parseInt(slaWindow) || 15,
        competitor_blocklist: blocklist,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">ICP & Logic Studio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Ideal Customer Profile boundaries, target geographies, competitor blocklists, and SLA thresholds.
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
            Loading saved configuration...
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* 1. Employee Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>01 &bull; Employee Headcount Boundaries</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-slate-600">Minimum Headcount</label>
              <input
                type="number"
                value={minEmp}
                onChange={(e) => setMinEmp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-slate-600">Maximum Headcount</label>
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
              placeholder="Add industry (e.g. Quick-Commerce, Logistics)"
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

        {/* 3. Target Geographies */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Globe className="w-4 h-4 text-slate-600" />
            <span>03 &bull; Target Commercial Geographies</span>
          </div>
          <p className="text-xs text-slate-500">
            Prospects located outside these regions are penalized during qualification scoring.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {geographies.map((geo) => (
              <span
                key={geo}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-xs sm:text-sm font-medium border border-blue-200"
              >
                <span>{geo}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGeography(geo)}
                  className="text-blue-400 hover:text-blue-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-3 max-w-md pt-2">
            <input
              type="text"
              placeholder="Add geography (e.g. Singapore, Germany)"
              value={newGeography}
              onChange={(e) => setNewGeography(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddGeography}
              className="btn-secondary text-xs sm:text-sm px-4"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* 4. Competitor Blocklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>04 &bull; Competitor & Disqualified Domains (Circuit Breaker)</span>
          </div>
          <p className="text-xs text-slate-500">
            Accounts matching these domains or company keywords are immediately disqualified with zero credit waste.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {blocklist.map((dom) => (
              <span
                key={dom}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-800 rounded-lg text-xs sm:text-sm font-medium border border-rose-200"
              >
                <span>{dom}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBlocklist(dom)}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-3 max-w-md pt-2">
            <input
              type="text"
              placeholder="Add competitor domain (e.g. rival.com)"
              value={newBlocklistDomain}
              onChange={(e) => setNewBlocklistDomain(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs sm:text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddBlocklist}
              className="btn-secondary text-xs sm:text-sm px-4"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* 5. Waterfall Priority */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>05 &bull; Waterfall Enrichment Sequence</span>
          </div>
          <div className="space-y-2.5">
            {waterfall.map((w) => (
              <div
                key={w.rank}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {w.rank}
                  </span>
                  <span className="font-semibold text-slate-900">{w.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Avg Latency: {w.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SLA Window */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>06 &bull; Sub-15m Speed-to-Lead SLA Window</span>
          </div>
          <div className="space-y-1.5 max-w-sm">
            <label className="text-xs sm:text-sm font-medium text-slate-600">Escalation Threshold (Minutes)</label>
            <input
              type="number"
              value={slaWindow}
              onChange={(e) => setSlaWindow(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving Changes...' : isSaved ? 'ICP Profile Saved Successfully!' : 'Save ICP Profile'}</span>
        </button>
      </form>
    </div>
  );
}
