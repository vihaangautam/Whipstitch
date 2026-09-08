import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, LogOut } from 'lucide-react';
import { submitOnboarding } from '../api';

const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function OnboardingWizard({ user, onComplete, onSignOut }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [companyDescription, setCompanyDescription] = useState('');
  const [offering, setOffering] = useState('');
  const [industries, setIndustries] = useState('');
  const [geographies, setGeographies] = useState('');
  const [roles, setRoles] = useState('');
  const [triggerRoles, setTriggerRoles] = useState('');
  const [empMin, setEmpMin] = useState('');
  const [empMax, setEmpMax] = useState('');

  const canNext =
    (step === 1 && companyDescription.trim() && offering.trim()) ||
    (step === 2 && splitList(industries).length > 0 && splitList(geographies).length > 0) ||
    step === 3;

  const handleFinish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await submitOnboarding({
        company_description: companyDescription.trim(),
        offering: offering.trim(),
        target_industries: splitList(industries),
        geographies: splitList(geographies),
        target_decision_maker_roles: splitList(roles),
        trigger_roles: splitList(triggerRoles),
        employee_count_min: empMin ? parseInt(empMin, 10) : null,
        employee_count_max: empMax ? parseInt(empMax, 10) : null,
      });
      onComplete(updated);
    } catch (err) {
      setError(err.message || 'Could not save your workspace setup.');
    } finally {
      setIsSaving(false);
    }
  };

  const field =
    'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
        <span className="text-base font-bold tracking-tight">Whipstitch</span>
        <button
          onClick={onSignOut}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 mt-6 space-y-6">
          <div>
            <div className="text-xs font-semibold text-slate-400">Step {step} of 3</div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">
              {step === 1 && 'Tell us about your company'}
              {step === 2 && 'Who do you sell to?'}
              {step === 3 && 'Who do you want to reach?'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {step === 1 && 'This drives how the AI writes outreach and qualifies leads for you.'}
              {step === 2 && 'Your ideal-customer profile powers outbound prospect discovery.'}
              {step === 3 && 'Optional — helps resolve the right decision-maker on each account.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  What does {user?.tenant_id ? user.tenant_id.replace(/_/g, ' ') : 'your company'} do?
                </label>
                <textarea
                  rows={3}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="e.g. We run performance-marketing retainers for D2C brands in India."
                  className={field}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  What do you sell, and what's the core value?
                </label>
                <textarea
                  rows={3}
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  placeholder="e.g. A managed UGC creative service that cuts customer acquisition cost by 30–40%."
                  className={field}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target industries</label>
                <input
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="Fintech, D2C, B2B SaaS"
                  className={field}
                />
                <p className="text-[11px] text-slate-400 mt-1">Comma-separated.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Geographies</label>
                <input
                  value={geographies}
                  onChange={(e) => setGeographies(e.target.value)}
                  placeholder="India, US, UAE"
                  className={field}
                />
                <p className="text-[11px] text-slate-400 mt-1">Comma-separated.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min headcount</label>
                  <input type="number" value={empMin} onChange={(e) => setEmpMin(e.target.value)} placeholder="50" className={field} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max headcount</label>
                  <input type="number" value={empMax} onChange={(e) => setEmpMax(e.target.value)} placeholder="500" className={field} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target decision-maker titles</label>
                <input
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="Head of Growth, VP Marketing, Founder"
                  className={field}
                />
                <p className="text-[11px] text-slate-400 mt-1">Who you actually contact once we find an account. Comma-separated.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Roles your buyers hire that signal budget</label>
                <input
                  value={triggerRoles}
                  onChange={(e) => setTriggerRoles(e.target.value)}
                  placeholder="SEO Specialist, Content Marketing Manager, Performance Marketing Lead"
                  className={field}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A company posting for one of these has budget and an unmet need in your category.
                  When paid data credits run out, we find accounts by searching job boards for these
                  roles. Comma-separated.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-0 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn-primary text-xs px-4 py-2 disabled:opacity-50 flex items-center gap-1.5"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="btn-primary text-xs px-4 py-2 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? 'Saving…' : 'Finish setup'} <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
