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
import { fetchAnalyticsSummary, triggerOutboundBatch } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTenant, setCurrentTenant] = useState('trifid_media');
  const [summaryData, setSummaryData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveLogs, setLiveLogs] = useState([
    { time: '15:38', text: 'Deal Apex Logistics diagnosed (68/100) → Synced to HubSpot CRM' },
    { time: '15:35', text: 'Outbound prospect NovaScale staged as Awaiting Approval' },
    { time: '15:30', text: 'Apollo Credit Guard check: 12/50 credits consumed' },
    { time: '15:25', text: 'Temporal Saga deal-diag-8a9f succeeded in 64ms' },
  ]);

  const loadSummary = async () => {
    setIsRefreshing(true);
    const data = await fetchAnalyticsSummary(currentTenant);
    setSummaryData(data);
    setIsRefreshing(false);
  };

  useEffect(() => { loadSummary(); }, [currentTenant]);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden selection:bg-emerald-600 selection:text-white">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentTenant={currentTenant}
        setCurrentTenant={setCurrentTenant}
        onRefresh={loadSummary}
        isRefreshing={isRefreshing}
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
            {currentView === 'analytics' && <PipelineAnalytics summaryData={summaryData} />}
            {currentView === 'privacy' && <PrivacyPolicy onNavigate={setCurrentView} />}
            {currentView === 'terms' && <TermsConditions onNavigate={setCurrentView} />}
          </main>
        </div>
      )}
    </div>
  );
}
