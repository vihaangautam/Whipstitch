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
        deal_name: "Festive Influencer & UGC Campaign",
        company_name: "Nykaa E-Retail",
        domain: "nykaa.com",
        deal_size: 1500000,
        currency: "INR",
        buyer_tier: "Tier 1: Founder-Led SMB",
        tenant_track: "Service / Retainer",
        current_stage: "Stage 3: Solution Validation",
        latest_score: 68,
        latest_category: "Rescue",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "d0000000-0000-0000-0000-000000000002",
        tenant_id: tenantId,
        deal_name: "Quick-Commerce Performance Retainer",
        company_name: "Zepto Quick-Commerce",
        domain: "zeptonow.com",
        deal_size: 2800000,
        currency: "INR",
        buyer_tier: "Tier 2: Growth Scale-up",
        tenant_track: "Service / Retainer",
        current_stage: "Stage 4: SOW & 50% Advance",
        latest_score: 84,
        latest_category: "Advance",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "d0000000-0000-0000-0000-000000000003",
        tenant_id: tenantId,
        deal_name: "B2B Enterprise Content Retainer",
        company_name: "Tata Digital",
        domain: "tatadigital.com",
        deal_size: 4500000,
        currency: "INR",
        buyer_tier: "Tier 3: Enterprise MNC",
        tenant_track: "Service / Retainer",
        current_stage: "Stage 1: Discovery & Needs",
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
      id: "diag-sample-nykaa-1",
      deal_id: dealId,
      overall_score: 68,
      deal_category: "Rescue",
      deal_health: "At Risk",
      next_best_action: "Share 1-page SOW executive brief with Founder to lock 50% advance before Diwali launch deadline.",
      outcome_trajectory: "At Risk: Founder Sign-Off Pending",
      rubric_version: "track1-tier1-v1.0",
      closure_if_addressed: {
        likelihood_range: "75-85%",
        rationale: "Diwali campaign budget of ₹15L is freeze and ROAS targets are agreed. Getting Founder sign-off on 50% advance locks kickoff before launch deadline.",
      },
      closure_if_ignored: {
        likelihood_range: "15-25%",
        rationale: "Without direct Founder approval and 50% advance payment release, accounts processing delay will cause campaign to miss the Diwali launch date.",
      },
      top_blocking_boxes: ["Economic Buyer", "Paper Process"],
      seller_summary: {
        headline: "High-intent festive campaign with ₹15L allocated budget, held up pending Founder sign-off on 50% advance payment.",
        what_we_know: [
          "Diwali creator campaign budget of ₹15 Lakhs confirmed by VP Marketing.",
          "Target ROAS minimum 3.5x required by Founder before signing SOW.",
          "Sneha Kapoor (VP Marketing) is actively championing the pitch internally.",
        ],
        deal_risks: [
          "Founder has final commercial authority but hasn't attended calls.",
          "50% advance invoice release requires 7-10 days accounts processing.",
        ],
        next_best_actions: [
          "Send 1-page SOW summary directly for Founder sign-off.",
          "Align accounts on GST and advance payment release timeline.",
        ],
      },
      follow_up_email: {
        subject: "Next Steps Alignment: Nykaa Campaign Scope & 50% Advance",
        body_content: "Hi Sneha,\n\nThanks for the great discussion today regarding Nykaa's upcoming Diwali creator campaign! To ensure we hit your 3.5x Meta ROAS target without any launch delays, I have drafted the SOW covering the ₹15 Lakhs influencer whitelisting scope.\n\nTo ensure your accounts team can release the 50% advance invoice on time for creator bookings, could we share this 1-page summary with your Founder / Managing Director this week for sign-off?\n\nBest regards,\nRohan Mehta",
      },
      boxes: [
        {
          box: "Metrics",
          score: 13,
          max_score: 20,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Quantified Diwali campaign budget at ₹15 Lakhs with 3.5x Meta ROAS target.",
          coaching_questions: ["What is the revenue loss if the campaign misses the pre-Diwali live date?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor (VP Marketing)", evidence_date: "Call 1", medium: "Call", quote: "Basically hamara Diwali campaign ka budget around 15 Lakhs freeze ho gaya hai for influencer whitelisting and UGC ads." }
          ]
        },
        {
          box: "Economic Buyer",
          score: 9,
          max_score: 20,
          rating: "Moderate",
          evidence_basis: "inferred",
          hard_cap_applied: true,
          notes: "Founder has final commercial sign-off; Rule 6.2 Hard Cap applies until direct confirmation is logged.",
          coaching_questions: ["Can Sneha share a 1-page brief with the Founder to confirm the ₹15L spend?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "Founder sir is directly looking at this, unko Meta ROAS 3.5x minimum chahiye before we sign the SOW." }
          ]
        },
        {
          box: "Decision Criteria",
          score: 7,
          max_score: 10,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Deliverables agreed: 25 UGC creator videos + Meta whitelisting with 3.5x ROAS minimum.",
          coaching_questions: ["How will creator revisions and whitelisting access be scheduled?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "We need 25 creator assets delivered with full usage rights and whitelisting access." }
          ]
        },
        {
          box: "Decision Process",
          score: 4,
          max_score: 5,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Single-step Founder sign-off required once SOW deliverables and payment terms are locked.",
          coaching_questions: ["What is the exact target date for countersigning the SOW?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "Once we agree on the deliverables sheet, sir will review and sign off within 2 days." }
          ]
        },
        {
          box: "Paper Process",
          score: 7,
          max_score: 15,
          rating: "Weak",
          evidence_basis: "inferred",
          notes: "50% advance payment required before creator outreach; accounts team requires 7-10 days to process invoice.",
          coaching_questions: ["Can we submit the pro-forma invoice now to avoid launch delays?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "Haan, approval toh mil gaya hai, but 50% advance invoice release hone me 1 week lagega." }
          ]
        },
        {
          box: "Implicated Pain",
          score: 12,
          max_score: 15,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Diwali festive window cannot slip; running in-house creator management has resulted in creator dropouts.",
          coaching_questions: ["What happens to Q3 sales targets if UGC assets aren't live before Diwali?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "Last year our in-house team tried managing creators and half of them didn't deliver on time." }
          ]
        },
        {
          box: "Champion",
          score: 9,
          max_score: 10,
          rating: "Strong",
          evidence_basis: "direct",
          notes: "Sneha Kapoor (VP Marketing) is actively pitching to Founder and driving approval.",
          coaching_questions: ["How can we empower Sneha with a crisp comparison against status quo?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "I will personally pitch this to the Founder on Thursday, just send me the SOW deck." }
          ]
        },
        {
          box: "Competition",
          score: 4,
          max_score: 5,
          rating: "Moderate",
          evidence_basis: "direct",
          notes: "Client evaluated pitching freelance creator managers, but rejected due to lack of whitelisting capabilities.",
          coaching_questions: ["Has client reached out to other performance creative agencies?"],
          evidence_quotes: [
            { person_name: "Sneha Kapoor", evidence_date: "Call 1", medium: "Call", quote: "Freelancers are cheaper, but they don't have ad-account whitelisting expertise like you guys." }
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
        id: "meet-zepto-01",
        tenant_id: tenantId,
        deal_id: "d0000000-0000-0000-0000-000000000002",
        title: "Zepto Quick-Commerce: Organic Search & SEO Growth Retainer",
        company_name: "Zepto Quick-Commerce",
        tenant_track: "Service / Retainer",
        buyer_tier: "Tier 2: Growth Scale-up",
        deal_size: 2800000,
        currency: "INR",
        offering_summary: "Organic Search & Quick-Commerce SEO Retainer",
        scheduled_time: "Today, 4:00 PM IST",
        attendees: [
          { name: "Amrit Pal", title: "Head of Growth", email: "amrit.pal@zepto.com", organization: "Zepto Quick-Commerce" },
          { name: "Kaivalya Vohra", title: "Finance Controller / Co-Founder", email: "kaivalya@zepto.com", organization: "Zepto Quick-Commerce" },
          { name: "Priya Raman", title: "Category Marketing Lead", email: "priya.raman@zepto.com", organization: "Zepto Quick-Commerce" },
        ],
        briefing_ready: true,
        champion_kit_ready: true,
      },
      {
        id: "meet-nykaa-02",
        tenant_id: tenantId,
        deal_id: "d0000000-0000-0000-0000-000000000001",
        title: "Nykaa E-Retail: Festive Influencer Campaign & Founder Review",
        company_name: "Nykaa E-Retail",
        tenant_track: "Service / Retainer",
        buyer_tier: "Tier 1: Founder-Led SMB",
        deal_size: 1500000,
        currency: "INR",
        offering_summary: "Festive Influencer & UGC Content Campaign",
        scheduled_time: "Tomorrow, 2:30 PM IST",
        attendees: [
          { name: "Sneha Kapoor", title: "VP Marketing", email: "sneha.kapoor@nykaa.com", organization: "Nykaa E-Retail" },
          { name: "Falguni Nayar", title: "Managing Director & Founder", email: "falguni@nykaa.com", organization: "Nykaa E-Retail" },
          { name: "Rajesh Nair", title: "Head of Accounts & Finance", email: "rajesh.nair@nykaa.com", organization: "Nykaa E-Retail" },
        ],
        briefing_ready: true,
        champion_kit_ready: true,
      },
      {
        id: "meet-apex-03",
        tenant_id: tenantId,
        deal_id: "deal-apex-01",
        title: "Apex Logistics Global: Executive CFO & RevOps Review",
        company_name: "Apex Logistics Global",
        tenant_track: "SaaS / Product",
        buyer_tier: "Tier 3: Enterprise MNC",
        deal_size: 120000,
        currency: "USD",
        offering_summary: "Enterprise Cloud Lead Routing Platform",
        scheduled_time: "Thursday, 3:30 PM EST",
        attendees: [
          { name: "Sarah Chen", title: "VP RevOps", email: "sarah.chen@apexlogistics.com", organization: "Apex Logistics Global" },
          { name: "Marcus Vance", title: "Chief Financial Officer", email: "marcus.vance@apexlogistics.com", organization: "Apex Logistics Global" },
          { name: "David Miller", title: "Head of InfoSec", email: "david.miller@apexlogistics.com", organization: "Apex Logistics Global" },
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
    if (meetingId === "meet-nykaa-02") {
      return {
        meeting_id: meetingId,
        deal_id: "d0000000-0000-0000-0000-000000000001",
        meeting_title: "Nykaa E-Retail: Festive Influencer Campaign & Founder Review",
        company_name: "Nykaa E-Retail",
        tenant_track: "Service / Retainer",
        buyer_tier: "Tier 1: Founder-Led SMB",
        deal_size: 1500000,
        currency: "INR",
        offering_summary: "Festive Influencer & UGC Content Campaign",
        scheduled_time: "Tomorrow, 2:30 PM IST",
        executive_summary: "Commercial review with Nykaa for the Festive Influencer & UGC Campaign (₹15 Lakhs). The primary goal is confirming Founder sign-off, locking 50% advance payment terms, and scheduling sprint kickoff before Diwali peak demand.",
        attendees: [
          {
            name: "Sneha Kapoor",
            title: "VP Marketing",
            organization: "Nykaa E-Retail",
            psychographic: {
              focus_areas: ["Festive Season ROAS & Customer Acquisition", "Influencer Whitelisting & Creative Velocity"],
              hooks: ["You're launching the festive collection next month—how are you scaling UGC volume without creative fatigue?", "Our sprint model guarantees 40 verified creator deliverables ready to air within 2 weeks of kickoff."],
              breaking_the_ice: "Saw Nykaa's recent Mumbai fashion showcase—exceptional creator integration across social channels.",
              buying_role: "Champion",
              seniority_level: "Executive",
            },
          },
          {
            name: "Falguni Nayar",
            title: "Managing Director & Founder",
            organization: "Nykaa E-Retail",
            psychographic: {
              focus_areas: ["Bottom-Line Cashflow & Unit Economics", "50% Advance with Deliverable-Backed Milestones"],
              hooks: ["We structure this ₹15 Lakhs sprint around verified 3x ROAS payback on your festive product line.", "Every Rupee in our SOW is tied directly to agreed creator deliverables before milestone release."],
              breaking_the_ice: "Deeply respect your discipline in building Nykaa's profitable D2C foundation—our campaign protects your unit economics.",
              buying_role: "Economic Buyer",
              seniority_level: "Executive",
            },
          },
          {
            name: "Rajesh Nair",
            title: "Head of Accounts & Finance",
            organization: "Nykaa E-Retail",
            psychographic: {
              focus_areas: ["SOW Scope Clarity & Deliverable Acceptance", "Standard GST-Compliant Milestone Invoicing"],
              hooks: ["Our SOW clearly defines weekly creator delivery SLAs with zero hidden agency costs.", "We provide full GST invoices with milestone payment schedules."],
              breaking_the_ice: "We prepared our draft SOW terms and deliverable schedule in advance for your finance review.",
              buying_role: "Legal / Procurement",
              seniority_level: "Management",
            },
          },
        ],
        company_signals: [
          {
            source: "Google Serper Radar",
            headline: "Nykaa Announces Q3 Festive Season Campaign Rollout",
            snippet: "Nykaa reveals aggressive festive marketing push across beauty, personal care, and fashion verticals targeting 35% growth.",
            relevance_to_deal: "Confirms immediate urgency: locking the influencer retainer now captures peak festive shopping demand before launch deadlines.",
          },
        ],
        top_medpicc_gaps_to_target: ["Economic Buyer: Founder confirmation on 50% advance invoice", "Paper Process: Scope sign-off on 40 creator deliverables"],
        strategic_discovery_questions: [
          "Since Falguni holds final authority on approving this ₹15 Lakhs campaign, what specific creator ROAS proof will give her total conviction today?",
          "What is your target launch deadline for the festive collection, and what approval steps are needed on the SOW before our team can begin creator outreach?",
          "If your team continues without dedicated influencer retainer support, what impact does that have on your festive sales targets and customer acquisition cost?",
        ],
      };
    }

    if (meetingId === "meet-zepto-01" || !meetingId.includes("apex")) {
      return {
        meeting_id: "meet-zepto-01",
        deal_id: "d0000000-0000-0000-0000-000000000002",
        meeting_title: "Zepto Quick-Commerce: Organic Search & SEO Growth Retainer",
        company_name: "Zepto Quick-Commerce",
        tenant_track: "Service / Retainer",
        buyer_tier: "Tier 2: Growth Scale-up",
        deal_size: 2800000,
        currency: "INR",
        offering_summary: "Organic Search & Quick-Commerce SEO Retainer",
        scheduled_time: "Today, 4:00 PM IST",
        executive_summary: "Strategic review with Zepto for the Organic Search & Quick-Commerce SEO Retainer (₹28 Lakhs). The primary goal is aligning on core organic traffic KPIs, proving blended CAC reduction, and getting Finance PO authorization.",
        attendees: [
          {
            name: "Amrit Pal",
            title: "Head of Growth",
            organization: "Zepto Quick-Commerce",
            psychographic: {
              focus_areas: ["Acquisition Velocity & Lowering Customer Acquisition Cost (CAC)", "Organic Category Dominance in Metro Clusters"],
              hooks: ["Zepto is expanding rapidly into 15 new dark store hubs—how are you scaling your organic app installs without burning more on Google/Meta ads?", "Investing ₹28 Lakhs in organic search lowers your blended CAC by 28% across 10-minute grocery categories."],
              breaking_the_ice: "Saw Zepto's rapid rollout into North India hubs—remarkable operational velocity in quick-commerce.",
              buying_role: "Champion",
              seniority_level: "Executive",
            },
          },
          {
            name: "Kaivalya Vohra",
            title: "Finance Controller / Co-Founder",
            organization: "Zepto Quick-Commerce",
            psychographic: {
              focus_areas: ["Blended ROAS Optimization & Ad Spend Reduction", "Monthly Retainer PO Authorization"],
              hooks: ["Spending on our specialized SEO sprint costs 60% less than building a 4-person in-house team, with zero hiring lag.", "We deliver full attribution reports directly to finance so you track exactly how organic rank increases store orders."],
              breaking_the_ice: "Appreciate Zepto's sharp focus on unit economics and dark store profitability ahead of your next fiscal review.",
              buying_role: "Economic Buyer",
              seniority_level: "Executive",
            },
          },
          {
            name: "Priya Raman",
            title: "Category Marketing Lead",
            organization: "Zepto Quick-Commerce",
            psychographic: {
              focus_areas: ["Category Search Ranking & SKU Page Optimization", "Weekly Sprint Delivery & Zero Friction Handoff"],
              hooks: ["Our SOW includes dedicated weekly ranking sprints and SKU content optimization so your team never bottlenecks.", "We operate on clear payment milestones with standardized GST invoicing."],
              breaking_the_ice: "Excited to support Zepto's fresh produce and FMCG category search presence across top urban pin-codes.",
              buying_role: "Legal / Procurement",
              seniority_level: "Management",
            },
          },
        ],
        company_signals: [
          {
            source: "Google Serper Radar",
            headline: "Zepto Expands Quick-Commerce Footprint to 15 New Dark Stores",
            snippet: "Zepto ramps up operations across Tier-1 and Tier-2 clusters to satisfy high-velocity quick commerce demand.",
            relevance_to_deal: "Huge growth signal: expanding footprint requires organic localized search dominance to acquire shoppers without burning margin on paid ads.",
          },
        ],
        top_medpicc_gaps_to_target: ["Economic Buyer: Finance Controller PO release authorization", "Decision Criteria: Agreement on organic search ranking KPIs"],
        strategic_discovery_questions: [
          "Who besides the growth team sits on the commercial PO sign-off for this ₹28 Lakhs retainer?",
          "What target ranking milestones does our team need to hit in month 1 to prove undeniable value to Kaivalya and leadership?",
          "If unaddressed, how much more will Zepto burn in paid Meta/Google ad spend this quarter to make up for lagging organic search traffic?",
        ],
      };
    }

    // Default Apex Logistics (SaaS)
    return {
      meeting_id: meetingId,
      deal_id: "deal-apex-01",
      meeting_title: "Apex Logistics Global: Executive CFO & RevOps Review",
      company_name: "Apex Logistics Global",
      tenant_track: "SaaS / Product",
      buyer_tier: "Tier 3: Enterprise MNC",
      deal_size: 120000,
      currency: "USD",
      offering_summary: "Enterprise Cloud Lead Routing Platform",
      scheduled_time: "Thursday, 3:30 PM EST",
      executive_summary: "Enterprise review with Apex Logistics Global for the Cloud Lead Routing Platform ($120k). The main goal is verifying the CFO sign-off process, reviewing the InfoSec compliance checklist, and locking next steps before the Q3 budget freeze.",
      attendees: [
        {
          name: "Sarah Chen",
          title: "VP RevOps",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["Speeding up lead response times", "Getting SDRs to respond in under 15 minutes"],
            hooks: ["You're hiring sales reps quickly—how are you making sure new leads get contacted immediately?", "Leads that sit untouched for more than 15 minutes drop in conversion by 70%—we route them in seconds."],
            breaking_the_ice: "Saw your recent post about fixing messy sales handoffs at Apex—really resonated with what we see every day.",
            buying_role: "Champion",
            seniority_level: "Executive",
          },
        },
        {
          name: "Marcus Vance",
          title: "Chief Financial Officer",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["Cutting software costs & tool clutter", "Clear ROI payback within 90 days"],
            hooks: ["Most finance leaders see a full return on Whipstitch within 90 days by rescuing lost inbound leads.", "How is your finance team prioritizing new software approvals before the end of the quarter?"],
            breaking_the_ice: "Saw your focus on cutting wasted software spend—our tool pays for itself by preventing lost sales pipeline.",
            buying_role: "Economic Buyer",
            seniority_level: "Executive",
          },
        },
        {
          name: "David Miller",
          title: "Head of InfoSec",
          organization: "Apex Logistics Global",
          psychographic: {
            focus_areas: ["Data security, encryption & access control", "SOC2 Type II compliance & privacy standards"],
            hooks: ["Your API keys stay encrypted in your own vault—we never store or expose credentials.", "Your customer and sales data is never used to train external AI models."],
            breaking_the_ice: "We know security is top priority for your team, so we have our SOC2 report and security documentation ready to share.",
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
          relevance_to_deal: "Shows the company is investing in growth—great angle to pitch automated lead routing for their expanding sales team.",
        },
      ],
      top_medpicc_gaps_to_target: ["Budget Owner: Need CFO confirmation on budget approval", "Contract Steps: Need InfoSec security review checklist"],
      strategic_discovery_questions: [
        "Sarah mentioned Marcus holds the final budget sign-off—who else needs to approve before you can move forward?",
        "When are you hoping to have this live for your team, and what security steps does David's team require first?",
        "If leads keep sitting unassigned and falling through the cracks, how will that affect your team hitting their Q4 sales goals?",
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
    if (meetingId === "meet-zepto-01" || !meetingId.includes("apex")) {
      return {
        meeting_id: "meet-zepto-01",
        deal_id: "d0000000-0000-0000-0000-000000000002",
        champion_name: "Amrit Pal",
        champion_title: "Head of Growth",
        company_name: "Zepto Quick-Commerce",
        tenant_track: "Service / Retainer",
        buyer_tier: "Tier 2: Growth Scale-up",
        deal_size: 2800000,
        currency: "INR",
        offering_summary: "Organic Search & Quick-Commerce SEO Retainer",
        last_updated: "Just Now",
        filter_1_wiifm_career_narrative: {
          title: "Champion Personal Win & Career Narrative",
          talking_points: [
            "Positions Amrit as the growth visionary who solved Zepto's organic quick-commerce acquisition without burning more paid marketing budget.",
            "Delivers verified organic search traffic wins in high-density delivery hubs within the first 30 days of execution.",
            "Frees internal growth managers from low-level execution so they can focus on high-impact strategic brand partnerships.",
          ],
          verbatim_soundbite: "By partnering with this specialized SEO team, we hit our aggressive customer acquisition targets without adding 4 expensive full-time salaries to payroll.",
          anticipated_objection: "Why can't our in-house growth team just manage SEO internally?",
          counter_narrative: "Our team is already at 100% bandwidth running daily campaigns. Hiring an external specialized partner gives us immediate execution with zero ramp-up delay.",
        },
        filter_2_cfo_business_case_roi: {
          title: "CFO / Founder Business Case & ROI",
          talking_points: [
            "Investing ₹28 Lakhs in organic search pays for itself by reducing blended customer acquisition cost (CAC).",
            "Saves an estimated ₹60 Lakhs in paid performance ad burn by building a permanent, compounding organic search funnel.",
            "Transparent monthly retainer with deliverable-backed sprint milestones and zero hidden fees.",
          ],
          verbatim_soundbite: "The financial case is straightforward: spending ₹28 Lakhs to lower our blended CAC and capture high-intent grocery searchers delivers a 3x return compared to burning budget on paid ads.",
          anticipated_objection: "Can we trim marketing spend and do this cheaper?",
          counter_narrative: "Cheap freelance options produce low-quality spam and risk Google domain penalties. A specialized growth partner guarantees measurable organic traffic and brand integrity.",
        },
        filter_3_infosec_architecture: {
          title: "Service Quality, IP Ownership & Delivery Assurance",
          talking_points: [
            "100% IP ownership: All created assets, content hubs, keyword architectures, and SKU optimization data belong entirely to Zepto.",
            "Strict SLA delivery schedule with weekly sprints and transparent tracking dashboards.",
            "Strict non-disclosure agreement (NDA) protecting confidential order growth metrics.",
          ],
          verbatim_soundbite: "All intellectual property and search assets remain 100% ours, with weekly sprint milestones ensuring zero deliverable drop.",
          anticipated_objection: "What happens if deliverables fall behind schedule or don't meet standards?",
          counter_narrative: "The SOW includes built-in milestone reviews. We approve weekly sprints before milestone invoice releases.",
        },
        filter_4_time_triggers_urgency: {
          title: "Time Triggers & Planning Urgency",
          talking_points: [
            "Upcoming festive demand surge creates a critical 8-week organic acquisition window.",
            "Organic search takes 4-6 weeks to compound—starting today ensures top Google rankings before peak seasonal shopping.",
            "Rival quick-commerce apps (Blinkit, Swiggy Instamart) are aggressively expanding organic keyword footprints.",
          ],
          verbatim_soundbite: "If we delay kickoff by even one month, we miss the upcoming seasonal shopping window and surrender top search rankings to Blinkit and Swiggy.",
          anticipated_objection: "Can we review this next quarter?",
          counter_narrative: "Delaying kickoff means continuing to burn cash on expensive paid search clicks. Starting now builds compounding organic rank before competitors lock down top spots.",
        },
        filter_5_power_structure_dynamics: {
          title: "Power Structure & Committee Alignment",
          talking_points: [
            "Finance Controller holds ultimate approval for signing off on the ₹28 Lakhs retainer SOW.",
            "Amrit acts as the executive growth sponsor and day-to-day project owner.",
            "Category Marketing Lead reviews weekly SKU content deliverables.",
          ],
          verbatim_soundbite: "I have already aligned our growth and category teams; we just need commercial sign-off on the ₹28 Lakhs SOW to initiate sprint 1.",
          anticipated_objection: "Who else needs to approve this agency partnership?",
          counter_narrative: "Our growth and marketing teams are 100% aligned. We only need commercial sign-off on the payment milestones to proceed.",
        },
        filter_6_vendor_disqualification: {
          title: "Vendor Disqualification (Why Alternatives Fail)",
          talking_points: [
            "Hiring in-house requires 4-6 months of recruitment and over ₹45 Lakhs in annual salaries and benefits.",
            "Generic freelance marketplaces produce shallow, AI-generated spam that risks domain penalties.",
            "Traditional ad agencies charge bloated retainers without tying work to organic order acquisition.",
          ],
          verbatim_soundbite: "Building this in-house would take 6 months and cost ₹45 Lakhs in headcount. This partner gives us an experienced team starting next Monday.",
          anticipated_objection: "Can't we just hire a junior specialist or intern?",
          counter_narrative: "A junior hire lacks strategic depth and requires senior management time. This partner brings senior execution experience from day one.",
        },
        filter_7_shadow_influence_landmines: {
          title: "Shadow Influence & Landmine Mitigation",
          talking_points: [
            "Internal marketing team might worry an external agency will disrupt their existing roadmap.",
            "Mitigation: Position the partner as an execution multiplier that supports the internal team.",
            "Set clear 30-day early wins to prove undeniable value to leadership.",
          ],
          verbatim_soundbite: "This partner takes the heavy lifting off our team's plate, giving us senior execution without disrupting our current roadmap.",
          anticipated_objection: "Will this require too much management oversight from our team?",
          counter_narrative: "No. They operate autonomously with a weekly 30-minute sync, saving our team time rather than demanding more oversight.",
        },
      };
    }

    // Default Apex Logistics (SaaS)
    return {
      meeting_id: meetingId,
      champion_name: "Sarah Chen",
      champion_title: "VP RevOps",
      company_name: "Apex Logistics Global",
      tenant_track: "SaaS / Product",
      buyer_tier: "Tier 3: Enterprise MNC",
      deal_size: 120000,
      currency: "USD",
      offering_summary: "Enterprise Cloud Lead Routing Platform",
      last_updated: "Just Now",
      filter_1_wiifm_career_narrative: {
        title: "Why This Helps Your Champion Personally",
        talking_points: [
          "Puts Sarah in the spotlight as the leader who fixed lead response times across the company.",
          "Gives her a quick, measurable win to present to leadership within the first 30 days.",
          "Removes manual spreadsheet routing so her team hits bigger sales targets without hiring more reps.",
        ],
        verbatim_soundbite: "By putting this in place, we stop losing $140k in unworked leads every year and give our reps automated lead routing within 3 weeks.",
        anticipated_objection: "Why can't our sales reps just assign new leads manually?",
        counter_narrative: "Manual routing takes up to 48 hours, and leads go cold when reps don't respond right away. Automated routing gets leads into rep hands in seconds.",
      },
      filter_2_cfo_business_case_roi: {
        title: "The Money Case (CFO-Ready ROI)",
        talking_points: [
          "Doing nothing costs about $140,000 every year in leads that slip through the cracks across 12 reps.",
          "Pays for itself in under 90 days by closing just 2 additional enterprise deals.",
          "No hidden markups or per-user platform fees—transparent, predictable pricing.",
        ],
        verbatim_soundbite: "The numbers are simple: spending $120k to recover $140k of inbound pipeline that we already paid marketing for gives us a 2.5x return in year one.",
        anticipated_objection: "We're on a strict software spending freeze this quarter.",
        counter_narrative: "This isn't an extra luxury tool—it's an efficiency engine that directly recovers revenue currently slipping through our fingers, without needing to hire more reps.",
      },
      filter_3_infosec_architecture: {
        title: "Security & Privacy Answers",
        talking_points: [
          "Bank-grade encryption for all stored data and credentials.",
          "Your sales and customer data is strictly private and never used to train AI models.",
          "Plugs right into your existing Salesforce or HubSpot CRM with zero disruption.",
        ],
        verbatim_soundbite: "All security requirements are covered: data is fully encrypted, no public AI training occurs, and our team maintains complete control of our data.",
        anticipated_objection: "Will our private customer and contact data be stored on public AI servers?",
        counter_narrative: "No. Data is processed securely in temporary memory, customer information is masked, and all requests run directly through your own secure workspace.",
      },
      filter_4_time_triggers_urgency: {
        title: "Why Act Now (Deadlines & Timing)",
        talking_points: [
          "Their Q3 budget window closes in 4 weeks—approvals after that get frozen until next year.",
          "A new group of sales reps starts next month and needs automated lead assignment on day one.",
          "Pushing past this month means waiting through end-of-year company freeze periods.",
        ],
        verbatim_soundbite: "If we don't complete the security review before the Q3 cutoff, we lose our budget allocation and keep losing leads for another two quarters.",
        anticipated_objection: "Can we push this to next fiscal year?",
        counter_narrative: "Every month we wait costs us another $11,500 in lost leads. Waiting six months will burn more money than the entire software license costs.",
      },
      filter_5_power_structure_dynamics: {
        title: "Who Makes the Decision",
        talking_points: [
          "The CFO (Marcus) has final sign-off authority on purchases over $50k.",
          "VP of RevOps (Sarah) is our internal champion who will use the tool daily.",
          "Head of InfoSec (David) needs to review the security checklist before signing.",
        ],
        verbatim_soundbite: "Sarah in RevOps is fully on board. Our next step is a quick 15-minute review with Marcus to walk through the ROI numbers.",
        anticipated_objection: "Who else needs to be involved before we can sign?",
        counter_narrative: "RevOps has already given the green light. We just need Marcus for budget sign-off and David's team for security review.",
      },
      filter_6_vendor_disqualification: {
        title: "Why Alternatives Won't Work",
        talking_points: [
          "Building this in-house would take 6 to 9 months of engineering time and over $150k in developer costs.",
          "Old tools charge thousands per sales rep with rigid, multi-year contracts.",
          "Whipstitch handles lead enrichment, deal qualification, and meeting prep all in one unified place.",
        ],
        verbatim_soundbite: "Trying to build lead routing and enrichment in-house would pull our engineers away from product for 6 months and cost 3 times more than buying a ready solution.",
        anticipated_objection: "Can't we just hook up Zapier or basic automation scripts?",
        counter_narrative: "Zapier breaks when APIs hit rate limits, doesn't automatically fall back to backup data sources, and can't score deals or prepare reps for sales calls.",
      },
      filter_7_shadow_influence_landmines: {
        title: "Hidden Risks & How to Handle Them",
        talking_points: [
          "Sales managers might worry this replaces reps: reassure them it gives reps superpowers by handling the research, leaving reps in control.",
          "The finance controller might ask about ongoing API credit costs: we use hard monthly credit limits to prevent surprises.",
          "Team members might push back on adopting a new tool: reps love it because it writes their follow-up emails and meeting prep in seconds.",
        ],
        verbatim_soundbite: "This gives our reps more selling time by doing the research upfront, without adding any complicated new software to manage.",
        anticipated_objection: "Will our reps actually use this or will it sit unused?",
        counter_narrative: "Reps use it because it directly saves them hours every week on manual research and follow-up emails.",
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

const FALLBACK_BATTLECARDS_DETAIL = {
  zoominfo: {
    id: "zoominfo",
    competitor_name: "ZoomInfo / Cognism",
    competitor_category: "Legacy Contact Database",
    summary_verdict: "ZoomInfo charges $15k-$50k annual seat minimums for static contact records without automated qualification or CRM sync intelligence.",
    pricing_weakness: "Steep per-seat licensing ($3,000-$5,000/rep/yr), auto-renewing multi-year lock-ins, and punishing credit overage penalties.",
    kill_shots: [
      {
        title: "The Static Data Trap",
        the_trap: "ZoomInfo tells buyers: 'We have the largest verified B2B database on earth.'",
        the_vulnerability: "Contact databases decay at 2.5% per month (30% annual turnover). Single-source data means 1 out of 3 outreach emails bounce.",
        the_counter_strike: "When an executive switches companies, does ZoomInfo fail over to PeopleDataLabs or live crawl the new company domain in real-time?",
        verbatim_soundbite: "ZoomInfo gives you a static phone book. Whipstitch cascades through multiple enrichment sources with live web crawling so your reps never hit a dead end.",
        evidence_proof: "Customer benchmark: Waterfall enrichment yields 94% phone/email match rates vs. ZoomInfo's single-provider 68% match rate."
      },
      {
        title: "The Per-Seat Tax Trap",
        the_trap: "ZoomInfo tells buyers: 'Every AE needs a license to prospect.'",
        the_vulnerability: "Forcing every rep onto a $4k/year license creates massive shelfware when reps only use it a few hours a week.",
        the_counter_strike: "How much are you paying for ZoomInfo seats that log in fewer than 3 times a month?",
        verbatim_soundbite: "With Whipstitch, you bring your own API keys with credit hard-cap guards—eliminating bloated per-seat taxes entirely.",
        evidence_proof: "Saves enterprise sales teams an average of $38,000 annually in unutilized seat licenses."
      }
    ],
    objection_matrix: [
      {
        objection: "We already have an enterprise contract with ZoomInfo for the next 18 months.",
        root_cause: "Fear of paying for duplicate data providers during an active contract.",
        talk_track: "We don't replace your ZoomInfo subscription today—we supercharge it. Whipstitch plugs into ZoomInfo as a waterfall layer, routes missing records to alternative providers, and auto-generates your MEDDPICC scorecards.",
        proof_point: "Plugging Whipstitch in front of existing data vendors increases rep pipeline velocity by 3.2x without canceling current contracts."
      },
      {
        objection: "ZoomInfo Copilot also uses AI now.",
        root_cause: "Assumption that legacy databases have caught up to autonomous revenue workflows.",
        talk_track: "ZoomInfo's AI is a basic wrapper on their existing database. It cannot execute multi-agent waterfall failovers, enforce 8-box anti-sentiment scoring rubrics, or build custom 7-filter champion selling briefs.",
        proof_point: "Whipstitch's Pydantic rubrics enforce strict anti-sentiment rules that catch unqualified deals 4 weeks earlier than legacy tools."
      }
    ],
    blackboard_stages: [
      {
        stage_number: 1,
        stage_name: "Opportunity Context Engine",
        executive_summary: "Target prospect is evaluating ZoomInfo renewal or seeking to avoid steep seat expansions.",
        details: { primary_rival: "ZoomInfo Enterprise", deal_risk: "Incumbent vendor inertia" }
      },
      {
        stage_number: 2,
        stage_name: "Pressure & Catalyst Engine",
        executive_summary: "CFO mandate to cut software OpEx before Q3 budget freeze favors our BYOK architecture.",
        details: { market_pressure: "Sales tech stack rationalization", target_metric: "Cost per qualified meeting" }
      },
      {
        stage_number: 3,
        stage_name: "Differentiation Engine",
        executive_summary: "Structural advantage in waterfall cascade reliability (94% vs 68%) and zero per-seat markups.",
        details: { kill_shot_category: "Multi-vendor failover & BYOK vaulting" }
      },
      {
        stage_number: 4,
        stage_name: "Operational Data Engine",
        executive_summary: "Hard financial savings: $38,000 OpEx reduction and 15-minute inbound SLA enforcement.",
        details: { payback_period_days: "60 days", annual_leakage_saved: "$140,000" }
      },
      {
        stage_number: 5,
        stage_name: "Seller Action Brief",
        executive_summary: "Focus discovery on bounce rates and unutilized seat licenses; pitch waterfall pilot alongside current contract.",
        details: { recommended_next_play: "Offer free 50-lead waterfall comparison test" }
      }
    ]
  },
  "apollo-alone": {
    id: "apollo-alone",
    competitor_name: "Standalone Apollo.io",
    competitor_category: "Sales Engagement Database",
    summary_verdict: "Apollo is a strong contact database, but lacks automated waterfall failovers, MEDDPICC qualification rubrics, and calendar prep.",
    pricing_weakness: "Cheap entry tier escalates rapidly as export volume scales; strict credit hard caps create mid-month pipeline standstills.",
    kill_shots: [
      {
        title: "The Single-Source Ceiling",
        the_trap: "Apollo tells buyers: 'We have all the emails and sequences you need in one cheap tool.'",
        the_vulnerability: "Apollo's verified coverage drops below 55% for enterprise buyers and technical leadership titles.",
        the_counter_strike: "When Apollo cannot find an email for a CISO or VP Finance, what does your rep do? They stop and spend 20 minutes searching LinkedIn manually.",
        verbatim_soundbite: "Whipstitch uses Apollo as a first step, but immediately cascades to PeopleDataLabs and live Crawl4AI scraping when Apollo comes up empty.",
        evidence_proof: "Recovers 39% of enterprise decision-makers that Apollo misses completely."
      }
    ],
    objection_matrix: [
      {
        objection: "We already use Apollo for email sequencing.",
        root_cause: "Perception that Whipstitch is just another outbound email sequencer.",
        talk_track: "Keep using Apollo for sequencing! Whipstitch is the intelligence brain that sits upstream—enriching the contacts Apollo misses, scoring deal health via MEDDPICC, and arming your champions with battle notes.",
        proof_point: "Zero workflow disruption: seamless bidirectional CRM synchronization."
      }
    ],
    blackboard_stages: [
      {
        stage_number: 1,
        stage_name: "Opportunity Context Engine",
        executive_summary: "Prospect loves Apollo's UI but SDRs complain about stale mobile numbers and missing enterprise titles.",
        details: { competitor: "Apollo.io Professional", churn_risk: "Data quality ceiling" }
      },
      {
        stage_number: 2,
        stage_name: "Pressure & Catalyst Engine",
        executive_summary: "RevOps team is missing outbound quota due to 40% bounce rate on niche enterprise segments.",
        details: { pressure: "Quota shortfall and domain deliverability risk" }
      },
      {
        stage_number: 3,
        stage_name: "Differentiation Engine",
        executive_summary: "Position Whipstitch as the multi-vendor orchestrator that powers Apollo with verified accuracy.",
        details: { advantage: "Multi-engine waterfall + automated qualification" }
      },
      {
        stage_number: 4,
        stage_name: "Operational Data Engine",
        executive_summary: "Eliminates 4 hours of weekly manual rep search waste per SDR.",
        details: { hours_saved_per_rep_week: "4 hours" }
      },
      {
        stage_number: 5,
        stage_name: "Seller Action Brief",
        executive_summary: "Run a blind sample test of 25 unverified Apollo contacts through Whipstitch's waterfall.",
        details: { action: "Blind contact match rate benchmark" }
      }
    ]
  },
  "in-house-build": {
    id: "in-house-build",
    competitor_name: "In-House DIY Build / Zapier",
    competitor_category: "Internal Scripts",
    summary_verdict: "Building an internal routing and qualification engine drains 6-9 months of core engineering time and costs $150k+ in developer payroll.",
    pricing_weakness: "Hidden ongoing maintenance costs, fragile webhook breakages, and lack of dedicated AI rubric governance.",
    kill_shots: [
      {
        title: "The Core Engineering Distraction",
        the_trap: "Internal engineers tell leadership: 'Don't buy software—we can build this in a couple of sprints with Python and OpenAI.'",
        the_vulnerability: "Engineers underestimate the complexity of waterfall rate-limiting, error retries, temporal state machines, and Pydantic rubric scoring.",
        the_counter_strike: "Is building internal CRM webhook scaffolding the highest-ROI use of your top software engineers this quarter?",
        verbatim_soundbite: "Your engineers should be shipping features that your customers pay for, not spending 6 months maintaining glue code for sales webhooks.",
        evidence_proof: "Internal builds take an average of 7.4 months to launch and require 12 hours of weekly engineering triage."
      }
    ],
    objection_matrix: [
      {
        objection: "Our engineering team prefers to build custom tools internally.",
        root_cause: "Internal engineering territorialism or lack of awareness of operational maintenance drag.",
        talk_track: "We love that your team is technical! Whipstitch provides full REST APIs, webhook hooks, and BYOK encryption so your engineers get complete control without having to write and maintain 10,000 lines of plumbing code.",
        proof_point: "Ships on day one with zero developer backlog tickets."
      }
    ],
    blackboard_stages: [
      {
        stage_number: 1,
        stage_name: "Opportunity Context Engine",
        executive_summary: "Tech lead is proposing an internal microservice using LangChain and Zapier webhooks.",
        details: { threat: "Internal DIY bias", target_evaluator: "CTO / Head of Engineering" }
      },
      {
        stage_number: 2,
        stage_name: "Pressure & Catalyst Engine",
        executive_summary: "Product roadmap is already 6 weeks behind schedule; marketing leads are sitting unrouted today.",
        details: { urgency: "Opportunity cost of delayed customer-facing features" }
      },
      {
        stage_number: 3,
        stage_name: "Differentiation Engine",
        executive_summary: "Pre-built Temporal Sagas, Redis idempotency locks, and Pydantic rubrics ready immediately.",
        details: { differentiation: "Production-grade resilience with zero build time" }
      },
      {
        stage_number: 4,
        stage_name: "Operational Data Engine",
        executive_summary: "Saves $150k in engineering salaries and 6 months of lost revenue pipeline.",
        details: { cost_comparison: "$150k internal build vs $15k ready solution" }
      },
      {
        stage_number: 5,
        stage_name: "Seller Action Brief",
        executive_summary: "Show engineering architecture diagrams; highlight Temporal resilience and BYOK encryption.",
        details: { pitch: "Give engineers their weekends back while RevOps gets production reliability" }
      }
    ]
  },
  "status-quo": {
    id: "status-quo",
    competitor_name: "Status Quo (Manual Rep Routing)",
    competitor_category: "Manual Process",
    summary_verdict: "Manual lead assignment and qualification causes a 48-hour response lag, losing $140k/year in inbound pipeline.",
    pricing_weakness: "The cost of inaction: 70% drop in lead conversion when response times exceed 15 minutes.",
    kill_shots: [
      {
        title: "The 48-Hour Speed-to-Lead Hemorrhage",
        the_trap: "Sales managers tell themselves: 'Our reps check inbound leads several times a day—we don't need automated routing.'",
        the_vulnerability: "Harvard Business Review benchmarks prove that waiting just 30 minutes to contact a lead reduces conversion by 21x.",
        the_counter_strike: "What is your average response time on a Friday afternoon, and how many leads slip to competitors before Monday morning?",
        verbatim_soundbite: "In enterprise B2B, the first vendor to respond with personalized research wins the deal 65% of the time. Waiting 48 hours is throwing away marketing dollars.",
        evidence_proof: "Reduces inbound response times from 48 hours to under 4 minutes, increasing pipeline conversion by 28%."
      }
    ],
    objection_matrix: [
      {
        objection: "Our current manual process is working fine for our volume.",
        root_cause: "Ignorance of hidden pipeline leakage that never gets tracked in the CRM.",
        talk_track: "Every company thinks their manual process is working until they audit lead timestamps. We typically find 15% of marketing-qualified leads sit untouched for over 48 hours.",
        proof_point: "Recovering just 2 lost deals per quarter pays for the entire platform 5x over."
      }
    ],
    blackboard_stages: [
      {
        stage_number: 1,
        stage_name: "Opportunity Context Engine",
        executive_summary: "12 SDRs manually claiming leads from a shared HubSpot queue with no automated qualification.",
        details: { status_quo: "Manual queue claiming", leakage_rate: "15-20%" }
      },
      {
        stage_number: 2,
        stage_name: "Pressure & Catalyst Engine",
        executive_summary: "VP Marketing frustrated that expensive inbound demo requests are receiving delayed follow-ups.",
        details: { inter_departmental_tension: "Marketing spend ROI vs Sales follow-up lag" }
      },
      {
        stage_number: 3,
        stage_name: "Differentiation Engine",
        executive_summary: "Sub-15-minute token-bucket SLA enforcement with automated Slack escalation.",
        details: { automation: "Instant webhook ingestion and waterfall qualification" }
      },
      {
        stage_number: 4,
        stage_name: "Operational Data Engine",
        executive_summary: "Directly recovers $140,000 in unrouted marketing pipeline annually.",
        details: { annual_recovery_value: "$140,000" }
      },
      {
        stage_number: 5,
        stage_name: "Seller Action Brief",
        executive_summary: "Audit 50 recent inbound leads to show real average response time to management.",
        details: { action: "Lead response time audit report" }
      }
    ]
  }
};

export async function fetchBattlecardDetail(competitorId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards/${competitorId}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch battlecard for ${competitorId}`);
    return await res.json();
  } catch (err) {
    console.warn("Using fallback battlecard detail", err);
    return FALLBACK_BATTLECARDS_DETAIL[competitorId] || FALLBACK_BATTLECARDS_DETAIL["zoominfo"];
  }
}

export async function generateCustomBattlecard(data) {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate custom battlecard");
    return await res.json();
  } catch (err) {
    console.warn("Using simulated custom battlecard generation", err);
    const comp = data.competitor_name || "Custom Rival";
    const buyer = data.buyer_company || "Target Prospect";
    return {
      id: comp.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      competitor_name: comp,
      competitor_category: "Direct Industry Competitor",
      summary_verdict: `${comp} offers legacy feature bundles but lacks automated workflow intelligence and BYOK zero-cost compute for ${buyer}.`,
      pricing_weakness: `High implementation overhead, inflexible per-seat licenses, and lack of real-time SLA verification.`,
      kill_shots: [
        {
          title: `The ${comp} Architecture Constraint`,
          the_trap: `${comp} tells buyers: 'We provide an all-in-one suite that handles everything out of the box.'`,
          the_vulnerability: `${comp} locks customers into a single rigid vendor stack with no failover or custom rubric control.`,
          the_counter_strike: `When your team encounters edge-cases or missing data, does ${comp} allow transparent waterfall failover, or are your reps blocked?`,
          verbatim_soundbite: `Unlike ${comp}'s closed garden, we offer an open architecture with zero seat-tax penalties and automated pipeline guarantees.`,
          evidence_proof: `Reduces deal cycle times by 35% compared to legacy solutions like ${comp}.`
        }
      ],
      objection_matrix: [
        {
          objection: `We are already evaluating ${comp} for this upcoming quarter.`,
          root_cause: `Familiarity with established market brands or recent vendor sales pitches.`,
          talk_track: `We frequently see teams evaluate ${comp} initially! However, once they look closely at total cost of ownership and integration speed, they choose our modular engine to avoid long lock-ins.`,
          proof_point: `Zero-capital deployment with 15-minute time-to-value.`
        }
      ],
      blackboard_stages: [
        {
          stage_number: 1,
          stage_name: "Opportunity Context Engine",
          executive_summary: `Prospect ${buyer} is comparing our solution directly against ${comp}.`,
          details: { competitor: comp, target_account: buyer }
        },
        {
          stage_number: 2,
          stage_name: "Pressure & Catalyst Engine",
          executive_summary: `Urgency to reduce OpEx and accelerate pipeline turnaround before quarter-end.`,
          details: { catalyst: "OpEx optimization mandate" }
        },
        {
          stage_number: 3,
          stage_name: "Differentiation Engine",
          executive_summary: `Position dynamic flexibility and sub-15-minute responsiveness against ${comp}'s legacy delays.`,
          details: { differentiation: "High-velocity orchestration" }
        },
        {
          stage_number: 4,
          stage_name: "Operational Data Engine",
          executive_summary: `Estimated 3x ROI through eliminated seat taxes and accelerated lead follow-up.`,
          details: { estimated_payback_days: "45 days" }
        },
        {
          stage_number: 5,
          stage_name: "Seller Action Brief",
          executive_summary: `Run a head-to-head live proof-of-concept against ${comp} on 20 real prospect accounts.`,
          details: { recommended_play: "Head-to-head bakeoff pilot" }
        }
      ]
    };
  }
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

// ==========================================
// Phase 8: Buying Committee Auto-Expansion & SSE
// ==========================================

export async function fetchCommitteeMembers(dealId = "d0000000-0000-0000-0000-000000000001") {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/committee`, { headers });
    if (!res.ok) throw new Error("Failed to fetch committee members");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback committee members", err);
    return [
      {
        id: "comm-01",
        deal_id: dealId,
        name: "Sneha Kapoor",
        role: "VP Marketing",
        tag: "Internal Champion",
        status: "Engaged",
        email: "sneha.kapoor@nykaa.com",
      },
      {
        id: "comm-02",
        deal_id: dealId,
        name: "Unassigned",
        role: "Founder & Managing Director",
        tag: "Budget Owner",
        status: "Missing",
      },
      {
        id: "comm-03",
        deal_id: dealId,
        name: "Rajesh Nair",
        role: "Head of Accounts & Finance",
        tag: "Commercial Reviewer",
        status: "Pending",
        email: "rajesh.nair@nykaa.com",
      },
      {
        id: "comm-04",
        deal_id: dealId,
        name: "Pooja Sharma",
        role: "Brand Partnerships Lead",
        tag: "Scope Reviewer",
        status: "Engaged",
        email: "pooja.s@nykaa.com",
      },
    ];
  }
}

export async function addCommitteeMember(dealId, memberData) {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/committee`, {
      method: "POST",
      headers,
      body: JSON.stringify(memberData),
    });
    if (!res.ok) throw new Error("Failed to add committee member");
    return await res.json();
  } catch (err) {
    console.warn("Using local committee member addition fallback", err);
    return {
      id: "comm-" + Date.now(),
      deal_id: dealId,
      ...memberData,
    };
  }
}

export async function triggerCommitteeAutoFind(dealId, roleTag, companyName = "Apex Logistics Global", domain = "apexlogistics.com") {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/committee/auto-find`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role_tag: roleTag, company_name: companyName, domain }),
    });
    if (!res.ok) throw new Error("Failed to auto-find candidate");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback auto-find candidate", err);
    const mockCandidates = {
      "Budget Owner": {
        name: "Marcus Vance",
        title: "Chief Financial Officer",
        email: "m.vance@apexlogistics.com",
        linkedin: "https://linkedin.com/in/marcus-vance-cfo",
        confidence: 96,
        source: "Apollo & Public 10-K Roster",
        summary: "Authorized to approve six-figure software OPEX allocations.",
      },
      "Security Reviewer": {
        name: "David Miller",
        title: "Head of Information Security",
        email: "david.miller@apexlogistics.com",
        linkedin: "https://linkedin.com/in/davidmiller-infosec",
        confidence: 93,
        source: "Serper Executive Directory",
        summary: "Oversees SOC 2 and vendor risk assessments.",
      },
      "Legal & Contracts": {
        name: "Emma Watson",
        title: "Senior Director of Procurement",
        email: "emma.watson@apexlogistics.com",
        linkedin: "https://linkedin.com/in/emma-watson-procure",
        confidence: 89,
        source: "LinkedIn Cross-Reference",
        summary: "Signs off on master service agreements and security addendums.",
      },
    };
    return mockCandidates[roleTag] || {
      name: "Alex Thorne",
      title: `${roleTag} Executive`,
      email: `alex.thorne@${domain}`,
      confidence: 90,
      source: "Registry Waterfall",
      summary: "Identified decision-maker.",
    };
  }
}

export function getCommitteeStreamUrl(dealId, roleTag, companyName, domain) {
  const params = new URLSearchParams({
    role_tag: roleTag,
    company_name: companyName || "Apex Logistics Global",
    domain: domain || "apexlogistics.com",
  });
  return `${BASE_URL}/v1/deals/${dealId}/committee/stream?${params.toString()}`;
}


