/**
 * PackSmart AI — Packaging Material Comparison Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let comparisonRadarChart = null;
let allMaterials = [];
let selectedMaterialIds = new Set();

export async function initComparison() {
    try {
        allMaterials = await API.fetchMaterials();
        renderSelectionPills();

        // Default select 3 contrasting materials (e.g. LDPE, Metallized BOPP, Aluminium Foil)
        if (allMaterials.length >= 3) {
            selectedMaterialIds.add(allMaterials[0].id);
            selectedMaterialIds.add(allMaterials[3]?.id || allMaterials[1].id);
            selectedMaterialIds.add(allMaterials[4]?.id || allMaterials[2].id);
        }
        updatePillSelectionState();
        await updateComparisonView();
    } catch (e) {
        console.warn("[Comparison] Init error:", e);
    }
}

function renderSelectionPills() {
    const container = document.getElementById("comparison-pills-container");
    if (!container) return;

    container.innerHTML = allMaterials.map(m => `
        <button class="material-pill-btn" data-id="${m.id}">
            <span class="pill-check">✓</span>
            ${m.name}
        </button>
    `).join("");

    container.querySelectorAll(".material-pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            if (selectedMaterialIds.has(id)) {
                if (selectedMaterialIds.size <= 2) {
                    alert("Please select at least 2 materials to compare.");
                    return;
                }
                selectedMaterialIds.delete(id);
            } else {
                if (selectedMaterialIds.size >= 5) {
                    alert("Maximum 5 materials can be compared simultaneously.");
                    return;
                }
                selectedMaterialIds.add(id);
            }
            updatePillSelectionState();
            updateComparisonView();
        });
    });
}

function updatePillSelectionState() {
    document.querySelectorAll(".material-pill-btn").forEach(btn => {
        const id = btn.getAttribute("data-id");
        if (selectedMaterialIds.has(id)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

async function updateComparisonView() {
    if (selectedMaterialIds.size === 0) return;

    try {
        const ids = Array.from(selectedMaterialIds);
        const res = await API.compareMaterials(ids);
        renderComparisonTable(res.comparison || []);
        renderComparisonRadar(res.comparison || []);
    } catch (e) {
        console.warn("[Comparison] Failed updating comparison:", e);
    }
}

function renderComparisonRadar(items) {
    const ctx = document.getElementById("chart-comparison-radar");
    if (!ctx || typeof Chart === "undefined") return;

    if (comparisonRadarChart) comparisonRadarChart.destroy();

    const colors = [
        { bg: "rgba(5, 150, 105, 0.15)", border: "#059669" },
        { bg: "rgba(59, 130, 246, 0.15)", border: "#3b82f6" },
        { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b" },
        { bg: "rgba(139, 92, 246, 0.15)", border: "#8b5cf6" },
        { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444" }
    ];

    const labels = ["Oxygen Barrier", "Moisture Barrier", "Mechanical Strength", "Thermal Tolerance", "Circularity & Eco", "Cost Efficiency"];

    const datasets = items.map((item, idx) => {
        const color = colors[idx % colors.length];
        const m = item.material;
        const rad = item.radar_metrics || {};
        return {
            label: m.name,
            data: labels.map(l => rad[l] || 50),
            backgroundColor: color.bg,
            borderColor: color.border,
            pointBackgroundColor: color.border,
            borderWidth: 2
        };
    });

    comparisonRadarChart = new Chart(ctx, {
        type: "radar",
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: "#e2e8f0" },
                    grid: { color: "#f1f5f9" },
                    pointLabels: { font: { size: 10, family: "Inter", weight: 600 } },
                    suggestedMin: 20,
                    suggestedMax: 100,
                    ticks: { stepSize: 20, backdropColor: "transparent" }
                }
            },
            plugins: {
                legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}

function renderComparisonTable(items) {
    const table = document.getElementById("comparison-matrix-table");
    if (!table) return;

    let headerHtml = `<tr><th>Property / Parameter</th>`;
    items.forEach(it => {
        headerHtml += `<th><b>${it.material.name}</b><br/><span class="badge badge-info">${it.material.category}</span></th>`;
    });
    headerHtml += `</tr>`;

    const attributes = [
        { label: "OTR (ASTM D3985)", key: "otr", unit: "cc/(m²·24h·atm)" },
        { label: "WVTR (ASTM F1249)", key: "wvtr", unit: "g/(m²·24h)" },
        { label: "Thickness", key: "thickness", unit: "μm" },
        { label: "Mechanical Strength", key: "mechanical_strength", unit: "" },
        { label: "Heat Sealability", key: "sealability", unit: "" },
        { label: "Thermal Range", key: "temp_range", unit: "°C" },
        { label: "MAP Compatible", key: "map_compatible", unit: "" },
        { label: "Recyclability", key: "recyclability", unit: "" },
        { label: "Biodegradability", key: "biodegradability", unit: "" },
        { label: "Unit Packaging Cost", key: "estimated_cost", unit: "USD" }
    ];

    let bodyHtml = "";
    attributes.forEach(attr => {
        bodyHtml += `<tr><td><b>${attr.label}</b></td>`;
        items.forEach(it => {
            const m = it.material;
            let val = "";
            if (attr.key === "temp_range") {
                val = `${m.temperature_min}°C to ${m.temperature_max}°C`;
            } else if (attr.key === "map_compatible") {
                val = m.map_compatible ? "✓ MAP Compatible" : "✗ Standard Only";
            } else if (attr.key === "estimated_cost") {
                val = `$${m.estimated_cost.toFixed(3)} ${attr.unit}`;
            } else {
                val = `${m[attr.key]} ${attr.unit}`.trim();
            }
            bodyHtml += `<td>${val}</td>`;
        });
        bodyHtml += `</tr>`;
    });

    table.innerHTML = `<thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody>`;
}
