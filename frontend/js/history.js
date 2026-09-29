/**
 * PackSmart AI — Analysis History Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

export async function initHistory() {
    await loadHistoryTable();
}

export async function loadHistoryTable() {
    const tbody = document.getElementById("history-table-tbody");
    if (!tbody) return;

    try {
        const analyses = await API.fetchHistory();
        if (!analyses || analyses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No historical packaging analyses logged yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = analyses.map(a => {
            const res = a.recommendation_results || {};
            const rec = res.recommended_material || {};
            const mat = rec.material || {};
            const dateStr = (a.created_at || "").substring(0, 10) || "Recent";
            const score = res.compatibility_score || 90;
            const slRange = res.shelf_life_range || "N/A";

            return `
                <tr>
                    <td><b>${res.commodity_name || "Food Commodity"}</b></td>
                    <td><span class="text-muted">${dateStr}</span></td>
                    <td><span class="badge badge-success">${mat.name || "Recommended Film"}</span></td>
                    <td><span class="score-pill">${score}/100</span></td>
                    <td>${slRange}</td>
                    <td>
                        <div class="btn-group-sm">
                            <button class="btn btn-sm btn-outline history-view-btn" data-id="${a.id}">View</button>
                            <button class="btn btn-sm btn-outline history-pdf-btn" data-id="${a.id}">PDF</button>
                            <button class="btn btn-sm btn-danger history-del-btn" data-id="${a.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        // Bind events
        tbody.querySelectorAll(".history-view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const item = analyses.find(x => x.id === id);
                if (item && item.recommendation_results) {
                    window.displayRecommendationResults(item.recommendation_results);
                    window.navigateToView("recommendations");
                }
            });
        });

        tbody.querySelectorAll(".history-pdf-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const item = analyses.find(x => x.id === id);
                if (item && item.recommendation_results) {
                    await API.downloadPdfReport(item.recommendation_results);
                }
            });
        });

        tbody.querySelectorAll(".history-del-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("Delete this analysis dossier from history?")) {
                    await API.deleteHistory(id);
                    await loadHistoryTable();
                }
            });
        });

    } catch (e) {
        console.warn("[History] Error loading history:", e);
    }
}
