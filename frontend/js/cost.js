/**
 * PackSmart AI — Cost Optimizer Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let costFrontierChart = null;

export async function initCostOptimizer() {
    setupCostControls();
    await runCostOptimization();
}

function setupCostControls() {
    const volSlider = document.getElementById("cost-vol-slider");
    const volDisp = document.getElementById("cost-vol-disp");
    const areaInput = document.getElementById("cost-area-input");

    if (volSlider && volDisp) {
        volSlider.addEventListener("input", (e) => {
            const formatted = parseInt(e.target.value).toLocaleString();
            volDisp.textContent = `${formatted} units`;
            runCostOptimization();
        });
    }

    if (areaInput) {
        areaInput.addEventListener("input", () => {
            runCostOptimization();
        });
    }
}

export async function runCostOptimization() {
    const vol = parseInt(document.getElementById("cost-vol-slider")?.value || 50000);
    const area = parseFloat(document.getElementById("cost-area-input")?.value || 0.08);

    try {
        const res = await API.optimizeCost({
            production_volume: vol,
            package_surface_area_sqm: area,
            desired_shelf_life_days: 90.0,
            performance_weight: 70.0
        });

        document.getElementById("cost-kpi-volume").textContent = vol.toLocaleString();
        document.getElementById("cost-kpi-discount").textContent = `${res.volume_discount_percent}% Tier Discount`;

        if (res.lowest_cost_option) {
            document.getElementById("cost-kpi-lowest-name").textContent = res.lowest_cost_option.material_name;
            document.getElementById("cost-kpi-lowest-unit").textContent = `$${res.lowest_cost_option.effective_unit_cost_usd.toFixed(4)}`;
            document.getElementById("cost-kpi-lowest-batch").textContent = `$${res.lowest_cost_option.total_production_cost_usd.toLocaleString()}`;
        }

        renderCostTable(res.materials_ranked_by_cost || []);
        renderCostFrontierChart(res.materials_ranked_by_cost || []);
    } catch (e) {
        console.warn("[Cost] Optimization error:", e);
    }
}

function renderCostTable(materials) {
    const tbody = document.getElementById("cost-matrix-tbody");
    if (!tbody) return;

    tbody.innerHTML = materials.map((m, idx) => `
        <tr class="${idx === 0 ? 'highlight-row' : ''}">
            <td><b>${m.material_name}</b></td>
            <td><span class="badge badge-info">${m.category}</span></td>
            <td><b>$${m.effective_unit_cost_usd.toFixed(4)}</b></td>
            <td>$${m.cost_per_1000_units_usd.toFixed(2)}</td>
            <td><b>$${m.total_production_cost_usd.toLocaleString()}</b></td>
            <td>${m.recyclability || "Standard"}</td>
        </tr>
    `).join("");
}

function renderCostFrontierChart(materials) {
    const ctx = document.getElementById("chart-cost-frontier");
    if (!ctx || typeof Chart === "undefined") return;

    if (costFrontierChart) costFrontierChart.destroy();

    const points = materials.map(m => ({
        x: m.cost_per_1000_units_usd,
        y: Math.min(98, Math.max(30, 100 - (Math.log10(m.otr + 0.1) * 15))),
        label: m.material_name
    }));

    costFrontierChart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Material Pareto Frontier",
                data: points,
                backgroundColor: "#0f766e",
                borderColor: "#065f46",
                pointRadius: 7,
                pointHoverRadius: 9
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
                            return `${raw.label}: $${raw.x.toFixed(2)} / 1k units (Barrier: ${Math.round(raw.y)})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: "Cost per 1,000 Units ($ USD)", font: { size: 11 } },
                    grid: { color: "#f1f5f9" }
                },
                y: {
                    title: { display: true, text: "Barrier Integrity Index (0-100)", font: { size: 11 } },
                    grid: { color: "#f1f5f9" }
                }
            }
        }
    });
}
