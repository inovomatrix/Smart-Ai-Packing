/**
 * PackSmart AI — Recommendation Results Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let recommendationRadarChart = null;
let activeAnalysisData = null;

export function displayRecommendationResults(data) {
    activeAnalysisData = data;

    const rec = data.recommended_material || {};
    const mat = rec.material || {};

    // 1. Title & Header
    document.getElementById("rec-commodity-name").textContent = data.commodity_name || "Food Commodity";
    document.getElementById("rec-material-name").textContent = mat.name || "Recommended Material";
    document.getElementById("rec-material-cat").textContent = `${mat.category || "Polymer"} | Thickness: ${mat.thickness || 40} μm`;

    // 2. Score Badges
    document.getElementById("rec-compat-score").textContent = data.compatibility_score || rec.compatibility_score || 90;
    document.getElementById("rec-perf-score").textContent = `${data.performance_score || rec.performance_score || 85}/100`;
    document.getElementById("rec-cost-score").textContent = `${data.cost_score || rec.cost_score || 75}/100`;
    document.getElementById("rec-sust-score").textContent = `${data.sustainability_score || rec.sustainability_score || 80}/100`;

    // 3. Operational Indicators
    document.getElementById("rec-shelf-life-range").textContent = data.shelf_life_range || rec.shelf_life_range || "N/A";
    document.getElementById("rec-map-status").textContent = rec.map_suitability || "MAP Compatible";
    document.getElementById("rec-unit-cost").textContent = `$${(mat.estimated_cost || 0.05).toFixed(3)} USD`;

    // 4. Render Radar Chart
    renderRadarChart(rec.radar_metrics || {
        "Oxygen Barrier": 85,
        "Moisture Barrier": 85,
        "Mechanical Strength": 80,
        "Thermal Tolerance": 75,
        "Circularity & Eco": 70,
        "Cost Efficiency": 80
    });

    // 5. ASTM Specifications Table
    renderSpecificationsTable(mat);

    // 6. Explainable Rationale & Trade-offs
    renderExplanations(data.explanation || rec.explanation || [], data.trade_offs || rec.trade_offs || []);

    // 7. Ranked Alternatives
    renderAlternatives(data.alternatives || []);

    // 8. Bind PDF Download & What-If buttons
    const btnPdf = document.getElementById("btn-download-pdf-dossier");
    if (btnPdf) {
        btnPdf.onclick = async () => {
            btnPdf.disabled = true;
            btnPdf.innerHTML = `<span class="spinner"></span> Generating PDF...`;
            try {
                await API.downloadPdfReport(activeAnalysisData);
            } catch (err) {
                alert(`PDF Generation failed: ${err.message}`);
            } finally {
                btnPdf.disabled = false;
                btnPdf.innerHTML = `📄 Download Technical Dossier (PDF)`;
            }
        };
    }

    const btnSimulate = document.getElementById("btn-open-in-simulator");
    if (btnSimulate) {
        btnSimulate.onclick = () => {
            if (window.loadWhatIfFromAnalysis) {
                window.loadWhatIfFromAnalysis(activeAnalysisData);
            }
            window.navigateToView("simulator");
        };
    }
}

function renderRadarChart(metrics) {
    const ctx = document.getElementById("chart-recommendation-radar");
    if (!ctx || typeof Chart === "undefined") return;

    if (recommendationRadarChart) recommendationRadarChart.destroy();

    const labels = Object.keys(metrics);
    const values = Object.values(metrics);

    recommendationRadarChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: labels,
            datasets: [{
                label: "Material Suitability Index",
                data: values,
                backgroundColor: "rgba(5, 150, 105, 0.2)",
                borderColor: "#059669",
                pointBackgroundColor: "#047857",
                pointBorderColor: "#ffffff",
                pointHoverBackgroundColor: "#ffffff",
                pointHoverBorderColor: "#047857",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: "#e2e8f0" },
                    grid: { color: "#f1f5f9" },
                    pointLabels: { font: { size: 10, family: "Inter", weight: 600 }, color: "#334155" },
                    suggestedMin: 20,
                    suggestedMax: 100,
                    ticks: { stepSize: 20, backdropColor: "transparent", color: "#94a3b8", font: { size: 9 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderSpecificationsTable(mat) {
    const tbody = document.getElementById("rec-specs-tbody");
    if (!tbody) return;

    const specs = [
        { prop: "Oxygen Transmission Rate (OTR)", val: `${mat.otr} cc/(m²·24h·atm)`, std: "ASTM D3985 (Coulometric sensor, 23°C, 0% RH)" },
        { prop: "Water Vapor Transmission Rate (WVTR)", val: `${mat.wvtr} g/(m²·24h)`, std: "ASTM F1249 (Modulated IR, 37.8°C, 90% RH)" },
        { prop: "Nominal Gauge Thickness", val: `${mat.thickness} μm (microns)`, std: "ASTM D6988 / ISO 4593" },
        { prop: "Thermal Operating Envelope", val: `${mat.temperature_min}°C to ${mat.temperature_max}°C`, std: "Differential Scanning Calorimetry (DSC)" },
        { prop: "Mechanical Puncture & Tensile", val: mat.mechanical_strength || "High Tensile", std: "ASTM D882 / ASTM F1306" },
        { prop: "Heat Seal Integrity", val: mat.sealability || "Hermetic Heat-Seal", std: "ASTM F88 Seam Strength" },
        { prop: "Circularity & Recyclability", val: mat.recyclability || "High Recyclability", std: "ISO 14021 Circular Polymers Standard" },
        { prop: "Biodegradability Status", val: mat.biodegradability || "Non-biodegradable", std: "ASTM D6400 / EN 13432 Compostability" }
    ];

    tbody.innerHTML = specs.map(s => `
        <tr>
            <td><b>${s.prop}</b></td>
            <td><span class="spec-highlight">${s.val}</span></td>
            <td><span class="text-muted small">${s.std}</span></td>
        </tr>
    `).join("");
}

function renderExplanations(explanations, tradeOffs) {
    const expContainer = document.getElementById("rec-explanations-list");
    const tradeContainer = document.getElementById("rec-tradeoffs-list");

    if (expContainer) {
        if (!explanations || explanations.length === 0) {
            expContainer.innerHTML = `<li>Balanced barrier protection aligned with target shelf-life requirements.</li>`;
        } else {
            expContainer.innerHTML = explanations.map(e => `
                <li class="explanation-item">
                    <span class="icon-check">✓</span>
                    <span>${e}</span>
                </li>
            `).join("");
        }
    }

    if (tradeContainer) {
        if (!tradeOffs || tradeOffs.length === 0) {
            tradeContainer.innerHTML = `<li>Standard packaging trade-offs within nominal manufacturing tolerances.</li>`;
        } else {
            tradeContainer.innerHTML = tradeOffs.map(t => `
                <li class="tradeoff-item">
                    <span class="icon-warn">⚠</span>
                    <span>${t}</span>
                </li>
            `).join("");
        }
    }
}

function renderAlternatives(alternatives) {
    const tbody = document.getElementById("rec-alternatives-tbody");
    if (!tbody) return;

    if (!alternatives || alternatives.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No secondary alternatives evaluated.</td></tr>`;
        return;
    }

    tbody.innerHTML = alternatives.map(alt => {
        const m = alt.material || {};
        return `
            <tr>
                <td><b>${m.name || "Alternative"}</b></td>
                <td><span class="badge badge-info">${m.category || "Polymer"}</span></td>
                <td><span class="score-pill">${alt.compatibility_score}/100</span></td>
                <td>${alt.performance_score}/100</td>
                <td>$${(m.estimated_cost || 0.05).toFixed(3)}</td>
                <td><span class="small">${alt.map_suitability || "Compatible"}</span></td>
            </tr>
        `;
    }).join("");
}
