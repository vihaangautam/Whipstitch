import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Database, HelpCircle, Terminal, Home, ArrowRight, User, LogOut, ChevronDown, Shield, CheckCircle } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  currentTenant,
  setCurrentTenant,
  summaryData,
  onRefresh,
  isRefreshing,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AM';

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'inbound': return 'Inbound Pipeline';
      case 'outbound': return 'Outbound Queue';
      case 'deal-health': return 'Deal Health & Risks';
      case 'battlecards': return 'Competitor Playbooks & Live Triggers';
      case 'meeting-prep': return 'Call Prep & Meeting Notes';
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
            <a href="#engine" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How it works
            </a>
            <a href="#features" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Engines
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
              {/* Workspace label (single workspace per user) */}
              {currentTenant && (
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-slate-400 font-medium">workspace:</span>
                  <span className="text-slate-900 font-semibold capitalize">
                    {currentTenant.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {/* Apollo Credits Indicator */}
              {summaryData && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>{summaryData.apollo_credits_used ?? 0}/{summaryData.apollo_credits_max ?? 50} Credits</span>
                </div>
              )}

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

              {/* User Profile Avatar & Dropdown */}
              <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer text-left focus:outline-none"
                    aria-label="User Profile Menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-slate-100 border border-slate-700 flex items-center justify-center text-xs font-semibold shadow-xs">
                      {initials}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-semibold text-slate-900 leading-tight">
                        {currentUser.full_name || 'Alex Morgan'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium leading-tight flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Sales Representative</span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Sign In
                  </button>
                )}

                {/* Dropdown Menu */}
                {isProfileOpen && currentUser && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.full_name || 'Alex Morgan'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email || 'rep@trifidmedia.in'}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200">
                        <Shield className="w-3 h-3 text-slate-500" />
                        <span>Sales Representative</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Switch Account / Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
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
                onClick={onOpenAuthModal}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
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
