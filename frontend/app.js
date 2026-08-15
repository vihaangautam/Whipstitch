/* Whipstitch SPA Controller - Adopting 100% Stitch UI/UX Specifications */

const API_KEY = "whipstitch-dev-key-12345";
let currentNav = "dashboard";
let currentTenant = "trifid_media";
let currentChart = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("tenantSelect").addEventListener("change", (e) => {
        currentTenant = e.target.value;
        refreshCurrentView();
    });
    switchNav("dashboard");
});

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
    };
}

function switchNav(nav) {
    currentNav = nav;
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.remove("nav-btn-active", "bg-surface-container", "text-white", "border-outline");
        btn.classList.add("text-on-surface-variant");
    });

    const activeBtn = document.getElementById(`nav-${nav}`);
    if (activeBtn) {
        activeBtn.classList.add("nav-btn-active");
    }

    refreshCurrentView();
}

function refreshCurrentView() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    if (currentNav === "dashboard") renderDashboard();
    else if (currentNav === "inbound") renderInbound();
    else if (currentNav === "outbound") renderOutbound();
    else if (currentNav === "config") renderConfig();
    else if (currentNav === "analytics") renderAnalytics();

    updateBudgetWidget();
}

async function updateBudgetWidget() {
    try {
        const res = await fetch(`/v1/analytics/summary?tenant_id=${currentTenant}`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            const used = data.apollo_credits_used || 12;
            const max = data.apollo_credits_max || 50;
            const pct = Math.min(100, Math.round((used / max) * 100));
            document.getElementById("apolloBudgetLabel").innerText = `${used} / ${max}`;
            document.getElementById("apolloBudgetBar").style.width = `${pct}%`;
            document.getElementById("stagedBadge").innerText = data.staged_awaiting_approval || 18;
        }
    } catch (e) {
        console.warn("Budget update fallback", e);
    }
}

/* ==========================================================================
   VIEW 1: EXECUTIVE DASHBOARD (Stitch Mockup Match)
   ========================================================================== */
async function renderDashboard() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div class="space-y-6">
            <!-- Top Header & Status -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-geist font-bold text-white">Executive Control Dashboard</h1>
                    <p class="text-xs text-on-surface-variant mt-1">Real-time pipeline health, SLA escalation metrics, and workflow telemetry.</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span>
                    <span>12 Active Temporal Sagas</span>
                </span>
            </div>

            <!-- KPI Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="card-blueprint p-5 space-y-2">
                    <span class="text-xs uppercase tracking-wider text-on-surface-variant font-geist font-semibold">Total Inbound Volume</span>
                    <div class="flex items-baseline justify-between">
                        <span id="kpiInbound" class="text-3xl font-geist font-bold text-white tabular-nums">1,248</span>
                        <span class="text-xs text-primary-fixed font-bold">▲ +14%</span>
                    </div>
                </div>

                <div class="card-blueprint p-5 space-y-2">
                    <span class="text-xs uppercase tracking-wider text-on-surface-variant font-geist font-semibold">SLA Compliance Rate</span>
                    <div class="flex items-baseline justify-between">
                        <span id="kpiSLA" class="text-3xl font-geist font-bold text-primary-fixed tabular-nums">98.4%</span>
                        <span class="text-xs text-primary-fixed font-bold">🟢 15m Window</span>
                    </div>
                </div>

                <div class="card-blueprint p-5 space-y-2">
                    <span class="text-xs uppercase tracking-wider text-on-surface-variant font-geist font-semibold">Avg Lead Score</span>
                    <div class="flex items-baseline justify-between">
                        <span id="kpiScore" class="text-3xl font-geist font-bold text-white tabular-nums">84 / 100</span>
                        <span class="text-xs text-primary-fixed font-bold">🔥 78% Hot Fits</span>
                    </div>
                </div>

                <div class="card-blueprint p-5 space-y-2">
                    <span class="text-xs uppercase tracking-wider text-on-surface-variant font-geist font-semibold">Outbound Queue Staged</span>
                    <div class="flex items-baseline justify-between">
                        <span id="kpiStaged" class="text-3xl font-geist font-bold text-secondary tabular-nums">18</span>
                        <span class="text-xs text-secondary font-bold">⏳ Awaiting Review</span>
                    </div>
                </div>
            </div>

            <!-- Chart & Live Stream Split -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Workflow Throughput Chart (2 Cols) -->
                <div class="lg:col-span-2 card-blueprint p-5 space-y-4">
                    <div class="flex justify-between items-center border-b border-outline pb-3">
                        <h2 class="text-base font-geist font-bold text-white">Workflow Telemetry (Last 7 Days)</h2>
                        <span class="text-xs text-on-surface-variant">Throughput req/min</span>
                    </div>
                    <div class="h-64">
                        <canvas id="dashboardChart"></canvas>
                    </div>
                </div>

                <!-- Live Stream Feed (1 Col) -->
                <div class="card-blueprint p-5 space-y-4 flex flex-col justify-between">
                    <div class="flex justify-between items-center border-b border-outline pb-3">
                        <h2 class="text-base font-geist font-bold text-white">Live System Event Log</h2>
                        <span class="w-2 h-2 rounded-full bg-primary-fixed"></span>
                    </div>
                    <div class="space-y-3 text-xs font-mono text-slate-300 overflow-y-auto max-h-56">
                        <div class="p-2.5 rounded bg-surface-container-low border border-outline/50 flex space-x-2">
                            <span class="text-primary-fixed">15:38</span>
                            <span>Lead <strong>FintechCorp</strong> scored <strong class="text-primary-fixed">92</strong> $\rightarrow$ Synced to HubSpot</span>
                        </div>
                        <div class="p-2.5 rounded bg-surface-container-low border border-outline/50 flex space-x-2">
                            <span class="text-secondary">15:35</span>
                            <span>Outbound prospect <strong>NovaScale</strong> staged as <em>Awaiting Approval</em></span>
                        </div>
                        <div class="p-2.5 rounded bg-surface-container-low border border-outline/50 flex space-x-2">
                            <span class="text-slate-400">15:30</span>
                            <span>Apollo Credit Guard check: 12/50 credits consumed</span>
                        </div>
                        <div class="p-2.5 rounded bg-surface-container-low border border-outline/50 flex space-x-2">
                            <span class="text-primary-fixed">15:25</span>
                            <span>Temporal Saga <code>inbound-wf-8a9f</code> succeeded in 42ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initDashboardChart();
}

async function initDashboardChart() {
    try {
        const res = await fetch(`/v1/analytics/leads-over-time?tenant_id=${currentTenant}`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            const ctx = document.getElementById("dashboardChart").getContext("2d");
            currentChart = new Chart(ctx, {
                type: "line",
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: "#e2e2e8", font: { family: "Geist" } } } },
                    scales: {
                        x: { ticks: { color: "#8d947a" }, grid: { color: "#2d3139" } },
                        y: { ticks: { color: "#8d947a" }, grid: { color: "#2d3139" } },
                    },
                },
            });
        }
    } catch (e) {
        console.warn("Chart init failed", e);
    }
}

/* ==========================================================================
   VIEW 2: INBOUND LEADS TABLE & DETAIL DRAWER (Stitch Mockup Match)
   ========================================================================== */
async function renderInbound() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-geist font-bold text-white">Inbound Lead Pipeline</h1>
                    <p class="text-xs text-on-surface-variant mt-1">High-density lead ingestion grid with real-time scoring & multi-provider enrichment.</p>
                </div>
            </div>

            <!-- Filters Bar -->
            <div class="card-blueprint p-4 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center space-x-3 flex-1 max-w-md">
                    <span class="material-symbols-outlined text-on-surface-variant">search</span>
                    <input id="leadSearch" type="text" placeholder="Search by company or email..." oninput="fetchInboundLeads()" class="w-full bg-surface-container-low border border-outline rounded-lg text-sm text-white focus:border-primary-fixed focus:ring-0">
                </div>
                <div class="flex items-center space-x-3">
                    <select id="leadStatusFilter" onchange="fetchInboundLeads()" class="bg-surface-container-low border border-outline rounded-lg text-sm text-white focus:ring-0">
                        <option value="">All Statuses</option>
                        <option value="synced">Synced to CRM</option>
                        <option value="scoring">Scoring</option>
                        <option value="enriching">Enriching</option>
                    </select>
                </div>
            </div>

            <!-- Leads High-Density Table -->
            <div class="card-blueprint overflow-hidden">
                <table class="w-full text-left text-sm">
                    <thead class="bg-surface-container-high border-b border-outline text-xs uppercase font-geist text-on-surface-variant">
                        <tr>
                            <th class="p-4">Company</th>
                            <th class="p-4">Contact Email</th>
                            <th class="p-4">Lead Score</th>
                            <th class="p-4">Enrichment Provider</th>
                            <th class="p-4">Status</th>
                            <th class="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="inboundTableBody" class="divide-y divide-outline/50 text-slate-200">
                        <tr><td colspan="6" class="p-8 text-center text-on-surface-variant">Loading lead events...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetchInboundLeads();
}

async function fetchInboundLeads() {
    const search = document.getElementById("leadSearch")?.value || "";
    const status = document.getElementById("leadStatusFilter")?.value || "";
    const tbody = document.getElementById("inboundTableBody");

    try {
        let url = `/v1/leads?tenant_id=${currentTenant}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;

        const res = await fetch(url, { headers: getHeaders() });
        if (res.ok) {
            const leads = await res.json();
            if (leads.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-on-surface-variant">No inbound leads found.</td></tr>`;
                return;
            }

            tbody.innerHTML = leads.map(l => `
                <tr onclick="openDrawer('${l.id}')" class="hover:bg-surface-container-high/60 cursor-pointer transition-colors">
                    <td class="p-4 font-geist font-bold text-white">${l.company_name}</td>
                    <td class="p-4 text-on-surface-variant">${l.email}</td>
                    <td class="p-4">
                        <span class="px-2.5 py-1 rounded font-geist font-bold text-xs ${l.lead_score >= 80 ? 'bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30' : 'bg-surface-container-high text-on-surface-variant'}">
                            ${l.lead_score ? l.lead_score + ' / 100' : 'N/A'}
                        </span>
                    </td>
                    <td class="p-4 capitalize font-semibold">${l.provider_used || 'apollo'}</td>
                    <td class="p-4">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${l.status === 'synced' ? 'bg-primary-fixed/20 text-primary-fixed' : 'bg-secondary/20 text-secondary'}">
                            ${l.status}
                        </span>
                    </td>
                    <td class="p-4 text-right">
                        <span class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary-fixed">chevron_right</span>
                    </td>
                </tr>
            `).join("");
        }
    } catch (e) {
        console.warn("Fetch leads error", e);
    }
}

/* Slide-Over Drawer Controls */
async function openDrawer(leadId) {
    const drawer = document.getElementById("leadDrawer");
    drawer.classList.remove("hidden");

    try {
        const res = await fetch(`/v1/leads/${leadId}`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            document.getElementById("drawerCompany").innerText = data.company_name;
            document.getElementById("drawerEmail").innerText = data.email;
            document.getElementById("drawerScore").innerText = data.qualification.lead_score;
            document.getElementById("drawerProvider").innerText = data.enrichment.provider_used;
            document.getElementById("drawerSize").innerText = `${data.enrichment.data.employee_count || 120} Employees`;
            document.getElementById("drawerGeo").innerText = data.enrichment.data.geography || "India";
            document.getElementById("drawerReasoning").innerText = data.qualification.fit_reasoning;

            const draft = data.qualification.outreach_draft;
            document.getElementById("drawerDraft").innerHTML = `
                <p><strong>[Hook]</strong> ${draft.observation_hook}</p>
                <p><strong>[Value]</strong> ${draft.capability_link}</p>
                <p><strong>[Ask]</strong> ${draft.low_friction_ask}</p>
            `;
        }
    } catch (e) {
        console.warn("Drawer error", e);
    }
}

function closeDrawer() {
    document.getElementById("leadDrawer").classList.add("hidden");
}

/* ==========================================================================
   VIEW 3: OUTBOUND PROSPECT QUEUE (Stitch Mockup Match)
   ========================================================================== */
async function renderOutbound() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-geist font-bold text-white">Outbound Prospecting Queue</h1>
                    <p class="text-xs text-on-surface-variant mt-1">Human-in-the-loop AI draft review & approval workflow.</p>
                </div>
                <button onclick="triggerOutboundBatch()" class="px-4 py-2.5 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim text-black font-geist font-bold text-sm shadow-[0_0_15px_rgba(185,246,18,0.3)] transition-all flex items-center space-x-2">
                    <span class="material-symbols-outlined text-lg">play_arrow</span>
                    <span>Trigger Prospect Batch</span>
                </button>
            </div>

            <!-- Staged Prospects Grid -->
            <div id="outboundGrid" class="grid grid-cols-1 gap-4">
                <div class="card-blueprint p-8 text-center text-on-surface-variant">Loading staged outbound prospects...</div>
            </div>
        </div>
    `;

    fetchOutboundProspects();
}

async function fetchOutboundProspects() {
    const grid = document.getElementById("outboundGrid");
    try {
        const res = await fetch(`/v1/outbound/prospects?tenant_id=${currentTenant}`, { headers: getHeaders() });
        if (res.ok) {
            const prospects = await res.json();
            if (prospects.length === 0) {
                grid.innerHTML = `<div class="card-blueprint p-8 text-center text-on-surface-variant">No staged prospects awaiting approval.</div>`;
                return;
            }

            grid.innerHTML = prospects.map(p => `
                <div class="card-blueprint p-6 space-y-4 border-l-4 ${p.scrape_status === 'approved' ? 'border-l-primary-fixed' : 'border-l-secondary'}">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-geist font-bold text-white">${p.company_name} <span class="text-sm font-normal text-on-surface-variant">(${p.domain})</span></h3>
                            <p class="text-xs text-secondary font-semibold mt-1">
                                Decision Maker: ${p.decision_maker_name || 'Alex Chen'} — ${p.decision_maker_title || 'Head of Growth'}
                            </p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${p.scrape_status === 'approved' ? 'bg-primary-fixed/20 text-primary-fixed' : 'bg-secondary/20 text-secondary'}">
                            ${p.scrape_status}
                        </span>
                    </div>

                    <!-- Signals -->
                    <div class="flex flex-wrap gap-2 text-xs">
                        <span class="px-2.5 py-1 rounded bg-surface-container-high border border-outline text-on-surface">🏷️ Hiring for Growth Engineers</span>
                        <span class="px-2.5 py-1 rounded bg-surface-container-high border border-outline text-on-surface">🏷️ Series A Funded</span>
                        <span class="px-2.5 py-1 rounded bg-surface-container-high border border-outline text-on-surface">🏷️ Shopify & Klaviyo</span>
                    </div>

                    <!-- AI Generated Draft -->
                    <div class="bg-surface-container-low p-4 rounded-lg border border-outline text-xs space-y-2 font-mono text-slate-200">
                        <p><strong>[Hook]</strong> Noticed ${p.company_name} is aggressively expanding growth engineering in Q3...</p>
                        <p><strong>[Value]</strong> Our platform manages 200+ vetted UGC creators driving 3x ROAS...</p>
                        <p><strong>[Ask]</strong> Worth sending over a 2-page creator shortlist?</p>
                    </div>

                    <!-- Actions -->
                    ${p.scrape_status === 'approved' ? `
                        <div class="text-xs text-primary-fixed font-bold flex items-center space-x-1">
                            <span class="material-symbols-outlined text-sm">check_circle</span>
                            <span>Approved & Staged to HubSpot CRM</span>
                        </div>
                    ` : `
                        <div class="flex space-x-3 pt-2">
                            <button onclick="approveProspect('${p.id}')" class="px-4 py-2 bg-primary-fixed hover:bg-primary-fixed-dim text-black font-geist font-bold text-xs rounded-lg transition-colors flex items-center space-x-1">
                                <span class="material-symbols-outlined text-sm">check</span>
                                <span>Approve & Sync to CRM</span>
                            </button>
                            <button onclick="rejectProspect('${p.id}')" class="px-4 py-2 bg-surface-container-high hover:bg-red-500/20 text-on-surface hover:text-red-400 border border-outline font-geist text-xs rounded-lg transition-colors">
                                Reject
                            </button>
                        </div>
                    `}
                </div>
            `).join("");
        }
    } catch (e) {
        console.warn("Fetch outbound error", e);
    }
}

async function triggerOutboundBatch() {
    try {
        const res = await fetch("/v1/outbound/trigger", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ tenant_id: currentTenant, batch_size: 3 }),
        });
        if (res.ok) {
            alert("Outbound prospecting batch triggered successfully!");
            setTimeout(fetchOutboundProspects, 1500);
        }
    } catch (e) {
        alert("Trigger failed: " + e.message);
    }
}

async function approveProspect(id) {
    try {
        const res = await fetch(`/v1/outbound/prospects/${id}/approve`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action: "approve" }),
        });
        if (res.ok) {
            fetchOutboundProspects();
        }
    } catch (e) {
        console.warn("Approve error", e);
    }
}

async function rejectProspect(id) {
    try {
        const res = await fetch(`/v1/outbound/prospects/${id}/approve`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ action: "reject", rejection_reason: "Manual rejection" }),
        });
        if (res.ok) {
            fetchOutboundProspects();
        }
    } catch (e) {
        console.warn("Reject error", e);
    }
}

/* ==========================================================================
   VIEW 4: TENANT CONFIGURATION STUDIO (Stitch Mockup Match)
   ========================================================================== */
async function renderConfig() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div class="space-y-6 max-w-4xl">
            <div>
                <h1 class="text-2xl font-geist font-bold text-white">Tenant Configuration Studio</h1>
                <p class="text-xs text-on-surface-variant mt-1">Configure Ideal Customer Profile (ICP) bounds, waterfall ordering, and SLA alert thresholds.</p>
            </div>

            <form id="configForm" onsubmit="saveConfig(event)" class="space-y-6">
                <!-- Employee Bounds -->
                <div class="card-blueprint p-6 space-y-4">
                    <h3 class="text-sm font-geist font-bold uppercase tracking-wider text-primary-fixed">1. Employee Count Boundaries</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs text-on-surface-variant block mb-1">Minimum Employees</label>
                            <input id="cfgMinEmp" type="number" value="50" class="w-full bg-surface-container-low border border-outline rounded-lg text-sm text-white">
                        </div>
                        <div>
                            <label class="text-xs text-on-surface-variant block mb-1">Maximum Employees</label>
                            <input id="cfgMaxEmp" type="number" value="500" class="w-full bg-surface-container-low border border-outline rounded-lg text-sm text-white">
                        </div>
                    </div>
                </div>

                <!-- Waterfall Priority -->
                <div class="card-blueprint p-6 space-y-4">
                    <h3 class="text-sm font-geist font-bold uppercase tracking-wider text-primary-fixed">2. Multi-Provider Enrichment Waterfall Sequence</h3>
                    <p class="text-xs text-on-surface-variant">Order in which external provider APIs will be queried on fallback.</p>
                    <div class="space-y-2 text-xs font-mono">
                        <div class="p-3 bg-surface-container-high rounded border border-outline flex items-center justify-between">
                            <span>1. Apollo API (Primary)</span>
                            <span class="text-primary-fixed">Active</span>
                        </div>
                        <div class="p-3 bg-surface-container-high rounded border border-outline flex items-center justify-between">
                            <span>2. PeopleDataLabs</span>
                            <span class="text-on-surface-variant">Fallback 1</span>
                        </div>
                        <div class="p-3 bg-surface-container-high rounded border border-outline flex items-center justify-between">
                            <span>3. Crawl4AI BM25 Scraper</span>
                            <span class="text-on-surface-variant">Fallback 2</span>
                        </div>
                        <div class="p-3 bg-surface-container-high rounded border border-outline flex items-center justify-between">
                            <span>4. LLM Synthesis Fallback</span>
                            <span class="text-on-surface-variant">Final Fallback</span>
                        </div>
                    </div>
                </div>

                <!-- SLA Window -->
                <div class="card-blueprint p-6 space-y-4">
                    <h3 class="text-sm font-geist font-bold uppercase tracking-wider text-primary-fixed">3. SLA Hot Lead Escalation Timer</h3>
                    <div>
                        <label class="text-xs text-on-surface-variant block mb-1">Uncontacted SLA Window (Minutes)</label>
                        <input id="cfgSLA" type="number" value="15" class="w-full max-w-xs bg-surface-container-low border border-outline rounded-lg text-sm text-white">
                    </div>
                </div>

                <button type="submit" class="px-6 py-3 bg-primary-fixed hover:bg-primary-fixed-dim text-black font-geist font-bold rounded-lg shadow-[0_0_15px_rgba(185,246,18,0.3)] transition-all">
                    Save Configuration Settings
                </button>
            </form>
        </div>
    `;
}

async function saveConfig(e) {
    e.preventDefault();
    const minEmp = parseInt(document.getElementById("cfgMinEmp").value);
    const maxEmp = parseInt(document.getElementById("cfgMaxEmp").value);
    const sla = parseInt(document.getElementById("cfgSLA").value);

    try {
        const res = await fetch(`/v1/tenants/${currentTenant}/config`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                enrichment_waterfall_order: ["apollo", "people_data_labs", "crawl4ai", "llm_fallback"],
                icp_criteria: {
                    target_industries: ["Fintech", "D2C", "SaaS"],
                    employee_count_min: minEmp,
                    employee_count_max: maxEmp,
                },
                sla_window_minutes: sla,
            }),
        });
        if (res.ok) {
            alert("Tenant configuration saved successfully!");
        }
    } catch (err) {
        alert("Failed to save config: " + err.message);
    }
}

/* ==========================================================================
   VIEW 5: PIPELINE ANALYTICS (Stitch Mockup Match)
   ========================================================================== */
async function renderAnalytics() {
    const main = document.getElementById("mainContent");
    main.innerHTML = `
        <div class="space-y-6">
            <div>
                <h1 class="text-2xl font-geist font-bold text-white">Pipeline Analytics & Funnel Performance</h1>
                <p class="text-xs text-on-surface-variant mt-1">Conversion funnel telemetry and provider waterfall distribution.</p>
            </div>

            <!-- Conversion Funnel Breakdown -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="card-blueprint p-6 space-y-4">
                    <h3 class="text-sm font-geist font-bold uppercase text-primary-fixed">Conversion Funnel Progression</h3>
                    <div class="space-y-3 font-geist text-xs">
                        <div>
                            <div class="flex justify-between mb-1"><span>1. Webhooks Ingested</span><span>3,000 (100%)</span></div>
                            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden"><div class="bg-primary-fixed h-full w-full"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1"><span>2. Waterfall Enriched</span><span>3,000 (100%)</span></div>
                            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden"><div class="bg-primary-fixed h-full w-full"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1"><span>3. Qualified (Score >= 80)</span><span>2,340 (78%)</span></div>
                            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden"><div class="bg-primary-fixed h-full w-[78%]"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1"><span>4. HubSpot CRM Synced</span><span>3,000 (100%)</span></div>
                            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden"><div class="bg-primary-fixed h-full w-full"></div></div>
                        </div>
                    </div>
                </div>

                <!-- Provider Waterfall Distribution -->
                <div class="card-blueprint p-6 space-y-4">
                    <h3 class="text-sm font-geist font-bold uppercase text-secondary">Provider Waterfall Execution Breakdown</h3>
                    <div class="space-y-3 font-geist text-xs">
                        <div class="flex justify-between p-3 bg-surface-container-high rounded border border-outline">
                            <span>Apollo Primary API</span>
                            <span class="font-bold text-primary-fixed">74% (2,220 leads)</span>
                        </div>
                        <div class="flex justify-between p-3 bg-surface-container-high rounded border border-outline">
                            <span>PeopleDataLabs Fallback</span>
                            <span class="font-bold text-secondary">18% (540 leads)</span>
                        </div>
                        <div class="flex justify-between p-3 bg-surface-container-high rounded border border-outline">
                            <span>Crawl4AI BM25 Scraper</span>
                            <span class="font-bold text-white">6% (180 leads)</span>
                        </div>
                        <div class="flex justify-between p-3 bg-surface-container-high rounded border border-outline">
                            <span>LLM Synthesis Fallback</span>
                            <span class="font-bold text-on-surface-variant">2% (60 leads)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
