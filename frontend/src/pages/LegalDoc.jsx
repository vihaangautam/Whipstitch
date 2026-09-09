import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

/* Marketing-side legal pages. Plain prose, no dashboard chrome. Rendered by
   LandingPage when a footer link is clicked. Content is a starting point —
   have counsel review before launch. */

const UPDATED = 'September 2026';

const DOCS = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what Whipstitch collects, why, and the choices you have. It covers the hosted product at whipstitch.io and this website.',
    sections: [
      {
        h: 'What we collect',
        p: [
          'Account details you give us: your name, work email, company name, and the answers you enter during onboarding (what you sell, your target industries and geographies, your buyer titles).',
          'Content you submit to a workspace: call transcripts, prospect and deal records, competitor notes, and webhook payloads from your forms and CRM.',
          'Provider keys you add to the vault (Gemini, Groq, Serper, Apollo, HubSpot), stored encrypted with AES-256 and decrypted only in memory for the duration of a single workflow.',
          'Basic product telemetry: which features run, workflow success and failure counts, and error traces — tied to a workspace, not to an individual.',
        ],
      },
      {
        h: 'How we use it',
        p: [
          'To run the work you ask for: discovery, enrichment, scoring, drafting, and briefing.',
          'To operate the service: rate limiting, idempotency, billing for any usage above the free tier, and support.',
          'To improve reliability: aggregate metrics on where the enrichment waterfall drops leads or where a model returns an invalid response.',
        ],
      },
      {
        h: 'What we never do',
        p: [
          'We do not sell your data.',
          'We do not use your workspace content to train foundation models, ours or anyone else’s.',
          'We do not share one workspace’s data with another. Every record is scoped to a workspace ID.',
        ],
      },
      {
        h: 'Sub-processors',
        p: [
          'Model and research providers you have enabled (by default Google for Gemini, Groq, and Serper; Apollo and HubSpot only if you add keys).',
          'Cloud hosting and managed Postgres, Redis, and Temporal.',
          'When you bring your own key, that request goes directly to the provider you configured and is billed to your account with them.',
        ],
      },
      {
        h: 'Retention and deletion',
        p: [
          'Workspace content is kept until you delete it or close the workspace.',
          'You can export or permanently delete transcripts, prospects, deals, battlecards, and stored keys from workspace settings, or by emailing privacy@whipstitch.io. Deletion completes within 30 days, backups included.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'You can access, correct, export, or delete your personal data. Email privacy@whipstitch.io and we will respond within 30 days.',
        ],
      },
      { h: 'Contact', p: ['privacy@whipstitch.io'] },
    ],
  },

  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern your use of Whipstitch. By creating a workspace you agree to them on behalf of yourself and your organization.',
    sections: [
      {
        h: 'The service',
        p: [
          'Whipstitch generates sales artifacts — outbound drafts, deal scorecards, competitor battlecards, and meeting briefings — from the inputs you provide. Everything is staged for your review. Nothing is sent to a prospect or written to your CRM without your action.',
          'Generated content is a draft, not advice. You are responsible for what you send.',
        ],
      },
      {
        h: 'Your account',
        p: [
          'Keep your credentials secure. You are responsible for activity under your workspace.',
          'One person per login. Workspace sharing is on the roadmap and not yet supported.',
        ],
      },
      {
        h: 'Acceptable use',
        p: [
          'Do not use Whipstitch to send unlawful communications, to scrape or contact people in violation of applicable law, or to process data you have no right to process.',
          'Do not attempt to break workspace isolation, exhaust shared capacity, or resell access.',
        ],
      },
      {
        h: 'Bring your own keys',
        p: [
          'When you add a provider key, usage on that provider is your responsibility and billed by them directly. Whipstitch adds no markup.',
          'The free tier runs on shared Gemini, Groq, and Serper capacity and is offered as-is, subject to fair use.',
        ],
      },
      {
        h: 'Availability',
        p: [
          'We target continuous availability but do not guarantee it during early access. Workflows are built to resume after provider or infrastructure failures rather than lose work.',
        ],
      },
      {
        h: 'Liability',
        p: [
          'The service is provided “as is.” To the extent permitted by law, Whipstitch is not liable for lost revenue, lost deals, or indirect damages arising from use of generated content.',
        ],
      },
      {
        h: 'Changes',
        p: [
          'We may update these terms as the product changes. Material changes will be announced in-product before they take effect.',
        ],
      },
      { h: 'Contact', p: ['legal@whipstitch.io'] },
    ],
  },

  security: {
    title: 'Security Architecture',
    intro:
      'How Whipstitch is built to keep workspace data isolated, keys protected, and multi-step work from failing silently.',
    sections: [
      {
        h: 'Tenant isolation',
        p: [
          'Every prospect, deal, transcript, battlecard, secret, and telemetry row carries a workspace ID. Queries are scoped to the caller’s workspace; there is no cross-workspace read path in the API.',
          'Prompts are assembled from your onboarding answers, not from a shared template, so one workspace’s context never leaks into another’s output.',
        ],
      },
      {
        h: 'Key handling',
        p: [
          'Provider keys are encrypted at rest with AES-256 (Fernet). They are decrypted into process memory only for the duration of a single activity and are never written to logs, error traces, or the database in plaintext.',
          'Bring-your-own-key requests route straight to the provider you configured.',
        ],
      },
      {
        h: 'Durable workflows',
        p: [
          'Multi-step work runs as Temporal workflows. If a provider rate-limits mid-enrichment, execution resumes on a fallback provider rather than leaving a deal half-processed.',
          'Every external call has an explicit retry policy. A scrape or enrichment failure degrades to available metadata; it does not fail the whole run.',
        ],
      },
      {
        h: 'Idempotency',
        p: [
          'Inbound webhooks pass a Redis atomic lock keyed on a business idempotency key before any workflow starts. Duplicate form fills and webhook retries do not run twice or double-charge a credit.',
        ],
      },
      {
        h: 'Schema-validated output',
        p: [
          'Every model response is validated against a Pydantic schema before you see it. On repeated validation failure the deterministic template takes over, so you never get an empty page or a malformed card.',
        ],
      },
      {
        h: 'Reporting an issue',
        p: [
          'Email security@whipstitch.io with details and reproduction steps. We aim to acknowledge within two business days. Please do not include working exploit code in the initial report.',
        ],
      },
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(DOCS);

export default function LegalDoc({ slug, onBack }) {
  const doc = DOCS[slug] || DOCS.privacy;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-14 sm:py-20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <h1 className="mt-8 font-display text-[2rem] sm:text-[2.5rem] font-light tracking-[-0.03em] leading-[1.1]">
          {doc.title}
        </h1>
        <p className="mt-2 text-xs text-slate-400">Last updated {UPDATED}</p>
        <p className="mt-6 text-[15px] text-slate-600 leading-relaxed">{doc.intro}</p>

        <div className="mt-10 space-y-9">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-[15px] font-bold text-slate-900">{s.h}</h2>
              <div className="mt-2 space-y-2.5">
                {s.p.map((para, i) => (
                  <p key={i} className="text-[14px] text-slate-600 leading-relaxed">{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 pt-6 border-t border-slate-200 text-xs text-slate-400">
          This document is a starting point and will be reviewed by counsel before general availability.
        </p>
      </div>
    </div>
  );
}
