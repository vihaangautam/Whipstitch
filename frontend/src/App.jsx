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
import { fetchAnalyticsSummary, triggerOutboundBatch, fetchCurrentUser, clearAuthToken, fetchAuditLogs } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTenant, setCurrentTenant] = useState('trifid_media');
  const [summaryData, setSummaryData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: 'rep-alex-morgan',
    full_name: 'Alex Morgan',
    email: 'rep@trifidmedia.in',
    role: 'sales_representative',
    tenant_id: 'trifid_media',
  });
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

  useEffect(() => { loadSummary(); }, [currentTenant]);

  useEffect(() => {
    async function checkAuth() {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
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
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden selection:bg-emerald-600 selection:text-white">
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.tenant_id) {
            setCurrentTenant(user.tenant_id);
          }
          loadSummary();
        }}
      />

      {currentView === 'landing' ? (
        <LandingPage setCurrentView={setCurrentView} onSimulateEvent={handleSimulateEvent} />
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
