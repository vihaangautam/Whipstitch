import React from 'react';

export default function Sidebar({ currentView, setCurrentView, summaryData }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'inbound', label: 'Inbound Pipeline', icon: 'input' },
    { id: 'outbound', label: 'Outbound Queue', icon: 'rocket_launch', badge: summaryData?.staged_awaiting_approval || 18 },
    { id: 'config', label: 'ICP & Logic Studio', icon: 'tune' },
    { id: 'analytics', label: 'Pipeline Analytics', icon: 'bar_chart' },
  ];

  const creditsUsed = summaryData?.apollo_credits_used || 12;
  const creditsMax = summaryData?.apollo_credits_max || 50;
  const budgetPct = Math.min(100, Math.round((creditsUsed / creditsMax) * 100));

  return (
    <aside className="w-60 border-r border-outline-variant bg-surface-container-low flex flex-col justify-between hidden md:flex shrink-0 z-20" role="navigation" aria-label="Dashboard navigation">
      <div className="p-4 space-y-5">
        <div className="px-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
            Engine Controls
          </span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-nav-item font-nav-item transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-primary border-l-2 border-l-lime shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-lime' : 'text-on-surface-variant'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-lime text-charcoal' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Apollo Credit Guard Card */}
      <div className="p-4 border-t border-outline-variant space-y-3 bg-surface-container-lowest/50">
        <div className="p-3 bg-surface-container border border-outline-variant rounded-lg space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-lime text-[16px]">database</span>
              <span>Apollo Budget</span>
            </span>
            <span className="text-lime font-bold tabular-nums">{creditsUsed}/{creditsMax}</span>
          </div>

          <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={creditsUsed} aria-valuemin={0} aria-valuemax={creditsMax}>
            <div
              className="bg-lime h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(185,246,18,0.4)]"
              style={{ width: `${budgetPct}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-on-surface-variant/80 font-body-md leading-tight">
            Redis guard active · 50 credits/mo limit
          </p>
        </div>

        <div className="px-1 text-xs font-mono text-on-surface-variant flex items-center justify-between">
          <span>Temporal v1.25</span>
          <span className="text-lime flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse"></span>
            <span>Running</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
