/**
 * PackSmart AI — Database Catalog Module
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { API } from "./api.js";

let commoditiesList = [];
let materialsList = [];
let sourcesList = [];

export async function initDatabases() {
    await loadCommoditiesCatalog();
    await loadMaterialsCatalog();
    await loadSourcesCatalog();
    setupCatalogSearchAndFilters();
    setupAddForms();
}

// ---------------- COMMODITIES CATALOG ----------------
async function loadCommoditiesCatalog() {
    try {
        commoditiesList = await API.fetchCommodities();
        renderCommoditiesTable(commoditiesList);
    } catch (e) {
        console.warn("[Database] Load commodities error:", e);
    }
}

function renderCommoditiesTable(items) {
    const tbody = document.getElementById("commodities-catalog-tbody");
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No matching commodities found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(c => `
        <tr>
            <td><b>${c.name}</b></td>
            <td><span class="badge badge-info">${c.category}</span></td>
            <td>${c.moisture}%</td>
            <td>${c.water_activity}</td>
            <td>${c.fat_content}%</td>
            <td>${c.respiration_rate > 0 ? `${c.respiration_rate} mg/kg·h` : "0 (Non-respiring)"}</td>
            <td>${c.storage_temperature_min}°C to ${c.storage_temperature_max}°C</td>
            <td>
                <button class="btn btn-sm btn-outline inspect-comm-btn" data-id="${c.id}">
                    Inspect
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll(".inspect-comm-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const c = commoditiesList.find(x => x.id === id);
            if (c) openCommodityModal(c);
        });
    });
}

function openCommodityModal(c) {
    const modal = document.getElementById("modal-inspect-commodity");
    if (!modal) return;

    document.getElementById("modal-comm-name").textContent = c.name;
    document.getElementById("modal-comm-cat").textContent = c.category;
    document.getElementById("modal-comm-moisture").textContent = `${c.moisture}%`;
    document.getElementById("modal-comm-ph").textContent = c.ph;
    document.getElementById("modal-comm-fat").textContent = `${c.fat_content}%`;
    document.getElementById("modal-comm-aw").textContent = c.water_activity;
    document.getElementById("modal-comm-respiration").textContent = `${c.respiration_rate} mg CO₂/kg·h`;
    document.getElementById("modal-comm-sens").textContent = `O₂: ${c.oxygen_sensitivity} | H₂O: ${c.moisture_sensitivity} | Light: ${c.light_sensitivity} | Aroma: ${c.aroma_sensitivity}`;
    document.getElementById("modal-comm-notes").textContent = c.packaging_considerations || "Standard storage parameters.";

    modal.style.display = "flex";
}

// ---------------- MATERIALS CATALOG ----------------
async function loadMaterialsCatalog() {
    try {
        materialsList = await API.fetchMaterials();
        renderMaterialsTable(materialsList);
    } catch (e) {
        console.warn("[Database] Load materials error:", e);
    }
}

function renderMaterialsTable(items) {
    const tbody = document.getElementById("materials-catalog-tbody");
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No matching materials found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(m => `
        <tr>
            <td><b>${m.name}</b></td>
            <td><span class="badge badge-success">${m.category}</span></td>
            <td><b>${m.otr}</b> <small class="text-muted">cc/m²·24h</small></td>
            <td><b>${m.wvtr}</b> <small class="text-muted">g/m²·24h</small></td>
            <td>${m.thickness} μm</td>
            <td>${m.map_compatible ? "✓ Yes" : "✗ No"}</td>
            <td><b>$${m.estimated_cost.toFixed(3)}</b></td>
            <td>
                <button class="btn btn-sm btn-outline inspect-mat-btn" data-id="${m.id}">
                    Specs
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll(".inspect-mat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const m = materialsList.find(x => x.id === id);
            if (m) openMaterialModal(m);
        });
    });
}

function openMaterialModal(m) {
    const modal = document.getElementById("modal-inspect-material");
    if (!modal) return;

    document.getElementById("modal-mat-name").textContent = m.name;
    document.getElementById("modal-mat-cat").textContent = m.category;
    document.getElementById("modal-mat-otr").textContent = `${m.otr} cc/(m²·24h·atm)`;
    document.getElementById("modal-mat-wvtr").textContent = `${m.wvtr} g/(m²·24h)`;
    document.getElementById("modal-mat-thickness").textContent = `${m.thickness} μm`;
    document.getElementById("modal-mat-temp").textContent = `${m.temperature_min}°C to ${m.temperature_max}°C`;
    document.getElementById("modal-mat-mech").textContent = `${m.mechanical_strength || "High"} | ${m.sealability || "Good"}`;
    document.getElementById("modal-mat-recyc").textContent = `${m.recyclability || "Moderate"} | ${m.biodegradability || "Non-biodegradable"}`;
    document.getElementById("modal-mat-cost").textContent = `$${m.estimated_cost.toFixed(3)} USD / unit`;

    modal.style.display = "flex";
}

// ---------------- RESEARCH SOURCES CATALOG ----------------
async function loadSourcesCatalog() {
    try {
        sourcesList = await API.fetchSources();
        renderSourcesTable(sourcesList);
    } catch (e) {
        console.warn("[Database] Load sources error:", e);
    }
}

function renderSourcesTable(items) {
    const tbody = document.getElementById("sources-catalog-tbody");
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No sources found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(s => `
        <tr>
            <td>
                <b>${s.title}</b>
                ${s.url ? `<br/><a href="${s.url}" target="_blank" class="external-link-btn">View Publication ↗</a>` : ""}
            </td>
            <td><span class="badge badge-info">${s.source_type}</span></td>
            <td>${s.authors || "Institutional Standard"}</td>
            <td>${s.parameter || "Storage Kinetics"}</td>
            <td><code>${s.value || "Empirical"}</code></td>
            <td><span class="badge badge-success">${s.confidence || "High"}</span></td>
        </tr>
    `).join("");
}

// ---------------- SEARCH & FILTER BINDINGS ----------------
function setupCatalogSearchAndFilters() {
    // Commodity search
    const commSearch = document.getElementById("search-commodities-input");
    if (commSearch) {
        commSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = commoditiesList.filter(c => 
                c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)
            );
            renderCommoditiesTable(filtered);
        });
    }

    // Material search
    const matSearch = document.getElementById("search-materials-input");
    if (matSearch) {
        matSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = materialsList.filter(m => 
                m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query)
            );
            renderMaterialsTable(filtered);
        });
    }
}

function setupAddForms() {
    // Add Commodity Form
    const addCommForm = document.getElementById("form-add-commodity");
    if (addCommForm) {
        addCommForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById("add-comm-name").value,
                category: document.getElementById("add-comm-cat").value,
                moisture: parseFloat(document.getElementById("add-comm-moisture").value || 10),
                ph: parseFloat(document.getElementById("add-comm-ph").value || 6),
                fat_content: parseFloat(document.getElementById("add-comm-fat").value || 1),
                water_activity: parseFloat(document.getElementById("add-comm-aw").value || 0.5),
                respiration_rate: parseFloat(document.getElementById("add-comm-respiration").value || 0),
                oxygen_sensitivity: document.getElementById("add-comm-o2").value,
                moisture_sensitivity: document.getElementById("add-comm-h2o").value,
                storage_temperature_min: parseFloat(document.getElementById("add-comm-tmin").value || 10),
                storage_temperature_max: parseFloat(document.getElementById("add-comm-tmax").value || 25),
                shelf_life_days: parseFloat(document.getElementById("add-comm-sl").value || 30),
                packaging_considerations: document.getElementById("add-comm-notes").value
            };
            try {
                const created = await API.createCommodity(payload);
                alert(`Commodity '${created.name}' registered successfully!`);
                document.getElementById("modal-add-commodity").style.display = "none";
                addCommForm.reset();
                await loadCommoditiesCatalog();
            } catch (err) {
                alert(`Failed to add commodity: ${err.message}`);
            }
        });
    }

    // Add Material Form
    const addMatForm = document.getElementById("form-add-material");
    if (addMatForm) {
        addMatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById("add-mat-name").value,
                category: document.getElementById("add-mat-cat").value,
                otr: parseFloat(document.getElementById("add-mat-otr").value || 100),
                wvtr: parseFloat(document.getElementById("add-mat-wvtr").value || 5),
                thickness: parseFloat(document.getElementById("add-mat-thickness").value || 40),
                mechanical_strength: document.getElementById("add-mat-mech").value,
                sealability: document.getElementById("add-mat-seal").value,
                temperature_min: parseFloat(document.getElementById("add-mat-tmin").value || -20),
                temperature_max: parseFloat(document.getElementById("add-mat-tmax").value || 80),
                map_compatible: !!document.getElementById("add-mat-map").checked,
                recyclability: document.getElementById("add-mat-recyc").value,
                biodegradability: document.getElementById("add-mat-biodeg").value,
                estimated_cost: parseFloat(document.getElementById("add-mat-cost").value || 0.05)
            };
            try {
                const created = await API.createMaterial(payload);
                alert(`Packaging material '${created.name}' registered successfully!`);
                document.getElementById("modal-add-material").style.display = "none";
                addMatForm.reset();
                await loadMaterialsCatalog();
            } catch (err) {
                alert(`Failed to add material: ${err.message}`);
            }
        });
    }
}
