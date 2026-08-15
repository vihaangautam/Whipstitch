import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ currentView, setCurrentView, currentTenant, setCurrentTenant, onRefresh, isRefreshing }) {
  return (
    <header className="h-16 w-full sticky top-0 z-40 bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
        {/* Left: Brand */}
        <div className="flex items-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group"
            aria-label="Go to homepage"
          >
            <span className="material-symbols-outlined text-lime text-2xl group-hover:rotate-45 transition-transform duration-300">cyclone</span>
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Whipstitch AI</span>
          </button>
        </div>

        {/* Center: Center-aligned Nav Links */}
        <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <a
            href="#features"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                setCurrentView('landing');
                setTimeout(() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="font-nav-item text-nav-item text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#engine"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                setCurrentView('landing');
                setTimeout(() => {
                  const el = document.getElementById('engine');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="font-nav-item text-nav-item text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            The Engine
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                setCurrentView('landing');
                setTimeout(() => {
                  const el = document.getElementById('faq');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="font-nav-item text-nav-item text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            FAQ
          </a>
          <button
            onClick={() => setCurrentView(currentView === 'landing' ? 'dashboard' : 'landing')}
            className="font-nav-item text-nav-item text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            {currentView === 'landing' ? 'Architecture' : 'Landing'}
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {currentView !== 'landing' && (
            <>
              <div className="hidden sm:flex items-center gap-1.5 bg-surface-container border border-outline-variant px-3 py-1.5 rounded text-xs font-mono">
                <span className="text-on-surface-variant">tenant:</span>
                <select
                  value={currentTenant}
                  onChange={(e) => setCurrentTenant(e.target.value)}
                  className="bg-transparent text-primary border-none text-xs py-0 pl-1 pr-4 cursor-pointer focus:ring-0"
                  aria-label="Select tenant"
                >
                  <option value="trifid_media" className="bg-surface-container text-primary">trifid_media</option>
                  <option value="acme_corp" className="bg-surface-container text-primary">acme_global</option>
                </select>
              </div>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 rounded bg-surface-container border border-outline-variant hover:border-lime/40 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 cursor-pointer"
                title="Refresh telemetry"
                aria-label="Refresh telemetry data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-lime' : ''}`} />
              </button>
            </>
          )}

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 font-nav-item text-nav-item text-on-surface-variant hover:text-primary transition-colors px-2 py-1"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Docs</span>
          </a>

          {currentView === 'landing' ? (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-lime text-charcoal font-nav-item text-nav-item px-4 py-2 rounded border border-lime hover:bg-[#a6de10] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Launch Dashboard</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('landing')}
              className="bg-surface-container hover:bg-surface-container-high text-primary font-nav-item text-nav-item px-4 py-2 rounded border border-outline-variant transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>View Landing</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
