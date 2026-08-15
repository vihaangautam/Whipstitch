import React, { useState, useEffect } from 'react';
import { fetchInboundLeads, fetchLeadDetail } from '../api';

export default function InboundLeads({ currentTenant }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const data = await fetchInboundLeads(currentTenant, search, statusFilter);
      setLeads(data);
      setIsLoading(false);
    })();
  }, [currentTenant, search, statusFilter]);

  const handleRowClick = async (lead) => {
    setSelectedLead(lead);
    setIsLoadingDrawer(true);
    const detail = await fetchLeadDetail(lead.id);
    setDrawerData(detail);
    setIsLoadingDrawer(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Inbound Lead Pipeline</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Multi-provider waterfall enrichment & Pydantic qualification scores.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container border border-outline-variant rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 focus-within:border-lime transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or email..."
            className="w-full bg-transparent border-none text-body-md text-primary focus:ring-0 placeholder:text-on-surface-variant/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-on-surface-variant">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded text-body-md text-primary px-3 py-1.5 focus:ring-0 cursor-pointer font-nav-item"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="synced">Synced</option>
            <option value="scoring">Scoring</option>
            <option value="enriching">Enriching</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <thead className="bg-surface-container-high border-b border-outline-variant text-label-sm font-label-sm uppercase font-mono text-on-surface-variant tracking-wider">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Score</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right sr-only">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {isLoading ? (
                <tr><td colSpan="6" className="p-12 text-center text-on-surface-variant font-mono text-sm">Querying lead database...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-on-surface-variant font-mono text-sm">No matching leads found.</td></tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => handleRowClick(l)}
                    className="hover:bg-surface-container-high/60 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-headline-md text-headline-md font-semibold text-primary group-hover:text-lime transition-colors">
                      {l.company_name}
                    </td>
                    <td className="p-4 text-on-surface font-mono text-xs">{l.email}</td>
                    <td className="p-4">
                      <span className={l.lead_score >= 80 ? 'badge-lime font-bold' : l.lead_score >= 50 ? 'badge-blue font-bold' : 'text-on-surface-variant font-mono text-xs'}>
                        {l.lead_score ? `${l.lead_score}/100` : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 capitalize font-mono text-xs text-on-surface">{l.provider_used || 'apollo'}</td>
                    <td className="p-4">
                      <span className={l.status === 'synced' ? 'badge-lime font-bold' : 'badge-blue font-bold'}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-lime group-hover:translate-x-1 transition-all text-[20px]">
                        chevron_right
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Lead details">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-surface-container-low border-l border-outline-variant p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-fade-in">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-outline-variant pb-4">
                  <div>
                    <h2 className="font-display-lg text-headline-lg font-bold text-primary">{drawerData?.company_name || selectedLead.company_name}</h2>
                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">{drawerData?.email || selectedLead.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>

                {isLoadingDrawer ? (
                  <div className="p-12 text-center text-xs font-mono text-on-surface-variant">Loading enriched traits...</div>
                ) : (
                  <>
                    {/* Score */}
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-between">
                      <div>
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-mono">AI Qualification</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-data-lg text-data-lg font-bold text-lime tabular-nums">{drawerData?.qualification?.lead_score || 88}</span>
                          <span className="badge-lime font-bold">Hot Fit</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-on-surface-variant font-mono block">Enrichment Provider</span>
                        <p className="text-sm font-mono font-bold text-primary capitalize mt-0.5">{drawerData?.enrichment?.provider_used || 'apollo'}</p>
                      </div>
                    </div>

                    {/* Enriched Traits */}
                    <div className="space-y-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-lime font-mono block">Enriched Intelligence</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-surface-container border border-outline-variant rounded space-y-1">
                          <span className="text-[11px] text-on-surface-variant font-mono block">Headcount</span>
                          <span className="font-headline-md text-headline-md font-semibold text-primary">{drawerData?.enrichment?.data?.employee_count || 220}</span>
                        </div>
                        <div className="p-3 bg-surface-container border border-outline-variant rounded space-y-1">
                          <span className="text-[11px] text-on-surface-variant font-mono block">Location</span>
                          <span className="font-headline-md text-headline-md font-semibold text-primary">{drawerData?.enrichment?.data?.geography || 'Bengaluru, IN'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tech Stack */}
                    {drawerData?.enrichment?.data?.tech_stack && (
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-on-surface-variant">Detected Stack</span>
                        <div className="flex flex-wrap gap-1.5">
                          {drawerData.enrichment.data.tech_stack.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs font-mono text-on-surface">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    <div className="space-y-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-lime font-mono block">Fit Reasoning</span>
                      <p className="text-body-md text-on-surface bg-surface-container-lowest p-3.5 rounded border border-outline-variant leading-relaxed">
                        {drawerData?.qualification?.fit_reasoning}
                      </p>
                    </div>

                    {/* Outreach Draft */}
                    <div className="space-y-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-lime font-mono block">3-Part Outreach Hook</span>
                      <div className="text-body-md space-y-2.5 bg-surface-container-lowest p-3.5 rounded border border-outline-variant font-mono leading-relaxed">
                        <p><strong className="text-lime">[Observation]</strong> {drawerData?.qualification?.outreach_draft?.observation_hook}</p>
                        <p><strong className="text-status-blue">[Capability]</strong> {drawerData?.qualification?.outreach_draft?.capability_link}</p>
                        <p><strong className="text-primary">[Ask]</strong> {drawerData?.qualification?.outreach_draft?.low_friction_ask}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-5 border-t border-outline-variant">
                <a
                  href="https://app.hubspot.com/contacts/sandbox"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full justify-center py-3"
                >
                  <span>Open in HubSpot CRM</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
