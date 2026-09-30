/**
 * PackSmart AI — Shelf-Life Kinetics Estimator Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let shelfLifeDecayChart = null;

export async function initShelfLifeEstimator() {
    setupShelfLifeInputs();
    await loadShelfLifeDropdowns();
}

async function loadShelfLifeDropdowns() {
    try {
        const commodities = await API.fetchCommodities();
        const materials = await API.fetchMaterials();

        const commSelect = document.getElementById("sl-commodity-select");
        const matSelect = document.getElementById("sl-material-select");

        if (commSelect) {
            commSelect.innerHTML = commodities.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }

        if (matSelect) {
            matSelect.innerHTML = materials.map(m => `<option value="${m.id}">${m.name} (${m.category})</option>`).join("");
        }

        runShelfLifeEstimation();

        if (commSelect) commSelect.addEventListener("change", runShelfLifeEstimation);
        if (matSelect) matSelect.addEventListener("change", runShelfLifeEstimation);
    } catch (e) {
        console.warn("[ShelfLife] Dropdowns error:", e);
    }
}

function setupShelfLifeInputs() {
    const tempSlider = document.getElementById("sl-temp-slider");
    const tempDisp = document.getElementById("sl-temp-disp");
    const rhSlider = document.getElementById("sl-rh-slider");
    const rhDisp = document.getElementById("sl-rh-disp");

    if (tempSlider && tempDisp) {
        tempSlider.addEventListener("input", (e) => {
            tempDisp.textContent = `${e.target.value} °C`;
            runShelfLifeEstimation();
        });
    }

    if (rhSlider && rhDisp) {
        rhSlider.addEventListener("input", (e) => {
            rhDisp.textContent = `${e.target.value} %`;
            runShelfLifeEstimation();
        });
    }
}

export async function runShelfLifeEstimation() {
    const commId = document.getElementById("sl-commodity-select")?.value;
    const matId = document.getElementById("sl-material-select")?.value;
    const temp = parseFloat(document.getElementById("sl-temp-slider")?.value || 20);
    const rh = parseFloat(document.getElementById("sl-rh-slider")?.value || 60);

    if (!commId || !matId) return;

    try {
        const comm = await API.fetchCommodity(commId);
        const mat = await API.fetchMaterial(matId);

        // Run analysis to evaluate kinetic decay
        const res = await API.analyzePackaging({
            commodity_id: commId,
            food_properties: comm,
            storage_conditions: {
                temperature: temp,
                humidity: rh,
                storage_type: temp <= 4 ? "Refrigerated" : "Ambient",
                transportation_duration: 2.0,
                transportation_distance: 300.0,
                handling_conditions: "Normal"
            },
            requirements: {
                desired_shelf_life_days: comm.shelf_life_days || 30.0,
                performance_priority: 80.0,
                cost_priority: 50.0,
                sustainability_priority: 50.0,
                budget: "Medium"
            },
            advanced_requirements: {
                high_oxygen_barrier: false,
                high_moisture_barrier: false,
                light_barrier: false,
                breathability_required: false,
                map_required: false,
                high_mechanical_strength: false,
                heat_sealability: true,
                flexible_packaging: true,
                rigid_packaging: false
            }
        });

        document.getElementById("sl-output-days").textContent = res.shelf_life_range || "N/A";
        document.getElementById("sl-output-mat").textContent = mat.name;
        document.getElementById("sl-output-q10").textContent = `Q10 = ${comm.respiration_rate > 10 ? '2.5 (Enzymatic Respiration)' : '2.0 (Lipid/Moisture Auto-Oxidation)'}`;

        renderDecayChart(res.decay_curve || []);
    } catch (e) {
        console.warn("[ShelfLife] Calculation error:", e);
    }
}

function renderDecayChart(decayCurve) {
    const ctx = document.getElementById("chart-shelflife-decay");
    if (!ctx || typeof Chart === "undefined") return;

    if (shelfLifeDecayChart) shelfLifeDecayChart.destroy();

    const labels = decayCurve.map(pt => `Day ${pt.day}`);
    const dataPoints = decayCurve.map(pt => pt.quality_index);

    shelfLifeDecayChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Product Quality Retention Index (%)",
                    data: dataPoints,
                    borderColor: "#059669",
                    backgroundColor: "rgba(5, 150, 105, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 5,
                    pointBackgroundColor: "#047857"
                },
                {
                    label: "Critical Consumer Acceptability Threshold (40%)",
                    data: labels.map(() => 40),
                    borderColor: "#ef4444",
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 105,
                    title: { display: true, text: "Sensory & Nutritional Quality Index (%)" },
                    grid: { color: "#f1f5f9" }
                },
                x: {
                    grid: { color: "#f8fafc" }
                }
            },
            plugins: {
                legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}
