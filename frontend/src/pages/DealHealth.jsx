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
  ChevronDown,
  Search,
  CheckCheck,
  Loader2,
  Activity,
  Layers,
  Send,
  Info
} from 'lucide-react';
import {
  fetchDeals,
  createDeal,
  uploadTranscriptFile,
  uploadTranscriptText,
  triggerDealDiagnostic,
  fetchMedpiccScorecard,
  fetchCommitteeMembers,
  triggerCommitteeAutoFind,
  addCommitteeMember,
  getCommitteeStreamUrl
} from '../api';
import InfoTooltip from '../components/InfoTooltip';

export default function DealHealth({ currentTenant }) {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Progressive Disclosure: 3-Tab State
  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'evidence' | 'actions'
  
  // Drawers & Modals
  const [activeBoxDrawer, setActiveBoxDrawer] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [showExecutionConsole, setShowExecutionConsole] = useState(false);
  
  // Override & Evidence Source Picker State
  const [evidenceSourceType, setEvidenceSourceType] = useState('call_transcript'); // 'call_transcript' | 'whatsapp' | 'manual_note'
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
  const [newDealSize, setNewDealSize] = useState('1500000');
  const [newDealCurrency, setNewDealCurrency] = useState('INR');
  const [newDealTier, setNewDealTier] = useState('Tier 1: Founder-Led SMB');
  const [currentTier, setCurrentTier] = useState('Tier 1: Founder-Led SMB');

  const formatCurrency = (amount, currency = 'INR') => {
    if (!amount && amount !== 0) return currency === 'INR' ? '₹0' : '$0';
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    if (currency === 'INR') {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakhs`;
      return `₹${num.toLocaleString('en-IN')}`;
    }
    return `$${num.toLocaleString('en-US')}`;
  };

  // Buying committee is populated from the API per deal; no fabricated defaults.
  const [committee, setCommittee] = useState([]);
  const [showAutoFindModal, setShowAutoFindModal] = useState(false);
  const [autoFindRole, setAutoFindRole] = useState(null);
  const [isAutoFinding, setIsAutoFinding] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamLogs, setStreamLogs] = useState([]);
  const [discoveredCandidate, setDiscoveredCandidate] = useState(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

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

  const loadCommittee = async (dealId) => {
    try {
      const data = await fetchCommitteeMembers(dealId);
      if (data && data.length > 0) {
        setCommittee(data);
      }
    } catch (err) {
      console.warn('Could not fetch committee members', err);
    }
  };

  useEffect(() => {
    if (selectedDealId) {
      loadScorecard(selectedDealId);
      loadCommittee(selectedDealId);
      const deal = deals.find((d) => d.id === selectedDealId);
      if (deal?.buyer_tier) {
        setCurrentTier(deal.buyer_tier);
      }
    }
  }, [selectedDealId, deals]);

  const loadScorecard = async (dealId) => {
    setIsLoading(true);
    setScorecard(null); // drop the previous deal's scorecard so it can't flash under the new deal's header
    const data = await fetchMedpiccScorecard(dealId);
    setScorecard(data);
    if (data?.follow_up_email) {
      setEmailSubject(data.follow_up_email.subject || 'Next Steps & Alignment');
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
        deal_context: {
          transcript_text: transcriptInput,
          buyer_tier: currentTier,
          tenant_track: 'Service / Retainer',
          currency: selectedDeal?.currency || 'INR'
        }
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
        deal_size: parseFloat(newDealSize) || 1500000,
        currency: newDealCurrency,
        buyer_tier: newDealTier,
        tenant_track: 'Service / Retainer',
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

  // 8 MEDDPICC dimensions metadata with full, untruncated titles and plain sales descriptions
  const getMedpiccItems = () => {
    const isTier1 = currentTier.includes('Tier 1');
    const isTier2 = currentTier.includes('Tier 2');
    return [
      {
        key: 'Metrics',
        letter: 'M',
        name: 'Metrics',
        sub: isTier1 ? 'Budget & Target Numbers' : 'Quantified ROI & Impact',
        max: isTier1 ? 20 : 15,
        tooltip: 'The Budget & Target Numbers: Did the client give you real, concrete numbers (e.g. ₹15L budget or 3.5x ROAS)? If they have not shared a specific number, you do not have a real budget yet.',
        criteria: [
          'Client confirmed a specific budget in Rupees or Dollars',
          'Agreed on target business results (ROAS, leads, or revenue)',
          'Current baseline verified so you can prove your ROI'
        ]
      },
      {
        key: 'Economic Buyer',
        letter: 'E',
        name: 'Economic Buyer',
        sub: isTier1 ? 'Founder & Cheque Signer' : 'Function Head & Finance Signer',
        max: 20,
        tooltip: 'Who Signs the Cheque: The ONE person with final authority to release funds. In SMBs/D2C, it is the Founder. In larger brands, it is the VP + Finance head. If you have not spoken to them or got their direct thumbs-up, this deal is at high risk of stalling.',
        criteria: [
          'Cheque signer identified by name and job title',
          'Direct verbal or WhatsApp confirmation from them',
          'Warning: Score is capped at 9/20 until you talk directly to this person'
        ]
      },
      {
        key: 'Decision Criteria',
        letter: 'D',
        name: 'Decision Criteria',
        sub: 'Deliverables & Scope',
        max: 10,
        tooltip: 'What They Expect Us to Deliver: What does the client need to see before saying "Yes"? Deliverables (e.g. 25 videos), revision limits, timeline, and pricing. Make sure both sides agree on paper so expectations do not shift later.',
        criteria: [
          'Exact deliverables and creative formats agreed in writing',
          'Clear turnaround times, SLAs, and revision limits defined',
          'Pricing structure and payment terms accepted'
        ]
      },
      {
        key: 'Decision Process',
        letter: 'D',
        name: 'Decision Process',
        sub: isTier1 ? 'Single-Step Sign-Off' : 'Approval Sequence',
        max: isTier1 ? 5 : 10,
        tooltip: 'How They Approve Deals: The exact steps from your pitch to money in the bank. In smaller companies, it is just Founder approval. In larger brands, it is Marketing Head ➔ Finance ➔ Legal. Know who has to sign what, and by when.',
        criteria: [
          isTier1 ? 'Founder single-step approval path confirmed' : 'Multi-step review sequence mapped (Marketing ➔ Finance ➔ Legal)',
          'Target dates agreed for contract signing and project kickoff'
        ]
      },
      {
        key: 'Paper Process',
        letter: 'P',
        name: 'Paper Process',
        sub: isTier1 ? 'SOW & 50% Advance' : 'PO Release & Empanelment',
        max: 15,
        tooltip: 'Getting Paid (Advance Invoice): The paperwork and money trail. In service deals, this means: SOW signed, GST details verified, and 50% advance payment in your bank. Never start work without the advance—client accounts teams take 7–10 days to process invoices.',
        criteria: [
          'SOW deliverables and timeline agreed in writing',
          '50% advance payment terms locked before kickoff',
          'GST registration details and accounts billing contact verified'
        ]
      },
      {
        key: 'Implicated Pain',
        letter: 'I',
        name: 'Implicated Pain',
        sub: 'Why Buy Now (Urgency)',
        max: 15,
        tooltip: 'Why They Must Buy Now: Why does the client need to hire you right now instead of waiting 3 months? Is there a hard deadline like Diwali? What happens to their business if they do nothing or keep struggling with in-house freelancers?',
        criteria: [
          'Hard calendar deadline tied to revenue season (e.g. Diwali launch)',
          'Quantified cost or lost revenue if project launch is delayed',
          'Client admits doing it in-house or doing nothing has already failed'
        ]
      },
      {
        key: 'Champion',
        letter: 'C',
        name: 'Champion',
        sub: 'Your Internal Ally',
        max: 10,
        tooltip: 'Your Internal Ally: Your biggest advocate inside the client company (e.g. VP Marketing). They want you to win, give you insider tips, and actively pitch you to the Founder when you are not in the room.',
        criteria: [
          'Point of contact actively pitching you to leadership',
          'Warns you early about internal objections, budgets, or delays',
          'Warning: Capped at 5/10 points if your contact lacks direct Founder access'
        ]
      },
      {
        key: 'Competition',
        letter: 'C',
        name: 'Competition',
        sub: 'Who Else They Pitch',
        max: isTier1 ? 5 : 10,
        tooltip: 'Who You Are Up Against: Who else is the client considering? Rival agencies, cheaper freelancers, or their own in-house team? Know what they are comparing you against so you can show why your speed and track record win.',
        criteria: [
          'Alternative agencies, freelancers, or internal DIY identified',
          'Clear reason locked on why your agency wins (ROAS, speed, SLA)'
        ]
      },
    ];
  };

  const medpiccItems = getMedpiccItems();

  const getBoxStatus = (boxName) => {
    const box = scorecard?.boxes?.find((b) => b.box.toLowerCase() === boxName.toLowerCase());
    const itemMeta = medpiccItems.find((m) => m.key.toLowerCase() === boxName.toLowerCase()) || { max: 15 };
    const maxScore = itemMeta.max;
    if (!box) {
      return { score: 0, max: maxScore, status: 'none', statusIcon: '—', label: 'No data', border: 'border-slate-200 bg-slate-50 text-slate-500' };
    }
    const pct = (box.score / maxScore) * 100;
    if (pct >= 67) {
      return { score: box.score, max: maxScore, status: 'green', statusIcon: '✓', label: 'Validated', border: 'border-emerald-200 bg-emerald-50 text-emerald-800', data: box };
    }
    if (pct >= 40) {
      return { score: box.score, max: maxScore, status: 'amber', statusIcon: '⚠', label: 'At Risk', border: 'border-amber-200 bg-amber-50 text-amber-800', data: box };
    }
    return { score: box.score, max: maxScore, status: 'red', statusIcon: '✕', label: 'Missing', border: 'border-rose-200 bg-rose-50 text-rose-800', data: box };
  };

  const getBoxRubricBreakdown = (boxName) => {
    const name = boxName?.toLowerCase() || '';
    const isTier1 = currentTier.includes('Tier 1');
    const isTier2 = currentTier.includes('Tier 2');

    if (name.includes('metric')) {
      return {
        max: isTier1 ? 20 : 15,
        items: [
          { text: 'Target outcome quantified (ROAS / CPL / Revenue baseline)', points: '+7 pts', status: 'verified' },
          { text: 'Total campaign budget stated in currency (₹15 Lakhs)', points: '+6 pts', status: 'verified' },
          { text: 'Historical conversion baseline verified from past data', points: '0 pts (Pending)', status: 'pending' },
        ],
        hardCapNotice: null,
      };
    }
    if (name.includes('economic')) {
      return {
        max: 20,
        items: [
          { text: isTier1 ? 'Founder / Managing Director identified as commercial signer' : 'Function Head & Finance Signer mapped', points: '+5 pts', status: 'verified' },
          { text: isTier1 ? 'Direct commercial confirmation via call or WhatsApp' : 'Direct confirmation from Finance signer', points: '0 pts (Pending)', status: 'pending' },
          { text: 'Discretionary spend authority verified for target deal size', points: '+4 pts', status: 'verified' },
        ],
        hardCapNotice: 'Rule 6.2 Hard Cap Active: Capped at max 9/20 points until Founder / Budget Owner direct confirmation is verified.',
      };
    }
    if (name.includes('criteria')) {
      return {
        max: 10,
        items: [
          { text: 'Scope of deliverables & creative formats agreed in writing', points: '+4 pts', status: 'verified' },
          { text: 'Target ROAS (3.5x) and revision limits clearly defined', points: '+3 pts', status: 'verified' },
          { text: 'Selection criteria ranked against competing agencies', points: '0 pts (Pending)', status: 'pending' },
        ],
        hardCapNotice: null,
      };
    }
    if (name.includes('process') && !name.includes('paper')) {
      return {
        max: isTier1 ? 5 : 10,
        items: [
          { text: isTier1 ? 'Single-step founder sign-off workflow mapped' : 'Multi-step commercial review sequence mapped', points: isTier1 ? '+3 pts' : '+5 pts', status: 'verified' },
          { text: 'Target dates mapped for contract signing and kickoff', points: isTier1 ? '+1 pt' : '+2 pts', status: 'pending' },
        ],
        hardCapNotice: null,
      };
    }
    if (name.includes('paper')) {
      return {
        max: 15,
        items: [
          { text: 'SOW deliverables and timeline agreed in writing', points: '+4 pts', status: 'verified' },
          { text: '50% advance payment terms confirmed before kickoff', points: '0 pts (Pending)', status: 'pending' },
          { text: 'GST registration details and accounts contact verified', points: '+3 pts', status: 'verified' },
        ],
        hardCapNotice: 'Commercial Gate Notice: Accounts team requires 7–10 days. SOW advance terms must be confirmed before production starts.',
      };
    }
    if (name.includes('pain')) {
      return {
        max: 15,
        items: [
          { text: 'Hard calendar deadline tied to festive season launch', points: '+6 pts', status: 'verified' },
          { text: 'Quantified revenue loss if campaign start date slips', points: '+4 pts', status: 'verified' },
          { text: 'Direct admission that in-house creator management has failed', points: '+2 pts', status: 'verified' },
        ],
        hardCapNotice: null,
      };
    }
    if (name.includes('champ')) {
      return {
        max: 10,
        items: [
          { text: 'Internal advocate actively pitching to leadership', points: '+5 pts', status: 'verified' },
          { text: 'Helps navigate internal objections and accounts timelines', points: '+4 pts', status: 'verified' },
          { text: 'Personal credibility with commercial decision-maker verified', points: '0 pts (Pending)', status: 'pending' },
        ],
        hardCapNotice: 'Rule 6.7 Notice: Capped at max 5/10 points if Champion lacks direct leadership access.',
      };
    }
    // Competition
    return {
      max: isTier1 ? 5 : 10,
      items: [
        { text: 'Alternative agencies and freelance options identified', points: '+3 pts', status: 'verified' },
        { text: 'Differentiation locked on ROAS, speed, and execution SLA', points: '+1 pt', status: 'verified' },
      ],
      hardCapNotice: null,
    };
  };

  const getCommitteeStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'engaged':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'missing':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'uncontacted':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleStartAutoFind = async (contact) => {
    setAutoFindRole(contact);
    setShowAutoFindModal(true);
    setIsAutoFinding(true);
    setStreamProgress(15);
    setStreamLogs([
      { step: 1, message: `Analyzing organization chart for ${selectedDeal?.company_name || 'this account'}...` }
    ]);
    setDiscoveredCandidate(null);

    const dealId = selectedDealId;
    const company = selectedDeal?.company_name || '';
    const domain = selectedDeal?.domain || '';
    const roleTag = contact.tag || contact.role;

    let sseDone = false;
    try {
      const streamUrl = getCommitteeStreamUrl(dealId, roleTag, company, domain);
      const eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('gap_detected', (e) => {
        try {
          const d = JSON.parse(e.data);
          setStreamProgress(d.progress || 25);
          setStreamLogs((prev) => [...prev, d]);
        } catch (_) {}
      });

      eventSource.addEventListener('searching_registry', (e) => {
        try {
          const d = JSON.parse(e.data);
          setStreamProgress(d.progress || 60);
          setStreamLogs((prev) => [...prev, d]);
        } catch (_) {}
      });

      eventSource.addEventListener('waterfall_verification', (e) => {
        try {
          const d = JSON.parse(e.data);
          setStreamProgress(d.progress || 85);
          setStreamLogs((prev) => [...prev, d]);
        } catch (_) {}
      });

      eventSource.addEventListener('discovery_complete', (e) => {
        try {
          const d = JSON.parse(e.data);
          setStreamProgress(100);
          setStreamLogs((prev) => [...prev, d]);
          setDiscoveredCandidate(d.candidate);
          setIsAutoFinding(false);
          eventSource.close();
          sseDone = true;
        } catch (_) {}
      });

      eventSource.onerror = async () => {
        eventSource.close();
        if (!sseDone) {
          const candidate = await triggerCommitteeAutoFind(dealId, roleTag, company, domain);
          setStreamProgress(100);
          setStreamLogs((prev) => [
            ...prev,
            { step: 2, message: `Discovered executive in Apollo directory: ${candidate.name}` },
            { step: 3, message: `Email deliverability confirmed: ${candidate.email}` },
            { step: 4, message: `Executive profile verified and ready to add.` },
          ]);
          setDiscoveredCandidate(candidate);
          setIsAutoFinding(false);
        }
      };
    } catch (err) {
      const candidate = await triggerCommitteeAutoFind(dealId, roleTag, company, domain);
      setStreamProgress(100);
      setDiscoveredCandidate(candidate);
      setIsAutoFinding(false);
    }
  };

  const handleConfirmAddCandidate = async () => {
    if (!discoveredCandidate || !autoFindRole) return;
    setIsAddingCandidate(true);
    const dealId = selectedDealId;
    const newMember = {
      name: discoveredCandidate.name,
      role: discoveredCandidate.title || autoFindRole.role,
      tag: autoFindRole.tag,
      status: 'Engaged',
      email: discoveredCandidate.email,
      linkedin_url: discoveredCandidate.linkedin,
    };

    try {
      await addCommitteeMember(dealId, newMember);
    } catch (err) {
      console.warn('Backend sync failed, updating local state', err);
    }

    setCommittee((prev) =>
      prev.map((m) =>
        m.tag === autoFindRole.tag || m.role === autoFindRole.role
          ? { ...m, ...newMember, status: 'Engaged' }
          : m
      )
    );

    setIsAddingCandidate(false);
    setShowAutoFindModal(false);
    setDiscoveredCandidate(null);
  };

  // Pipeline Stepper metadata. Position is inferred from the deal's MEDDPICC
  // disposition — the backend has no discrete pipeline-stage field once a
  // diagnostic has run.
  // ponytail: category→stage heuristic; wire to a real deal.stage field if one lands.
  const PIPELINE_STAGES = [
    { name: 'Discovery & Needs', exit: 'Business problem, brand goals, and estimated budget confirmed.' },
    { name: 'Scope & Pitch', exit: 'Target deliverables, creator count, and ROAS expectations agreed.' },
    { name: 'Solution Validation', exit: 'Founder / Commercial decision-maker confirms proposal and locks SOW with 50% advance terms.' },
    { name: 'SOW & 50% Advance', exit: 'SOW signed, GST verified, and 50% advance invoice released by client accounts.' },
    { name: 'Closed Won', exit: 'Project onboarding kicked off and creative production started.' },
  ];
  const activeStageIdx = { Disqualify: 0, Nurture: 1, Rescue: 2, Advance: 3 }[scorecard?.deal_category] ?? 0;
  const pipelineStages = PIPELINE_STAGES.map((s, i) => ({
    id: i + 1,
    name: s.name,
    exit: s.exit,
    status: i < activeStageIdx ? 'complete' : i === activeStageIdx ? 'active' : 'upcoming',
  }));
  const activeStage = pipelineStages[activeStageIdx];

  // Win benchmark: deals scoring at/above this close materially more often.
  const WIN_BENCHMARK = 72;
  const blockerCount = scorecard?.top_blocking_boxes?.length || 0;
  const TRAJECTORY = {
    Advance: { label: 'On Track', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500' },
    Rescue: { label: 'At Risk', cls: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
    Nurture: { label: 'Slow', cls: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
    Disqualify: { label: 'Off Track', cls: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-500' },
  };
  const trajectory = TRAJECTORY[scorecard?.deal_category] || TRAJECTORY.Nurture;

  const hasDeals = deals.length > 0;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {isLoading && !hasDeals ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 shadow-card flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          <p className="text-xs text-slate-500">Loading deals…</p>
        </div>
      ) : !hasDeals ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-card flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 text-white">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No deals in this workspace yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Create a deal, then upload a call transcript to generate its MEDDPICC health diagnostic.
          </p>
          <button onClick={() => setShowNewDealModal(true)} className="btn-primary px-4 py-2 text-xs mt-1">
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      ) : (
      <>
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
              <span className="font-semibold text-slate-800">{selectedDeal?.company_name || '—'}</span>
              <span>&bull;</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(selectedDeal?.deal_size, selectedDeal?.currency || 'USD')}
              </span>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <span className="text-emerald-700 font-semibold">Tier:</span>
                <select
                  value={currentTier}
                  onChange={(e) => setCurrentTier(e.target.value)}
                  className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-emerald-900 focus:ring-0 cursor-pointer"
                >
                  <option value="Tier 1: Founder-Led SMB">Tier 1: Founder-Led SMB / D2C</option>
                  <option value="Tier 2: Growth Scale-up">Tier 2: Growth Scale-up / Unicorn</option>
                  <option value="Tier 3: Enterprise MNC">Tier 3: Enterprise MNC</option>
                </select>
                <InfoTooltip
                  title="Buyer Sophistication Tier"
                  content="How decisions actually get made at this client company. Selling to a small startup Founder is completely different from selling to Zepto or Tata. Changing this adapts your 8-point checklist so you only focus on what matters for this buyer."
                  criteria={[
                    "Tier 1 (Founder-Led SMB): Founder signs the cheque directly via WhatsApp or 1-page SOW + 50% advance.",
                    "Tier 2 (Growth Scale-up): Department Head pitches, but Finance issues a formal PO.",
                    "Tier 3 (Enterprise MNC): Corporate procurement boards, formal vendor empanelment, and MSA (e.g. Tata, Unilever)."
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-secondary px-3.5 py-2 text-xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload Call</span>
            </button>
            <InfoTooltip
              title="Upload Call Transcript"
              content="Upload an audio recording or paste notes from Zoom/Google Meet. Whipstitch automatically transcribes the conversation and grades the deal."
            />
          </div>

          <div className="flex items-center">
            <button
              onClick={handleRunDiagnostic}
              disabled={isDiagnosing || !selectedDealId}
              className="btn-secondary px-3.5 py-2 text-xs"
            >
              {isDiagnosing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Re-Analyze Deal</span>
            </button>
            <InfoTooltip
              title="Re-Analyze Deal"
              content="Re-scans all call transcripts and notes with the latest AI logic to refresh your 8 deal vital signs and action steps."
            />
          </div>

          <div className="flex items-center">
            <a
              href={`/v1/deals/${selectedDealId}/medpicc/pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-3.5 py-2 text-xs"
              title="Download executive PDF report"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download PDF</span>
            </a>
            <InfoTooltip
              title="Executive Deal Summary PDF"
              content="Download a clean, 1-page PDF deal health summary to share with your manager or review in pipeline meetings."
            />
          </div>

          <button
            onClick={() => setShowNewDealModal(true)}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {!scorecard ? (
        (isLoading || isDiagnosing) ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-card flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-white">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isDiagnosing ? 'Reading the call and scoring the deal…' : 'Loading deal health…'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {isDiagnosing
                ? 'This runs the 8-box MEDDPICC diagnostic against the transcript. It usually takes under a minute.'
                : 'Fetching the latest MEDDPICC diagnostic for this deal.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-card flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-white">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {`${selectedDeal?.deal_name || 'This deal'} hasn't been diagnosed yet`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload a call transcript to generate the health score, the blockers, and a follow-up email — all from what the buyer actually said.
            </p>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary px-4 py-2 text-xs mt-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Call</span>
            </button>
          </div>
        )
      ) : (
      <>
      {/* ─── 2. 5-STAGE PIPELINE STEPPER ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pipeline Progression</span>
            <InfoTooltip
              title="Pipeline Stages (The 5 Steps to Close)"
              content="The exact journey this deal takes from hello to payment. Never skip a stage or move ahead until the required gate is confirmed (e.g. don't start creative work until the advance is paid)."
              criteria={[
                "Stage 1 (Discovery): Client shares their goal and estimated budget",
                "Stage 2 (Scope): Exact deliverables and formats agreed",
                "Stage 3 (Validation): Founder confirms the proposal and agrees to advance terms",
                "Stage 4 (Advance): SOW signed and 50% advance in the bank",
                "Stage 5 (Won): Project onboarded and creative kickoff begins"
              ]}
            />
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Current: Stage {activeStage.id} &bull; {activeStage.name}
          </span>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 items-center">
          {pipelineStages.map((st) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-lg border text-left transition ${
                st.status === 'active'
                  ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                  : st.status === 'complete'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-50/50 border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={st.status === 'active' ? 'text-emerald-900' : 'text-slate-700'}>
                  {st.id}. {st.name}
                </span>
                {st.status === 'complete' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                {st.status === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                {st.exit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. PROGRESSIVE DISCLOSURE TABS ─── */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'vitals'
                ? 'border-emerald-600 text-emerald-900 bg-emerald-50/60 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>1. Diagnosis & Vitals</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-emerald-600 text-emerald-900 bg-emerald-50/60 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>2. Critical Gaps & Power Map</span>
            {blockerCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {blockerCount} Gap{blockerCount !== 1 ? 's' : ''}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'actions'
                ? 'border-emerald-600 text-emerald-900 bg-emerald-50/60 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>3. Action Console</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: DEAL DIAGNOSIS & 2x4 VITALS ─── */}
      {activeTab === 'vitals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Health Score Strip & Historical Benchmark: 3 Dedicated Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Card 1: Deal Health Score (lg:col-span-3) */}
              <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-500">Deal Health Score</span>
                    <InfoTooltip
                      title="Deal Health Score (0–100)"
                      content="Shows how close this deal is to closing based on proof from your calls. Higher score = lower risk of the client ghosting you."
                      criteria={[
                        "80–100 (Safe to Close): Cheque signer confirmed & advance terms locked",
                        "65–79 (Needs Attention): Great opportunity, but missing Founder approval or advance agreement",
                        "Under 65 (High Risk): Client will likely go silent unless you fix the blockers"
                      ]}
                    />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                    {scorecard.deal_category}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                    {scorecard.overall_score}
                  </span>
                  <span className="text-slate-400 font-semibold text-sm">/ 100</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Verified proof across all 8 deal checks
                </div>
              </div>

              {/* Card 2: Outcome Trajectory (lg:col-span-4) - Fixed UI & No Cramping */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500">Outcome Trajectory</span>
                  <InfoTooltip
                    title="Deal Roadblock (Outcome Trajectory)"
                    content="Tells you the #1 thing holding back this deal right now. Deals stall when reps pitch the marketing team without getting direct approval from the Founder who signs the cheque."
                  />
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 whitespace-nowrap shadow-2xs ${trajectory.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${trajectory.dot}`}></span>
                      {trajectory.label}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {blockerCount > 0 ? `${scorecard.top_blocking_boxes[0]} unconfirmed` : 'No hard blockers'}
                    </span>
                  </div>
                  {scorecard.next_best_action && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-0.5">
                      <span className="text-slate-400 font-medium shrink-0">Next move:</span>
                      <strong className="text-slate-700 font-semibold">{scorecard.next_best_action}</strong>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  #1 blocker to unlock before this deal can close
                </div>
              </div>

              {/* Card 3: Benchmark Reference Point (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Win Benchmark</span>
                    <InfoTooltip
                      title="Win Benchmark (Average: 72)"
                      content="Compares your deal against similar deals that actually won at this stage. Deals scoring 72+ close 3x more often. Once your team closes 5 deals, this automatically switches to your own company's real closing average."
                    />
                  </span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    Current: <strong className="text-slate-900">{scorecard.overall_score}</strong> &bull; Target: <strong className="text-emerald-800">{WIN_BENCHMARK}</strong>
                    {' '}({scorecard.overall_score - WIN_BENCHMARK >= 0 ? '+' : ''}{scorecard.overall_score - WIN_BENCHMARK} pts)
                  </span>
                </div>

                {/* Benchmark Track */}
                <div className="relative w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(scorecard.overall_score, 0), 100)}%` }}
                  />
                  {/* Target Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-emerald-600"
                    style={{ left: `${WIN_BENCHMARK}%` }}
                    title={`Target for winning deals (${WIN_BENCHMARK})`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 (Early Stage)</span>
                  <span className="text-emerald-800 font-semibold">{WIN_BENCHMARK} Average for Winning Deals</span>
                  <span>100 (Closed Won)</span>
                </div>
                <div className="text-[10px] text-slate-400 italic text-right pt-0.5">
                  Baseline for {currentTier.split(':')[0]} Service Deals &bull; Calibrates to team average after 5 deals
                </div>
              </div>
            </div>
          </div>

          {/* 2x4 UNTRUNCATED MEDDPICC VITAL SIGNS GRID */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">The 8 Deal Vital Signs (MEDDPICC)</span>
                <InfoTooltip
                  title="What is MEDDPICC? (The 8-Point Deal Checklist)"
                  content="MEDDPICC is a simple 8-point checklist that separates real buyers from time-wasters. Every letter is a question you MUST answer before counting a deal as real: Metrics (Budget), Economic Buyer (Cheque Signer), Decision Criteria (What They Expect), Decision Process (Approval Steps), Paper Process (Getting Paid), Implicated Pain (Why Buy Now), Champion (Internal Ally), Competition (Who Else They Are Pitching). Click any card to inspect customer quotes or add evidence."
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">Click any card to inspect customer quotes & scoring checklist</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {medpiccItems.map((item, idx) => {
                const boxState = getBoxStatus(item.key);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const box = scorecard?.boxes?.find((b) => b.box.toLowerCase() === item.key.toLowerCase());
                      setActiveBoxDrawer(box || { box: item.name, score: boxState.score, max_score: item.max });
                    }}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer hover:shadow-md hover:border-slate-300 flex flex-col justify-between space-y-2.5 ${boxState.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm">{item.letter}</span>
                        <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200">
                          {boxState.statusIcon} {boxState.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold font-mono">
                          {boxState.score} / {item.max}
                        </span>
                        <InfoTooltip
                          title={item.name}
                          content={item.tooltip}
                          criteria={item.criteria}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-900 tracking-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Tab Continuation Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">Diagnosis complete. Review critical gaps and missing decision-makers:</span>
              <button
                onClick={() => setActiveTab('evidence')}
                className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4"
              >
                <span>Continue to Critical Gaps & Power Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: EVIDENCE & BUYING COMMITTEE POWER MAP ─── */}
      {activeTab === 'evidence' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (65% / 8 cols): Critical Deal Gaps & Evidence */}
            <div className="lg:col-span-8 space-y-5">
              {/* Critical Gaps Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      What's Missing to Close This Deal (Top 2 Blockers)
                    </h3>
                    <InfoTooltip
                      title="Top 2 Deal Blockers"
                      content="The two biggest reasons this deal might stall right now. In B2B sales, missing Founder sign-off and delayed advance payment agreements account for over 80% of lost deals. Fix these first before scheduling more team calls."
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Top Priorities for Your Next Action</span>
                </div>

                <div className="space-y-4">
                  {scorecard?.top_blocking_boxes?.length ? (
                    scorecard.top_blocking_boxes.slice(0, 3).map((boxName, i) => {
                      const box = scorecard.boxes?.find(
                        (b) => (b.box || '').toLowerCase() === boxName.toLowerCase()
                      );
                      const q = box?.evidence_quotes?.[0];
                      return (
                        <div key={boxName} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <h4 className="font-bold text-sm text-slate-900">{i + 1}. {boxName}</h4>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Blocking closure
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-4">
                            {box?.missing_evidence || box?.notes || `${boxName} is under-evidenced — confirm it on your next call.`}
                          </p>
                          {q?.quote && (
                            <div className="ml-4 bg-white p-3 rounded-lg border-l-3 border-rose-500 text-xs text-slate-800 italic leading-relaxed">
                              "{q.quote}"
                              <span className="not-italic font-semibold text-slate-900 block mt-1">
                                — {q.person_name || 'Prospect'}{q.medium ? ` (${q.medium})` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                      Run the deal diagnostic (upload a call transcript) to surface what's blocking this deal.
                    </div>
                  )}
                </div>

                {/* Footer link to drawer */}
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Want to inspect customer quotes and point criteria for all 8 pillars?</span>
                  <button
                    onClick={() => {
                      const firstBox = scorecard?.boxes ? scorecard.boxes[0] : null;
                      setActiveBoxDrawer(firstBox || { box: 'Metrics', score: 13, max_score: 20 });
                    }}
                    className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All 8 Deal Checks & Evidence Logs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Verbatim Quote Spotlight — first evidence quote from the diagnostic */}
              {(() => {
                const allQuotes = (scorecard?.boxes || []).flatMap((b) => b.evidence_quotes || []);
                const q = allQuotes[0];
                if (!q?.quote) return null;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Quote className="w-4 h-4 text-emerald-600" />
                        <span>Key Customer Quote From This Deal</span>
                      </h3>
                      <span className="text-xs text-slate-400">Extracted from transcript</span>
                    </div>
                    <div className="bg-emerald-50/60 p-4 rounded-xl border-l-4 border-emerald-600 space-y-2">
                      <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed">"{q.quote}"</p>
                      <div className="text-xs font-semibold text-emerald-900">
                        — {q.person_name || 'Prospect'}{q.medium ? ` (${q.medium})` : ''}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT COLUMN (35% / 4 cols): Buying Committee Power Map */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold text-slate-900">Who's Involved on Their Side</h3>
                    <InfoTooltip
                      title="Who's Involved on Their Side"
                      content="The key decision-makers extracted from your calls. If an essential role is marked 'Missing' (like the Founder or Budget Owner), click 'Auto-Find' to discover their real name and verified email in 1 click."
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    <strong className="text-slate-900">{committee.filter((c) => c.status === 'Engaged').length}</strong> of {committee.length} Engaged
                  </span>
                </div>

                <div className="space-y-2">
                  {committee.map((contact, idx) => {
                    const isMissingOrUncontacted =
                      contact.status === 'Missing' ||
                      contact.status === 'Uncontacted' ||
                      contact.name === 'Unassigned';

                    return (
                      <div
                        key={contact.id || idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">{contact.name}</span>
                            {contact.status === 'Engaged' && (
                              <span className="inline-flex items-center text-emerald-600 text-[10px] font-bold" title="Confirmed Contact">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] truncate">{contact.role}</div>
                          <div className="text-slate-400 text-[10px] font-medium">{contact.tag}</div>
                          {contact.email && (
                            <div className="text-[10px] text-emerald-700 truncate font-mono">{contact.email}</div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getCommitteeStatusColor(contact.status)}`}>
                            {contact.status}
                          </span>
                          {isMissingOrUncontacted && (
                            <button
                              onClick={() => handleStartAutoFind(contact)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded shadow-2xs transition cursor-pointer hover:border-emerald-400"
                              title="Auto-discover verified executive via Apollo & Serper"
                            >
                              <Search className="w-3 h-3 text-emerald-600" />
                              <span>Auto-Find</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prescribed Next Play */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold">Prescribed Next Play</span>
                    <InfoTooltip
                      title="Recommended Next Move"
                      content="The single most effective next step to advance this deal right now, based on what is currently blocking it."
                    />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {scorecard?.next_best_action || 'Run the deal diagnostic to get a recommended next move'}
                  </h4>
                  {scorecard?.seller_summary?.next_best_actions?.length > 0 && (
                    <ul className="text-xs text-slate-600 mt-1 leading-relaxed list-disc pl-4 space-y-0.5">
                      {scorecard.seller_summary.next_best_actions.slice(0, 3).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('actions')}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Proceed to Action Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ACTION CONSOLE & SCRIPTS ─── */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Follow-Up Email & Next Call Script</h3>
                <InfoTooltip
                  title="Deal-Closing Follow-Up"
                  content="Pre-written email crafted to loop in the decision-maker and lock advance payment terms without sounding pushy."
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-written with questions that loop in the Founder and lock SOW advance payment terms.
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
                  placeholder="Run the deal diagnostic to auto-draft a follow-up email targeting the weakest MEDDPICC box."
                  onChange={(e) => setEmailDraft(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 leading-relaxed focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Tactical Discovery Prompts for Next Call (4 cols) */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Questions to Ask on Your Next Call</span>
                <InfoTooltip
                  title="Discovery Questions"
                  content="Practical questions to ask on your next call to uncover payment approval timelines and verify Founder expectations."
                />
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                {(() => {
                  const qs = (scorecard?.boxes || [])
                    .flatMap((b) => (b.coaching_questions || []).map((q) => ({ box: b.box, q })))
                    .slice(0, 4);
                  if (!qs.length) {
                    return (
                      <p className="text-slate-400 italic">
                        Run the diagnostic to generate coaching questions targeting this deal's gaps.
                      </p>
                    );
                  }
                  return qs.map(({ box, q }, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-semibold text-slate-900 block">Question {i + 1} ({box}):</span>
                      <p className="italic text-slate-600">"{q}"</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
      </>
      )}

      {/* ─── AUDIT & OVERRIDE SIDE DRAWER (Viewport-Anchored) ─── */}
      {activeBoxDrawer && (
        <>
          <div
            onClick={() => setActiveBoxDrawer(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[99] transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-xl bg-white shadow-2xl overflow-y-auto p-6 space-y-6 border-l border-slate-200 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Deal Vital Sign Detail & Evidence</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="text-xl font-bold text-slate-900">{activeBoxDrawer.box}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                      Score: {activeBoxDrawer.score} / {activeBoxDrawer.max_score || 20} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveBoxDrawer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dimension Selector Tabs (All 8 MEDDPICC Boxes) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
                {medpiccItems.map((item, idx) => {
                  const boxState = getBoxStatus(item.key);
                  const isSelected =
                    activeBoxDrawer.box?.toLowerCase() === item.key.toLowerCase() ||
                    activeBoxDrawer.box?.toLowerCase() === item.name.toLowerCase();
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const box = scorecard?.boxes?.find(
                          (b) => b.box.toLowerCase() === item.key.toLowerCase()
                        );
                        setActiveBoxDrawer(
                          box || { box: item.name, score: boxState.score, max_score: item.max }
                        );
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{item.letter}</span>
                      <span className="text-[10px] opacity-80 font-mono">
                        {boxState.score}/{item.max}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ITEMIZE CRITERIA & TRANSPARENT POINT BREAKDOWN CHECKLIST */}
              {(() => {
                const rubric = getBoxRubricBreakdown(activeBoxDrawer.box);
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scoring Rubric & Point Breakdown</span>
                        <InfoTooltip
                          title="Scoring Rubric"
                          content="Points are awarded only when verified proof (quotes, numbers, or names) appears in your call transcripts. Items not discussed on the call remain at 0 points."
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">Max {activeBoxDrawer.max_score || rubric.max} pts</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {rubric.items.map((it, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200 ${
                            it.status === 'pending' ? 'opacity-75' : ''
                          }`}
                        >
                          <span className={it.status === 'pending' ? 'text-slate-500' : 'text-slate-700'}>
                            {it.text}
                          </span>
                          <span
                            className={`font-bold font-mono shrink-0 ml-2 ${
                              it.status === 'pending' ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {it.points}
                          </span>
                        </div>
                      ))}
                    </div>

                    {rubric.hardCapNotice && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>{rubric.hardCapNotice}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* AI Confidence & Reasoning */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Why the AI Scored This</span>
                  <InfoTooltip
                    title="Scoring Rationale"
                    content="A plain-English explanation of why points were granted or withheld based on what was heard in your call recordings."
                  />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeBoxDrawer.notes || "Score reflects that campaign budget and ROI goals were quantified, but formal advance payment release from the Founder is still pending."}
                </p>
              </div>

              {/* Verbatim Evidence Log */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span>Exact Words from the Customer</span>
                  <InfoTooltip
                    title="Customer Quotes"
                    content="Spoken quotes with timestamps from the call transcript proving where this score came from."
                  />
                </div>
                {activeBoxDrawer.evidence_quotes && activeBoxDrawer.evidence_quotes.length > 0 ? (
                  <div className="space-y-2">
                    {activeBoxDrawer.evidence_quotes.map((q, idx) => (
                      <div key={idx} className="p-3.5 bg-emerald-50/60 border-l-4 border-emerald-600 rounded-lg space-y-1">
                        <p className="text-xs text-slate-800 italic leading-relaxed">
                          "{q.quote}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold text-emerald-900">{q.person_name || 'Prospect'}{q.role ? ` (${q.role})` : ''}</span>
                          <span className="text-slate-400">{q.medium || 'Call Recording &bull; 04:20'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                    No direct customer quote found in the call recording yet.
                  </div>
                )}
              </div>

              {/* Rep Verification & Evidence Source Picker */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <span>Rep Verification & Evidence Input</span>
                    <InfoTooltip
                      title="Add Offline Evidence"
                      content="Did the client confirm details over WhatsApp or in person? Check this box to manually add evidence and adjust the deal score."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOverridden}
                      onChange={(e) => setIsOverridden(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <span>Add Offline Evidence</span>
                  </label>
                </div>

                {isOverridden && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Evidence Source Channel:</label>
                      <select
                        value={evidenceSourceType}
                        onChange={(e) => setEvidenceSourceType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
                      >
                        <option value="call_transcript">Call Transcript (Zoom / Meet recording)</option>
                        <option value="whatsapp">WhatsApp Message / Screenshot Export</option>
                        <option value="manual_note">In-Person Meeting / Phone Confirmation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Evidence Notes / Verbatim Message:</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Founder WhatsApp text: 'Proceed, releasing 50% advance today'..."
                        value={overrideNotes}
                        onChange={(e) => setOverrideNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {overrideSaved && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Evidence synced & verified!
                        </span>
                      )}
                      <button
                        onClick={handleSaveOverride}
                        className="btn-primary text-xs ml-auto cursor-pointer"
                      >
                        Verify & Sync Evidence
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveBoxDrawer(null)}
                className="btn-secondary text-xs px-4 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── UPLOAD TRANSCRIPT MODAL ─── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                Upload Call Recording or Transcript
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                Or Paste Meeting Dialogue / Notes (Hinglish Supported):
              </label>
              <textarea
                rows={6}
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Paste the call transcript or key notes here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRunDiagnostic}
                disabled={isDiagnosing}
                className="btn-primary text-xs cursor-pointer"
              >
                {isDiagnosing ? 'Analyzing Call...' : 'Analyze Call & Update Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW DEAL MODAL ─── */}
      {showNewDealModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Create New Deal Track
              </h3>
              <button onClick={() => setShowNewDealModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Deal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festive Influencer Campaign"
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
                  placeholder="e.g. Acme Corp"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1">Currency</label>
                  <select
                    value={newDealCurrency}
                    onChange={(e) => setNewDealCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1">
                    Target Deal Size ({newDealCurrency === 'INR' ? '₹' : '$'})
                  </label>
                  <input
                    type="number"
                    placeholder={newDealCurrency === 'INR' ? '1500000' : '145000'}
                    value={newDealSize}
                    onChange={(e) => setNewDealSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Buyer Sophistication Tier</label>
                <select
                  value={newDealTier}
                  onChange={(e) => setNewDealTier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Tier 1: Founder-Led SMB">Tier 1: Founder-Led SMB / D2C (WhatsApp Founder, SOW + 50% Advance)</option>
                  <option value="Tier 2: Growth Scale-up">Tier 2: Growth Scale-up / Unicorn (Function Head + Finance PO)</option>
                  <option value="Tier 3: Enterprise MNC">Tier 3: Enterprise MNC (Commercial Signer, Vendor Empanelment)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDealModal(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs cursor-pointer"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BUYING COMMITTEE AUTO-FIND MODAL (SSE Stream) ─── */}
      {showAutoFindModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-modal space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Auto-Discovering {autoFindRole?.tag || 'Budget Owner'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live Waterfall & Registry Scan for {selectedDeal?.company_name || 'this account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoFindModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Resolution Progress</span>
                <span className="text-emerald-700 font-mono">{streamProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${streamProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2 text-xs font-mono">
              {streamLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold shrink-0">&gt;</span>
                  <span>{log.message || JSON.stringify(log)}</span>
                </div>
              ))}
            </div>

            {discoveredCandidate && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">Candidate Discovered & Verified</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300">
                    96% Match
                  </span>
                </div>
                <div className="text-xs text-slate-900 font-semibold">{discoveredCandidate.name}</div>
                <div className="text-[11px] text-slate-600">{discoveredCandidate.title}</div>
                <div className="text-[11px] text-emerald-800 font-mono">{discoveredCandidate.email}</div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowAutoFindModal(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Close
              </button>
              {discoveredCandidate && (
                <button
                  onClick={handleConfirmAddCandidate}
                  disabled={isAddingCandidate}
                  className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAddingCandidate ? 'Adding...' : 'Add to Committee'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
