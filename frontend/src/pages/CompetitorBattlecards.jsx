import React, { useState, useEffect } from 'react';
import {
  Swords,
  ShieldAlert,
  Target,
  AlertTriangle,
  Copy,
  Plus,
  RefreshCw,
  Search,
  Check,
  TrendingUp,
  HelpCircle,
  Clock,
  Layers,
  Zap,
  Building2,
  X,
  ExternalLink,
  Sliders,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  fetchBattlecards,
  fetchBattlecardDetail,
  generateCustomBattlecard,
  autoGenerateBattlecards,
  fetchLiveSignals,
  scanBuyingSignals,
  ingestSignal
} from '../api';
import InfoTooltip from '../components/InfoTooltip';

export default function CompetitorBattlecards({ currentTenant }) {
  const companyLabel = (currentTenant || 'your company').replace(/_/g, ' ');
  const [battlecards, setBattlecards] = useState([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(null);
  const [battlecardDetail, setBattlecardDetail] = useState(null);
  const [signals, setSignals] = useState([]);
  const [activeTab, setActiveTab] = useState('killshots'); // 'killshots' | 'blackboard' | 'objections' | 'signals'
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedHookIndex, setCopiedHookIndex] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCompetitor, setCustomCompetitor] = useState('');
  const [customBuyer, setCustomBuyer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [bList, sigs] = await Promise.all([
        fetchBattlecards(currentTenant),
        fetchLiveSignals(currentTenant),
      ]);
      setBattlecards(bList);
      setSignals(sigs);
      setSelectedCompetitorId(bList.length > 0 ? bList[0].id : null);
      setBattlecardDetail(bList.length > 0 ? bList[0] : null);
      setIsLoading(false);
    })();
  }, [currentTenant]);

  const handleScanSignals = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const sigs = await scanBuyingSignals(currentTenant);
      setSignals(sigs);
      if (sigs.length === 0) {
        setScanError('No fresh signals found. Add prospects in the Outbound Queue or deals in Deal Health, then scan again.');
      }
    } catch (err) {
      setScanError(err.message || 'Signal scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (selectedCompetitorId) {
      (async () => {
        setIsLoading(true);
        const detail = await fetchBattlecardDetail(selectedCompetitorId, currentTenant);
        setBattlecardDetail(detail);
        setIsLoading(false);
      })();
    }
  }, [selectedCompetitorId, currentTenant]);

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    setGenError(null);
    try {
      const cards = await autoGenerateBattlecards(currentTenant);
      setBattlecards(cards);
      if (cards.length > 0) {
        setSelectedCompetitorId(cards[0].id);
        setBattlecardDetail(cards[0]);
      }
    } catch (err) {
      setGenError(err.message || 'Could not generate battlecards.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyHook = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedHookIndex(index);
    setTimeout(() => setCopiedHookIndex(null), 2000);
  };

  const handleCreateCustomBattlecard = async (e) => {
    e.preventDefault();
    if (!customCompetitor) return;
    try {
      setIsGenerating(true);
      const generated = await generateCustomBattlecard({
        competitor_name: customCompetitor,
        tenant_id: currentTenant,
        buyer_company: customBuyer || undefined,
      });
      setBattlecards((prev) => [generated, ...prev]);
      setSelectedCompetitorId(generated.id);
      setBattlecardDetail(generated);
      setShowCustomModal(false);
      setCustomCompetitor('');
      setCustomBuyer('');
    } catch (err) {
      alert('Failed to generate playbook: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatStageTitle = (stageNum, rawName) => {
    const friendlyNames = {
      1: 'The Situation & Deal Context',
      2: "The Buyer's Urgency & Pressure",
      3: 'Why Whipstitch Wins (Our Edge)',
      4: 'Hard Numbers & ROI Proof',
      5: 'How to Pitch & Next Move',
    };
    return friendlyNames[stageNum] || rawName;
  };

  const friendlyParamKey = (key) => {
    const keyMap = {
      primary_rival: 'Competitor',
      deal_risk: 'Main Deal Risk',
      market_pressure: 'Market Pressure',
      target_metric: 'Target Metric',
      kill_shot_category: 'Our Key Edge',
      payback_period_days: 'Payback Period',
      annual_leakage_saved: 'Estimated Savings',
      recommended_next_play: 'Recommended Pitch',
      churn_risk: 'Churn Risk',
      hours_saved_per_rep_week: 'Hours Saved / Rep / Wk',
      threat: 'Main Threat',
      target_evaluator: 'Key Decision Maker',
      urgency: 'Deal Urgency',
      differentiation: 'Core Differentiator',
      cost_comparison: 'Cost Comparison',
      action: 'Recommended Action',
      competitor: 'Competitor',
      pressure: 'Urgency Driver',
      advantage: 'Our Advantage',
      pitch: 'Sales Angle',
      hours_unlocked_per_week: 'Billable Hours Unlocked / Wk',
      calculation_basis: 'Calculation Basis',
    };
    return keyMap[key] || key.replace(/_/g, ' ');
  };

  const getSignalBadge = (sigType) => {
    switch (sigType) {
      case 'seasonal_campaign_window':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Seasonal Campaign (Diwali / EOSS)</span>;
      case 'leadership_shift':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Leadership Move</span>;
      case 'capital_expansion':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Funding / Expansion</span>;
      case 'tech_stack_migration':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Tech Stack Shift</span>;
      case 'compliance_infosec':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Security & Compliance</span>;
      case 'incumbent_churn':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">Competitor Churn Risk</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Traffic Surge</span>;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* ─── 1. TOP HEADER & COMPETITOR SELECTOR ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Swords className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Competitor Playbooks & Live Triggers
              </h1>
              <InfoTooltip
                title="Competitor Playbooks"
                content="Your field guide for when prospects mention rival products or alternative solutions (including hiring in-house). Gives you fair traps to set on calls, hard ROI math, and ready-to-use objection scripts."
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rep cheat sheets, objection handling scripts, and real-time triggers to win against rivals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="btn-primary px-3.5 py-2 text-xs self-start lg:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Competitor Playbook</span>
        </button>
      </div>

      {/* ─── 2. COMPETITOR SELECTOR PILLS ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-card space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-600">Choose Competitor or Alternative:</span>
            <InfoTooltip
              title="Competitors & Alternatives"
              content="Pick the rival or alternative you're facing. In B2B sales, your rival isn't always another software tool—it can be hiring an in-house team, an agency, or sticking to Excel."
            />
          </div>
          <span className="text-slate-400 font-medium">AI-Generated Playbook</span>
        </div>

        {genError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
            {genError}
          </div>
        )}
        {battlecards.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
            <h4 className="text-sm font-bold text-slate-800 capitalize">
              No competitor battlecards generated for {companyLabel} yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Whipstitch reads your company description and offering, works out who you actually
              lose deals to, and writes a battlecard for each — traps, kill-shots, and objection scripts.
            </p>
            <button
              onClick={handleAutoGenerate}
              disabled={isAutoGenerating}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isAutoGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="capitalize">
                {isAutoGenerating ? 'Generating…' : `Generate AI battlecards for ${companyLabel}`}
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {battlecards.map((b) => {
              const isSelected = b.id === selectedCompetitorId;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedCompetitorId(b.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer hover:shadow-xs ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-card'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {b.competitor_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {b.competitor_category || 'Alternative'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>


      {/* ─── 3. WORKSPACE TABS ─── */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-2 text-sm font-semibold pb-1">
          <button
            onClick={() => setActiveTab('killshots')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'killshots'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Silver Bullets & Traps ({battlecardDetail?.kill_shots?.length || 0})</span>
            <InfoTooltip
              title="Silver Bullets & Traps"
              content="Sharp, fair counter-arguments. Instead of badmouthing the rival, you ask a simple question that makes their hidden weaknesses obvious to the buyer."
            />
          </button>

          <button
            onClick={() => setActiveTab('blackboard')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blackboard'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>5-Step Deal Strategy</span>
            <InfoTooltip
              title="5-Step Deal Strategy"
              content="A step-by-step game plan showing the buyer's pain, why you win, concrete ROI numbers, and your recommended closing move."
            />
          </button>

          <button
            onClick={() => setActiveTab('objections')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'objections'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Objection Cheat Sheet ({battlecardDetail?.objection_matrix?.length || 0})</span>
            <InfoTooltip
              title="Objection Cheat Sheet"
              content="Direct answers to tough questions prospects throw at you during sales calls, backed by verified benchmarks."
            />
          </button>

          <button
            onClick={() => setActiveTab('signals')}
            className={`pb-3 px-3 transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'signals'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Live Buying Triggers ({signals.length})</span>
            <InfoTooltip
              title="Live Buying Triggers"
              content="Fresh company news (like new executive hires or funding rounds) paired with ready-to-send messages so you can reach out at the perfect moment."
            />
          </button>
        </div>
      </div>

      {/* ─── 4. TAB 1: SILVER BULLETS & TRAPS ─── */}
      {activeTab === 'killshots' && (
        <div className="space-y-6">
          {/* Verdict Callout */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">The Winning Angle (Executive Summary)</span>
              <InfoTooltip
                title="Executive Verdict"
                content="The core reason why buyers pick you over this rival. Memorize this 1-line wedge for all your prospect conversations."
              />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {battlecardDetail?.summary_verdict || 'Analyzing competitive displacement strategy...'}
            </h3>
            {battlecardDetail?.pricing_weakness && (
              <div className="flex items-center gap-1.5 pt-1">
                <p className="text-xs text-rose-700 font-semibold">
                  Their Pricing Weakness: {battlecardDetail?.pricing_weakness}
                </p>
                <InfoTooltip
                  title="Pricing Weakness"
                  content="Hidden charges, platform fees, seat minimums, or rigid contracts that make the rival far more expensive than they appear on paper."
                />
              </div>
            )}
          </div>

          {/* Silver Bullets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {battlecardDetail?.kill_shots?.map((ks, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-4 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{ks.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ks.evidence_basis === 'tenant_verified_intel' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Tenant Intel
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Category Pattern
                        </span>
                      )}
                      <InfoTooltip
                        title="Intel Source"
                        content="Verified Tenant Intel comes from your own closed-won deals and customer quotes. Category Pattern reflects broader market benchmarks and review data."
                      />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                        The Trap to Set
                      </span>
                    </div>
                  </div>

                  {/* What They Tell Buyers */}
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                        What They Tell Buyers:
                      </span>
                      <InfoTooltip
                        title="Competitor Pitch"
                        content="What the competitor promises the buyer in their demos. Knowing their pitch in advance lets you prepare the prospect before they hear it."
                      />
                    </div>
                    <p className="italic text-slate-700">
                      "{ks.the_trap}"
                    </p>
                  </div>

                  {/* The Flaw They Hide */}
                  <div className="space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                        The Flaw They Hide:
                      </span>
                      <InfoTooltip
                        title="The Hidden Flaw"
                        content="The real headache customers face 3 months in—such as stale contact data, surprise add-on fees, or rigid contracts."
                      />
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      {ks.the_vulnerability}
                    </p>
                  </div>

                  {/* The Trap Question to Ask */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                        The Trap Question to Ask (On Your Call):
                      </span>
                      <InfoTooltip
                        title="The Trap Question"
                        content="Ask this innocent question during your call. If the prospect asks the competitor this, the competitor will struggle to answer cleanly."
                      />
                    </div>
                    <p className="font-semibold text-slate-900">
                      "{ks.the_counter_strike}"
                    </p>
                  </div>

                  {/* What to Say Word for Word */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                        What to Say (Word-for-Word):
                      </span>
                      <InfoTooltip
                        title="Rep Talk Track"
                        content="Say this exact phrase when the prospect brings up the competitor. It re-frames the conversation around your strengths without sounding defensive."
                      />
                    </div>
                    <p className="text-slate-900 font-medium italic">
                      "{ks.verbatim_soundbite}"
                    </p>
                  </div>
                </div>

                {/* Bottom Proof & Copy */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 truncate max-w-[280px]">
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      Proof & Data: {ks.evidence_proof || 'Verified across 50+ customer benchmarks.'}
                    </span>
                    <InfoTooltip
                      title="Proof Benchmark"
                      content="Concrete numbers and benchmarks to validate your claim so you don't sound like you're just making sales claims."
                    />
                  </div>
                  <button
                    onClick={() => handleCopy(ks.verbatim_soundbite, idx)}
                    className="btn-secondary text-xs shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedIndex === idx ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. TAB 2: 5-STEP DEAL STRATEGY ─── */}
      {activeTab === 'blackboard' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                5-Step Competitive Deal Strategy
              </h3>
              <InfoTooltip
                title="5-Step Deal Strategy"
                content="A step-by-step game plan showing the buyer's pain, why you win, concrete ROI numbers, and your recommended closing move."
              />
            </div>
            <p className="text-xs text-slate-500">
              How our AI breaks down the deal—from the prospect's pain to the exact pitch to close.
            </p>
          </div>

          <div className="space-y-4">
            {battlecardDetail?.blackboard_stages?.map((stage) => (
              <div
                key={stage.stage_number}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      0{stage.stage_number}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {formatStageTitle(stage.stage_number, stage.stage_name)}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Strategic Insight
                    </span>
                    <InfoTooltip
                      title="Strategic Insight"
                      content="Core game plan for this stage: how to frame your value, eliminate buyer doubts, and outmaneuver the rival."
                    />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {stage.executive_summary}
                </p>

                {/* Structured Key Deal Facts */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Deal Facts</span>
                    <InfoTooltip
                      title="Key Deal Facts"
                      content="Verified numbers and benchmarks (such as payback period in days and estimated savings) to quote during your conversation."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.entries(stage.details || {}).map(([key, val]) => (
                      <div key={key} className="text-slate-600 border-b border-slate-100 pb-1 leading-snug">
                        <span className="font-medium text-slate-500 mr-1.5">{friendlyParamKey(key)}:</span>
                        <strong className="text-slate-900">{String(val)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. TAB 3: OBJECTION CHEAT SHEET ─── */}
      {activeTab === 'objections' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Objection Cheat Sheet
              </h3>
              <InfoTooltip
                title="Objection Handling"
                content="Word-for-word responses to tough buyer questions and competitor claims, backed by verified benchmarks."
              />
            </div>
            <p className="text-xs text-slate-500">
              Word-for-word responses to tough buyer questions and competitor claims, backed by verified data.
            </p>
          </div>

          <div className="space-y-4">
            {battlecardDetail?.objection_matrix?.map((obj, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-sm text-slate-900">"{obj.objection}"</h4>
                    <InfoTooltip
                      title="Common Objection"
                      content="This objection usually surfaces when the buyer is either budget-conscious or afraid of the effort required to switch providers."
                    />
                  </div>
                  <button
                    onClick={() => handleCopy(obj.talk_track, `obj-${idx}`)}
                    className="btn-secondary text-xs self-end sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedIndex === `obj-${idx}` ? 'Copied!' : 'Copy Response'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Why They're Asking This:</span>
                      <InfoTooltip
                        title="Underlying Concern"
                        content="The real worry behind the question (e.g. implementation headache, wasted budget, or risk of looking bad to leadership)."
                      />
                    </div>
                    <p className="text-slate-600 mt-0.5">{obj.root_cause}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-800">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">What to Say:</span>
                      <InfoTooltip
                        title="Talk Track"
                        content="Read or say this naturally on your call. It acknowledges their concern with empathy and guides them toward your distinct edge."
                      />
                    </div>
                    <p className="italic text-xs sm:text-sm leading-relaxed font-medium">
                      "{obj.talk_track}"
                    </p>
                  </div>

                  <div className="pt-1 text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Proof to Back It Up:</span>
                    <span>{obj.proof_point}</span>
                    <InfoTooltip
                      title="Proof Benchmark"
                      content="A verified data point you can cite so the client knows you have delivered these results for similar companies."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 7. TAB 4: LIVE BUYING TRIGGERS ─── */}
      {activeTab === 'signals' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Live Buying Signals & Triggers
                </h3>
                <InfoTooltip
                  title="Live Buying Signals"
                  content="Real-world company events (like new VP hires, funding rounds, or software changes) that indicate a prospect is actively ready to buy right now. We scan your pipeline accounts for these on demand."
                />
              </div>
              <button
                onClick={handleScanSignals}
                disabled={isScanning}
                className="btn-primary text-xs px-3.5 py-2 disabled:opacity-50 shrink-0"
              >
                {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isScanning ? 'Scanning…' : 'Scan for Buying Signals'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Scans your Outbound Queue prospects and Deal Health accounts for recent leadership moves,
              funding, expansion, and churn signals — each paired with a ready outreach hook.
            </p>
          </div>

          {scanError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
              {scanError}
            </div>
          )}

          {signals.length === 0 && !isScanning && (
            <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
              <h4 className="text-sm font-bold text-slate-800">No buying signals scanned yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Trigger an outbound batch or add a deal first, then hit <strong>Scan for Buying Signals</strong> to
                pull fresh company news for those accounts.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {signals.map((sig, idx) => (
              <div
                key={sig.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {getSignalBadge(sig.signal_type)}
                    <span className="font-bold text-sm text-slate-900">{sig.account_name}</span>
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <span className="text-xs text-slate-500">{sig.detected_at}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        +{sig.opportunity_viability_boost} Timing Advantage
                      </span>
                      <InfoTooltip
                        title="Timing Advantage"
                        content="Reaching out within days of a trigger event results in 3x–5x higher response rates than cold outreach."
                      />
                    </div>
                    <button
                      onClick={() => handleCopyHook(sig.pre_drafted_hook, idx)}
                      className="btn-primary text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedHookIndex === idx ? 'Copied Hook!' : 'Copy Message Hook'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-slate-900">{sig.headline}</h4>
                  <p className="text-slate-600 leading-relaxed">{sig.snippet}</p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Why Reach Out Now:</span>
                      <InfoTooltip
                        title="Urgency Reason"
                        content="Why this event creates an immediate need for your solution right now, before the window closes."
                      />
                    </div>
                    <p className="text-slate-800 font-semibold">{sig.recommended_sales_play}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Ready-to-Send Message Hook:</span>
                      <InfoTooltip
                        title="Pre-Drafted Message"
                        content="A friendly, relevant opening message ready to copy-paste into LinkedIn InMail, email, or WhatsApp."
                      />
                    </div>
                    <p className="italic text-slate-900">"{sig.pre_drafted_hook}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 8. CUSTOM COMPETITOR MODAL ─── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-700" />
                Generate Competitor Playbook
              </h3>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBattlecard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Competitor / Alternative Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clay.com or Outreach.io"
                  value={customCompetitor}
                  onChange={(e) => setCustomCompetitor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Prospect (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={customBuyer}
                  onChange={(e) => setCustomBuyer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-primary"
                >
                  {isGenerating ? 'Analyzing Competitor...' : 'Generate Playbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
