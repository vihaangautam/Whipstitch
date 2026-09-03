import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onNavigate }) {
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
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
            <Shield className="w-4 h-4" /> Legal & Data Protection
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: September 3, 2026</p>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              Whipstitch processes B2B contact data, business emails, publicly available company signals, and sales meeting transcripts submitted directly by authorized workspace users. We collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Account Information: Name, business email, organization name, and authentication tokens.</li>
              <li>BYOK Credentials: API keys for third-party providers (OpenAI, Gemini, Groq, Apollo, HubSpot) encrypted using AES-256 Fernet encryption at rest.</li>
              <li>Operational Data: Webhook payloads, qualification scorecards, and CRM pipeline synchronization records.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. How We Use Information</h2>
            <p>
              We process data strictly to deliver lead enrichment, qualification scoring, and CRM synchronization workflows. Whipstitch does not sell, monetize, or train foundational public AI models on customer data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">3. Bring-Your-Own-Key (BYOK) Security</h2>
            <p>
              When you supply your own API keys, requests route directly to the designated third-party provider. Keys are decrypted in volatile memory only for the duration of activity execution and are never logged in plaintext.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">4. Data Retention and Deletion</h2>
            <p>
              Workspaces retain complete ownership of their data. You may request permanent deletion of your tenant records, stored transcripts, and encrypted keys at any time via the settings console or by contacting support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">5. Contact Information</h2>
            <p>
              For security or privacy inquiries, contact: <span className="font-semibold text-slate-900">privacy@whipstitch.io</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
