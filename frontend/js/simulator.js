/**
 * PackSmart AI — What-If Sensitivity Simulator
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let simulatorCommodity = null;
let baseConditions = {
    temperature: 20.0,
    humidity: 60.0,
    storage_type: "Ambient",
    transportation_duration: 2.0,
    transportation_distance: 300.0,
    handling_conditions: "Normal"
};

export async function initSimulator() {
    setupSimulatorControls();
    await loadSimulatorCommodityDropdown();
}

async function loadSimulatorCommodityDropdown() {
    try {
        const commodities = await API.fetchCommodities();
        const select = document.getElementById("sim-commodity-select");
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Commodity to Simulate --</option>';
        commodities.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = `${c.name} (${c.category})`;
            select.appendChild(opt);
        });

        // Default to first item
        if (commodities.length > 0) {
            select.value = commodities[0].id;
            simulatorCommodity = commodities[0];
            runSimulation();
        }

        select.addEventListener("change", (e) => {
            const found = commodities.find(x => x.id === e.target.value);
            if (found) {
                simulatorCommodity = found;
                runSimulation();
            }
        });
    } catch (e) {
        console.warn("[Simulator] Failed loading commodities:", e);
    }
}

export function loadWhatIfFromAnalysis(analysisData) {
    if (!analysisData) return;
    const commName = analysisData.commodity_name;
    const select = document.getElementById("sim-commodity-select");
    if (select) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(commName)) {
                select.selectedIndex = i;
                break;
            }
        }
    }
    runSimulation();
}

function setupSimulatorControls() {
    const sliders = [
        { id: "sim-slider-temp", display: "sim-val-temp", unit: "°C" },
        { id: "sim-slider-rh", display: "sim-val-rh", unit: "%" },
        { id: "sim-slider-shelflife", display: "sim-val-shelflife", unit: "days" },
        { id: "sim-slider-transit", display: "sim-val-transit", unit: "days" },
        { id: "sim-slider-cost-prio", display: "sim-val-cost-prio", unit: "/100" },
        { id: "sim-slider-sust-prio", display: "sim-val-sust-prio", unit: "/100" }
    ];

    sliders.forEach(s => {
        const sliderEl = document.getElementById(s.id);
        const dispEl = document.getElementById(s.display);
        if (sliderEl && dispEl) {
            sliderEl.addEventListener("input", (e) => {
                dispEl.textContent = `${e.target.value} ${s.unit}`;
                debounceSimulation();
            });
        }
    });

    const resetBtn = document.getElementById("btn-reset-simulation");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            document.getElementById("sim-slider-temp").value = 20;
            document.getElementById("sim-val-temp").textContent = "20 °C";
            document.getElementById("sim-slider-rh").value = 60;
            document.getElementById("sim-val-rh").textContent = "60 %";
            document.getElementById("sim-slider-shelflife").value = 60;
            document.getElementById("sim-val-shelflife").textContent = "60 days";
            document.getElementById("sim-slider-transit").value = 2;
            document.getElementById("sim-val-transit").textContent = "2 days";
            runSimulation();
        });
    }
}

let debounceTimer = null;
function debounceSimulation() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        runSimulation();
    }, 250);
}

export async function runSimulation() {
    if (!simulatorCommodity) return;

    const simTemp = parseFloat(document.getElementById("sim-slider-temp")?.value || 20);
    const simRh = parseFloat(document.getElementById("sim-slider-rh")?.value || 60);
    const simShelfLife = parseFloat(document.getElementById("sim-slider-shelflife")?.value || 60);
    const simTransit = parseFloat(document.getElementById("sim-slider-transit")?.value || 2);
    const simCostPrio = parseFloat(document.getElementById("sim-slider-cost-prio")?.value || 50);
    const simSustPrio = parseFloat(document.getElementById("sim-slider-sust-prio")?.value || 60);

    const simulatedConditions = {
        temperature: simTemp,
        humidity: simRh,
        storage_type: simTemp <= 4 ? "Refrigerated" : (simTemp <= -10 ? "Frozen" : "Ambient"),
        transportation_duration: simTransit,
        transportation_distance: simTransit * 150.0,
        handling_conditions: "Normal"
    };

    const requirements = {
        desired_shelf_life_days: simShelfLife,
        performance_priority: 70.0,
        cost_priority: simCostPrio,
        sustainability_priority: simSustPrio,
        budget: "Medium"
    };

    const payload = {
        commodity_id: simulatorCommodity.id,
        food_properties: simulatorCommodity,
        base_conditions: baseConditions,
        simulated_conditions: simulatedConditions,
        requirements: requirements,
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
    };

    try {
        const res = await API.runWhatIf(payload);
        renderSimulationResults(res);
    } catch (e) {
        console.warn("[Simulator] Error:", e);
    }
}

function renderSimulationResults(res) {
    const base = res.baseline || {};
    const sim = res.simulated || {};
    const deltas = res.deltas || {};

    const baseRec = base.recommended_material || {};
    const baseMat = baseRec.material || {};

    const simRec = sim.recommended_material || {};
    const simMat = simRec.material || {};

    // Baseline Cards
    document.getElementById("sim-base-material").textContent = baseMat.name || "Baseline Material";
    document.getElementById("sim-base-score").textContent = `${base.compatibility_score || 0}/100`;
    document.getElementById("sim-base-shelflife").textContent = base.shelf_life_range || "N/A";
    document.getElementById("sim-base-cost").textContent = `$${(baseMat.estimated_cost || 0.05).toFixed(3)}`;

    // Simulated Cards
    document.getElementById("sim-sim-material").textContent = simMat.name || "Simulated Material";
    document.getElementById("sim-sim-score").textContent = `${sim.compatibility_score || 0}/100`;
    document.getElementById("sim-sim-shelflife").textContent = sim.shelf_life_range || "N/A";
    document.getElementById("sim-sim-cost").textContent = `$${(simMat.estimated_cost || 0.05).toFixed(3)}`;

    // Deltas
    const deltaScoreEl = document.getElementById("sim-delta-score");
    if (deltaScoreEl) {
        const val = deltas.score_delta;
        deltaScoreEl.textContent = `${val >= 0 ? "+" : ""}${val} pts`;
        deltaScoreEl.className = val >= 0 ? "delta-pill delta-positive" : "delta-pill delta-negative";
    }

    const deltaSlEl = document.getElementById("sim-delta-shelflife");
    if (deltaSlEl) {
        const val = deltas.shelf_life_delta_days;
        deltaSlEl.textContent = `${val >= 0 ? "+" : ""}${val} days`;
        deltaSlEl.className = val >= 0 ? "delta-pill delta-positive" : "delta-pill delta-negative";
    }

    const matChangeEl = document.getElementById("sim-material-changed-badge");
    if (matChangeEl) {
        if (deltas.material_changed) {
            matChangeEl.style.display = "inline-block";
            matChangeEl.textContent = "⚡ Recommendation Shifted to Meet New Constraints";
            matChangeEl.className = "badge badge-warning";
        } else {
            matChangeEl.style.display = "inline-block";
            matChangeEl.textContent = "✓ Baseline Material Remains Optimal";
            matChangeEl.className = "badge badge-success";
        }
    }
}
