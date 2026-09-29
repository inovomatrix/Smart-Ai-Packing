/**
 * PackSmart AI — 3 Hackathon Scenarios & SIH Demo Mode
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";
import { goToStep, handleCommoditySelection } from "./analysis.js";

export function initDemoScenarios() {
    // Top bar scenario buttons
    const btnMango = document.getElementById("preset-btn-mango");
    const btnChips = document.getElementById("preset-btn-chips");
    const btnMilk = document.getElementById("preset-btn-milk");
    const btnSihDemo = document.getElementById("preset-btn-sih-demo");

    if (btnMango) btnMango.addEventListener("click", () => loadScenario(1));
    if (btnChips) btnChips.addEventListener("click", () => loadScenario(2));
    if (btnMilk) btnMilk.addEventListener("click", () => loadScenario(3));
    if (btnSihDemo) btnSihDemo.addEventListener("click", launchSihJudgeDemo);
}

export async function loadScenario(scenarioId) {
    window.navigateToView("analysis");
    goToStep(1);

    const commodities = await API.fetchCommodities();
    const select = document.getElementById("analysis-commodity-select");

    if (scenarioId === 1) {
        // Scenario 1: Fresh Alphonso Mango
        const target = commodities.find(c => c.name.includes("Mango")) || commodities[0];
        if (select) {
            select.value = target.id;
            handleCommoditySelection(target.id);
        }

        // Set storage conditions
        setElementVal("input-storage-temp", 12);
        setElementText("val-storage-temp", "12 °C");
        setElementVal("input-storage-rh", 85);
        setElementText("val-storage-rh", "85 %");
        setElementVal("select-storage-type", "Refrigerated");
        setElementVal("input-transit-days", 5);
        setElementVal("input-transit-km", 800);
        setElementVal("select-handling", "Normal");

        // Requirements
        setElementVal("input-shelf-life-target", 20);
        setElementVal("slider-priority-perf", 85);
        setElementVal("slider-priority-cost", 50);
        setElementVal("slider-priority-sust", 75);

        // Advanced
        setCheckbox("chk-adv-breath", true);
        setCheckbox("chk-adv-map", true);
        setCheckbox("chk-adv-o2", false);
        setCheckbox("chk-adv-h2o", false);

        alert("🥭 Loaded Scenario 1: Fresh Mango (Climacteric fruit with active respiration requiring breathable micro-perforated MAP film). Click 'Next' or jump to Step 5 to Analyze!");
    } else if (scenarioId === 2) {
        // Scenario 2: Potato Chips
        const target = commodities.find(c => c.name.includes("Potato Chips")) || commodities[1];
        if (select) {
            select.value = target.id;
            handleCommoditySelection(target.id);
        }

        // Set storage conditions
        setElementVal("input-storage-temp", 22);
        setElementText("val-storage-temp", "22 °C");
        setElementVal("input-storage-rh", 55);
        setElementText("val-storage-rh", "55 %");
        setElementVal("select-storage-type", "Ambient");
        setElementVal("input-transit-days", 3);
        setElementVal("input-transit-km", 400);

        // Requirements
        setElementVal("input-shelf-life-target", 180);
        setElementVal("slider-priority-perf", 80);
        setElementVal("slider-priority-cost", 70);
        setElementVal("slider-priority-sust", 50);

        // Advanced
        setCheckbox("chk-adv-o2", true);
        setCheckbox("chk-adv-h2o", true);
        setCheckbox("chk-adv-light", true);
        setCheckbox("chk-adv-breath", false);
        setCheckbox("chk-adv-map", true);

        alert("🥔 Loaded Scenario 2: Fried Potato Chips (High-fat, crispness-critical commodity requiring high barrier Metallized BOPP/LDPE laminate). Jump to Step 5 to Analyze!");
    } else if (scenarioId === 3) {
        // Scenario 3: Whole Milk Powder
        const target = commodities.find(c => c.name.includes("Milk Powder")) || commodities[2];
        if (select) {
            select.value = target.id;
            handleCommoditySelection(target.id);
        }

        // Set storage conditions
        setElementVal("input-storage-temp", 20);
        setElementText("val-storage-temp", "20 °C");
        setElementVal("input-storage-rh", 60);
        setElementText("val-storage-rh", "60 %");
        setElementVal("select-storage-type", "Ambient");

        // Requirements
        setElementVal("input-shelf-life-target", 365);
        setElementVal("slider-priority-perf", 95);
        setElementVal("slider-priority-cost", 40);
        setElementVal("slider-priority-sust", 40);

        // Advanced
        setCheckbox("chk-adv-o2", true);
        setCheckbox("chk-adv-h2o", true);
        setCheckbox("chk-adv-light", true);
        setCheckbox("chk-adv-strength", true);

        alert("🥛 Loaded Scenario 3: Whole Milk Powder (Extreme hygroscopicity & lipid auto-oxidation requiring impermeable Aluminium Foil Tri-Laminate). Jump to Step 5 to Analyze!");
    }
}

let demoStepIndex = 0;
const DEMO_STEPS = [
    {
        title: "Problem Statement: SIH26236",
        desc: "Food loss in commercial supply chains is driven by poor packaging choices. Antagonistic needs (respiration vs hermetic barrier) lead to catastrophic spoilage. PackSmart AI replaces guessing with scientific barrier physics.",
        action: () => window.navigateToView("dashboard")
    },
    {
        title: "Step 1 & 2: Empirical Food Science Intake",
        desc: "PackSmart AI retrieves peer-reviewed biochemical properties (moisture, pH, fat, aw, respiration rate) from Supabase PostgreSQL.",
        action: () => {
            window.navigateToView("analysis");
            loadScenario(1);
        }
    },
    {
        title: "Step 3, 4 & 5: Thermodynamic & Logistics Rules",
        desc: "Inputs capture temperature, RH, transit distance, target shelf life, and user priorities (Performance vs Cost vs Circularity).",
        action: () => goToStep(4)
    },
    {
        title: "AI Analysis & Recommendation Dossier",
        desc: "The system runs ASTM D3985 OTR and ASTM F1249 WVTR compatibility calculations, ranks Pareto candidates, and produces explainable results with trade-offs.",
        action: async () => {
            goToStep(5);
            const btn = document.getElementById("btn-run-analysis");
            if (btn) btn.click();
        }
    },
    {
        title: "Arrhenius Shelf-Life Kinetics",
        desc: "Evaluates temperature acceleration (Q10) and models sensory quality degradation curves over time.",
        action: () => window.navigateToView("shelf-life")
    },
    {
        title: "Interactive What-If Simulation",
        desc: "Test climate shocks: drag temperature from 10°C to 25°C to see real-time shelf life and barrier trade-offs.",
        action: () => window.navigateToView("simulator")
    }
];

export function launchSihJudgeDemo() {
    demoStepIndex = 0;
    const modal = document.getElementById("modal-sih-demo-tour");
    if (!modal) return;

    modal.style.display = "flex";
    updateDemoTourContent();

    const btnNext = document.getElementById("btn-tour-next");
    const btnPrev = document.getElementById("btn-tour-prev");
    const btnClose = document.getElementById("btn-tour-close");

    if (btnNext) {
        btnNext.onclick = () => {
            if (demoStepIndex < DEMO_STEPS.length - 1) {
                demoStepIndex++;
                updateDemoTourContent();
            } else {
                modal.style.display = "none";
            }
        };
    }

    if (btnPrev) {
        btnPrev.onclick = () => {
            if (demoStepIndex > 0) {
                demoStepIndex--;
                updateDemoTourContent();
            }
        };
    }

    if (btnClose) {
        btnClose.onclick = () => {
            modal.style.display = "none";
        };
    }
}

function updateDemoTourContent() {
    const step = DEMO_STEPS[demoStepIndex];
    document.getElementById("tour-step-counter").textContent = `Step ${demoStepIndex + 1} of ${DEMO_STEPS.length}`;
    document.getElementById("tour-title").textContent = step.title;
    document.getElementById("tour-description").textContent = step.desc;

    const btnNext = document.getElementById("btn-tour-next");
    if (btnNext) {
        btnNext.textContent = demoStepIndex === DEMO_STEPS.length - 1 ? "Finish Walkthrough ✓" : "Next Step →";
    }

    if (step.action) step.action();
}

function setElementVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setCheckbox(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
}
