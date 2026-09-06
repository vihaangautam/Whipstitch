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
      next_best_action: "Schedule a quick 15-minute check-in with the CFO to confirm budget approval before starting security review.",
      closure_if_addressed: {
        likelihood_range: "75-85%",
        rationale: "Customer problem and dollar savings are clearly proven. Getting direct CFO budget sign-off unlocks contract closing for Q3.",
      },
      closure_if_ignored: {
        likelihood_range: "15-25%",
        rationale: "Without the budget owner's direct approval, the deal will stall in legal review or get postponed to next year.",
      },
      top_blocking_boxes: ["Economic Buyer", "Paper Process"],
      seller_summary: {
        headline: "High-urgency deal with clear financial return, but currently held up until we get access to executive leadership.",
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
          notes: "CFO is confirmed as the budget owner, but no direct meeting or written sign-off has happened yet.",
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
          notes: "Procurement contact not yet assigned; legal and security review usually takes ~4 weeks.",
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
      executive_summary: "Key sales meeting with Apex Logistics to show how Whipstitch automates inbound lead routing. The main goal for this call is getting the CFO's sign-off process clear and locking in next steps before their Q3 budget freeze.",
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
        {
          source: "Google Serper Radar",
          headline: "Apex Logistics Appoints New Chief Financial Officer",
          snippet: "Focusing on operational efficiency and vendor spend rationalization ahead of fiscal year close.",
          relevance_to_deal: "New CFO is actively reviewing all software costs—lead with clear ROI and cost savings, not technical features.",
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
    return {
      meeting_id: meetingId,
      champion_name: "Sarah Chen",
      champion_title: "VP RevOps",
      company_name: "Apex Logistics Global",
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
        verbatim_soundbite: "The numbers are simple: spending $60k to recover $140k of inbound pipeline that we already paid marketing for gives us a 2.3x return in year one.",
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
          "Old tools like ZoomInfo charge thousands per sales rep with rigid, multi-year contracts.",
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
          "Finance might worry about surprise bills: reassure them with strict monthly spending caps so there are zero surprise overages.",
          "IT might worry about complex setup: reassure them that setup takes under 30 minutes with our pre-built CRM connectors.",
        ],
        verbatim_soundbite: "This gives our sales reps more time to actually sell by doing the heavy research upfront, while giving leadership clear visibility into every deal.",
        anticipated_objection: "Will our sales reps actually use this, or will it just sit on the shelf?",
        counter_narrative: "Reps love it because it builds their call prep sheets and follow-up emails in seconds, saving them hours of manual research and CRM data entry.",
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

