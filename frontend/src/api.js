const API_KEY = "whipstitch-dev-key-12345";
const BASE_URL = "";
const AUTH_TOKEN_KEY = "whipstitch_auth_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      delete headers["Authorization"];
    }
  } catch (e) {}
}

export function clearAuthToken() {
  setAuthToken(null);
}

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

const initialToken = getAuthToken();
if (initialToken) {
  headers["Authorization"] = `Bearer ${initialToken}`;
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Invalid email or password");
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerUser(payload) {
  const res = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function demoLoginUser() {
  const res = await fetch(`${BASE_URL}/v1/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Demo login failed");
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function submitOnboarding(payload) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/v1/auth/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Setup failed" }));
    throw new Error(err.detail || "Setup failed");
  }
  return await res.json();
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/v1/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      clearAuthToken();
      return null;
    }
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function fetchAnalyticsSummary(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/analytics/summary?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch analytics summary");
    return await res.json();
  } catch (err) {
    console.warn("Analytics summary error", err);
    return {
      tenant_id: tenantId,
      total_leads_inbound: 0,
      total_prospects_outbound: 0,
      staged_awaiting_approval: 0,
      sla_compliance_rate: 100.0,
      avg_lead_score: 0,
      apollo_credits_used: 0,
      apollo_credits_max: 50,
      active_workflows_count: 0,
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
    console.warn("Leads over time error", err);
    return {
      labels: [],
      datasets: [
        { label: "Inbound Ingested", data: [], borderColor: "#059669" },
        { label: "Outbound Discovered", data: [], borderColor: "#2563EB" },
      ],
    };
  }
}

export async function fetchPipelineAnalytics(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/analytics/pipeline?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch pipeline analytics");
    return await res.json();
  } catch (err) {
    console.warn("Pipeline analytics fetch error", err);
    return null;
  }
}

export async function fetchAuditLogs(tenantId = "trifid_media", limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}/v1/analytics/audit-logs?tenant_id=${tenantId}&limit=${limit}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return await res.json();
  } catch (err) {
    console.warn("Audit logs fetch error", err);
    return [];
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
    console.warn("Failed to fetch inbound leads", err);
    return [];
  }
}

export async function fetchLeadDetail(leadId) {
  const res = await fetch(`${BASE_URL}/v1/leads/${leadId}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch lead detail");
  return await res.json();
}

export async function fetchOutboundProspects(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/outbound/prospects?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch outbound prospects");
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch outbound prospects", err);
    return [];
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

export async function fetchTenantConfig(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/tenants/${tenantId}/config`, { headers });
    if (!res.ok) throw new Error("Failed to fetch tenant config");
    return await res.json();
  } catch (err) {
    console.warn("Tenant config fetch failed", err);
    return {
      enrichment_waterfall_order: [],
      icp_criteria: {
        target_industries: [],
        employee_count_min: null,
        employee_count_max: null,
        geographies: [],
      },
      sla_window_minutes: 15,
      competitor_blocklist: [],
    };
  }
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
    console.warn("Failed to fetch deals", err);
    return [];
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
    console.warn("Failed to fetch MEDDPICC scorecard", err);
    return null;
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
    console.warn("API keys fetch failed", err);
    return [];
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
    console.warn("fetchMeetings failed", err);
    return [];
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
    console.warn("fetchPreCallBriefing failed", err);
    return null;
  }
}

export async function fetchChampionSellingKit(meetingId) {
  try {
    const res = await fetch(`${BASE_URL}/v1/meetings/${meetingId}/champion-kit`, { headers });
    if (!res.ok) throw new Error("Failed to fetch champion kit");
    return await res.json();
  } catch (err) {
    console.warn("fetchChampionSellingKit failed", err);
    return null;
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

export async function fetchBattlecards(tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch battlecards");
    return await res.json();
  } catch (err) {
    console.warn("fetchBattlecards failed", err);
    return [];
  }
}

export async function fetchBattlecardDetail(competitorId, tenantId = "trifid_media") {
  try {
    const res = await fetch(`${BASE_URL}/v1/battlecards/${competitorId}?tenant_id=${tenantId}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch battlecard for ${competitorId}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchBattlecardDetail failed", err);
    return null;
  }
}

export async function autoGenerateBattlecards(tenantId) {
  const res = await fetch(`${BASE_URL}/v1/battlecards/auto-generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Generation failed" }));
    throw new Error(err.detail || "Battlecard generation failed");
  }
  return await res.json();
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
    console.warn("generateCustomBattlecard failed", err);
    throw err;
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
    console.warn("fetchLiveSignals failed", err);
    return [];
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
    console.warn("fetchCommitteeMembers failed", err);
    return [];
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
    console.warn("addCommitteeMember failed", err);
    return null;
  }
}

export async function triggerCommitteeAutoFind(dealId, roleTag, companyName = "", domain = "") {
  try {
    const res = await fetch(`${BASE_URL}/v1/deals/${dealId}/committee/auto-find`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role_tag: roleTag, company_name: companyName, domain }),
    });
    if (!res.ok) throw new Error("Failed to auto-find candidate");
    return await res.json();
  } catch (err) {
    console.warn("triggerCommitteeAutoFind failed", err);
    return null;
  }
}

export function getCommitteeStreamUrl(dealId, roleTag, companyName, domain) {
  const params = new URLSearchParams({
    role_tag: roleTag,
    company_name: companyName || "",
    domain: domain || "",
  });
  return `${BASE_URL}/v1/deals/${dealId}/committee/stream?${params.toString()}`;
}


