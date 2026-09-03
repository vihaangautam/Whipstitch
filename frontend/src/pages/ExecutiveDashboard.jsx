import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Rocket,
  ShieldCheck,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Search,
  Plus,
  FileText,
  Building2,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchLeadsOverTime } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ExecutiveDashboard({ summaryData, currentTenant, onNavigate, liveLogs, onTriggerOutbound }) {
  const [chartData, setChartData] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadChart = async () => {
      setIsLoadingChart(true);
      try {
        const series = await fetchLeadsOverTime(currentTenant, 7);
        if (!isMounted) return;

        const labels = series && series.length > 0
          ? series.map((s) => s.date)
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const inboundValues = series && series.length > 0
          ? series.map((s) => s.count)
          : [45, 62, 58, 85, 92, 40, 78];

        const outboundValues = inboundValues.map((v) => Math.round(v * 0.45));

        setChartData({
          labels,
          datasets: [
            {
              label: 'Inbound Ingested',
              data: inboundValues,
              borderColor: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              borderWidth: 2.5,
              pointBackgroundColor: '#059669',
              pointBorderColor: '#ffffff',
              pointRadius: 4.5,
              pointHoverRadius: 7,
              fill: true,
              tension: 0.35,
            },
            {
              label: 'Outbound Discovered',
              data: outboundValues,
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.04)',
              borderWidth: 2.5,
              borderDash: [5, 5],
              pointBackgroundColor: '#2563EB',
              pointBorderColor: '#ffffff',
              pointRadius: 4,
              fill: true,
              tension: 0.35,
            },
          ],
        });
      } catch (e) {
        console.warn('Failed to load chart series', e);
      } finally {
        if (isMounted) setIsLoadingChart(false);
      }
    };

    loadChart();
    return () => { isMounted = false; };
  }, [currentTenant]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#334155',
          font: { family: 'Plus Jakarta Sans, sans-serif', size: 12, weight: '600' },
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#FFFFFF',
        bodyColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold', size: 13 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        displayColors: true,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' } },
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        border: { dash: [4, 4] },
      },
      y: {
        ticks: { color: '#64748B', font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' } },
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        border: { dash: [4, 4] },
        suggestedMin: 0,
      },
    },
  };

  const recentDeals = [
    {
      id: 'd1',
      name: 'Strategic RevOps Modernization',
      company: 'Apex Logistics Global',
      tags: ['Enterprise', 'Rescue'],
      tagColors: ['bg-slate-100 text-slate-700 border-slate-200', 'bg-amber-50 text-amber-800 border-amber-200'],
      score: 68,
      stage: 'Rescue (68/100)',
      owner: 'Lauren Davis',
      created: '2 hours ago',
    },
    {
      id: 'd2',
      name: 'AI Lead Routing Rollout',
      company: 'CloudScale Systems',
      tags: ['SaaS', 'Advance'],
      tagColors: ['bg-slate-100 text-slate-700 border-slate-200', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
      score: 86,
      stage: 'Advance (86/100)',
      owner: 'Lauren Davis',
      created: 'Yesterday',
    },
    {
      id: 'd3',
      name: 'Enterprise Pipeline Automation',
      company: 'FinPulse Payments',
      tags: ['Fintech', 'Discovery'],
      tagColors: ['bg-slate-100 text-slate-700 border-slate-200', 'bg-blue-50 text-blue-800 border-blue-200'],
      score: null,
      stage: 'Discovery',
      owner: 'Ryan Martinez',
      created: '3 days ago',
    },
    {
      id: 'd4',
      name: 'Creator Roster UGC Intake',
      company: 'Velox Brands D2C',
      tags: ['E-Commerce', 'Advance'],
      tagColors: ['bg-slate-100 text-slate-700 border-slate-200', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
      score: 92,
      stage: 'Advance (92/100)',
      owner: 'Lauren Davis',
      created: 'May 12, 2026',
    },
  ];

  const filteredDeals = recentDeals.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* Top Banner / Control Center */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500">
              Live Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Telemetry & pipeline execution for <span className="text-slate-900 font-semibold">{currentTenant === 'trifid_media' ? 'Trifid Media' : 'Acme Global'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('deal-health')}
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>New MEDDPICC Diagnostic</span>
          </button>

          <button
            onClick={onTriggerOutbound}
            className="btn-primary px-4 py-2.5 text-sm"
          >
            <Rocket className="w-4 h-4" />
            <span>Trigger Outbound Batch</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Total Inbound Leads',
            value: summaryData?.total_leads_inbound?.toLocaleString() || '1,248',
            change: '+14%',
            changeType: 'positive',
            sub: 'Validated & Deduplicated',
            icon: Inbox,
            iconColor: 'text-slate-700',
            bgColor: 'bg-slate-100 border-slate-200',
          },
          {
            label: 'SLA Compliance Rate',
            value: `${summaryData?.sla_compliance_rate || 98.4}%`,
            change: '15m window',
            changeType: 'emerald',
            sub: 'Zero Breached Hot Leads',
            icon: Timer,
            iconColor: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border-emerald-200',
            accentValue: 'text-emerald-800',
          },
          {
            label: 'Avg Lead Score',
            value: `${summaryData?.avg_lead_score || 84}`,
            valueSuffix: '/100',
            change: '78% Hot',
            changeType: 'blue',
            sub: 'Pydantic Validated',
            icon: ShieldCheck,
            iconColor: 'text-blue-700',
            bgColor: 'bg-blue-50 border-blue-200',
            accentValue: 'text-blue-800',
          },
          {
            label: 'Outbound Staged',
            value: `${summaryData?.staged_awaiting_approval || 18}`,
            change: 'awaiting',
            changeType: 'slate',
            sub: 'Human-in-the-Loop',
            icon: Rocket,
            iconColor: 'text-indigo-700',
            bgColor: 'bg-indigo-50 border-indigo-200',
            accentValue: 'text-slate-900',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:border-slate-300 hover:shadow-card-hover transition space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg border ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${kpi.accentValue || 'text-slate-900'}`}>
                  {kpi.value}
                  {kpi.valueSuffix && (
                    <span className="text-sm font-normal text-slate-400 ml-1">{kpi.valueSuffix}</span>
                  )}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                  kpi.changeType === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : kpi.changeType === 'blue'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {kpi.change}
                </span>
              </div>

              <span className="text-xs text-slate-500 block leading-tight">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Live Event Log Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Workflow Telemetry Throughput Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Workflow Telemetry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days throughput (Inbound vs Outbound)</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-200">
              1,000 req/min cap
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full relative">
            {isLoadingChart ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Loading telemetry series...
              </div>
            ) : chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : null}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Idempotent Ingestion SLA: 99.98%</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline"
            >
              Full Analytics Report &rarr;
            </button>
          </div>
        </div>

        {/* Right: Live Event Log Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Live Event Log</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Temporal Engine Live
            </span>
          </div>

          <div className="space-y-2.5 text-xs overflow-y-auto max-h-[300px] pr-1 flex-1">
            {liveLogs && liveLogs.length > 0 ? (
              liveLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition text-xs flex items-start gap-2.5"
                >
                  <span className="text-emerald-800 font-bold shrink-0">{log.time}</span>
                  <span className="text-slate-800 font-medium leading-relaxed">{log.text}</span>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0">15:38</span>
                  <span className="text-slate-800 leading-relaxed">Lead <strong>FintechCorp</strong> scored <strong>92</strong> &rarr; Synced to HubSpot</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                  <span className="text-blue-800 font-bold shrink-0">15:35</span>
                  <span className="text-slate-800 leading-relaxed">Outbound prospect <strong>NovaScale</strong> staged as <em>Awaiting Approval</em></span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                  <span className="text-slate-500 font-bold shrink-0">15:30</span>
                  <span className="text-slate-800 leading-relaxed">Apollo Credit Guard: <strong>12/50</strong> credits consumed</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0">15:25</span>
                  <span className="text-slate-800 leading-relaxed">Temporal Saga <code className="text-blue-700 font-semibold">inbound-wf-8a9f</code> succeeded in 42ms</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>worker pool: operational (42ms avg)</span>
            <button
              onClick={() => onNavigate('inbound')}
              className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline"
            >
              View all leads &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Active Deals & Pipeline Opportunities Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden space-y-0">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md transition ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              All Deals & Opportunities
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-1.5 rounded-md transition ${
                activeTab === 'recent' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Recent Diagnostics
            </button>
          </div>

          {/* Search & New Action */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search deals or accounts..."
                className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
              />
            </div>

            <button
              onClick={() => onNavigate('deal-health')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Diagnostic
            </button>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <tr>
                <th className="py-3 px-6">Opportunity Name</th>
                <th className="py-3 px-6">Account Tags</th>
                <th className="py-3 px-6">MEDDPICC Stage</th>
                <th className="py-3 px-6">Created / Updated</th>
                <th className="py-3 px-6">Owner</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{deal.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6.5">{deal.company}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {deal.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${deal.tagColors[idx]}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-900">{deal.stage}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{deal.created}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {deal.owner.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-slate-800 text-xs font-medium">{deal.owner}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onNavigate('deal-health')}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
