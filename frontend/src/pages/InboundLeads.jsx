import React, { useState, useEffect } from 'react';
import { Search, Building2, Mail, CheckCircle2, RefreshCw, X, ArrowRight, Database, Sparkles } from 'lucide-react';
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'synced':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Synced to HubSpot</span>;
      case 'scoring':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">Scoring</span>;
      case 'enriching':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Enriching</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Inbound Lead Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time webhook intake, 5-stage waterfall enrichment & Pydantic qualification scoring.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or contact email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 px-3 py-2 focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="synced">Synced</option>
            <option value="scoring">Scoring</option>
            <option value="enriching">Enriching</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <tr>
                <th className="py-3.5 px-6">Company</th>
                <th className="py-3.5 px-6">Contact Email</th>
                <th className="py-3.5 px-6">Lead Score</th>
                <th className="py-3.5 px-6">Enrichment Provider</th>
                <th className="py-3.5 px-6">Sync Status</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading pipeline...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No leads found matching current query.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {lead.company_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs sm:text-sm">
                      {lead.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-bold ${
                        (lead.lead_score || 0) >= 80 ? 'text-emerald-700' : 'text-slate-800'
                      }`}>
                        {lead.lead_score ?? '--'}/100
                      </span>
                    </td>
                    <td className="py-4 px-6 capitalize text-slate-600 font-medium">
                      {lead.provider_used || <span className="text-slate-400">Not yet enriched</span>}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 font-semibold">
                        Inspect &rarr;
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold">Lead Inspection</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedLead.company_name}</h2>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDrawer ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Retrieving telemetry...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Score Header */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Qualification Score</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {drawerData?.qualification?.lead_score ?? '--'}
                      <span className="text-slate-400 text-sm font-normal">/100</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(selectedLead.status)}
                  </div>
                </div>

                {/* Enrichment Profile */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Waterfall Enrichment Context
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Email:</span>
                      <span className="text-slate-900 font-medium">{selectedLead.email}</span>
                    </div>
                    {drawerData?.enrichment ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Primary Provider:</span>
                          <span className="capitalize font-medium text-slate-900">{drawerData.enrichment.provider_used}</span>
                        </div>
                        {drawerData.enrichment.data?.industry && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Industry:</span>
                            <span className="font-medium text-slate-900">{drawerData.enrichment.data.industry}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-400 italic">Not yet enriched.</div>
                    )}
                  </div>
                </div>

                {/* Structured 3-Part Outreach Draft */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Structured 3-Part Outreach Pitch
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-3 text-slate-800 leading-relaxed">
                    {drawerData?.qualification?.outreach_draft ? (
                      <>
                        <div>
                          <strong className="text-emerald-800 block mb-0.5">1. Observation Hook:</strong>
                          "{drawerData.qualification.outreach_draft.observation_hook}"
                        </div>
                        <div>
                          <strong className="text-blue-800 block mb-0.5">2. Capability Link:</strong>
                          "{drawerData.qualification.outreach_draft.capability_link}"
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">3. Low-Friction Ask:</strong>
                          "{drawerData.qualification.outreach_draft.low_friction_ask}"
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 italic">Not yet qualified — no outreach draft generated.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
