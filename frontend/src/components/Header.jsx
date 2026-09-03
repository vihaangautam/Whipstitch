import React from 'react';
import { RefreshCw, Database, HelpCircle, Terminal, Home, ArrowRight, User } from 'lucide-react';

export default function Header({ currentView, setCurrentView, currentTenant, setCurrentTenant, onRefresh, isRefreshing }) {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'inbound': return 'Inbound Pipeline';
      case 'outbound': return 'Outbound Queue';
      case 'deal-health': return 'Deal Health & MEDDPICC';
      case 'battlecards': return 'Competitor Battlecards & 6-Signal Agent';
      case 'meeting-prep': return 'Meeting Intelligence & Calendar Prep';
      case 'byok-settings': return 'BYOK Key Vault';
      case 'config': return 'Logic & ICP Studio';
      case 'analytics': return 'Pipeline Analytics';
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms and Conditions';
      default: return 'Overview';
    }
  };

  return (
    <header className="h-14 w-full sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group"
            aria-label="Whipstitch Home"
          >
            {/* Clean Geometric Logo Icon */}
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l8 8 8-8" className="stroke-emerald-400" />
                <path d="M4 6l8 8 8-8" className="stroke-blue-400" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Whipstitch</span>
          </button>

          {currentView !== 'landing' && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>/</span>
              <span className="text-slate-700 font-semibold">{getViewTitle()}</span>
            </div>
          )}
        </div>

        {/* Center: Landing Page Nav Links */}
        {currentView === 'landing' && (
          <nav className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#engine" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Engine Mechanics
            </a>
            <a href="#pricing" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Zero-Capital Model
            </a>
            <a href="#faq" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>
        )}

        {/* Right: Tenant, Credits, Docs & Profile */}
        <div className="flex items-center gap-3">
          {currentView !== 'landing' ? (
            <>
              {/* Tenant Switcher */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-slate-400 font-medium">tenant:</span>
                <select
                  value={currentTenant}
                  onChange={(e) => setCurrentTenant(e.target.value)}
                  className="bg-transparent text-slate-900 font-semibold border-none text-xs py-0 pl-1 pr-3 cursor-pointer focus:ring-0 focus:outline-none"
                  aria-label="Select tenant"
                >
                  <option value="trifid_media">trifid_media</option>
                  <option value="acme_corp">acme_global</option>
                </select>
              </div>

              {/* Apollo Credits Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>12/50 Credits</span>
              </div>

              {/* Telemetry Refresh */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition disabled:opacity-40"
                title="Refresh telemetry data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 transition"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>API Docs</span>
              </a>

              {/* User Profile Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  LD
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">Lauren Davis</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Admin Workspace</div>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('landing')}
                className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50 transition"
              >
                Landing
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
