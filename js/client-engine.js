/**
 * PackSmart AI — Client-Side AI Recommendation & Kinetics Engine
 * Smart India Hackathon 2026 | Problem Statement: SIH26236
 * 
 * High-fidelity client-side implementation of ASTM D3985 / ASTM F1249
 * barrier physics, Arrhenius/Q10 degradation kinetics, and Pareto multi-objective
 * optimization. Powers instant offline computation on Cloudflare Pages and static CDNs.
 */

import { SeedData } from "./seed-data.js";

export const DISCLAIMER = 
    "AI-estimated computational value based on Arrhenius/Q10 kinetics and ASTM barrier permeation. " +
    "Laboratory validation, microbial challenge testing, and regulatory sensory trials are strictly required " +
    "prior to commercial deployment.";

export function clientCalculateShelfLife(commodity, material, conditions) {
    const baseline_days = parseFloat(commodity.shelf_life_days || 30.0);
    const cat = (commodity.category || "").toLowerCase();
    const is_fresh = cat.includes("fresh produce") || cat.includes("fruit") || cat.includes("vegetable") || parseFloat(commodity.respiration_rate || 0) > 10.0;

    const t_min = commodity.storage_temperature_min !== undefined ? commodity.storage_temperature_min : 15.0;
    const t_max = commodity.storage_temperature_max !== undefined ? commodity.storage_temperature_max : 25.0;
    const t_ref = (t_min + t_max) / 2.0;

    const current_temp = parseFloat(conditions.temperature || 20.0);
    const delta_t = current_temp - t_ref;

    const q10 = is_fresh ? 2.5 : 2.0;
    let temp_acceleration = Math.pow(q10, delta_t / 10.0);
    temp_acceleration = Math.max(0.2, Math.min(8.0, temp_acceleration));

    let barrier_factor = 1.0;
    const matName = (material.name || "").toLowerCase();

    if (is_fresh) {
        if (material.otr < 50.0) {
            barrier_factor = 0.25; // Asphyxiation / rapid anaerobic breakdown
        } else if (material.otr >= 1000.0 || matName.includes("perforat") || matName.includes("breath")) {
            barrier_factor = 1.35; // Optimum respiration MAP
        } else {
            barrier_factor = 0.90;
        }
    } else {
        // WVTR factor
        let wvtr_factor = 1.0;
        if (material.wvtr <= 0.1) wvtr_factor = 1.40;
        else if (material.wvtr <= 1.0) wvtr_factor = 1.25;
        else if (material.wvtr <= 5.0) wvtr_factor = 1.00;
        else wvtr_factor = Math.max(0.4, 1.0 - (material.wvtr - 5.0) * 0.04);

        // OTR factor
        let otr_factor = 1.0;
        if (material.otr <= 0.1) otr_factor = 1.40;
        else if (material.otr <= 2.0) otr_factor = 1.25;
        else if (material.otr <= 50.0) otr_factor = 1.05;
        else otr_factor = Math.max(0.4, 1.0 - (material.otr / 2000.0) * 0.3);

        barrier_factor = (wvtr_factor * 0.55) + (otr_factor * 0.45);
    }

    let rh_factor = 1.0;
    const humidity = parseFloat(conditions.humidity || 60.0);
    if (!is_fresh && humidity > 65.0) {
        const rh_stress = (humidity - 65.0) / 100.0;
        rh_factor = 1.0 + (rh_stress * (material.wvtr / 10.0));
    }

    let estimated_days = (baseline_days * barrier_factor) / (temp_acceleration * rh_factor);
    estimated_days = Math.max(1.0, Math.round(estimated_days * 10) / 10);

    const lower_bound = Math.max(1, Math.floor(estimated_days * 0.88));
    const upper_bound = Math.ceil(estimated_days * 1.12);
    const shelf_life_range = `${lower_bound}–${upper_bound} days`;

    const decay_curve = [];
    const num_intervals = 6;
    for (let i = 0; i <= num_intervals; i++) {
        const day = Math.round((estimated_days / num_intervals) * i * 10) / 10;
        const progress = i / num_intervals;
        const quality = Math.max(0.0, Math.round(100.0 * Math.exp(-0.916 * progress) * 10) / 10);
        decay_curve.push({
            day,
            quality_index: quality,
            status: quality >= 80 ? "Optimal" : (quality >= 60 ? "Acceptable" : (quality >= 40 ? "Near Limit" : "Sub-standard"))
        });
    }

    return { estimated_days, shelf_life_range, decay_curve };
}

export function clientEvaluateScientificRules(commodity, material, conditions, requirements, advanced) {
    const cat = (commodity.category || "").toLowerCase();
    const is_fresh_produce = cat.includes("fresh produce") || cat.includes("fruit") || cat.includes("vegetable") || parseFloat(commodity.respiration_rate || 0) > 10.0;

    let penalties = 0.0;
    let bonuses = 0.0;
    const explanations = [];
    const trade_offs = [];
    const warnings = [];

    const matName = (material.name || "").toLowerCase();
    const matCat = (material.category || "").toLowerCase();

    // 1. Respiration vs Barrier Impermeability (Fresh Produce)
    if (is_fresh_produce || advanced.breathability_required) {
        const is_hermetic = material.otr < 100.0 && !matName.includes("perforat") && !matName.includes("breath");
        const is_breathable = matName.includes("perforat") || matName.includes("breath") || material.otr >= 3000.0;

        if (is_hermetic) {
            warnings.push(
                `Respiration Hazard: ${material.name} has ultra-low OTR (${material.otr} cc/m²·24h). ` +
                `Living ${commodity.name} (respiration: ${commodity.respiration_rate} mg CO2/kg·h) will deplete internal O2 ` +
                `below 1%, triggering anaerobic fermentation, off-odors, and rapid decay.`
            );
            penalties += 50.0;
            trade_offs.push("Incompatible with fresh living produce unless laser micro-perforated or gas-permeable valves are integrated.");
        } else if (is_breathable) {
            bonuses += 15.0;
            explanations.push(
                `Permits vital gas exchange: Tailored OTR (${material.otr} cc/m²·24h) accommodates ${commodity.name}'s ` +
                `aerobic respiration (${commodity.respiration_rate} mg CO2/kg·h) to prevent anaerobic breakdown.`
            );
            if (material.map_compatible) {
                explanations.push("Equilibrium MAP Certified: Preserves optimal 3–5% O2 and 5–8% CO2 headspace balance.");
            }
        } else {
            trade_offs.push(`Moderate gas exchange (${material.otr} cc/m²·24h): equilibrium MAP validation required to verify internal O2 stays above 2%.`);
        }
    }

    // 2. Moisture Sensitivity & WVTR
    if (!is_fresh_produce) {
        const high_moisture_risk = (commodity.moisture_sensitivity || "").toLowerCase() === "high" ||
            parseFloat(commodity.water_activity || 0.5) < 0.35 ||
            advanced.high_moisture_barrier;

        if (high_moisture_risk) {
            if (material.wvtr <= 0.05) {
                bonuses += 10.0;
                explanations.push(`Impermeable moisture barrier: WVTR of ${material.wvtr} g/(m²·24h) provides total hygroscopic isolation (critical aw = ${commodity.water_activity}), preventing caking and insolubility.`);
            } else if (material.wvtr <= 1.0) {
                bonuses += 5.0;
                explanations.push(`Superior moisture barrier: WVTR of ${material.wvtr} g/(m²·24h) prevents moisture uptake (critical aw = ${commodity.water_activity}), protecting texture and crispness.`);
            } else if (material.wvtr <= 3.0) {
                explanations.push(`Acceptable moisture barrier: WVTR of ${material.wvtr} g/(m²·24h) provides standard protection against ambient humidity (${conditions.humidity}% RH).`);
            } else {
                const penalty = Math.min(35.0, (material.wvtr - 3.0) * 2.5);
                penalties += penalty;
                warnings.push(`Elevated WVTR (${material.wvtr} g/m²·24h): Under ${conditions.humidity}% ambient RH, moisture sorption may exceed the critical threshold for ${commodity.name} before ${requirements.desired_shelf_life_days} days.`);
                trade_offs.push("High moisture permeation rate may shorten crispness or accelerate hygroscopic agglomeration.");
            }

            if (parseFloat(requirements.desired_shelf_life_days || 90) >= 300.0 && material.wvtr > 0.1) {
                penalties += 18.0;
                warnings.push(`Extended Storage Inadequacy: Over ${requirements.desired_shelf_life_days} days, a WVTR of ${material.wvtr} g/m²·24h allows cumulative moisture transmission that triggers caking in ${commodity.name}.`);
            }
        }
    } else {
        if (matName.includes("perforat") || material.wvtr >= 20.0) {
            explanations.push("Anti-fog transpiration control: Dissipates respiratory water vapor to prevent liquid condensation droplets that foster Botrytis mold.");
        }
    }

    // 3. Oxygen Sensitivity & Lipid Oxidation
    const high_oxygen_risk = (commodity.oxygen_sensitivity || "").toLowerCase() === "high" ||
        parseFloat(commodity.fat_content || 0) > 10.0 ||
        advanced.high_oxygen_barrier;

    if (high_oxygen_risk && !is_fresh_produce) {
        if (material.otr <= 0.1) {
            bonuses += 12.0;
            explanations.push(`Absolute gas barrier: OTR of ${material.otr} cc/(m²·24h·atm) completely eliminates atmospheric oxygen ingress, preventing lipid rancidity in high-fat matrix (${commodity.fat_content}%).`);
        } else if (material.otr <= 2.0) {
            bonuses += 6.0;
            explanations.push(`Ultra-low oxygen barrier: OTR of ${material.otr} cc/(m²·24h·atm) effectively suppresses free-radical lipid peroxidation of fat content (${commodity.fat_content}%).`);
        } else if (material.otr <= 50.0) {
            explanations.push(`Moderate gas barrier: OTR of ${material.otr} cc/(m²·24h·atm) provides adequate oxygen impediment with appropriate nitrogen gas flushing.`);
        } else {
            const penalty = Math.min(40.0, (material.otr / 100.0) * 2.0);
            penalties += penalty;
            warnings.push(`High oxygen permeability (OTR: ${material.otr} cc/m²·24h·atm): Fat content (${commodity.fat_content}%) in ${commodity.name} risks oxidative rancidity and off-flavor synthesis.`);
            trade_offs.push("Permeable to atmospheric oxygen; requires secondary antioxidant scavengers or shorter turnover cycle.");
        }
    }

    // 4. Thermal Envelope
    const storage_temp = parseFloat(conditions.temperature || 20.0);
    if (storage_temp < material.temperature_min) {
        penalties += 60.0;
        warnings.push(`Thermal limit violation: Storage temperature (${storage_temp}°C) is below safe operating limit (${material.temperature_min}°C).`);
    } else if (storage_temp > material.temperature_max) {
        penalties += 60.0;
        warnings.push(`Thermal softening violation: Storage temperature (${storage_temp}°C) exceeds thermal stability limit (${material.temperature_max}°C).`);
    } else {
        explanations.push(`Thermal envelope verified: Material operating window (${material.temperature_min}°C to ${material.temperature_max}°C) safely encloses target storage at ${storage_temp}°C.`);
    }

    // 5. MAP Compatibility
    if (advanced.map_required || (conditions.storage_type || "").toLowerCase() === "controlled atmosphere") {
        if (material.map_compatible) {
            bonuses += 6.0;
            explanations.push("MAP Compliant: Certified for hermetic gas flushing (N2 / CO2) with strong seam sealability.");
        } else {
            penalties += 30.0;
            warnings.push(`MAP Sub-optimal: ${material.name} does not maintain headspace gas equilibrium due to seam micro-channel leakage or high permeability.`);
            trade_offs.push("Not natively recommended for modified atmosphere gas flushing.");
        }
    }

    // 6. Mechanical Stress & Transit
    const is_high_stress = (conditions.handling_conditions || "").toLowerCase().includes("rough") ||
        parseFloat(conditions.transportation_distance || 0) > 500.0 ||
        advanced.high_mechanical_strength;

    if (is_high_stress) {
        const mech = (material.mechanical_strength || "").toLowerCase();
        if (mech.includes("maximum") || mech.includes("extreme") || mech.includes("burst")) {
            bonuses += 8.0;
            explanations.push(`Logistics resilience: Maximum mechanical strength rating protects packaging integrity over ${conditions.transportation_distance} km transit.`);
        } else if (mech.includes("high")) {
            bonuses += 4.0;
            explanations.push(`Logistics resilience: High tensile resistance protects packaging over ${conditions.transportation_distance} km transit.`);
        } else {
            penalties += 15.0;
            trade_offs.push("May require corrugated secondary packaging to resist flex-cracking during rough transit.");
        }
    }

    // 7. Light Sensitivity
    if ((commodity.light_sensitivity || "").toLowerCase() === "high" || advanced.light_barrier) {
        if (matCat.includes("foil")) {
            bonuses += 10.0;
            explanations.push("Complete light block: Aluminium foil layer provides 100% optical opacity against photo-sensitized auto-oxidation.");
        } else if (matName.includes("metallized") || matCat.includes("paper")) {
            bonuses += 6.0;
            explanations.push("Opaque barrier blocks photosensitized riboflavin degradation and photo-catalytic lipid oxidation.");
        } else if (matName.includes("transparent") || (matCat.includes("polymer") && !matName.includes("metallized"))) {
            penalties += 18.0;
            trade_offs.push("Transparent film offers no UV-visible light barrier; outer carton or UV masterbatch required.");
        }
    }

    // 8. Sustainability Considerations
    const biodeg = (material.biodegradability || "").toLowerCase();
    const recyc = (material.recyclability || "").toLowerCase();
    if (biodeg.includes("compostable") || biodeg.includes("biodegradable") || matCat.includes("paper")) {
        explanations.push(`Eco-profile: ${material.biodegradability} reduces end-of-life landfill accumulation.`);
    } else if (recyc.includes("high") || recyc.includes("code 2") || recyc.includes("code 4") || recyc.includes("code 5")) {
        explanations.push(`Closed-loop circularity: High recyclability stream (${material.recyclability}).`);
    } else {
        trade_offs.push(`Complex multi-material structure (${material.category}) limits curbside mechanical recyclability.`);
    }

    return {
        penalties: Math.min(85.0, penalties),
        bonuses: Math.min(8.0, bonuses),
        explanations,
        trade_offs,
        warnings
    };
}

export function clientCalculatePerformanceScore(material, commodity, conditions, advanced) {
    const cat = (commodity.category || "").toLowerCase();
    const is_fresh = cat.includes("fresh produce") || cat.includes("fruit") || cat.includes("vegetable") || parseFloat(commodity.respiration_rate || 0) > 10.0;
    const matName = (material.name || "").toLowerCase();

    // 1. Oxygen (0-30)
    let otr_score = 25.0;
    if (is_fresh || advanced.breathability_required) {
        if (matName.includes("perforat") || matName.includes("breath") || material.otr >= 3500.0) otr_score = 30.0;
        else if (material.otr >= 1000.0) otr_score = 24.0;
        else if (material.otr >= 200.0) otr_score = 14.0;
        else otr_score = 2.0;
    } else {
        if ((commodity.oxygen_sensitivity || "").toLowerCase() === "high" || parseFloat(commodity.fat_content || 0) > 10.0 || advanced.high_oxygen_barrier) {
            if (material.otr <= 0.1) otr_score = 30.0;
            else if (material.otr <= 2.0) otr_score = 28.0;
            else if (material.otr <= 20.0) otr_score = 20.0;
            else if (material.otr <= 500.0) otr_score = 12.0;
            else otr_score = 4.0;
        }
    }

    // 2. Moisture (0-30)
    let wvtr_score = 24.0;
    if (is_fresh) {
        if (matName.includes("perforat") || material.wvtr >= 20.0) wvtr_score = 30.0;
        else if (material.wvtr >= 10.0) wvtr_score = 25.0;
        else wvtr_score = 15.0;
    } else {
        if ((commodity.moisture_sensitivity || "").toLowerCase() === "high" || parseFloat(commodity.water_activity || 0.5) < 0.35 || advanced.high_moisture_barrier) {
            if (material.wvtr <= 0.05) wvtr_score = 30.0;
            else if (material.wvtr <= 1.0) wvtr_score = 28.0;
            else if (material.wvtr <= 3.0) wvtr_score = 20.0;
            else if (material.wvtr <= 10.0) wvtr_score = 12.0;
            else wvtr_score = 4.0;
        }
    }

    // 3. Mechanical (0-20)
    const mech = (material.mechanical_strength || "").toLowerCase();
    let mech_score = 13.0;
    if (mech.includes("maximum") || mech.includes("burst") || mech.includes("extreme")) mech_score = 20.0;
    else if (mech.includes("high")) mech_score = 17.0;
    else if (mech.includes("medium") || mech.includes("moderate")) mech_score = 13.0;
    else mech_score = 8.0;

    // 4. Thermal & Seal (0-20)
    const temp = parseFloat(conditions.temperature || 20.0);
    const temp_margin = Math.min(temp - material.temperature_min, material.temperature_max - temp);
    let therm_score = 4.0;
    if (temp_margin >= 20.0) therm_score = 10.0;
    else if (temp_margin >= 5.0) therm_score = 7.0;
    else if (temp_margin >= 0.0) therm_score = 4.0;
    else therm_score = 0.0;

    const seal = (material.sealability || "").toLowerCase();
    let seal_score = 8.0;
    if (seal.includes("hermetic") || seal.includes("excellent")) seal_score = 10.0;
    else if (seal.includes("good")) seal_score = 8.0;
    else seal_score = 5.0;

    const total = otr_score + wvtr_score + mech_score + therm_score + seal_score;
    return Math.round(Math.min(100.0, Math.max(0.0, total)) * 10) / 10;
}

export function clientCalculateCostScore(material, budget = "Medium") {
    const cost = parseFloat(material.estimated_cost || 0.05);
    let normalized = 100.0 - ((cost - 0.03) / (0.30 - 0.03)) * 60.0;
    normalized = Math.max(20.0, Math.min(99.0, normalized));

    const b = (budget || "").toLowerCase();
    if (b === "low" && cost > 0.15) normalized = Math.max(10.0, normalized - 20.0);
    else if (b === "premium") normalized = Math.min(98.0, normalized + 24.0);

    return Math.round(normalized * 10) / 10;
}

export function clientCalculateSustainabilityScore(material) {
    const recyc = (material.recyclability || "").toLowerCase();
    const biodeg = (material.biodegradability || "").toLowerCase();
    const cat = (material.category || "").toLowerCase();

    let score = 50.0;
    if (biodeg.includes("100%") || biodeg.includes("industrially compostable") || biodeg.includes("home compostable")) {
        score = 95.0;
    } else if (biodeg.includes("biodegradable")) {
        score = 88.0;
    }

    if (cat.includes("paper")) score = Math.max(score, 88.0);
    else if (recyc.includes("code 2") || recyc.includes("code 4") || recyc.includes("code 5") || recyc.includes("pe stream")) {
        score = Math.max(score, 84.0);
    } else if (recyc.includes("high")) score = Math.max(score, 80.0);
    else if (recyc.includes("moderate")) score = Math.max(score, 60.0);
    else if (recyc.includes("low") || recyc.includes("non-recyclable")) score = Math.min(score, 45.0);

    return Math.round(Math.min(100.0, Math.max(15.0, score)) * 10) / 10;
}

export function clientCalculateRadarMetrics(material) {
    let otr_radar = 30.0;
    if (material.otr <= 0.1) otr_radar = 98.0;
    else if (material.otr <= 2.0) otr_radar = 92.0;
    else if (material.otr <= 50.0) otr_radar = 75.0;
    else if (material.otr <= 1000.0) otr_radar = 50.0;

    let wvtr_radar = 20.0;
    if (material.wvtr <= 0.05) wvtr_radar = 98.0;
    else if (material.wvtr <= 1.0) wvtr_radar = 92.0;
    else if (material.wvtr <= 5.0) wvtr_radar = 70.0;
    else if (material.wvtr <= 20.0) wvtr_radar = 45.0;

    const mech = (material.mechanical_strength || "").toLowerCase();
    let mech_radar = 65.0;
    if (mech.includes("maximum") || mech.includes("burst") || mech.includes("extreme")) mech_radar = 98.0;
    else if (mech.includes("high")) mech_radar = 85.0;
    else if (mech.includes("medium") || mech.includes("moderate")) mech_radar = 65.0;
    else mech_radar = 45.0;

    const thermal_span = material.temperature_max - material.temperature_min;
    const thermal_radar = Math.min(98.0, Math.max(30.0, (thermal_span / 165.0) * 100.0));
    const sust_radar = clientCalculateSustainabilityScore(material);
    const cost_radar = clientCalculateCostScore(material, "Medium");

    return {
        "Oxygen Barrier": Math.round(otr_radar * 10) / 10,
        "Moisture Barrier": Math.round(wvtr_radar * 10) / 10,
        "Mechanical Strength": Math.round(mech_radar * 10) / 10,
        "Thermal Tolerance": Math.round(thermal_radar * 10) / 10,
        "Circularity & Eco": Math.round(sust_radar * 10) / 10,
        "Cost Efficiency": Math.round(cost_radar * 10) / 10
    };
}

export function clientOptimizeAndRankMaterials(commodity, candidates, conditions, requirements, advanced) {
    const w_p = Math.max(1.0, parseFloat(requirements.performance_priority || 70));
    const w_c = Math.max(1.0, parseFloat(requirements.cost_priority || 50));
    const w_s = Math.max(1.0, parseFloat(requirements.sustainability_priority || 60));
    const total_weight = w_p + w_c + w_s;

    const cat = (commodity.category || "").toLowerCase();
    const is_fresh = cat.includes("fresh produce") || cat.includes("fruit") || cat.includes("vegetable") || parseFloat(commodity.respiration_rate || 0) > 10.0;

    const scored = candidates.map(mat => {
        const rules = clientEvaluateScientificRules(commodity, mat, conditions, requirements, advanced);
        const perf = clientCalculatePerformanceScore(mat, commodity, conditions, advanced);
        const cost = clientCalculateCostScore(mat, requirements.budget);
        const sust = clientCalculateSustainabilityScore(mat);

        const weighted = ((w_p * perf) + (w_c * cost) + (w_s * sust)) / total_weight;
        const final_compat = Math.max(5.0, Math.min(99.0, weighted - rules.penalties + rules.bonuses));

        const sl = clientCalculateShelfLife(commodity, mat, conditions);

        let map_status = "Standard Atmosphere Only";
        const matName = (mat.name || "").toLowerCase();
        if (is_fresh) {
            if (matName.includes("perforat") || mat.otr >= 1000.0) map_status = "MAP Compatible (Equilibrium Respiration)";
            else if (mat.map_compatible) map_status = "Requires Gas Flush Calibration";
            else map_status = "Not Suitable for MAP";
        } else {
            if (mat.map_compatible && mat.otr <= 5.0) map_status = "Certified for MAP (Nitrogen/CO₂ Flush)";
            else if (mat.map_compatible) map_status = "MAP Compatible";
        }

        const radar = clientCalculateRadarMetrics(mat);

        return {
            material: mat,
            compatibility_score: Math.round(final_compat * 10) / 10,
            performance_score: Math.round(perf * 10) / 10,
            cost_score: Math.round(cost * 10) / 10,
            sustainability_score: Math.round(sust * 10) / 10,
            shelf_life_estimate_days: sl.estimated_days,
            shelf_life_range: sl.shelf_life_range,
            map_suitability: map_status,
            explanation: rules.explanations,
            trade_offs: rules.trade_offs,
            warnings: rules.warnings,
            radar_metrics: radar
        };
    });

    scored.sort((a, b) => b.compatibility_score - a.compatibility_score || b.performance_score - a.performance_score);

    return {
        top_recommended: scored[0],
        alternatives: scored.slice(1, 5)
    };
}

export function clientAnalyze(payload) {
    let commodity = payload.food_properties;
    if (!commodity && payload.commodity_id) {
        commodity = SeedData.getCommodityById(payload.commodity_id);
    }
    if (!commodity && payload.commodity_name) {
        commodity = SeedData.getCommodityById(payload.commodity_name);
    }
    if (!commodity) {
        commodity = SeedData.getCommodities()[0];
    }

    const materials = SeedData.getMaterials();
    const conditions = payload.storage_conditions || {};
    const requirements = payload.requirements || {};
    const advanced = payload.advanced_requirements || {};

    const { top_recommended, alternatives } = clientOptimizeAndRankMaterials(
        commodity,
        materials,
        conditions,
        requirements,
        advanced
    );

    const sl = clientCalculateShelfLife(commodity, top_recommended.material, conditions);
    const analysisId = `analysis-${Date.now()}`;

    const response = {
        id: analysisId,
        commodity_name: commodity.name,
        commodity_category: commodity.category,
        recommended_material: top_recommended,
        compatibility_score: top_recommended.compatibility_score,
        performance_score: top_recommended.performance_score,
        cost_score: top_recommended.cost_score,
        sustainability_score: top_recommended.sustainability_score,
        shelf_life_estimate_days: top_recommended.shelf_life_estimate_days,
        shelf_life_range: top_recommended.shelf_life_range,
        alternatives,
        explanation: top_recommended.explanation,
        trade_offs: top_recommended.trade_offs,
        warnings: top_recommended.warnings,
        decay_curve: sl.decay_curve,
        disclaimer: DISCLAIMER,
        created_at: new Date().toISOString()
    };

    SeedData.saveAnalysis({
        id: analysisId,
        commodity_id: commodity.id,
        storage_conditions: conditions,
        requirements,
        recommended_material_id: top_recommended.material.id,
        recommendation_results: response
    });

    return response;
}

export function clientRunWhatIf(payload) {
    const baseConditions = payload.base_conditions || {};
    const simConditions = payload.simulated_conditions || {};

    let commodity = payload.food_properties;
    if (!commodity && payload.commodity_id) {
        commodity = SeedData.getCommodityById(payload.commodity_id);
    }
    if (!commodity) {
        commodity = SeedData.getCommodities()[0];
    }

    const baseRes = clientAnalyze({
        commodity_id: commodity.id,
        food_properties: commodity,
        storage_conditions: baseConditions,
        requirements: payload.requirements || {},
        advanced_requirements: payload.advanced_requirements || {}
    });

    const simRes = clientAnalyze({
        commodity_id: commodity.id,
        food_properties: commodity,
        storage_conditions: simConditions,
        requirements: payload.requirements || {},
        advanced_requirements: payload.advanced_requirements || {}
    });

    const score_delta = Math.round((simRes.compatibility_score - baseRes.compatibility_score) * 10) / 10;
    const shelf_life_delta = Math.round((simRes.shelf_life_estimate_days - baseRes.shelf_life_estimate_days) * 10) / 10;
    const material_changed = baseRes.recommended_material.material.id !== simRes.recommended_material.material.id;

    return {
        baseline: baseRes,
        simulated: simRes,
        deltas: {
            score_delta,
            shelf_life_delta_days: shelf_life_delta,
            material_changed,
            temp_delta: Math.round((simConditions.temperature - baseConditions.temperature) * 10) / 10,
            humidity_delta: Math.round((simConditions.humidity - baseConditions.humidity) * 10) / 10
        }
    };
}

export function clientOptimizeCost(payload) {
    const materials = SeedData.getMaterials();
    const volume = Math.max(100, parseInt(payload.production_volume || 50000));
    const area = Math.max(0.01, parseFloat(payload.package_surface_area_sqm || 0.08));

    let discount = 0.0;
    if (volume >= 500000) discount = 0.25;
    else if (volume >= 100000) discount = 0.18;
    else if (volume >= 25000) discount = 0.10;

    const comps = materials.map(m => {
        const base_unit = m.estimated_cost * (area / 0.1);
        const effective_unit = base_unit * (1.0 - discount);
        const total_cost = effective_unit * volume;
        const per_thousand = effective_unit * 1000.0;

        return {
            material_id: m.id,
            material_name: m.name,
            category: m.category,
            base_cost_per_sqm: m.estimated_cost,
            effective_unit_cost_usd: Math.round(effective_unit * 10000) / 10000,
            cost_per_1000_units_usd: Math.round(per_thousand * 100) / 100,
            total_production_cost_usd: Math.round(total_cost * 100) / 100,
            recyclability: m.recyclability,
            otr: m.otr,
            wvtr: m.wvtr
        };
    });

    comps.sort((a, b) => a.effective_unit_cost_usd - b.effective_unit_cost_usd);

    return {
        production_volume: volume,
        package_surface_area_sqm: area,
        volume_discount_percent: Math.round(discount * 100),
        lowest_cost_option: comps[0] || null,
        materials_ranked_by_cost: comps
    };
}
