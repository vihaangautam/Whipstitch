import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 }, colors: ['#b9f612', '#c0c1ff', '#ffffff'] });
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, scrape_status: 'approved' } : p)));
    try { await approveOutboundProspect(id, 'approve'); } catch (e) { console.warn(e); }
  };

  const handleReject = async (id) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, scrape_status: 'rejected' } : p)));
    try { await approveOutboundProspect(id, 'reject', 'Manual rejection'); } catch (e) { console.warn(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Outbound Queue</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Human-in-the-loop approval staging pipeline.</p>
        </div>
        <button onClick={handleTriggerBatch} disabled={isTriggering} className="btn-primary disabled:opacity-50">
          <span className={`material-symbols-outlined text-[18px] ${isTriggering ? 'animate-spin' : ''}`}>
            {isTriggering ? 'sync' : 'rocket_launch'}
          </span>
          <span>{isTriggering ? 'Running Discovery...' : 'Trigger Batch'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="bg-surface-container border border-outline-variant rounded-lg p-12 text-center text-sm font-mono text-on-surface-variant">
            Querying staged prospects...
          </div>
        ) : prospects.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded-lg p-12 text-center space-y-3">
            <p className="text-body-md text-on-surface">No prospects currently awaiting approval.</p>
            <button onClick={handleTriggerBatch} className="text-sm font-mono text-lime hover:underline cursor-pointer font-bold">
              Trigger batch discovery now →
            </button>
          </div>
        ) : (
          prospects.map((p) => {
            const isApproved = p.scrape_status === 'approved';
            const isRejected = p.scrape_status === 'rejected';
            return (
              <div
                key={p.id}
                className={`bg-surface-container border border-outline-variant rounded-lg p-5 space-y-3.5 border-l-4 transition-all ${
                  isApproved ? 'border-l-lime' : isRejected ? 'border-l-error opacity-60' : 'border-l-status-blue'
                }`}
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
                      <span>{p.company_name}</span>
                      <span className="text-xs font-mono text-on-surface-variant">({p.domain})</span>
                    </h3>
                    <div className="text-body-md text-on-surface-variant font-mono mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-status-blue font-semibold">Decision Maker:</span>
                      <span className="text-primary font-bold">{p.decision_maker_name || 'Alex Chen'}</span>
                      <span className="text-outline-variant">—</span>
                      <span>{p.decision_maker_title || 'Head of Growth'}</span>
                      {p.decision_maker_linkedin && (
                        <a href={p.decision_maker_linkedin} target="_blank" rel="noreferrer" className="text-lime hover:underline flex items-center gap-0.5" aria-label="LinkedIn profile">
                          <span className="material-symbols-outlined text-[16px]">link</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                    isApproved ? 'badge-lime font-bold' : isRejected ? 'bg-error/10 text-error border border-error/30' : 'badge-blue font-bold'
                  }`}>
                    {p.scrape_status}
                  </span>
                </div>

                {/* Intent Tags */}
                <div className="flex flex-wrap gap-2">
                  {['Hiring Growth Engineers', 'Series A Funding', 'Modern MarTech Stack'].map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-xs font-mono text-on-surface flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[14px] ${idx % 2 === 0 ? 'text-lime' : 'text-status-blue'}`}>label</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                {/* Outreach Copy */}
                <div className="bg-surface-container-lowest p-3.5 rounded border border-outline-variant text-body-md space-y-1.5 font-mono leading-relaxed">
                  <p><strong className="text-lime">[Observation]</strong> Noticed {p.company_name} is scaling growth engineering in Q3...</p>
                  <p><strong className="text-status-blue">[Capability]</strong> Our engine automates lead qualification and CRM syncing in &lt;5s...</p>
                  <p><strong className="text-primary">[Ask]</strong> Worth sending a 2-minute overview?</p>
                </div>

                {/* Actions */}
                {isApproved ? (
                  <div className="text-xs text-lime font-mono font-semibold flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Approved & staged to HubSpot CRM Sandbox</span>
                  </div>
                ) : isRejected ? (
                  <div className="text-xs text-error font-mono flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Prospect rejected.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => handleApprove(p.id)} className="btn-primary">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Approve & Sync</span>
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-error font-nav-item text-nav-item px-4 py-2 rounded border border-outline-variant transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
