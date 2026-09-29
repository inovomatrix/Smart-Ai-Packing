/**
 * PackSmart AI — Sustainability & Circularity Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

export async function initSustainability() {
    try {
        const materials = await API.fetchMaterials();
        renderCircularityMatrix(materials);
        setupCircularitySliders();
    } catch (e) {
        console.warn("[Sustainability] Error:", e);
    }
}

function renderCircularityMatrix(materials) {
    const tbody = document.getElementById("sustainability-matrix-tbody");
    if (!tbody) return;

    tbody.innerHTML = materials.map(m => {
        const biodeg = (m.biodegradability || "").toLowerCase();
        const recyc = (m.recyclability || "").toLowerCase();

        let ecoScore = 55;
        let streamBadge = "badge-secondary";

        if ("compostable" in biodeg || "biodegradable" in biodeg || "paper" in m.category.lower()) {
            ecoScore = 95;
            streamBadge = "badge-success";
        } else if ("code 2" in recyc || "code 4" in recyc || "code 5" in recyc || "pe stream" in recyc) {
            ecoScore = 85;
            streamBadge = "badge-info";
        } else if ("high" in recyc) {
            ecoScore = 78;
            streamBadge = "badge-info";
        } else if ("moderate" in recyc) {
            ecoScore = 60;
            streamBadge = "badge-warning";
        } else {
            ecoScore = 40;
            streamBadge = "badge-danger";
        }

        return `
            <tr>
                <td><b>${m.name}</b></td>
                <td><span class="badge ${streamBadge}">${m.recyclability || "Standard"}</span></td>
                <td>${m.biodegradability || "Non-biodegradable"}</td>
                <td>${m.thickness} μm</td>
                <td>
                    <div class="progress-bar-inline">
                        <div class="progress-fill" style="width: ${ecoScore}%; background: ${ecoScore > 80 ? '#059669' : (ecoScore > 60 ? '#f59e0b' : '#ef4444')}"></div>
                    </div>
                    <b>${ecoScore}/100</b>
                </td>
            </tr>
        `;
    }).join("");
}

function setupCircularitySliders() {
    const slider = document.getElementById("sust-priority-slider");
    const valDisp = document.getElementById("sust-priority-val");
    if (slider && valDisp) {
        slider.addEventListener("input", (e) => {
            valDisp.textContent = `${e.target.value}% Circularity Weight`;
        });
    }
}
