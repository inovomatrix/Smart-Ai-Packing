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

        const cat = (m.category || "").toLowerCase();
        let ecoScore = 55;
        let streamBadge = "badge-secondary";

        if (biodeg.includes("compostable") || biodeg.includes("biodegradable") || cat.includes("paper")) {
            ecoScore = 95;
            streamBadge = "badge-success";
        } else if (recyc.includes("code 2") || recyc.includes("code 4") || recyc.includes("code 5") || recyc.includes("pe stream")) {
            ecoScore = 85;
            streamBadge = "badge-info";
        } else if (recyc.includes("high")) {
            ecoScore = 78;
            streamBadge = "badge-info";
        } else if (recyc.includes("moderate")) {
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
