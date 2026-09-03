const API_KEY = "whipstitch-dev-key-12345";
const BASE_URL = "";

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

export async function fetchAnalyticsSummary(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/analytics/summary?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch analytics summary");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback analytics summary", err);
    return {
      tenant_id: tenantId,
      total_leads_inbound: 1248,
      total_prospects_outbound: 42,
      staged_awaiting_approval: 18,
      sla_compliance_rate: 98.4,
      avg_lead_score: 84,
      apollo_credits_used: 12,
      apollo_credits_max: 50,
      active_workflows_count: 12,
      systems_status: "operational",
    };
  }
}

export async function fetchLeadsOverTime(tenantId = "trifid_media", days = 7) {
  try {
    const res = await fetch(`${BASE_URL}/v1/analytics/leads-over-time?tenant_id=${tenantId}&days=${days}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch leads over time");
    return await res.json();
  } catch (err) {
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Inbound Webhooks",
          data: [42, 68, 95, 110, 84, 52, 76],
          borderColor: "#b9f612",
          backgroundColor: "rgba(185, 246, 18, 0.15)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Outbound Prospecting",
          data: [20, 35, 40, 48, 55, 30, 42],
          borderColor: "#c0c1ff",
          backgroundColor: "rgba(192, 193, 255, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }
}

export async function fetchInboundLeads(tenantId = "trifid_media", search = "", status = "") {
  try {
    let url = `${BASE_URL}/v1/leads?tenant_id=${tenantId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch leads");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback leads data", err);
    return [
      {
        id: "00000000-0000-0000-0000-000000000001",
        company_name: "FintechCorp Asia",
        email: "priya.sharma@fintechcorp.io",
        lead_score: 92,
        provider_used: "apollo",
        status: "synced",
        created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        company_name: "NovaScale Technologies",
        email: "alex.chen@novascale.io",
        lead_score: 88,
        provider_used: "crawl4ai",
        status: "synced",
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        company_name: "ApexPay Solutions",
        email: "sarah.j@apexpay.com",
        lead_score: 42,
        provider_used: "llm_fallback",
        status: "scoring",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000004",
        company_name: "HyperGrowth Labs",
        email: "david.m@hypergrowth.co",
        lead_score: 95,
        provider_used: "people_data_labs",
        status: "synced",
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      }
    ];
  }
}

export async function fetchLeadDetail(leadId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/leads/${leadId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch lead detail");
    return await res.json();
  } catch (err) {
    return {
      id: leadId,
      company_name: "FintechCorp Asia",
      email: "priya.sharma@fintechcorp.io",
      status: "synced",
      created_at: new Date().toISOString(),
      enrichment: {
        provider_used: "apollo",
        data: {
          employee_count: 220,
          industry: "Fintech & Digital Payments",
          geography: "Bengaluru, India",
          tech_stack: ["Shopify", "Klaviyo", "HubSpot CRM", "Stripe API"],
        },
      },
      qualification: {
        lead_score: 92,
        confidence_score: 0.95,
        fit_reasoning: "Strong ICP fit: Scaling B2B commerce platform with active engineering hiring and modern MarTech stack.",
        outreach_draft: {
          observation_hook: "Noticed FintechCorp Asia recently scaled cross-border payments infrastructure in Southeast Asia.",
          capability_link: "Our engine automates high-fidelity lead qualification and CRM syncing in under 5 seconds with zero duplicate records.",
          low_friction_ask: "Worth sending over a 2-minute overview video of how we accelerate GTM pipelines?",
        },
      },
      crm_sync: {
        crm_provider: "hubspot",
        crm_record_id: "hs-9f2a1b9c",
        sync_status: "synced",
      },
    };
  }
}

export async function fetchOutboundProspects(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/outbound/prospects?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch outbound prospects");
    return await res.json();
  } catch (err) {
    return [
      {
        id: "00000000-0000-0000-0000-000000000010",
        company_name: "NovaScale Technologies",
        domain: "novascale.io",
        industry: "B2B SaaS",
        scrape_status: "staged_awaiting_approval",
        decision_maker_name: "Alex Chen",
        decision_maker_title: "Head of Growth & Acquisition",
        decision_maker_linkedin: "https://www.linkedin.com/in/alexchen-growth",
        signals_json: {
          hiring_growth: true,
          recent_funding: "Series A $12M",
          tech_stack: ["Segment", "HubSpot", "PostgreSQL"],
        },
        fit_markdown: "NovaScale is actively scaling GTM engineering and expanding performance marketing.",
      },
      {
        id: "00000000-0000-0000-0000-000000000011",
        company_name: "Veritas Logistics Cloud",
        domain: "veritaslogistics.com",
        industry: "Logistics SaaS",
        scrape_status: "staged_awaiting_approval",
        decision_maker_name: "Elena Rostova",
        decision_maker_title: "VP Revenue Operations",
        decision_maker_linkedin: "https://www.linkedin.com/in/elena-rostova",
        signals_json: {
          hiring_growth: true,
          recent_funding: "Seed $4M",
          tech_stack: ["Salesforce", "Marketo", "AWS"],
        },
        fit_markdown: "Rapidly growing logistics software provider upgrading outbound tooling.",
      }
    ];
  }
}

export async function triggerOutboundBatch(tenantId = "trifid_media", batchSize = 3) {
  const res = await fetch(`${BASE_URL}/v1/outbound/trigger`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenant_id: tenantId, batch_size: batchSize }),
  });
  if (!res.ok) throw new Error("Failed to trigger outbound batch");
  return await res.json();
}

export async function approveOutboundProspect(prospectId, action = "approve", reason = "") {
  const res = await fetch(`${BASE_URL}/v1/outbound/prospects/${prospectId}/approve`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, rejection_reason: reason }),
  });
  if (!res.ok) throw new Error(`Failed to ${action} prospect`);
  return await res.json();
}

export async function saveTenantConfig(tenantId, config) {
  const res = await fetch(`${BASE_URL}/v1/tenants/${tenantId}/config`, {
    method: "POST",
    headers,
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to save tenant config");
  return await res.json();
}

// ==========================================
// Phase 7: Deals & MEDDPICC Deal Diagnostic
// ==========================================

export async function fetchDeals(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch deals");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback deals", err);
    return [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        tenant_id: tenantId,
        deal_name: "Strategic RevOps Modernization",
        company_name: "Apex Logistics Global",
        domain: "apexlogistics.com",
        deal_size: 145000,
        currency: "USD",
        current_stage: "Rescue (68/100)",
        latest_score: 68,
        latest_category: "Rescue",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "d0000000-0000-0000-0000-000000000002",
        tenant_id: tenantId,
        deal_name: "AI Lead Routing Rollout",
        company_name: "CloudScale Systems",
        domain: "cloudscale.io",
        deal_size: 85000,
        currency: "USD",
        current_stage: "Advance (86/100)",
        latest_score: 86,
        latest_category: "Advance",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "d0000000-0000-0000-0000-000000000003",
        tenant_id: tenantId,
        deal_name: "Enterprise Pipeline Automation",
        company_name: "FinPulse Payments",
        domain: "finpulse.io",
        deal_size: 60000,
        currency: "USD",
        current_stage: "Discovery",
        latest_score: null,
        latest_category: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    ];
  }
}

export async function createDeal(payload) {
  const res = await fetch(`${BASE_URL}/v1/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create deal");
  return await res.json();
}

export async function uploadTranscriptFile(dealId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/transcript`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload transcript file");
  return await res.json();
}

export async function uploadTranscriptText(dealId, text) {
  const formData = new FormData();
  formData.append("raw_text", text);

  const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/transcript`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload transcript text");
  return await res.json();
}

export async function triggerDealDiagnostic(dealId, payload) {
  const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/diagnose`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to trigger MEDDPICC diagnostic");
  return await res.json();
}

export async function fetchMedpiccScorecard(dealId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/medpicc`, { headers });
    if (!res.ok) throw new Error("Failed to fetch MEDDPICC scorecard");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback MEDDPICC scorecard", err);
    return {
      id: "diag-sample-1",
      deal_id: dealId,
      overall_score: 68,
      deal_category: "Rescue",
      next_best_action: "Schedule 15-minute alignment with CFO to validate discretionary funds before infosec review.",
      closure_if_addressed: {
        likelihood_range: "75-85%",
        rationale: "Implicated pain and metrics are fully validated. Gaining direct CFO budget access unlocks Q3 contracting.",
      },
      closure_if_ignored: {
        likelihood_range: "15-25%",
        rationale: "Without EB buy-in, the deal will stall in legal redlines or fall prey to status-quo inertia.",
      },
      top_blocking_boxes: ["Economic Buyer", "Paper Process"],
      seller_summary: {
        headline: "High-urgency opportunity with strong quantified pain, currently gatekept at the director level.",
        what_we_know: [
          "Manual routing errors wasting $140k/yr in executive time.",
          "Lead architect and RevOps lead strongly endorse the platform.",
          "Security requirements (SOC2, sub-200ms) confirmed achievable.",
        ],
        deal_risks: [
          "CFO / Budget owner has not attended any discovery calls.",
          "Legal timeline unmapped — potential late-stage slippage.",
        ],
        next_best_actions: [
          "Ask champion for intro to CFO.",
          "Deliver Mutual Action Plan with procurement milestones.",
        ],
      },
      follow_up_email: {
        subject: "Quantified ROI & Next Steps: Apex Logistics x Whipstitch",
        body_content: "Hi Team,\n\nFollowing our review of the lead routing architecture, we've mapped the $140k annual leak in unrouted pipeline. To ensure we meet your Q3 launch goal, could we set up a brief 15-minute sync with the CFO to confirm the financial justification?\n\nBest regards,\nAccount Executive",
      },
      boxes: [
        {
          box: "Metrics",
          score: 13,
          max_score: 15,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Quantified cost of inaction at $140,000 annually across 12 SDRs.",
          coaching_questions: ["What is the downstream quota penalty if lead routing is delayed past Q3?"],
          evidence_quotes: [
            { person_name: "Sarah Chen (VP RevOps)", evidence_date: "Call 1", medium: "Call", quote: "We are leaking approximately $140k every year because leads sit unassigned for 48 hours." }
          ]
        },
        {
          box: "Economic Buyer",
          score: 6,
          max_score: 15,
          rating: "Moderate",
          evidence_basis: "inferred",
          hard_cap_applied: true,
          notes: "RULE 6.2 Hard Cap: CFO identified as signer but no direct sponsor call confirmed.",
          coaching_questions: ["Can our champion broker a brief executive check-in with the CFO?"],
          evidence_quotes: []
        },
        {
          box: "Decision Criteria",
          score: 8,
          max_score: 10,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Technical requirements (sub-200ms latency, SOC2, HubSpot sync) clearly specified.",
          coaching_questions: ["How will procurement weight security compliance versus pricing?"],
          evidence_quotes: [
            { person_name: "Mark Davis (Architect)", evidence_date: "Call 1", medium: "Call", quote: "Must be SOC2 compliant with sub-200ms response time and bidirectional CRM syncing." }
          ]
        },
        {
          box: "Decision Process",
          score: 7,
          max_score: 10,
          rating: "Moderate",
          evidence_basis: "direct",
          notes: "Security audit is next step, followed by executive sign-off.",
          coaching_questions: ["What is the exact deadline for infosec sign-off?"],
          evidence_quotes: [
            { person_name: "Sarah Chen", evidence_date: "Email", medium: "Email", quote: "After tech demo, our infosec team reviews for 2 weeks before CFO signature." }
          ]
        },
        {
          box: "Paper Process",
          score: 4,
          max_score: 10,
          rating: "Weak",
          evidence_basis: "inferred",
          notes: "Procurement contact unassigned; standard DPA timeline not yet scoped.",
          coaching_questions: ["Has legal already pre-approved third-party cloud data processors?"],
          evidence_quotes: []
        },
        {
          box: "Implicated Pain",
          score: 14,
          max_score: 15,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Executive pain: losing qualified pipeline to competitors due to slow response.",
          coaching_questions: ["What happens to Q4 pipeline targets if manual routing continues?"],
          evidence_quotes: [
            { person_name: "Sarah Chen", evidence_date: "Call 1", medium: "Call", quote: "Reps are complaining daily that leads go cold before they can even make the first dial." }
          ]
        },
        {
          box: "Champion",
          score: 11,
          max_score: 15,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "VP RevOps is an active internal seller sharing stakeholder context.",
          coaching_questions: ["How does rolling this out advance Sarah's team performance metrics?"],
          evidence_quotes: [
            { person_name: "Sarah Chen", evidence_date: "Email", medium: "Email", quote: "I've already briefed our VP of Sales. Let's make sure this gets over the finish line." }
          ]
        },
        {
          box: "Competition",
          score: 5,
          max_score: 10,
          rating: "Moderate",
          evidence_basis: "direct",
          notes: "Internal Python script and status quo spreadsheet are primary alternatives.",
          coaching_questions: ["What is the maintenance cost of an in-house tool when APIs change?"],
          evidence_quotes: [
            { person_name: "Mark Davis", evidence_date: "Call 1", medium: "Call", quote: "We were thinking about writing an internal script, but engineering bandwidth is zero." }
          ]
        }
      ],
      model_used: "gemini-2.0-flash",
      pdf_report_url: null,
      created_at: new Date().toISOString(),
    };
  }
}

// ==========================================
// Phase 7: BYOK Settings API
// ==========================================

export async function fetchAPIKeys(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/settings/api-keys?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch API keys");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback API keys list", err);
    return [
      { id: "k1", provider: "openai", key_masked: "sk-...8f12", is_active: true, created_at: new Date().toISOString() },
      { id: "k2", provider: "gemini", key_masked: "AIz...9a41", is_active: true, created_at: new Date().toISOString() },
    ];
  }
}

export async function saveAPIKey(tenantId, provider, apiKey) {
  const res = await fetch(`${BASE_URL}/v1/settings/api-keys`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenant_id: tenantId, provider, api_key: apiKey }),
  });
  if (!res.ok) throw new Error("Failed to save API key");
  return await res.json();
}

export async function deleteAPIKey(provider, tenantId = "trifid_media") {
  const res = await fetch(`${BASE_URL}/v1/settings/api-keys/${provider}?tenant_id=${tenantId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Failed to delete key for ${provider}`);
  return await res.json();
}

export async function testAPIKeyConnection(provider, apiKey) {
  const res = await fetch(`${BASE_URL}/v1/settings/api-keys/test?provider=${provider}&api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Connection test request failed");
  return await res.json();
}

// ==========================================
// Meeting Intelligence & Calendar Prep API
// ==========================================

export async function fetchMeetings(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/meetings?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch meetings");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback meetings list", err);
    return [
      {
        id: "meet-apex-01",
        tenant_id: tenantId,
        deal_id: "deal-apex-01",
        title: "Apex Logistics: Executive CFO & RevOps Review",
        company_name: "Apex Logistics Global",
        scheduled_time: "Today, 3:30 PM EST",
        attendees: [
          { name: "Sarah Chen", title: "VP RevOps", email: "sarah.chen@apexlogistics.com", organization: "Apex Logistics Global" },
          { name: "Marcus Vance", title: "Chief Financial Officer", email: "marcus.vance@apexlogistics.com", organization: "Apex Logistics Global" },
          { name: "David Miller", title: "Head of InfoSec", email: "david.miller@apexlogistics.com", organization: "Apex Logistics Global" },
        ],
        briefing_ready: true,
        champion_kit_ready: true,
      },
      {
        id: "meet-cloudscale-02",
        tenant_id: tenantId,
        deal_id: "deal-cloudscale-02",
        title: "CloudScale Systems: Lead Routing Solution Demo",
        company_name: "CloudScale Systems",
        scheduled_time: "Tomorrow, 11:00 AM EST",
        attendees: [
          { name: "Alex Thorne", title: "Director of Global Sales Ops", email: "alex@cloudscale.io", organization: "CloudScale Systems" },
        ],
        briefing_ready: true,
        champion_kit_ready: true,
      },
    ];
  }
}

export async function createMeeting(meetingData, tenantId = "trifid_media") {
  const res = await fetch(`${BASE_URL}/v1/meetings?tenant_id=${tenantId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(meetingData),
  });
  if (!res.ok) throw new Error("Failed to create meeting");
  return await res.json();
}

export async function fetchPreCallBriefing(meetingId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/meetings/${meetingId}/briefing`, { headers });
    if (!res.ok) throw new Error("Failed to fetch pre-call briefing");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback pre-call briefing", err);
    return {
      meeting_id: meetingId,
      meeting_title: "Apex Logistics: Executive CFO & RevOps Review",
      company_name: "Apex Logistics Global",
      scheduled_time: "Today, 3:30 PM EST",
      executive_summary: "Strategic evaluation call with Apex Logistics focusing on revenue automation. Primary objective is validating the CFO sign-off process and establishing a formal mutual action timeline before the Q3 budget freeze.",
      attendees: [
        {
          name: "Sarah Chen",
          title: "VP RevOps",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["Pipeline Automation & SLA Compliance", "Cross-Functional Productivity"],
            hooks: ["Noticed rapid sales hiring push—how are you protecting inbound SLA?", "Most RevOps leaders lose 15-20% pipeline when leads sit past 15 min."],
            breaking_the_ice: "Saw your recent insights on streamlining operational handoffs at Apex Logistics.",
            buying_role: "Champion",
            seniority_level: "Executive",
          },
        },
        {
          name: "Marcus Vance",
          title: "Chief Financial Officer",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["OpEx Rationalization & Vendor Consolidation", "Quantified 90-Day Payback"],
            hooks: ["We structure our implementation around a hard 90-day payback period.", "How is Apex evaluating operational software ahead of the Q3 fiscal lock?"],
            breaking_the_ice: "Noticed your focus on operational efficiency—our approach directly eliminates unrouted pipeline leakage.",
            buying_role: "Economic Buyer",
            seniority_level: "Executive",
          },
        },
        {
          name: "David Miller",
          title: "Head of InfoSec",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["Zero-Trust & AES-256 BYOK Key Security", "SOC2 Type II & Volatile Memory Isolation"],
            hooks: ["We provide full BYOK Fernet encryption so API credentials never touch persistent third-party databases.", "Zero LLM retraining on proprietary enterprise data."],
            breaking_the_ice: "Respecting your rigorous InfoSec posture, we prepared our pre-signed compliance packet in advance.",
            buying_role: "Security Gatekeeper",
            seniority_level: "Management",
          },
        },
      ],
      company_signals: [
        {
          source: "Google Serper Radar",
          headline: "Apex Logistics Global Expands Regional Supply Chain Hubs",
          snippet: "Apex Logistics announces strategic investment into modernized pipeline automation and regional supply chain visibility.",
          relevance_to_deal: "Aligns with RevOps automation pitch and unblocks Q3 quota expansion.",
        },
        {
          source: "Google Serper Radar",
          headline: "Apex Logistics Appoints New Chief Financial Officer",
          snippet: "Focusing on operational efficiency and vendor spend rationalization ahead of fiscal year close.",
          relevance_to_deal: "Confirms CFO requirement for quantified ROI models before approving software line items.",
        },
      ],
      top_medpicc_gaps_to_target: ["Economic Buyer (CFO sign-off unverified)", "Paper Process (InfoSec review lead time)"],
      strategic_discovery_questions: [
        "Sarah mentioned the CFO holds the ultimate discretionary budget—who besides finance sits on the final commercial review?",
        "What is your target go-live milestone, and what InfoSec security gates must be cleared before contract signature?",
        "If unassigned pipeline leakage ($140k/year) continues unaddressed, what downstream impact does that have on your team's Q4 quota attainment?",
      ],
    };
  }
}

export async function fetchChampionSellingKit(meetingId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/meetings/${meetingId}/champion-kit`, { headers });
    if (!res.ok) throw new Error("Failed to fetch champion kit");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback champion kit", err);
    return {
      meeting_id: meetingId,
      champion_name: "Sarah Chen",
      champion_title: "VP RevOps",
      company_name: "Apex Logistics Global",
      last_updated: "Just Now",
      filter_1_wiifm_career_narrative: {
        title: "Champion Personal Win & Career Narrative",
        talking_points: [
          "Positions Sarah Chen as the visionary operational leader modernizing Apex Logistics' GTM motion.",
          "Delivers an immediate high-visibility win to executive leadership within 30 days of deployment.",
          "Automates repetitive manual routing, allowing Sarah's team to hit higher quotas with zero headcount increase.",
        ],
        verbatim_soundbite: "By implementing this, our team eliminates $140k in annual lead leakage and delivers automated CRM routing to leadership within 3 weeks.",
        anticipated_objection: "Why can't we just have SDRs manually route incoming leads faster?",
        counter_narrative: "Manual routing creates a 48-hour lag where conversion drops by 70%. Automation guarantees sub-15-minute SLA execution.",
      },
      filter_2_cfo_business_case_roi: {
        title: "CFO Business Case & Quantified ROI",
        talking_points: [
          "Hard annual cost of inaction estimated at $140,000 across 12 SDRs.",
          "Payback period achieved within 90 days based on recovering just 2 enterprise opportunities.",
          "Zero platform markup on LLM tokens via Bring-Your-Own-Key (BYOK) architecture.",
        ],
        verbatim_soundbite: "The financial case is straightforward: spending $60k to recover $140k of already-paid-for marketing pipeline is a 2.3x return in year one.",
        anticipated_objection: "We have a hiring and software freeze this quarter.",
        counter_narrative: "This is not expansion software—it is an efficiency utility that recovers revenue currently slipping through our CRM cracks without hiring new headcount.",
      },
      filter_3_infosec_architecture: {
        title: "InfoSec, Compliance & Cloud Architecture",
        talking_points: [
          "Enterprise AES-256 encryption at rest with Fernet vaulting.",
          "Zero LLM training on customer pipeline data—complete enterprise data sovereignty.",
          "Compatible with existing HubSpot/Salesforce CRM without ripping and replacing existing stacks.",
        ],
        verbatim_soundbite: "Our InfoSec requirements are fully met: keys are encrypted with AES-256, no public AI training occurs, and data is isolated per tenant.",
        anticipated_objection: "Does this store our customer PII on third-party AI servers?",
        counter_narrative: "No. Processing occurs in volatile memory with strict tokenization, and all third-party API calls run directly under our own enterprise tenant credentials.",
      },
      filter_4_time_triggers_urgency: {
        title: "Time Triggers & Planning Urgency",
        talking_points: [
          "Q3 budget freeze deadline occurs in 4 weeks.",
          "New SDR cohort onboarded next month requires automated assignment from day one.",
          "Delaying implementation past this quarter pushes rollout into fiscal year-end blackouts.",
        ],
        verbatim_soundbite: "If we don't clear security and finalize this before the Q3 lock, we forfeit our discretionary allocation and leak pipeline for another two quarters.",
        anticipated_objection: "Can we revisit this next fiscal year?",
        counter_narrative: "Every month of delay costs us another $11,500 in unrouted leads. Waiting six months will burn more money than the entire software license.",
      },
      filter_5_power_structure_dynamics: {
        title: "Power Structure & Committee Alignment",
        talking_points: [
          "CFO holds ultimate sign-off authority for line items over $100k.",
          "VP RevOps acts as the operational sponsor and day-to-day champion.",
          "Head of InfoSec acts as the compliance gatekeeper who must review the security whitepaper.",
        ],
        verbatim_soundbite: "I have aligned with our RevOps team; our next step is a 15-minute executive briefing with the CFO to confirm the financial model.",
        anticipated_objection: "Who else needs to weigh in before we approve this?",
        counter_narrative: "We already have RevOps agreement. Only Finance and InfoSec compliance are required for final clearance.",
      },
      filter_6_vendor_disqualification: {
        title: "Vendor Disqualification & Why In-House Fails",
        talking_points: [
          "Building internally would take 6-9 months of dedicated engineering time and $150k+ in developer payroll.",
          "Legacy tools like ZoomInfo charge massive per-seat platform markups with inflexible annual contracts.",
          "Whipstitch provides unified waterfall enrichment, MEDDPICC scoring, and calendar intelligence in a single workflow.",
        ],
        verbatim_soundbite: "Building an internal waterfall engine would distract our engineering team for 6 months and cost 3x more than buying a ready solution.",
        anticipated_objection: "Can't we just write Zapier webhooks to do this?",
        counter_narrative: "Zapier lacks waterfall failover, token-bucket rate limiters, Pydantic scoring rubrics, and automated CRM idempotency.",
      },
      filter_7_shadow_influence_landmines: {
        title: "Shadow Influence & Landmine Mitigation",
        talking_points: [
          "SDR Managers might fear AI replaces rep qualification judgment.",
          "Mitigation: Reassure sales leadership that the system acts as a copilot that pre-populates notes, keeping the rep in the driver's seat.",
          "Finance controller might ask about ongoing API credit overages (addressed by credit hard-cap guards).",
        ],
        verbatim_soundbite: "This gives our SDRs more selling time by doing the heavy research upfront, while giving leadership full visibility into deal health.",
        anticipated_objection: "Will sales reps actually use this or will it become shelfware?",
        counter_narrative: "Reps love it because it writes their follow-up emails and meeting prep briefs in 5 seconds without manual CRM data entry.",
      },
    };
  }
}

export async function triggerMeetingPrep(meetingId) {
  const res = await fetch(`${BASE_URL}/v1/meetings/${meetingId}/prep`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to trigger meeting prep");
  return await res.json();
}

// ==========================================
// Competitor Battlecards & 6-Signal Agent API
// ==========================================

export async function fetchBattlecards() {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards`, { headers });
    if (!res.ok) throw new Error("Failed to fetch battlecards");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback battlecards list", err);
    return [
      { id: "zoominfo", competitor_name: "ZoomInfo / Cognism", competitor_category: "Legacy Contact Database" },
      { id: "apollo-alone", competitor_name: "Standalone Apollo.io", competitor_category: "Sales Engagement Database" },
      { id: "in-house-build", competitor_name: "In-House DIY Build / Zapier", competitor_category: "Internal Scripts" },
      { id: "status-quo", competitor_name: "Status Quo (Manual Rep Routing)", competitor_category: "Manual Process" },
    ];
  }
}

export async function fetchBattlecardDetail(competitorId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards/${competitorId}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch battlecard for ${competitorId}`);
    return await res.json();
  } catch (err) {
    console.warn("Using fallback battlecard detail", err);
    return null;
  }
}

export async function generateCustomBattlecard(data) {
  const res = await fetch(`${BASE_URL}/v1/battlecards/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to generate custom battlecard");
  return await res.json();
}

export async function fetchLiveSignals(accountName = null) {
  try {
    const url = accountName
      ? `${BASE_URL}/v1/signals?account_name=${encodeURIComponent(accountName)}`
      : `${BASE_URL}/v1/signals`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch live signals");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback live signals", err);
    return [
      {
        id: "sig-01",
        account_name: "Apex Logistics Global",
        signal_type: "leadership_shift",
        headline: "Sarah Chen appointed as VP Revenue Operations",
        snippet: "Previously scaled outbound pipeline 4x at Flexport; currently restructuring lead routing and SLA enforcement.",
        source: "LinkedIn Movements",
        detected_at: "2 hours ago",
        confidence_score: 96,
        opportunity_viability_boost: 25,
        recommended_sales_play: "Congratulate on the new role and share the 15-minute speed-to-lead benchmark audit.",
        pre_drafted_hook: "Saw the move to Apex Logistics—congrats Sarah! Typically when new RevOps leaders take the helm, tightening inbound routing SLAs is an early 30-day win.",
      },
      {
        id: "sig-02",
        account_name: "CloudScale Systems",
        signal_type: "capital_expansion",
        headline: "CloudScale Systems Secures $42M Series B for Enterprise Expansion",
        snippet: "Funding will be deployed to double the enterprise sales team and modernize pipeline infrastructure.",
        source: "TechCrunch Radar",
        detected_at: "5 hours ago",
        confidence_score: 94,
        opportunity_viability_boost: 30,
        recommended_sales_play: "Reach out to VP Sales before budget allocation locks for the upcoming fiscal quarter.",
        pre_drafted_hook: "Huge congratulations on the $42M Series B! Noticed your aggressive sales hiring targets—how are you scaling automated lead qualification so new reps ramp instantly?",
      },
    ];
  }
}

export async function ingestSignal(signalData) {
  const res = await fetch(`${BASE_URL}/v1/signals/ingest`, {
    method: "POST",
    headers,
    body: JSON.stringify(signalData),
  });
  if (!res.ok) throw new Error("Failed to ingest signal");
  return await res.json();
}

