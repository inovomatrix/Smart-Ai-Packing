/**
 * PackSmart AI — Multi-Step Analysis Wizard
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let currentStep = 1;
let loadedCommodities = [];
let selectedCommodityData = null;
let isManualPropertiesMode = false;

export async function initAnalysisWizard() {
    setupStepNavigation();
    setupPropertyModeToggle();
    await loadCommodityDropdown();
}

async function loadCommodityDropdown() {
    try {
        loadedCommodities = await API.fetchCommodities();
        const select = document.getElementById("analysis-commodity-select");
        if (!select) return;

        select.innerHTML = '<option value="">-- Select a Food Commodity --</option>';
        
        // Group by category
        const groups = {};
        loadedCommodities.forEach(c => {
            if (!groups[c.category]) groups[c.category] = [];
            groups[c.category].push(c);
        });

        for (const [cat, items] of Object.entries(groups)) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = cat;
            items.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.name;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }

        // Custom commodity option
        const customOpt = document.createElement("option");
        customOpt.value = "CUSTOM";
        customOpt.textContent = "➕ Custom / Other Commodity (Manual Entry)";
        select.appendChild(customOpt);

        select.addEventListener("change", (e) => {
            handleCommoditySelection(e.target.value);
        });
    } catch (e) {
        console.warn("[Analysis] Failed loading commodities:", e);
    }
}

export function handleCommoditySelection(commId) {
    const badge = document.getElementById("commodity-source-badge");
    const descText = document.getElementById("commodity-desc-text");

    if (commId === "CUSTOM") {
        selectedCommodityData = null;
        if (badge) {
            badge.textContent = "Data Source: User-Defined Input";
            badge.className = "badge badge-warning";
        }
        if (descText) descText.textContent = "Enter custom biological, respiratory, and storage parameters below.";
        enableManualProperties(true);
        clearPropertyInputs();
        return;
    }

    const c = loadedCommodities.find(item => item.id === commId);
    if (!c) return;

    selectedCommodityData = c;
    if (badge) {
        badge.innerHTML = `<span class="pulse-dot"></span> Data Source: Supabase Database (Verified)`;
        badge.className = "badge badge-success";
    }
    if (descText) descText.textContent = c.packaging_considerations || "Peer-reviewed baseline storage and respiration parameters.";

    // Auto-fill Step 2 property inputs
    fillPropertyInputs(c);
    enableManualProperties(false);

    // Auto-fill optimal storage conditions if Step 3 inputs are at default
    const tempInput = document.getElementById("input-storage-temp");
    if (tempInput && c.storage_temperature_min !== undefined && c.storage_temperature_max !== undefined) {
        const midTemp = Math.round((c.storage_temperature_min + c.storage_temperature_max) / 2);
        tempInput.value = midTemp;
        document.getElementById("val-storage-temp").textContent = `${midTemp} °C`;
    }
}

function fillPropertyInputs(c) {
    setInputValue("prop-moisture", c.moisture);
    setInputValue("prop-ph", c.ph);
    setInputValue("prop-fat", c.fat_content);
    setInputValue("prop-aw", c.water_activity);
    setInputValue("prop-respiration", c.respiration_rate);
    setSelectValue("prop-o2-sens", c.oxygen_sensitivity);
    setSelectValue("prop-h2o-sens", c.moisture_sensitivity);
    setSelectValue("prop-light-sens", c.light_sensitivity);
    setSelectValue("prop-aroma-sens", c.aroma_sensitivity);
}

function clearPropertyInputs() {
    setInputValue("prop-moisture", 10.0);
    setInputValue("prop-ph", 6.0);
    setInputValue("prop-fat", 2.0);
    setInputValue("prop-aw", 0.50);
    setInputValue("prop-respiration", 0.0);
    setSelectValue("prop-o2-sens", "Medium");
    setSelectValue("prop-h2o-sens", "Medium");
    setSelectValue("prop-light-sens", "Low");
    setSelectValue("prop-aroma-sens", "Low");
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : "";
}

function setSelectValue(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
}

function setupPropertyModeToggle() {
    const toggleDb = document.getElementById("btn-use-db-val");
    const toggleManual = document.getElementById("btn-enter-manual-val");

    if (toggleDb && toggleManual) {
        toggleDb.addEventListener("click", () => {
            toggleDb.classList.add("active");
            toggleManual.classList.remove("active");
            enableManualProperties(false);
            if (selectedCommodityData) fillPropertyInputs(selectedCommodityData);
        });

        toggleManual.addEventListener("click", () => {
            toggleManual.classList.add("active");
            toggleDb.classList.remove("active");
            enableManualProperties(true);
        });
    }
}

function enableManualProperties(enabled) {
    isManualPropertiesMode = enabled;
    const inputs = [
        "prop-moisture", "prop-ph", "prop-fat", "prop-aw", "prop-respiration",
        "prop-o2-sens", "prop-h2o-sens", "prop-light-sens", "prop-aroma-sens"
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = !enabled;
            if (enabled) {
                el.classList.add("editable-highlight");
            } else {
                el.classList.remove("editable-highlight");
            }
        }
    });

    const statusBadge = document.getElementById("property-mode-indicator");
    if (statusBadge) {
        statusBadge.textContent = enabled ? "Mode: Manual Parameter Override" : "Mode: Database Calibrated Values";
        statusBadge.className = enabled ? "badge badge-warning" : "badge badge-info";
    }
}

function setupStepNavigation() {
    // Next / Prev buttons
    document.querySelectorAll(".btn-step-next").forEach(btn => {
        btn.addEventListener("click", () => {
            if (validateCurrentStep(currentStep)) {
                goToStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll(".btn-step-prev").forEach(btn => {
        btn.addEventListener("click", () => {
            goToStep(currentStep - 1);
        });
    });

    // Step indicators click
    document.querySelectorAll(".wizard-step-node").forEach(node => {
        node.addEventListener("click", () => {
            const step = parseInt(node.getAttribute("data-step"));
            if (step < currentStep || validateCurrentStep(currentStep)) {
                goToStep(step);
            }
        });
    });

    // Final Analyze Button
    const analyzeBtn = document.getElementById("btn-run-analysis");
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", handleRunAnalysis);
    }
}

export function goToStep(step) {
    if (step < 1 || step > 5) return;
    currentStep = step;

    // Toggle panels
    document.querySelectorAll(".wizard-panel").forEach(p => p.classList.remove("active"));
    const activePanel = document.getElementById(`wizard-panel-${step}`);
    if (activePanel) activePanel.classList.add("active");

    // Toggle progress indicators
    document.querySelectorAll(".wizard-step-node").forEach(node => {
        const s = parseInt(node.getAttribute("data-step"));
        node.classList.remove("active", "completed");
        if (s === step) {
            node.classList.add("active");
        } else if (s < step) {
            node.classList.add("completed");
        }
    });

    // Update progress bar width
    const fill = document.getElementById("wizard-progress-fill");
    if (fill) {
        const percent = ((step - 1) / 4) * 100;
        fill.style.width = `${percent}%`;
    }
}

function validateCurrentStep(step) {
    if (step === 1) {
        const select = document.getElementById("analysis-commodity-select");
        if (!select || !select.value) {
            alert("Please select a food commodity to proceed.");
            return false;
        }
    }
    return true;
}

async function handleRunAnalysis() {
    const payload = compileAnalysisPayload();

    // Show processing animation modal
    const overlay = document.getElementById("analysis-processing-overlay");
    if (overlay) overlay.style.display = "flex";

    const steps = [
        "Analyzing commodity bio-chemical parameters...",
        "Evaluating storage and thermal envelope...",
        "Filtering incompatible packaging materials (ASTM D3985 / F1249)...",
        "Calculating barrier compatibility scores...",
        "Running multi-objective Pareto optimization...",
        "Generating explainable rationale and trade-off dossier..."
    ];

    const stepLabel = document.getElementById("processing-step-label");
    const stepBar = document.getElementById("processing-progress-bar");

    for (let i = 0; i < steps.length; i++) {
        if (stepLabel) stepLabel.textContent = steps[i];
        if (stepBar) stepBar.style.width = `${((i + 1) / steps.length) * 100}%`;
        await new Promise(r => setTimeout(r, 380));
    }

    try {
        const result = await API.analyzePackaging(payload);
        if (overlay) overlay.style.display = "none";

        // Display results
        window.displayRecommendationResults(result);
        window.navigateToView("recommendations");
    } catch (err) {
        if (overlay) overlay.style.display = "none";
        alert(`Analysis Error: ${err.message}`);
    }
}

function compileAnalysisPayload() {
    const select = document.getElementById("analysis-commodity-select");
    const commId = select ? select.value : "";
    const commName = selectedCommodityData ? selectedCommodityData.name : "Custom Commodity";

    // Food properties
    const foodProps = {
        name: commName,
        category: selectedCommodityData ? selectedCommodityData.category : "Custom",
        moisture: parseFloat(document.getElementById("prop-moisture")?.value || 10),
        ph: parseFloat(document.getElementById("prop-ph")?.value || 6),
        fat_content: parseFloat(document.getElementById("prop-fat")?.value || 2),
        water_activity: parseFloat(document.getElementById("prop-aw")?.value || 0.5),
        respiration_rate: parseFloat(document.getElementById("prop-respiration")?.value || 0),
        oxygen_sensitivity: document.getElementById("prop-o2-sens")?.value || "Medium",
        moisture_sensitivity: document.getElementById("prop-h2o-sens")?.value || "Medium",
        light_sensitivity: document.getElementById("prop-light-sens")?.value || "Low",
        aroma_sensitivity: document.getElementById("prop-aroma-sens")?.value || "Low",
        storage_temperature_min: selectedCommodityData?.storage_temperature_min || 10,
        storage_temperature_max: selectedCommodityData?.storage_temperature_max || 25,
        shelf_life_days: selectedCommodityData?.shelf_life_days || 30
    };

    // Storage conditions
    const storageConditions = {
        temperature: parseFloat(document.getElementById("input-storage-temp")?.value || 22),
        humidity: parseFloat(document.getElementById("input-storage-rh")?.value || 60),
        storage_type: document.getElementById("select-storage-type")?.value || "Ambient",
        transportation_duration: parseFloat(document.getElementById("input-transit-days")?.value || 2),
        transportation_distance: parseFloat(document.getElementById("input-transit-km")?.value || 300),
        handling_conditions: document.getElementById("select-handling")?.value || "Normal"
    };

    // Target requirements
    const requirements = {
        desired_shelf_life_days: parseFloat(document.getElementById("input-shelf-life-target")?.value || 90),
        performance_priority: parseFloat(document.getElementById("slider-priority-perf")?.value || 70),
        cost_priority: parseFloat(document.getElementById("slider-priority-cost")?.value || 50),
        sustainability_priority: parseFloat(document.getElementById("slider-priority-sust")?.value || 60),
        budget: document.getElementById("select-budget")?.value || "Medium"
    };

    // Advanced requirements
    const advanced = {
        high_oxygen_barrier: !!document.getElementById("chk-adv-o2")?.checked,
        high_moisture_barrier: !!document.getElementById("chk-adv-h2o")?.checked,
        light_barrier: !!document.getElementById("chk-adv-light")?.checked,
        breathability_required: !!document.getElementById("chk-adv-breath")?.checked,
        map_required: !!document.getElementById("chk-adv-map")?.checked,
        high_mechanical_strength: !!document.getElementById("chk-adv-strength")?.checked,
        heat_sealability: !!document.getElementById("chk-adv-seal")?.checked,
        flexible_packaging: !!document.getElementById("chk-adv-flex")?.checked,
        rigid_packaging: !!document.getElementById("chk-adv-rigid")?.checked
    };

    return {
        commodity_id: commId !== "CUSTOM" ? commId : null,
        commodity_name: commName,
        food_properties: foodProps,
        storage_conditions: storageConditions,
        requirements: requirements,
        advanced_requirements: advanced
    };
}
