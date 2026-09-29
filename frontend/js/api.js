/**
 * PackSmart AI — Centralized REST API Service
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { supabase, IS_LIVE_SUPABASE } from "./supabase-config.js";

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
    // Fallback to local session storage for guest demo mode
    return localStorage.getItem("packsmart_token") || "demo-guest-jwt-token";
}

async function request(url, options = {}) {
    const token = await getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        let errMessage = `Request failed: ${res.statusText}`;
        try {
            const errData = await res.json();
            if (errData.detail) errMessage = errData.detail;
        } catch (_) {}
        throw new Error(errMessage);
    }
    return await res.json();
}

export const API = {
    // Analysis & Simulation
    async analyzePackaging(data) {
        return await request("/api/analyze", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    async runWhatIf(data) {
        return await request("/api/what-if", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    async optimizeCost(data) {
        return await request("/api/optimize-cost", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    // Commodities
    async fetchCommodities() {
        return await request("/api/commodities");
    },

    async fetchCommodity(id) {
        return await request(`/api/commodities/${encodeURIComponent(id)}`);
    },

    async createCommodity(data) {
        return await request("/api/commodities", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    // Packaging Materials
    async fetchMaterials() {
        return await request("/api/materials");
    },

    async fetchMaterial(id) {
        return await request(`/api/materials/${encodeURIComponent(id)}`);
    },

    async createMaterial(data) {
        return await request("/api/materials", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    async compareMaterials(materialIds) {
        return await request("/api/materials/compare", {
            method: "POST",
            body: JSON.stringify({ material_ids: materialIds })
        });
    },

    // Dashboard
    async fetchDashboardStats() {
        return await request("/api/dashboard/stats");
    },

    async fetchDashboardInsights() {
        return await request("/api/dashboard/insights");
    },

    // History
    async fetchHistory() {
        return await request("/api/history");
    },

    async deleteHistory(id) {
        return await request(`/api/history/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
    },

    // Research Sources
    async fetchSources() {
        return await request("/api/sources");
    },

    // PDF Report Download
    async downloadPdfReport(analysisData) {
        const token = await getAuthToken();
        const res = await fetch("/api/reports/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(analysisData)
        });

        if (!res.ok) {
            throw new Error("PDF report generation failed on server.");
        }

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
    }
};
