import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Rocket,
  ShieldCheck,
  KeyRound,
  Sliders,
  BarChart3,
  Database,
  Activity,
  Calendar,
  Swords
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, summaryData }) {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbound', label: 'Inbound Pipeline', icon: Inbox },
    { id: 'outbound', label: 'Outbound Queue', icon: Rocket, badge: summaryData?.staged_awaiting_approval ?? 0 },
    { id: 'deal-health', label: 'Deal Health & Risks', icon: ShieldCheck },
  ];

  const engineNav = [
    { id: 'battlecards', label: 'Competitor Playbooks', icon: Swords },
    { id: 'meeting-prep', label: 'Call Prep & Meetings', icon: Calendar },
    { id: 'byok-settings', label: 'BYOK Key Vault', icon: KeyRound },
    { id: 'config', label: 'Logic & ICP Studio', icon: Sliders },
    { id: 'analytics', label: 'Pipeline Analytics', icon: BarChart3 },
  ];

  const creditsUsed = summaryData?.apollo_credits_used ?? 0;
  const creditsMax = summaryData?.apollo_credits_max ?? 50;
  const budgetPct = Math.min(100, Math.round((creditsUsed / creditsMax) * 100));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex shrink-0 z-20 select-none">
      <div className="p-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1.5">
          <div className="px-3 pb-1">
            <span className="text-xs font-semibold text-slate-400 block">
              Pipeline Workspace
            </span>
          </div>

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Engine Section */}
        <div className="space-y-1.5">
          <div className="px-3 pb-1">
            <span className="text-xs font-semibold text-slate-400 block">
              Intelligence & Logic
            </span>
          </div>

          <nav className="space-y-1">
            {engineNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Budget & System Status */}
      <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
        {/* Apollo Budget Pill */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-card">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Apollo Credits</span>
            </span>
            <span className="text-slate-900 font-bold text-xs">{creditsUsed}/{creditsMax}</span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">50 credits / month free tier</div>
        </div>

        {/* Workflow engine liveness */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Workflow Engine</span>
          </span>
          <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Running
          </span>
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200">
          <button
            onClick={() => setCurrentView('privacy')}
            className="hover:text-slate-700 transition"
          >
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button
            onClick={() => setCurrentView('terms')}
            className="hover:text-slate-700 transition"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </aside>
  );
}
