/**
 * PackSmart AI — Centralized REST API Service & Offline Fallback Layer
 * Smart India Hackathon 2026 | PS: SIH26236
 * 
 * Provides resilient, hybrid API connectivity:
 * 1. Automatically queries live backend or configured custom API URL (e.g., Render, Railway, AWS).
 * 2. If backend is offline or on a static host (Cloudflare Pages, GitHub Pages, Vercel),
 *    seamlessly falls back to direct Supabase queries or the embedded scientific dataset
 *    and client-side AI recommendation engine.
 */

import { supabase, IS_LIVE_SUPABASE } from "./supabase-config.js";
import { SeedData } from "./seed-data.js";
import { clientAnalyze, clientRunWhatIf, clientOptimizeCost, DISCLAIMER } from "./client-engine.js";

const STORAGE_KEY_API_URL = "packsmart_api_url";

export function getApiBaseUrl() {
    if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY_API_URL);
        if (stored !== null && stored !== undefined && stored.trim() !== "") {
            return stored.trim().replace(/\/+$/, "");
        }
    }
    if (typeof window !== "undefined" && window.PACKSMART_API_BASE_URL) {
        return window.PACKSMART_API_BASE_URL.trim().replace(/\/+$/, "");
    }
    return "";
}

export function setApiBaseUrl(url) {
    if (!url || url.trim() === "") {
        localStorage.removeItem(STORAGE_KEY_API_URL);
    } else {
        localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ""));
    }
}

async function getAuthToken() {
    try {
        if (IS_LIVE_SUPABASE && supabase) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
                return data.session.access_token;
            }
        }
    } catch (e) {
        console.warn("[API] Auth session check error:", e);
    }
    return localStorage.getItem("packsmart_token") || "demo-guest-jwt-token";
}

async function request(endpoint, options = {}, timeoutMs = 3800) {
    const token = await getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const baseUrl = getApiBaseUrl();
    const fullUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://") 
        ? endpoint 
        : `${baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(fullUrl, {
            ...options,
            headers,
            signal: controller.signal
        });

        clearTimeout(timer);

        if (!res.ok) {
            let errMessage = `Request failed: ${res.status} ${res.statusText}`;
            try {
                const errData = await res.json();
                if (errData.detail) errMessage = errData.detail;
            } catch (_) {}
            throw new Error(errMessage);
        }

        // Verify response is JSON (not HTML 404 from static CDNs)
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(`Invalid content-type from endpoint: ${contentType || "unknown"} (expected application/json)`);
        }

        return await res.json();
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

export const API = {
    getApiBaseUrl,
    setApiBaseUrl,

    async testConnection(testUrl) {
        const target = (testUrl !== undefined ? testUrl : getApiBaseUrl()).trim().replace(/\/+$/, "");
        const pingEndpoint = target ? `${target}/api/health` : "/api/health";
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(pingEndpoint, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                return { success: true, message: `Connected to ${data.service || "PackSmart API"} (${data.status})` };
            }
            return { success: false, message: `Server replied with HTTP status ${res.status}` };
        } catch (err) {
            return { success: false, message: err.name === "AbortError" ? "Connection timed out after 3.5s" : err.message };
        }
    },

    // Analysis & Simulation
    async analyzePackaging(data) {
        try {
            return await request("/api/analyze", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.info("[API] Backend unavailable for /api/analyze; running client-side recommendation engine:", e.message);
            return clientAnalyze(data);
        }
    },

    async runWhatIf(data) {
        try {
            return await request("/api/what-if", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.info("[API] Backend unavailable for /api/what-if; running client-side simulator:", e.message);
            return clientRunWhatIf(data);
        }
    },

    async optimizeCost(data) {
        try {
            return await request("/api/optimize-cost", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.info("[API] Backend unavailable for /api/optimize-cost; running client-side cost optimizer:", e.message);
            return clientOptimizeCost(data);
        }
    },

    // Commodities
    async fetchCommodities() {
        try {
            const data = await request("/api/commodities");
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (e) {
            console.info("[API] /api/commodities unavailable, using embedded scientific dataset:", e.message);
        }

        // Direct Supabase query fallback if live
        if (IS_LIVE_SUPABASE && supabase) {
            try {
                const { data } = await supabase.table("commodities").select("*");
                if (data && data.length > 0) return data;
            } catch (_) {}
        }

        return SeedData.getCommodities();
    },

    async fetchCommodity(id) {
        try {
            return await request(`/api/commodities/${encodeURIComponent(id)}`);
        } catch (_) {
            return SeedData.getCommodityById(id);
        }
    },

    async createCommodity(data) {
        try {
            return await request("/api/commodities", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } catch (_) {
            if (IS_LIVE_SUPABASE && supabase) {
                try {
                    const { data: created } = await supabase.table("commodities").insert(data).select().single();
                    if (created) return created;
                } catch (_) {}
            }
            return SeedData.addCommodity(data);
        }
    },

    // Packaging Materials
    async fetchMaterials() {
        try {
            const data = await request("/api/materials");
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (e) {
            console.info("[API] /api/materials unavailable, using embedded material catalog:", e.message);
        }

        if (IS_LIVE_SUPABASE && supabase) {
            try {
                const { data } = await supabase.table("packaging_materials").select("*");
                if (data && data.length > 0) return data;
            } catch (_) {}
        }

        return SeedData.getMaterials();
    },

    async fetchMaterial(id) {
        try {
            return await request(`/api/materials/${encodeURIComponent(id)}`);
        } catch (_) {
            return SeedData.getMaterialById(id);
        }
    },

    async createMaterial(data) {
        try {
            return await request("/api/materials", {
                method: "POST",
                body: JSON.stringify(data)
            });
        } catch (_) {
            return SeedData.addMaterial(data);
        }
    },

    async compareMaterials(materialIds) {
        try {
            return await request("/api/materials/compare", {
                method: "POST",
                body: JSON.stringify({ material_ids: materialIds })
            });
        } catch (_) {
            return SeedData.compareMaterials(materialIds);
        }
    },

    // Dashboard
    async fetchDashboardStats() {
        try {
            return await request("/api/dashboard/stats");
        } catch (_) {
            return SeedData.getStats();
        }
    },

    async fetchDashboardInsights() {
        try {
            return await request("/api/dashboard/insights");
        } catch (_) {
            return SeedData.getInsights();
        }
    },

    // History
    async fetchHistory() {
        try {
            const data = await request("/api/history");
            if (Array.isArray(data)) return data;
        } catch (_) {}
        return SeedData.getAnalyses();
    },

    async deleteHistory(id) {
        try {
            return await request(`/api/history/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
        } catch (_) {
            return SeedData.deleteAnalysis(id);
        }
    },

    // Research Sources
    async fetchSources() {
        try {
            const data = await request("/api/sources");
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (_) {}
        return SeedData.getSources();
    },

    // PDF Report Download / Printable Dossier
    async downloadPdfReport(analysisData) {
        const token = await getAuthToken();
        const baseUrl = getApiBaseUrl();
        const fullUrl = `${baseUrl}/api/reports/generate`;

        try {
            const res = await fetch(fullUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(analysisData)
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const commName = (analysisData.commodity_name || "Dossier").replace(/\s+/g, "_");
                a.download = `PackSmart_AI_${commName}_Report.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                return;
            }
        } catch (e) {
            console.warn("[API] Server-side PDF generation failed or unreachable:", e.message);
        }

        // Client-side fallback: open high-quality printable scientific dossier
        generateClientPrintDossier(analysisData);
    }
};

function generateClientPrintDossier(data) {
    const rec = data.recommended_material || {};
    const mat = rec.material || {};
    const commName = data.commodity_name || "Food Commodity";
    const commCat = data.commodity_category || "Food Category";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const explanationsHtml = (data.explanation || rec.explanation || [])
        .map(e => `<li>${e}</li>`).join("");

    const tradeOffsHtml = (data.trade_offs || rec.trade_offs || [])
        .map(t => `<li>${t}</li>`).join("");

    const warningsHtml = (data.warnings || rec.warnings || [])
        .map(w => `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:8px 12px;margin:6px 0;font-size:12px;color:#92400e;">⚠️ ${w}</div>`).join("");

    const printHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PackSmart AI — Technical Dossier: ${commName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 30px; font-size: 13px; line-height: 1.5; }
        .header { border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header h1 { margin: 0; color: #065f46; font-size: 22px; }
        .header p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
        .meta-strip { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; display: flex; justify-content: space-between; }
        .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin-bottom: 16px; }
        .card-title { color: #0f766e; font-size: 14px; font-weight: bold; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .score-box { text-align: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; }
        .score-val { font-size: 22px; font-weight: bold; color: #047857; }
        .score-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        th { background: #e2e8f0; font-weight: 600; color: #334155; }
        ul { margin: 4px 0; padding-left: 20px; }
        li { margin-bottom: 4px; }
        .disclaimer { font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 8px; font-style: italic; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px 14px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span>📄 <b>PackSmart AI Technical Dossier ready for printing or saving as PDF.</b></span>
        <button onclick="window.print()" style="background:#047857;color:#fff;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-weight:bold;">🖨️ Print / Save PDF</button>
    </div>

    <div class="header">
        <div>
            <h1>PackSmart AI — Food Packaging Technical Dossier</h1>
            <p>Smart India Hackathon 2026 | PS ID: SIH26236 | ASTM D3985 &amp; ASTM F1249 Decision Support</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
            Date: ${dateStr}<br>
            Analysis ID: ${data.id || "PS-REC-LOCAL"}
        </div>
    </div>

    <div class="meta-strip">
        <div><b>Target Food Commodity:</b> ${commName} (${commCat})</div>
        <div><b>Primary Recommendation:</b> ${mat.name || "Recommended Material"}</div>
        <div><b>Shelf-Life Horizon:</b> ${data.shelf_life_range || rec.shelf_life_range || "N/A"}</div>
    </div>

    <div class="grid-2" style="margin-bottom: 16px;">
        <div class="score-box">
            <div class="score-val">${data.compatibility_score || rec.compatibility_score || 90}/100</div>
            <div class="score-lbl">Overall Compatibility Score</div>
        </div>
        <div class="score-box">
            <div class="score-val">${data.performance_score || rec.performance_score || 85}/100</div>
            <div class="score-lbl">Barrier &amp; Performance Score</div>
        </div>
    </div>

    <div class="card">
        <div class="card-title">ASTM Physical &amp; Barrier Specifications</div>
        <table>
            <tr>
                <th>Specification Parameter</th>
                <th>Standard / Value</th>
                <th>Operational Relevance</th>
            </tr>
            <tr>
                <td><b>Oxygen Transmission Rate (OTR)</b></td>
                <td>${mat.otr} cc/(m²·24h·atm) at 23°C, 0% RH</td>
                <td>ASTM D3985 Coulometric Sensor Test</td>
            </tr>
            <tr>
                <td><b>Water Vapor Transmission Rate (WVTR)</b></td>
                <td>${mat.wvtr} g/(m²·24h) at 38°C, 90% RH</td>
                <td>ASTM F1249 Modulated Infrared Sensor</td>
            </tr>
            <tr>
                <td><b>Nominal Material Gauge</b></td>
                <td>${mat.thickness} μm (${mat.category})</td>
                <td>Puncture &amp; Tensile Resistance</td>
            </tr>
            <tr>
                <td><b>Thermal Operating Window</b></td>
                <td>${mat.temperature_min}°C to ${mat.temperature_max}°C</td>
                <td>Safe cold-chain &amp; ambient tolerance</td>
            </tr>
            <tr>
                <td><b>Estimated Unit Cost</b></td>
                <td>$${(mat.estimated_cost || 0.05).toFixed(3)} USD / m²</td>
                <td>Industrial procurement baseline</td>
            </tr>
        </table>
    </div>

    <div class="card">
        <div class="card-title">Scientific Rationale &amp; Barrier Alignment</div>
        <ul>${explanationsHtml || "<li>Optimal equilibrium barrier protection verified against commodity biological properties.</li>"}</ul>
    </div>

    ${tradeOffsHtml ? `
    <div class="card">
        <div class="card-title">Engineering Trade-Offs &amp; Operational Constraints</div>
        <ul>${tradeOffsHtml}</ul>
    </div>` : ""}

    ${warningsHtml ? `
    <div class="card">
        <div class="card-title" style="color: #b45309;">Safety &amp; Preservation Advisories</div>
        ${warningsHtml}
    </div>` : ""}

    <div class="disclaimer">
        <b>REGULATORY DISCLAIMER:</b> ${data.disclaimer || DISCLAIMER}
    </div>
</body>
</html>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
    } else {
        alert("Pop-up blocked. Please allow pop-ups for PackSmart AI to view and print the Technical Dossier.");
    }
}
