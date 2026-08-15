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
