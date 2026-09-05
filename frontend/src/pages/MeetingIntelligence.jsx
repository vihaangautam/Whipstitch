import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Briefcase,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  HelpCircle,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Building2,
  Check,
  Download,
  AlertTriangle,
  X,
  Target,
  FileText
} from 'lucide-react';
import {
  fetchMeetings,
  createMeeting,
  fetchPreCallBriefing,
  fetchChampionSellingKit,
  triggerMeetingPrep
} from '../api';

export default function MeetingIntelligence({ currentTenant }) {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [championKit, setChampionKit] = useState(null);
  const [activeTab, setActiveTab] = useState('briefing'); // 'briefing' | 'champion-kit' | 'calendar'
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKit, setCopiedKit] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);

  // New Meeting Form
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEmails, setNewEmails] = useState('');

  const loadMeetingsData = async () => {
    setIsLoading(true);
    const data = await fetchMeetings(currentTenant);
    setMeetings(data);
    if (data.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(data[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadMeetingsData();
  }, [currentTenant]);

  useEffect(() => {
    if (selectedMeetingId) {
      loadMeetingDetails(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  const loadMeetingDetails = async (meetingId) => {
    setIsLoading(true);
    const [bData, cData] = await Promise.all([
      fetchPreCallBriefing(meetingId),
      fetchChampionSellingKit(meetingId),
    ]);
    setBriefing(bData);
    setChampionKit(cData);
    setIsLoading(false);
  };

  const handleRefreshPrep = async () => {
    if (!selectedMeetingId) return;
    try {
      setIsRefreshing(true);
      await triggerMeetingPrep(selectedMeetingId);
      await loadMeetingDetails(selectedMeetingId);
    } catch (e) {
      console.warn("Failed to refresh prep", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newTitle || !newCompany) return;
    try {
      const emailList = newEmails.split(',').map((em) => em.trim()).filter(Boolean);
      const created = await createMeeting(
        {
          title: newTitle,
          company_name: newCompany,
          scheduled_time: newTime || 'Upcoming Call',
          attendee_emails: emailList,
        },
        currentTenant
      );
      setShowNewMeetingModal(false);
      setNewTitle('');
      setNewCompany('');
      setNewTime('');
      setNewEmails('');
      await loadMeetingsData();
      setSelectedMeetingId(created.id);
    } catch (err) {
      alert('Failed to add meeting: ' + err.message);
    }
  };

  const handleCopyChampionKit = () => {
    if (!championKit) return;
    const text = `
INTERNAL SELLING CHEAT SHEET: ${championKit.company_name}
Champion: ${championKit.champion_name} (${championKit.champion_title})

1. WHY THIS HELPS YOUR CHAMPION PERSONALLY:
${championKit.filter_1_wiifm_career_narrative.talking_points.join('\n- ')}
Soundbite: "${championKit.filter_1_wiifm_career_narrative.verbatim_soundbite}"

2. THE MONEY CASE (CFO-READY ROI):
${championKit.filter_2_cfo_business_case_roi.talking_points.join('\n- ')}
Soundbite: "${championKit.filter_2_cfo_business_case_roi.verbatim_soundbite}"

3. SECURITY & PRIVACY ANSWERS:
${championKit.filter_3_infosec_architecture.talking_points.join('\n- ')}
Soundbite: "${championKit.filter_3_infosec_architecture.verbatim_soundbite}"

4. WHY ACT NOW (DEADLINES & TIMING):
${championKit.filter_4_time_triggers_urgency.talking_points.join('\n- ')}

5. WHO MAKES THE DECISION:
${championKit.filter_5_power_structure_dynamics.talking_points.join('\n- ')}

6. WHY ALTERNATIVES WON'T WORK:
${championKit.filter_6_vendor_disqualification.talking_points.join('\n- ')}

7. HIDDEN RISKS & HOW TO HANDLE THEM:
${championKit.filter_7_shadow_influence_landmines.talking_points.join('\n- ')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedKit(true);
    setTimeout(() => setCopiedKit(false), 2000);
  };

  const handleCopyQuestions = () => {
    if (!briefing?.strategic_discovery_questions) return;
    navigator.clipboard.writeText(briefing.strategic_discovery_questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n\n'));
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  const filterBlocks = championKit ? [
    { key: 'f1', badge: 'Angle 1', data: championKit.filter_1_wiifm_career_narrative, icon: Target, border: 'border-emerald-200 bg-emerald-50/40' },
    { key: 'f2', badge: 'Angle 2', data: championKit.filter_2_cfo_business_case_roi, icon: TrendingUp, border: 'border-blue-200 bg-blue-50/40' },
    { key: 'f3', badge: 'Angle 3', data: championKit.filter_3_infosec_architecture, icon: ShieldCheck, border: 'border-slate-200 bg-slate-50' },
    { key: 'f4', badge: 'Angle 4', data: championKit.filter_4_time_triggers_urgency, icon: Clock, border: 'border-amber-200 bg-amber-50/40' },
    { key: 'f5', badge: 'Angle 5', data: championKit.filter_5_power_structure_dynamics, icon: Users, border: 'border-indigo-200 bg-indigo-50/40' },
    { key: 'f6', badge: 'Angle 6', data: championKit.filter_6_vendor_disqualification, icon: AlertTriangle, border: 'border-rose-200 bg-rose-50/40' },
    { key: 'f7', badge: 'Angle 7', data: championKit.filter_7_shadow_influence_landmines, icon: Briefcase, border: 'border-purple-200 bg-purple-50/40' },
  ] : [];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* ─── 1. TOP HEADER & WORKSPACE TOOLBAR ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMeetingId || ''}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-none p-0 pr-6 focus:ring-0 cursor-pointer"
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
              <span className="font-semibold text-slate-800">{selectedMeeting?.company_name || 'Apex Logistics Global'}</span>
              <span>&bull;</span>
              <span>Scheduled: <strong className="text-slate-800">{selectedMeeting?.scheduled_time || 'Today, 3:30 PM EST'}</strong></span>
              <span>&bull;</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                Google Calendar Synced
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefreshPrep}
            disabled={isRefreshing}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            {isRefreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isRefreshing ? 'Updating...' : 'Refresh Call Prep'}</span>
          </button>

          <button
            onClick={() => setShowNewMeetingModal(true)}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meeting</span>
          </button>
        </div>
      </div>

      {/* ─── 2. WORKSPACE TAB SELECTOR ─── */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer ${
              activeTab === 'briefing'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Call Prep & Notes
          </button>
          <button
            onClick={() => setActiveTab('champion-kit')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'champion-kit'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Champion Cheat Sheet</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full font-bold">
              7 Angles
            </span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming Calls ({meetings.length})
          </button>
        </div>

        {activeTab === 'champion-kit' && (
          <button
            onClick={handleCopyChampionKit}
            className="btn-secondary text-xs mb-2"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedKit ? 'Copied Cheat Sheet!' : 'Copy Cheat Sheet'}</span>
          </button>
        )}
      </div>

      {/* ─── 3. TAB 1: CALL PREP & NOTES ─── */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Executive Meeting Context */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                What This Call Is About
              </h3>
              <span className="text-xs text-slate-400">Key gaps still open on this deal</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {briefing?.executive_summary || 'Analyzing meeting goals and attendee profiles...'}
            </p>

            {/* Targeted Deal Gaps */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">What's Still Missing to Close:</span>
              {briefing?.top_medpicc_gaps_to_target?.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-md font-semibold border border-amber-200 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {gap}
                </span>
              ))}
            </div>
          </div>

          {/* Attendee Profiles & Hooks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                Who's on This Call & How to Connect
              </h3>
              <span className="text-xs text-slate-500">{briefing?.attendees?.length || 0} People Attending</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {briefing?.attendees?.map((att, idx) => {
                const psycho = att.psychographic;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4 hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Attendee Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{att.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{att.title}</p>
                          <p className="text-[11px] text-slate-400">{att.organization}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          psycho?.buying_role === 'Champion'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : psycho?.buying_role === 'Economic Buyer'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {psycho?.buying_role || 'Stakeholder'}
                        </span>
                      </div>

                      {/* Focus Areas */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          What They Care About
                        </span>
                        <div className="space-y-1">
                          {psycho?.focus_areas?.map((fa, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-slate-700">
                              <span className="text-emerald-600 font-bold mt-0.5">&bull;</span>
                              <span>{fa}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Talking Points / Value Hooks */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          What to Say to This Person
                        </span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-800 text-[11px] leading-relaxed">
                          {psycho?.hooks?.map((hook, i) => (
                            <div key={i}>
                              <strong className="text-emerald-800 block mb-0.5">Talking Point {i + 1}:</strong>
                              "{hook}"
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Icebreaker */}
                      {psycho?.breaking_the_ice && (
                        <div className="space-y-1 text-xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Icebreaker
                          </span>
                          <p className="italic text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            "{psycho.breaking_the_ice}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Discovery Questions & Company News */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 3 Questions (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    3 Questions to Ask on This Call
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Designed to uncover what's blocking the deal.</p>
                </div>
                <button
                  onClick={handleCopyQuestions}
                  className="btn-secondary text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedQuestions ? 'Copied!' : 'Copy Questions'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {briefing?.strategic_discovery_questions?.map((q, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-emerald-800 block">Question {idx + 1}:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      "{q}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Company News / Market Signals (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-700" />
                  Recent Company News
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Latest Updates</span>
              </div>

              <div className="space-y-3">
                {briefing?.company_signals?.map((sig, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{sig.headline}</div>
                    <p className="text-slate-600 leading-relaxed">{sig.snippet}</p>
                    <div className="pt-1 text-emerald-800 font-semibold text-[11px]">
                      Why This Matters for Your Deal: {sig.relevance_to_deal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. TAB 2: CHAMPION CHEAT SHEET ─── */}
      {activeTab === 'champion-kit' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-400 font-semibold">Internal Selling Notes</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Talking Points for {championKit?.champion_name} to Sell Internally
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Everything your champion needs to pitch this deal and handle tough questions in their internal meetings.
                </p>
              </div>

              <button
                onClick={handleCopyChampionKit}
                className="btn-primary text-xs shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKit ? 'Copied Cheat Sheet!' : 'Copy Cheat Sheet'}</span>
              </button>
            </div>
          </div>

          {/* 7 Internal Selling Angles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filterBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.key}
                  className={`border rounded-xl p-5 shadow-card space-y-4 hover:border-slate-300 transition ${block.border}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <Icon className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{block.badge}</span>
                        <h4 className="font-bold text-sm text-slate-900">{block.data.title}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Core Talking Points */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 text-xs">Key Talking Points:</span>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {block.data.talking_points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-700 font-bold mt-0.5">&bull;</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Verbatim Executive Soundbite */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                      What to Say (Word-for-Word):
                    </span>
                    <p className="italic text-slate-800 leading-relaxed font-medium">
                      "{block.data.verbatim_soundbite}"
                    </p>
                  </div>

                  {/* Anticipated Objection & Counter */}
                  {block.data.anticipated_objection && (
                    <div className="p-3 bg-white/70 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="text-rose-900 font-semibold">
                        Tough Question They Might Get: "{block.data.anticipated_objection}"
                      </div>
                      <div className="text-slate-700 pl-2 border-l-2 border-slate-300 mt-1">
                        <strong>How to Answer:</strong> {block.data.counter_narrative}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. TAB 3: UPCOMING CALLS ─── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Synced Calendar Meetings</h3>
            <span className="text-xs text-slate-500">Preps automatically before each call</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMeetingId(m.id);
                  setActiveTab('briefing');
                }}
                className={`p-5 rounded-xl border bg-white shadow-card transition cursor-pointer hover:border-slate-300 ${
                  m.id === selectedMeetingId ? 'border-emerald-600 ring-1 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Prep Notes Ready
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{m.company_name}</span>
                  <span>&bull;</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.scheduled_time || 'Upcoming'}</span>
                </div>

                <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span>{m.attendees?.length || 0} Confirmed Attendees</span>
                  <span className="text-emerald-800 font-semibold hover:underline flex items-center gap-1">
                    View Prep Notes &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. NEW MEETING MODAL ─── */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Add Upcoming Call
              </h3>
              <button onClick={() => setShowNewMeetingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics: Executive CFO Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics Global"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scheduled Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow, 2:00 PM EST"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Attendee Emails (comma separated)</label>
                <input
                  type="text"
                  placeholder="sarah.chen@apex.com, marcus.vance@apex.com"
                  value={newEmails}
                  onChange={(e) => setNewEmails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Prep My Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
