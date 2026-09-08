import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import InboundLeads from './pages/InboundLeads';
import OutboundQueue from './pages/OutboundQueue';
import TenantConfigStudio from './pages/TenantConfigStudio';
import PipelineAnalytics from './pages/PipelineAnalytics';
import DealHealth from './pages/DealHealth';
import MeetingIntelligence from './pages/MeetingIntelligence';
import CompetitorBattlecards from './pages/CompetitorBattlecards';
import BYOKSettings from './pages/BYOKSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import AuthModal from './components/AuthModal';
import OnboardingWizard from './components/OnboardingWizard';
import { fetchAnalyticsSummary, triggerOutboundBatch, fetchCurrentUser, clearAuthToken, fetchAuditLogs } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTenant, setCurrentTenant] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);

  const loadSummary = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAnalyticsSummary(currentTenant);
      setSummaryData(data);
      const logs = await fetchAuditLogs(currentTenant, 10);
      if (Array.isArray(logs) && logs.length > 0) {
        setLiveLogs(logs.map((l) => ({
          time: l.time || 'Live',
          text: l.text || 'Workflow execution record',
        })));
      }
    } catch (e) {
      console.warn('Error loading summary / logs', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { if (currentTenant) loadSummary(); }, [currentTenant]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          setCurrentTenant(user.tenant_id || null);
        }
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  const handleSimulateEvent = (eventName) => {
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveLogs((prev) => [{ time: t, text: eventName }, ...prev.slice(0, 7)]);
  };

  const handleTriggerOutbound = async () => {
    try {
      await triggerOutboundBatch(currentTenant, 3);
      handleSimulateEvent('Outbound Batch Triggered (3 prospects) → Apollo Discovery Running');
      loadSummary();
    } catch (e) { console.warn(e); }
  };

  const handleSignOut = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentTenant(null);
    setSummaryData(null);
    setCurrentView('dashboard');
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentTenant(user?.tenant_id || null);
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
    loadSummary();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-400 text-sm font-sans">
        Loading workspace…
      </div>
    );
  }

  // Unauthenticated: landing page only. The landing page brings its own nav; every CTA opens the auth modal.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans overflow-x-clip">
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
        <LandingPage
          onPrimary={() => setIsAuthModalOpen(true)}
          onSignIn={() => setIsAuthModalOpen(true)}
        />
      </div>
    );
  }

  // Authenticated but workspace setup not finished → force the wizard.
  if (!currentUser.onboarded) {
    return (
      <OnboardingWizard
        user={currentUser}
        onSignOut={handleSignOut}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          setCurrentTenant(updatedUser?.tenant_id || currentTenant);
          setCurrentView('dashboard');
          loadSummary();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col relative overflow-x-clip selection:bg-emerald-600 selection:text-white">
      {currentView !== 'landing' && (
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentTenant={currentTenant}
          setCurrentTenant={setCurrentTenant}
          summaryData={summaryData}
          onRefresh={loadSummary}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {currentView === 'landing' ? (
        <LandingPage onPrimary={() => setCurrentView('dashboard')} onSignIn={() => setCurrentView('dashboard')} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} summaryData={summaryData} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
            {currentView === 'dashboard' && (
              <ExecutiveDashboard
                summaryData={summaryData}
                currentTenant={currentTenant}
                onNavigate={setCurrentView}
                liveLogs={liveLogs}
                onTriggerOutbound={handleTriggerOutbound}
              />
            )}
            {currentView === 'inbound' && <InboundLeads currentTenant={currentTenant} />}
            {currentView === 'outbound' && (
              <OutboundQueue
                currentTenant={currentTenant}
                onTriggerSuccess={() => {
                  handleSimulateEvent('Outbound Batch Discovered & Staged');
                  loadSummary();
                }}
              />
            )}
            {currentView === 'deal-health' && <DealHealth currentTenant={currentTenant} />}
            {currentView === 'battlecards' && <CompetitorBattlecards currentTenant={currentTenant} />}
            {currentView === 'meeting-prep' && <MeetingIntelligence currentTenant={currentTenant} />}
            {currentView === 'byok-settings' && <BYOKSettings currentTenant={currentTenant} />}
            {currentView === 'config' && <TenantConfigStudio currentTenant={currentTenant} />}
            {currentView === 'analytics' && <PipelineAnalytics summaryData={summaryData} currentTenant={currentTenant} />}
            {currentView === 'privacy' && <PrivacyPolicy onNavigate={setCurrentView} />}
            {currentView === 'terms' && <TermsConditions onNavigate={setCurrentView} />}
          </main>
        </div>
      )}
    </div>
  );
}
