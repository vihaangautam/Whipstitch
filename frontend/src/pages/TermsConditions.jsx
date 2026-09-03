import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsConditions({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <FileText className="w-4 h-4" /> Terms of Service
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Terms and Conditions</h1>
          <p className="text-xs text-slate-500 mt-1">Effective Date: September 3, 2026</p>
        </div>


        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Whipstitch, you agree to be bound by these Terms and Conditions. If you are entering into this agreement on behalf of a company or legal entity, you represent that you have the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. Service Description and SLA</h2>
            <p>
              Whipstitch provides an event-driven engine for inbound webhook enrichment, LLM-based qualification, outbound prospecting, and MEDDPICC sales diagnostics. Workflows execute durably via Temporal and PostgreSQL.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">3. Bring-Your-Own-Key (BYOK) Responsibility</h2>
            <p>
              Users utilizing BYOK functionality are solely responsible for compliance with their respective third-party API terms (such as OpenAI, Google Cloud, Groq, Apollo.io, and HubSpot). Users are responsible for any direct API billing incurred with those providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">4. Prohibited Uses</h2>
            <p>
              You agree not to use the service for spam transmission, unlawful scraping, scraping of non-public personal data, or any activity that violates anti-spam regulations (including CAN-SPAM, CASL, or GDPR).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Whipstitch and its contributors shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
