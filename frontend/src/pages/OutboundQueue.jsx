import React, { useState, useEffect } from 'react';
import { Rocket, CheckCircle2, XCircle, RefreshCw, Building2, User, Linkedin, Globe, Sparkles } from 'lucide-react';
import { fetchOutboundProspects, triggerOutboundBatch, approveOutboundProspect } from '../api';

export default function OutboundQueue({ currentTenant, onTriggerSuccess }) {
  const [prospects, setProspects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadProspects = async () => {
    setIsLoading(true);
    const data = await fetchOutboundProspects(currentTenant);
    setProspects(data);
    setIsLoading(false);
  };

  useEffect(() => { loadProspects(); }, [currentTenant]);

  const handleTriggerBatch = async () => {
    setIsTriggering(true);
    try {
      await triggerOutboundBatch(currentTenant, 3);
      if (onTriggerSuccess) onTriggerSuccess();
      setTimeout(loadProspects, 1000);
    } catch (e) { console.warn("Trigger failed", e); }
    finally { setIsTriggering(false); }
  };

  const handleApprove = async (id) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, scrape_status: 'approved' } : p)));
    try { await approveOutboundProspect(id, 'approve'); } catch (e) { console.warn(e); }
  };

  const handleReject = async (id) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, scrape_status: 'rejected' } : p)));
    try { await approveOutboundProspect(id, 'reject', 'Manual rejection'); } catch (e) { console.warn(e); }
  };

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Outbound Prospecting Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified decision makers, Crawl4AI signal filtering & Human-in-the-Loop CRM staging.
          </p>
        </div>
        <button
          onClick={handleTriggerBatch}
          disabled={isTriggering}
          className="btn-primary px-4 py-2.5 text-sm"
        >
          {isTriggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          <span>{isTriggering ? 'Running Discovery...' : 'Trigger Batch (3)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-sm text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Querying staged prospects...
          </div>
        ) : prospects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-3 shadow-card">
            <p className="text-sm text-slate-600 font-medium">No prospects currently awaiting approval.</p>
            <button
              onClick={handleTriggerBatch}
              className="text-sm font-semibold text-emerald-800 hover:text-emerald-900 transition"
            >
              Trigger batch discovery now &rarr;
            </button>
          </div>
        ) : (
          prospects.map((p) => {
            const isApproved = p.scrape_status === 'approved';
            const isRejected = p.scrape_status === 'rejected';
            const hasContact = Boolean(p.decision_maker_name);

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                      {p.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-slate-900">{p.company_name}</h3>
                        <a
                          href={`https://${p.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {p.domain}
                        </a>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {p.industry || 'B2B Software'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isApproved ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approved & Synced
                      </span>
                    ) : isRejected ? (
                      <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" /> Rejected
                      </span>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        {p.scrape_status === 'needs_contact_research' && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold">
                            Needs Contact
                          </span>
                        )}
                        <button
                          onClick={() => handleReject(p.id)}
                          className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={!hasContact}
                          title={hasContact ? undefined : 'A verified contact is required before this can be staged in CRM'}
                          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          {hasContact ? 'Approve & Stage in CRM' : 'Needs a Contact'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Maker & Fit Markdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <div className="text-xs text-slate-400 font-semibold">Decision Maker</div>
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      {hasContact ? p.decision_maker_name : <span className="text-slate-400 font-medium">Not resolved yet</span>}
                    </div>
                    <div className="text-xs text-slate-600">
                      {hasContact
                        ? p.decision_maker_title
                        : `Searching for: ${p.decision_maker_title || 'decision maker'}`}
                    </div>
                    {p.decision_maker_linkedin && (
                      <a
                        href={p.decision_maker_linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1 font-medium pt-1"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> View LinkedIn Profile
                      </a>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <div className="text-xs text-slate-400 font-semibold">Research Findings</div>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                      {p.fit_markdown || (
                        <span className="text-slate-400">No research findings yet for this account.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
