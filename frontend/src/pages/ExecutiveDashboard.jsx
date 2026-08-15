import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { fetchLeadsOverTime } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ExecutiveDashboard({ summaryData, currentTenant, onNavigate, liveLogs, onTriggerOutbound }) {
  const [chartData, setChartData] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoadingChart(true);
      const data = await fetchLeadsOverTime(currentTenant);
      setChartData(data);
      setIsLoadingChart(false);
    })();
  }, [currentTenant]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e1e5d0', font: { family: 'Hanken Grotesk', size: 12, weight: 500 }, boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1e2024',
        titleColor: '#b9f612',
        bodyColor: '#e1e5d0',
        borderColor: '#434934',
        borderWidth: 1,
        padding: 10,
        titleFont: { family: 'Hanken Grotesk', weight: 'bold' },
        bodyFont: { family: 'Hanken Grotesk' },
      },
    },
    scales: {
      x: { ticks: { color: '#c3caad', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(67, 73, 52, 0.3)' } },
      y: { ticks: { color: '#c3caad', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(67, 73, 52, 0.3)' } },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Live Control Center</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Executive Dashboard</h1>
          <p className="text-body-md text-on-surface-variant">
            Telemetry & pipeline execution for <span className="text-primary font-semibold">{currentTenant === 'trifid_media' ? 'Trifid Media' : 'Acme Global'}</span>
          </p>
        </div>
        <button onClick={onTriggerOutbound} className="btn-primary">
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          <span>Trigger Outbound Batch</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Inbound', value: summaryData?.total_leads_inbound?.toLocaleString() || '1,248', change: '+14%', sub: 'Validated & Deduplicated', icon: 'input' },
          { label: 'SLA Compliance', value: `${summaryData?.sla_compliance_rate || 98.4}%`, change: '15m window', sub: 'Zero Breached Hot Leads', accent: true, icon: 'timer' },
          { label: 'Avg Lead Score', value: `${summaryData?.avg_lead_score || 84}`, valueSuffix: '/100', change: '78% Hot', sub: 'Pydantic Schema Validated', icon: 'grade' },
          { label: 'Outbound Staged', value: `${summaryData?.staged_awaiting_approval || 18}`, change: 'awaiting', sub: 'Human-in-the-Loop', isBlue: true, icon: 'rocket_launch' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface-container border border-outline-variant rounded-lg p-5 space-y-2 hover:border-lime/40 transition-all">
            <div className="flex justify-between items-center">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-mono">{kpi.label}</span>
              <span className={`material-symbols-outlined text-[20px] ${kpi.accent ? 'text-lime' : kpi.isBlue ? 'text-status-blue' : 'text-on-surface-variant'}`}>
                {kpi.icon}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`font-data-lg text-data-lg font-bold tabular-nums ${kpi.accent ? 'text-lime' : kpi.isBlue ? 'text-status-blue' : 'text-primary'}`}>
                {kpi.value}
                {kpi.valueSuffix && <span className="text-sm font-normal text-on-surface-variant ml-0.5">{kpi.valueSuffix}</span>}
              </span>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                kpi.accent ? 'bg-lime/10 text-lime border border-lime/30' : kpi.isBlue ? 'bg-status-blue/10 text-status-blue border border-status-blue/30' : 'bg-surface-container-high text-primary'
              }`}>
                {kpi.change}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant block">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Chart + Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart */}
        <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-lg p-5 space-y-4 flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary">Workflow Telemetry</h2>
              <p className="text-xs text-on-surface-variant font-mono">Last 7 days throughput</p>
            </div>
            <span className="badge-lime font-bold">1,000 req/min cap</span>
          </div>
          <div className="h-64 w-full">
            {isLoadingChart ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">Loading telemetry series...</div>
            ) : chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : null}
          </div>
        </div>

        {/* Live Event Log */}
        <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-lg p-5 space-y-4 flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lime text-xl animate-spin">cyclone</span>
              <h2 className="font-headline-md text-headline-md font-bold text-primary">Live Event Log</h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" aria-label="Event stream active"></span>
          </div>

          <div className="space-y-2 font-mono text-xs overflow-y-auto max-h-[250px] pr-1 flex-1">
            {liveLogs && liveLogs.length > 0 ? (
              liveLogs.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/70 hover:border-lime/30 transition-colors">
                  <span className="text-lime font-bold">[{log.time}]</span>
                  <span className="text-on-surface ml-2">{log.text}</span>
                </div>
              ))
            ) : (
              <>
                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/70">
                  <span className="text-lime font-bold">[15:38]</span>
                  <span className="text-on-surface ml-2">Lead <strong className="text-primary">FintechCorp</strong> scored <strong className="text-lime">92</strong> → Synced to HubSpot</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/70">
                  <span className="text-status-blue font-bold">[15:35]</span>
                  <span className="text-on-surface ml-2">Outbound prospect <strong className="text-primary">NovaScale</strong> staged as <em>Awaiting Approval</em></span>
                </div>
                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/70">
                  <span className="text-on-surface-variant font-bold">[15:30]</span>
                  <span className="text-on-surface ml-2">Apollo Credit Guard: <strong className="text-lime">12/50</strong> credits consumed</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/70">
                  <span className="text-lime font-bold">[15:25]</span>
                  <span className="text-on-surface ml-2">Temporal Saga <code className="text-status-blue">inbound-wf-8a9f</code> succeeded in 42ms</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>worker pool: operational</span>
            <button onClick={() => onNavigate('inbound')} className="text-lime hover:underline cursor-pointer font-bold">
              View all leads →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
