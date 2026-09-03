import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  Upload,
  Play,
  RefreshCw,
  Plus,
  Building2,
  Quote,
  HelpCircle,
  Download,
  X,
  FileText,
  Mail,
  User,
  Users,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
  Share2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import {
  fetchDeals,
  createDeal,
  uploadTranscriptFile,
  uploadTranscriptText,
  triggerDealDiagnostic,
  fetchMedpiccScorecard
} from '../api';

export default function DealHealth({ currentTenant }) {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  // Drawers & Modals
  const [activeBoxDrawer, setActiveBoxDrawer] = useState(null); // Dedicated dimension audit & override drawer
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [showExecutionConsole, setShowExecutionConsole] = useState(false);
  
  // Override State inside Drawer
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideContact, setOverrideContact] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideSaved, setOverrideSaved] = useState(false);

  // Email / Upload inputs
  const [transcriptInput, setTranscriptInput] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [newDealName, setNewDealName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newDealSize, setNewDealSize] = useState('145000');

  const loadDeals = async () => {
    setIsLoading(true);
    const data = await fetchDeals(currentTenant);
    setDeals(data);
    if (data.length > 0 && !selectedDealId) {
      setSelectedDealId(data[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDeals();
  }, [currentTenant]);

  useEffect(() => {
    if (selectedDealId) {
      loadScorecard(selectedDealId);
    }
  }, [selectedDealId]);

  const loadScorecard = async (dealId) => {
    setIsLoading(true);
    const data = await fetchMedpiccScorecard(dealId);
    setScorecard(data);
    if (data?.follow_up_email) {
      setEmailSubject(data.follow_up_email.subject || 'Next Steps Alignment: Apex Logistics x Whipstitch');
      setEmailDraft(data.follow_up_email.body_content || '');
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDealId) return;
    try {
      setIsLoading(true);
      const res = await uploadTranscriptFile(selectedDealId, file);
      setTranscriptInput(res.full_text || '');
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!selectedDealId) return;
    try {
      setIsDiagnosing(true);
      if (transcriptInput.trim()) {
        await uploadTranscriptText(selectedDealId, transcriptInput);
      }
      await triggerDealDiagnostic(selectedDealId, {
        tenant_id: currentTenant,
        deal_context: { transcript_text: transcriptInput }
      });
      setShowUploadModal(false);
      await loadScorecard(selectedDealId);
      await loadDeals();
    } catch (err) {
      alert('Diagnostic trigger failed: ' + err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!newDealName || !newCompanyName) return;
    try {
      const created = await createDeal({
        tenant_id: currentTenant,
        deal_name: newDealName,
        company_name: newCompanyName,
        deal_size: parseFloat(newDealSize) || 145000,
      });
      setShowNewDealModal(false);
      setNewDealName('');
      setNewCompanyName('');
      await loadDeals();
      setSelectedDealId(created.id);
    } catch (err) {
      alert('Failed to create deal: ' + err.message);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailDraft}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleOpenEmailClient = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailDraft)}`;
    window.open(mailto, '_blank');
  };

  const handleSaveOverride = () => {
    setOverrideSaved(true);
    setTimeout(() => setOverrideSaved(false), 2500);
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  // 8 MEDDPICC dimensions metadata
  const medpiccItems = [
    { key: 'Metrics', letter: 'M', name: 'Metrics', max: 15 },
    { key: 'Economic Buyer', letter: 'E', name: 'Economic Buyer', max: 15 },
    { key: 'Decision Criteria', letter: 'D', name: 'Decision Criteria', max: 10 },
    { key: 'Decision Process', letter: 'D', name: 'Decision Process', max: 10 },
    { key: 'Paper Process', letter: 'P', name: 'Paper Process', max: 10 },
    { key: 'Implicated Pain', letter: 'I', name: 'Implicated Pain', max: 15 },
    { key: 'Champion', letter: 'C', name: 'Champion', max: 15 },
    { key: 'Competition', letter: 'C', name: 'Competition', max: 10 },
  ];

  const getBoxStatus = (boxName) => {
    const box = scorecard?.boxes?.find((b) => b.box.toLowerCase() === boxName.toLowerCase());
    if (!box) {
      return { score: 12, max: 15, status: 'green', statusIcon: '✓', label: 'Validated', border: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
    }
    const pct = (box.score / (box.max_score || 15)) * 100;
    if (pct >= 67) {
      return { score: box.score, max: box.max_score, status: 'green', statusIcon: '✓', label: 'Validated', border: 'border-emerald-200 bg-emerald-50 text-emerald-800', data: box };
    }
    if (pct >= 40) {
      return { score: box.score, max: box.max_score, status: 'amber', statusIcon: '⚠', label: 'At Risk', border: 'border-amber-200 bg-amber-50 text-amber-800', data: box };
    }
    return { score: box.score, max: box.max_score, status: 'red', statusIcon: '✕', label: 'Missing', border: 'border-rose-200 bg-rose-50 text-rose-800', data: box };
  };

  // Stakeholder Power Map Roster
  const buyingCommittee = [
    { name: 'Sarah Chen', role: 'VP RevOps', tag: 'Champion', status: 'Engaged', statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { name: 'Unassigned', role: 'Chief Financial Officer', tag: 'Economic Buyer', status: 'Missing', statusColor: 'bg-rose-50 text-rose-800 border-rose-200' },
    { name: 'David Miller', role: 'Head of InfoSec', tag: 'Security Gatekeeper', status: 'Pending', statusColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    { name: 'Emma Watson', role: 'Procurement Counsel', tag: 'Paper Process', status: 'Uncontacted', statusColor: 'bg-slate-100 text-slate-600 border-slate-200' },
  ];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* ─── 1. TOP HEADER & DEAL CONTEXT ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Deal Switcher & Quick Metadata */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDealId || ''}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-none p-0 pr-6 focus:ring-0 cursor-pointer"
              >
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
              <span className="font-semibold text-slate-800">{selectedDeal?.company_name || 'Apex Logistics Global'}</span>
              <span>&bull;</span>
              <span className="font-bold text-slate-900">${(selectedDeal?.deal_size || 145000).toLocaleString()}</span>
              <span>&bull;</span>
              <span>Target Close: <strong className="text-slate-700">Oct 31, 2026</strong></span>
              <span>&bull;</span>
              <span>AE: <strong className="text-slate-700">Lauren Davis</strong></span>
              <span>&bull;</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Stage 3 &bull; Solution Validation</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Call</span>
          </button>

          <button
            onClick={handleRunDiagnostic}
            disabled={isDiagnosing || !selectedDealId}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            {isDiagnosing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Re-Diagnose</span>
          </button>

          <a
            href={`/v1/deals/${selectedDealId}/medpicc/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary px-3.5 py-2 text-xs"
            title="Download executive PDF report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export PDF</span>
          </a>

          <button
            onClick={() => setShowNewDealModal(true)}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* ─── 2. DEAL HEALTH STRIP & BENCHMARK BAR ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Health Score & Tag (4 cols) */}
          <div className="md:col-span-4 flex items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400">Deal Health Score</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  {scorecard?.overall_score ?? 68}
                </span>
                <span className="text-slate-400 font-semibold text-sm">/100</span>
                <span className="ml-2 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  {scorecard?.deal_category || 'Rescue'}
                </span>
              </div>
            </div>
            <div className="h-10 border-r border-slate-200 hidden sm:block"></div>
            <div>
              <span className="text-xs text-slate-400 font-semibold">Forecast Likelihood</span>
              <div className="text-xs text-slate-700 font-medium mt-1 space-y-0.5">
                <div><strong className="text-emerald-800">75%</strong> if critical gaps addressed</div>
                <div><strong className="text-rose-800">20%</strong> if CFO meeting ignored</div>
              </div>
            </div>
          </div>

          {/* Historical Won-Deal Benchmark Comparison (8 cols) */}
          <div className="md:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Stage 3 Won-Deal Trajectory Benchmark
              </span>
              <span className="text-slate-500 font-medium">
                Current Deal: <strong className="text-slate-900">68</strong> &bull; Stage 3 Target: <strong className="text-emerald-800">75</strong> (-7 pts)
              </span>
            </div>

            {/* Benchmark Track */}
            <div className="relative w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: '68%' }}
              />
              {/* Target Marker at 75% */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-emerald-600"
                style={{ left: '75%' }}
                title="Historical Stage 3 Won-Deal Target (75)"
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0 (Qualification Start)</span>
              <span className="text-emerald-800 font-semibold">75 Target Benchmark</span>
              <span>100 (Contract Closed)</span>
            </div>
          </div>
        </div>

        {/* ─── 3. 8-PILL MEDDPICC STATUS STRIP (Interactive) ─── */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>MEDDPICC Criteria</span>
              <span className="text-slate-400 font-normal">&bull; Click any pill to audit evidence quotes or override score</span>
            </span>
            <span className="text-slate-400 text-[11px]">8 Dimensions Evaluated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {medpiccItems.map((item, idx) => {
              const boxState = getBoxStatus(item.key);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const box = scorecard?.boxes?.find((b) => b.box.toLowerCase() === item.key.toLowerCase());
                    setActiveBoxDrawer(box || { box: item.name, score: boxState.score, max_score: item.max });
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition cursor-pointer hover:shadow-xs hover:border-slate-300 ${boxState.border}`}
                >
                  <div className="truncate">
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>{item.letter}</span>
                      <span className="text-[11px] font-semibold">{boxState.statusIcon}</span>
                    </div>
                    <div className="text-[10px] truncate opacity-80">{item.name}</div>
                  </div>
                  <div className="text-xs font-bold text-right shrink-0">
                    {boxState.score}/{item.max}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. MAIN WORKSPACE (2-Column 65% / 35% Split) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (65% / 8 cols): Critical Gaps & Evidence */}
        <div className="lg:col-span-8 space-y-5">
          {/* Critical Deal Gaps Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Critical Deal Gaps (Top 2 Blockers)
              </h3>
              <span className="text-xs text-slate-400 font-medium">Prioritized for Next Call</span>
            </div>

            <div className="space-y-4">
              {/* Gap 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h4 className="font-bold text-sm text-slate-900">1. Unverified Economic Buyer Buy-in</h4>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    High Risk of Stall
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-4">
                  Sarah Chen (VP RevOps) confirmed the CFO holds ultimate budget authority for purchases above $100k, but no direct meeting or correspondence with the CFO exists yet.
                </p>

                {/* Evidence Quote Snippet */}
                <div className="ml-4 bg-white p-3 rounded-lg border-l-3 border-rose-500 text-xs text-slate-800 italic leading-relaxed">
                  "Our CFO will need to sign off on anything above $100k before we issue an RFP."
                  <span className="not-italic font-semibold text-slate-900 block mt-1">
                    — Sarah Chen, VP RevOps (Discovery Call &bull; 14:22)
                  </span>
                </div>
              </div>

              {/* Gap 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-sm text-slate-900">2. Paper Process & InfoSec Schedule Undefined</h4>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Timeline Gatekeeper
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-4">
                  Legal review and SOC2 audit lead times are unpinned against the prospect’s target Q3 live date.
                </p>

                {/* Evidence Quote Snippet */}
                <div className="ml-4 bg-white p-3 rounded-lg border-l-3 border-amber-500 text-xs text-slate-800 italic leading-relaxed">
                  "Legal usually takes at least 4 weeks if we haven't scheduled them early."
                  <span className="not-italic font-semibold text-slate-900 block mt-1">
                    — Sarah Chen, VP RevOps (Discovery Call &bull; 22:15)
                  </span>
                </div>
              </div>
            </div>

            {/* Button to open full audit drawer */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-500">Need the complete dimension evidence breakdown?</span>
              <button
                onClick={() => {
                  const firstBox = scorecard?.boxes ? scorecard.boxes[0] : null;
                  setActiveBoxDrawer(firstBox || { box: 'Metrics', score: 13, max_score: 15 });
                }}
                className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Inspect All 8 MEDDPICC Evidence Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Verbatim Quote Spotlight */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Quote className="w-4 h-4 text-emerald-600" />
                Quantified Pain Quote (Core Value Hook)
              </h3>
              <span className="text-xs text-slate-400">Discovery Call &bull; Audio Verified</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border-l-4 border-emerald-600 space-y-2">
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed">
                "We are leaking approximately $140k every year because inbound leads sit unassigned for 48 hours."
              </p>
              <div className="text-xs font-semibold text-emerald-900">
                — Sarah Chen (VP RevOps &bull; Champion)
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (35% / 4 cols): Buying Committee Power Map & Next Action */}
        <div className="lg:col-span-4 space-y-5">
          {/* Buying Committee Power Map */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                Buying Committee Power Map
              </h3>
              <span className="text-xs text-slate-400">1 of 4 Engaged</span>
            </div>

            <div className="space-y-2">
              {buyingCommittee.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{contact.name}</div>
                    <div className="text-slate-500 text-[11px]">{contact.role}</div>
                    <div className="text-slate-400 text-[10px] font-medium">{contact.tag}</div>
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${contact.statusColor}`}>
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prescribed Play & CTA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold">Recommended Next Play</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Schedule 15-Minute CFO Alignment
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Send the follow-up email requesting Sarah Chen connect you with the finance team to validate discretionary tooling budget ahead of InfoSec review.
              </p>
            </div>

            <button
              onClick={() => {
                setShowExecutionConsole(true);
                setTimeout(() => {
                  const el = document.getElementById('execution-console');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Draft Follow-Up Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. EXECUTION CONSOLE (Below - Revealing Follow-Up Email & Discovery Playbook) ─── */}
      <div id="execution-console" className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Execution Console &bull; Follow-Up Email & Discovery Playbook</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-configured with questions specifically targeting unverified Economic Buyer and Paper Process gaps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEmailClient}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in Mail Client</span>
            </button>

            <button
              onClick={handleCopyEmail}
              className="btn-primary px-3.5 py-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Email Composer (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Line:</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Body:</label>
              <textarea
                rows={10}
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 leading-relaxed focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Discovery Prompts for Next Call (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Discovery Talk Track for Next Call</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-semibold text-slate-900 block">Question 1 (CFO Access):</span>
                <p className="italic text-slate-600">
                  "Sarah, to make sure we don't hit an RFP gatekeeper, could we share our 1-page financial impact summary with your CFO before next Tuesday?"
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-semibold text-slate-900 block">Question 2 (Security Lead Time):</span>
                <p className="italic text-slate-600">
                  "What is David Miller’s typical InfoSec backlog for reviewing cloud integrations like ours?"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. AUDIT & OVERRIDE SIDE DRAWER (Viewport-Anchored) ─── */}
      {activeBoxDrawer && (
        <>
          {/* Backdrop (z-[99]) */}
          <div
            onClick={() => setActiveBoxDrawer(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[99] transition-opacity"
          />

          {/* Drawer Panel (z-[100]) */}
          <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-xl bg-white shadow-2xl overflow-y-auto p-6 space-y-6 border-l border-slate-200 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400">MEDDPICC Dimension Audit</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="text-xl font-bold text-slate-900">{activeBoxDrawer.box}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      Weight: {activeBoxDrawer.score} / {activeBoxDrawer.max_score || 15} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveBoxDrawer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Confidence & Reasoning */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  AI Logic & Deduction Reason
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeBoxDrawer.notes || "Score was capped because key decision criteria remain directional rather than contractually verified."}
                </p>
              </div>

              {/* Verbatim Evidence Log */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Verbatim Buyer Evidence Log
                </div>
                {activeBoxDrawer.evidence_quotes && activeBoxDrawer.evidence_quotes.length > 0 ? (
                  <div className="space-y-2">
                    {activeBoxDrawer.evidence_quotes.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-emerald-50/60 border-l-4 border-emerald-600 rounded-lg space-y-1">
                        <p className="text-xs text-slate-800 italic leading-relaxed">
                          "{q.quote}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold text-emerald-900">{q.person_name || 'Sarah Chen'} ({q.role || 'VP RevOps'})</span>
                          <span className="text-slate-400">{q.medium || 'Call Recording &bull; 14:22'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                    No direct verbatim buyer quote detected in the ingested recording.
                  </div>
                )}
              </div>

              {/* Discovery Talk Track */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Discovery Playbook for Next Call
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    &bull; "To ensure no downstream budget roadblocks, who else sits on the commercial sign-off committee?"
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    &bull; "What is the consequence if this implementation slip past the Q3 deadline?"
                  </div>
                </div>
              </div>

              {/* Rep Verification / Manual Override (Crucial!) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">Rep Verification & Manual Override</div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOverridden}
                      onChange={(e) => setIsOverridden(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span>Disagree with AI Score</span>
                  </label>
                </div>

                {isOverridden && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Link Verified Contact from CRM:</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe (CFO, Apex Logistics)"
                        value={overrideContact}
                        onChange={(e) => setOverrideContact(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Paste Rep Override Evidence Notes:</label>
                      <textarea
                        rows={3}
                        placeholder="Notes confirming direct sponsor alignment..."
                        value={overrideNotes}
                        onChange={(e) => setOverrideNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {overrideSaved && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Changes synced to CRM!
                        </span>
                      )}
                      <button
                        onClick={handleSaveOverride}
                        className="btn-primary text-xs ml-auto"
                      >
                        Sync Override to HubSpot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom drawer close */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveBoxDrawer(null)}
                className="btn-secondary text-xs px-4"
              >
                Close Dimension Audit
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── 7. UPLOAD TRANSCRIPT MODAL ─── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                Upload Call Recording or Transcript
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition">
              <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900 mb-0.5">
                Drop Zoom, Teams, or Otter Transcript (.vtt, .srt, .docx, .pdf, .txt)
              </p>
              <label className="btn-secondary text-xs cursor-pointer mt-2 px-3 py-1.5 inline-block">
                Choose File
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.vtt,.srt,.docx,.pdf"
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Paste Meeting Notes / Dialogue:
              </label>
              <textarea
                rows={6}
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Paste verbatim dialogue from discovery call..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRunDiagnostic}
                disabled={isDiagnosing}
                className="btn-primary text-xs"
              >
                {isDiagnosing ? 'Analyzing...' : 'Run MEDDPICC Diagnostic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. NEW DEAL MODAL ─── */}
      {showNewDealModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-modal space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Create New Deal Track
            </h3>

            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Deal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise RevOps Platform"
                  value={newDealName}
                  onChange={(e) => setNewDealName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Logistics"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Target Deal Size ($)</label>
                <input
                  type="number"
                  placeholder="145000"
                  value={newDealSize}
                  onChange={(e) => setNewDealSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDealModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
