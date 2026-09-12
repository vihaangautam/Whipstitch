import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Sparkles,
  Lock,
  Cpu,
  Zap,
  Globe,
  Database,
  Search
} from 'lucide-react';
import {
  fetchAPIKeys,
  saveAPIKey,
  deleteAPIKey,
  testAPIKeyConnection,
  testStoredAPIKey,
  rotateIngestKey
} from '../api';

const PROVIDER_METADATA = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Powers GPT-4o and advanced reasoning models.',
    icon: Sparkles,
    placeholder: 'sk-proj-...',
    defaultModel: 'gpt-4o',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Free 1M context tier for long transcripts & deep MEDDPICC scoring.',
    icon: Zap,
    placeholder: 'AIzaSy...',
    defaultModel: 'gemini-2.0-flash',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    description: 'Ultra-low latency Llama 3.3 70B inference engine.',
    icon: Cpu,
    placeholder: 'gsk_...',
    defaultModel: 'llama-3.3-70b-versatile',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet for nuance and executive note generation.',
    icon: Sparkles,
    placeholder: 'sk-ant-...',
    defaultModel: 'claude-3-5-sonnet',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: 'B2B contact enrichment and waterfall lead discovery.',
    icon: Database,
    placeholder: 'apollo_api_key...',
    defaultModel: null,
    color: 'text-slate-800',
    bgColor: 'bg-slate-100 border-slate-200',
  },
  {
    id: 'serper',
    name: 'Google Serper',
    description: 'Live web search for psychographic profiling & signal crawling (2,500 free/mo).',
    icon: Search,
    placeholder: 'serper_api_key...',
    defaultModel: null,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-200',
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Bidirectional lead & deal stage synchronization token.',
    icon: Globe,
    placeholder: 'pat-na1-...',
    defaultModel: null,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
  },
];

export default function BYOKSettings({ currentTenant }) {
  const [keysList, setKeysList] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [showKey, setShowKey] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [preferredModel, setPreferredModel] = useState('gemini-2.0-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [ingestKey, setIngestKey] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [ingestKeyError, setIngestKeyError] = useState(null);

  // Rotating invalidates whatever key the tenant's webhook provider is using, so the second
  // press is a deliberate confirm. Inline rather than window.confirm(): a native dialog
  // blocks the whole renderer until dismissed.
  const handleRotateIngestKey = async () => {
    if (ingestKey && !confirmRotate) {
      setConfirmRotate(true);
      return;
    }
    setConfirmRotate(false);
    setIngestKeyError(null);
    setIsRotating(true);
    try {
      const res = await rotateIngestKey();
      setIngestKey(res.ingest_key);
    } catch (err) {
      setIngestKeyError(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  const loadKeys = async () => {
    setIsLoading(true);
    const keys = await fetchAPIKeys(currentTenant);
    setKeysList(keys);
    setIsLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, [currentTenant]);

  const handleSave = async (provider) => {
    const rawKey = inputValues[provider];
    if (!rawKey || !rawKey.trim()) return;
    try {
      await saveAPIKey(currentTenant, provider, rawKey.trim());
      setInputValues((prev) => ({ ...prev, [provider]: '' }));
      await loadKeys();
    } catch (err) {
      alert('Failed to save key: ' + err.message);
    }
  };

  const handleDelete = async (provider) => {
    if (!confirm(`Are you sure you want to revoke the ${provider.toUpperCase()} key?`)) return;
    try {
      await deleteAPIKey(provider, currentTenant);
      await loadKeys();
    } catch (err) {
      alert('Failed to revoke key: ' + err.message);
    }
  };

  const handleTest = async (provider) => {
    const activeKey = keysList.find((k) => k.provider === provider);
    const typedKey = inputValues[provider];
    if (!typedKey && !activeKey) {
      alert('Please enter a key to test.');
      return;
    }

    setTestingProvider(provider);
    try {
      // A freshly typed key gets tested directly; an already-saved key is tested
      // server-side against its real decrypted value instead of a fake placeholder.
      const res = typedKey
        ? await testAPIKeyConnection(provider, typedKey)
        : await testStoredAPIKey(provider, currentTenant);
      setTestResults((prev) => ({ ...prev, [provider]: res }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { valid: false, message: 'Test ping failed: ' + err.message }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-7 w-full max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
            Security & Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-slate-700" />
            BYOK (Bring-Your-Own-Key) Vault & Model Selection
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Store your third-party API keys securely encrypted with AES-256 Fernet. Platform calls use your keys directly with zero billing overhead.
        </p>
      </div>

      {/* Security Info Callout */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold">Zero Platform Markup Guarantee:</strong> When you provide your own API keys, Whipstitch orchestrates LLM, enrichment, and CRM requests without charging platform credits. All keys are encrypted at rest with a master Fernet key and decrypted in memory only during activity execution.
        </div>
      </div>

      {/* Webhook Ingest Key */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-600" />
              Webhook Ingest Key
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Your form or CRM sends inbound leads with this key in the <code className="text-slate-700">X-API-Key</code> header.
              It identifies your workspace, so leads can never land in — or be read from — someone else's.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRotateIngestKey}
            disabled={isRotating}
            className="btn-secondary text-xs sm:text-sm py-2 px-4 shrink-0 disabled:opacity-40"
          >
            {isRotating
              ? 'Generating…'
              : confirmRotate
                ? 'Click again to replace'
                : ingestKey
                  ? 'Rotate Key'
                  : 'Generate Key'}
          </button>
        </div>

        {ingestKeyError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            Could not generate ingest key: {ingestKeyError}
          </div>
        )}

        {ingestKey && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-amber-900">
              Copy this now — only its hash is stored, so it cannot be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-2.5 py-2 text-slate-800 break-all">
                {ingestKey}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(ingestKey)}
                className="btn-secondary text-xs py-2 px-3 shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Model Preference Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-600" />
              Default AI Reasoning Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which LLM powers MEDDPICC scoring, follow-up emails, and outbound qualification.
            </p>
          </div>
          <select
            value={preferredModel}
            onChange={(e) => setPreferredModel(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Free 1M context — Recommended)</option>
            <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B Versatile (Free ultra-fast)</option>
            <option value="gpt-4o">OpenAI GPT-4o (BYOK Required)</option>
            <option value="gpt-4o-mini">OpenAI GPT-4o-mini (BYOK Low-cost)</option>
            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (BYOK)</option>
          </select>
        </div>
      </div>

      {/* Provider Key Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PROVIDER_METADATA.map((p) => {
          const Icon = p.icon;
          const activeKey = keysList.find((k) => k.provider === p.id && k.is_active);
          const isTesting = testingProvider === p.id;
          const testResult = testResults[p.id];
          const isShow = showKey[p.id];

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${p.bgColor}`}>
                      <Icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{p.description}</p>
                    </div>
                  </div>

                  {activeKey ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      Not Configured
                    </span>
                  )}
                </div>

                {activeKey && (
                  <div className="mt-3.5 flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-700">
                      Stored Key: <strong className="text-slate-900 font-semibold">{activeKey.key_masked}</strong>
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Input Form for Key */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="relative">
                  <input
                    type={isShow ? 'text' : 'password'}
                    placeholder={activeKey ? 'Enter new key to replace...' : p.placeholder}
                    value={inputValues[p.id] || ''}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {isShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
                      testResult.valid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTest(p.id)}
                    disabled={isTesting}
                    className="flex-1 btn-secondary text-xs sm:text-sm py-2"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Test Ping
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(p.id)}
                    disabled={!inputValues[p.id]}
                    className="flex-1 btn-primary text-xs sm:text-sm py-2 disabled:opacity-40"
                  >
                    Save Encrypted
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
