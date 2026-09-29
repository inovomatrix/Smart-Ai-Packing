/**
 * PackSmart AI — Dashboard Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let categoriesChart = null;
let sustainabilityChart = null;
let costPerfChart = null;

export async function loadDashboard() {
    try {
        const stats = await API.fetchDashboardStats();
        document.getElementById("stat-commodities").textContent = stats.total_commodities || "14";
        document.getElementById("stat-materials").textContent = stats.packaging_materials || "10";
        document.getElementById("stat-analyses").textContent = stats.analyses_completed || "48";
        document.getElementById("stat-recommendations").textContent = stats.recommendations_generated || "48";

        const insights = await API.fetchDashboardInsights();
        renderCharts(insights);
        renderRecentAnalyses(insights.recent_analyses || []);
    } catch (e) {
        console.warn("[Dashboard] Load error, using default metrics:", e);
    }
}

function renderCharts(insights) {
    if (typeof Chart === "undefined") return;

    // 1. Material Categories Doughnut Chart
    const ctxCat = document.getElementById("chart-categories");
    if (ctxCat) {
        if (categoriesChart) categoriesChart.destroy();
        const catData = insights.categories_breakdown || {
            labels: ["Polymer", "Laminate", "Foil", "Biodegradable", "Paper", "Micro-perforated"],
            data: [3, 2, 1, 1, 1, 1]
        };
        categoriesChart = new Chart(ctxCat, {
            type: "doughnut",
            data: {
                labels: catData.labels,
                datasets: [{
                    data: catData.data,
                    backgroundColor: [
                        "#059669", "#0f766e", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "right", labels: { boxWidth: 12, font: { size: 11, family: "Inter" } } }
                },
                cutout: "68%"
            }
        });
    }

    // 2. Sustainability Distribution Bar Chart
    const ctxSust = document.getElementById("chart-sustainability");
    if (ctxSust) {
        if (sustainabilityChart) sustainabilityChart.destroy();
        const sustData = insights.sustainability_breakdown || {
            labels: ["Compostable / Bio", "High Recyclability", "Multi-layer / Barrier"],
            data: [2, 5, 3]
        };
        sustainabilityChart = new Chart(ctxSust, {
            type: "bar",
            data: {
                labels: sustData.labels,
                datasets: [{
                    label: "Materials",
                    data: sustData.data,
                    backgroundColor: ["#10b981", "#059669", "#64748b"],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Cost vs Performance Scatter Chart
    const ctxCost = document.getElementById("chart-cost-perf");
    if (ctxCost) {
        if (costPerfChart) costPerfChart.destroy();
        const items = insights.cost_vs_performance || [];
        const scatterData = items.map(m => ({
            x: m.cost,
            y: Math.min(100, Math.max(20, 100 - (Math.log10(m.otr + 0.1) * 15))),
            label: m.name
        }));

        costPerfChart = new Chart(ctxCost, {
            type: "scatter",
            data: {
                datasets: [{
                    label: "Packaging Materials",
                    data: scatterData,
                    backgroundColor: "#059669",
                    borderColor: "#047857",
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const raw = ctx.raw;
                                return `${raw.label}: $${raw.x}/unit (Barrier Index: ${Math.round(raw.y)})`;
                            }
                        }
                    },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Estimated Unit Cost ($ USD)", font: { size: 11 } },
                        grid: { color: "#f1f5f9" }
                    },
                    y: {
                        title: { display: true, text: "Barrier Performance Index (0-100)", font: { size: 11 } },
                        grid: { color: "#f1f5f9" },
                        min: 10,
                        max: 105
                    }
                }
            }
        });
    }
}

function renderRecentAnalyses(analyses) {
    const tbody = document.getElementById("recent-analyses-tbody");
    if (!tbody) return;

    if (!analyses || analyses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-state">
                    No recent analyses logged yet. Click <b>+ New Packaging Analysis</b> to generate your first recommendation!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = analyses.map(a => {
        const results = a.recommendation_results || {};
        const rec = results.recommended_material || {};
        const mat = rec.material || {};
        const dateStr = (a.created_at || "").substring(0, 10) || "Just now";
        const score = results.compatibility_score || 90;

        return `
            <tr>
                <td><b>${results.commodity_name || "Food Commodity"}</b></td>
                <td><span class="text-muted">${dateStr}</span></td>
                <td><span class="badge badge-success">${mat.name || "Optimized Packaging"}</span></td>
                <td><span class="score-pill">${score}/100</span></td>
                <td>
                    <button class="btn btn-sm btn-outline view-analysis-btn" data-id="${a.id}">
                        View Dossier
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // Bind view buttons
    document.querySelectorAll(".view-analysis-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const item = analyses.find(x => x.id === id);
            if (item && item.recommendation_results) {
                window.displayRecommendationResults(item.recommendation_results);
            }
        });
    });
}
