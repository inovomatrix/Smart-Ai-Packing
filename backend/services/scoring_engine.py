"""
PackSmart AI — Multi-Objective Scoring Engine
Smart India Hackathon 2026 | PS: SIH26236

Computes objective, normalized performance, cost, and sustainability sub-scores.
"""

from typing import Dict, Any
from backend.models.commodity import CommodityBase
from backend.models.packaging import PackagingMaterial
from backend.models.analysis import StorageConditions, AdvancedRequirements

def calculate_performance_score(
    material: PackagingMaterial,
    commodity: CommodityBase,
    conditions: StorageConditions,
    advanced: AdvancedRequirements
) -> float:
    is_fresh = (
        commodity.category.lower() in ["fresh produce", "fruits & vegetables", "horticulture"]
        or commodity.respiration_rate > 10.0
    )

    # 1. Oxygen transmission fitness (0-30 points)
    if is_fresh or advanced.breathability_required:
        if "perforat" in material.name.lower() or "breath" in material.name.lower() or material.otr >= 3500.0:
            otr_score = 30.0
        elif material.otr >= 1000.0:
            otr_score = 24.0
        elif material.otr >= 200.0:
            otr_score = 14.0
        else:
            otr_score = 2.0  # Asphyxiation hazard for fresh living tissue
    else:
        if commodity.oxygen_sensitivity.lower() == "high" or commodity.fat_content > 10.0 or advanced.high_oxygen_barrier:
            if material.otr <= 0.1:
                otr_score = 30.0
            elif material.otr <= 2.0:
                otr_score = 28.0
            elif material.otr <= 20.0:
                otr_score = 20.0
            elif material.otr <= 500.0:
                otr_score = 12.0
            else:
                otr_score = 4.0
        else:
            otr_score = 25.0

    # 2. Moisture transmission fitness (0-30 points)
    if is_fresh:
        if "perforat" in material.name.lower() or material.wvtr >= 20.0:
            wvtr_score = 30.0
        elif material.wvtr >= 10.0:
            wvtr_score = 25.0
        else:
            wvtr_score = 15.0
    else:
        if commodity.moisture_sensitivity.lower() == "high" or commodity.water_activity < 0.35 or advanced.high_moisture_barrier:
            if material.wvtr <= 0.05:
                wvtr_score = 30.0
            elif material.wvtr <= 1.0:
                wvtr_score = 28.0
            elif material.wvtr <= 3.0:
                wvtr_score = 20.0
            elif material.wvtr <= 10.0:
                wvtr_score = 12.0
            else:
                wvtr_score = 4.0
        else:
            wvtr_score = 24.0

    # 3. Mechanical strength & logistics (0-20 points)
    mech_str = (material.mechanical_strength or "").lower()
    if "maximum" in mech_str or "burst" in mech_str or "extreme" in mech_str:
        mech_score = 20.0
    elif "high" in mech_str:
        mech_score = 17.0
    elif "medium" in mech_str or "moderate" in mech_str:
        mech_score = 13.0
    else:
        mech_score = 8.0

    if conditions.handling_conditions.lower() in ["rough handling", "high mechanical stress"]:
        if mech_score < 15.0:
            mech_score = max(4.0, mech_score - 6.0)

    # 4. Thermal & Sealability window (0-20 points)
    temp_margin = min(
        conditions.temperature - material.temperature_min,
        material.temperature_max - conditions.temperature
    )
    if temp_margin >= 20.0:
        therm_score = 10.0
    elif temp_margin >= 5.0:
        therm_score = 7.0
    elif temp_margin >= 0.0:
        therm_score = 4.0
    else:
        therm_score = 0.0

    seal = (material.sealability or "").lower()
    if "hermetic" in seal or "excellent" in seal:
        seal_score = 10.0
    elif "good" in seal:
        seal_score = 8.0
    else:
        seal_score = 5.0

    total_performance = otr_score + wvtr_score + mech_score + therm_score + seal_score
    return round(min(100.0, max(0.0, total_performance)), 1)


def calculate_cost_score(material: PackagingMaterial, budget: str = "Medium") -> float:
    """
    Computes a cost-efficiency score (100 = most affordable/economical).
    """
    cost = float(material.estimated_cost)
    normalized = 100.0 - ((cost - 0.03) / (0.30 - 0.03)) * 60.0
    normalized = max(20.0, min(99.0, normalized))

    if budget.lower() == "low":
        if cost > 0.15:
            normalized = max(10.0, normalized - 20.0)
    elif budget.lower() == "premium":
        normalized = min(98.0, normalized + 24.0)

    return round(normalized, 1)


def calculate_sustainability_score(material: PackagingMaterial) -> float:
    """
    Computes sustainability & circularity index.
    """
    recyc = (material.recyclability or "").lower()
    biodeg = (material.biodegradability or "").lower()
    cat = material.category.lower()

    score = 50.0

    if "100%" in biodeg or "industrially compostable" in biodeg or "home compostable" in biodeg:
        score = 95.0
    elif "biodegradable" in biodeg:
        score = 88.0

    if "paper" in cat:
        score = max(score, 88.0)
    elif "code 2" in recyc or "code 4" in recyc or "code 5" in recyc or "pe stream" in recyc:
        score = max(score, 84.0)
    elif "high" in recyc:
        score = max(score, 80.0)
    elif "moderate" in recyc:
        score = max(score, 60.0)
    elif "low" in recyc or "non-recyclable" in recyc:
        score = min(score, 45.0)

    return round(min(100.0, max(15.0, score)), 1)


def calculate_radar_metrics(
    material: PackagingMaterial,
    commodity: CommodityBase
) -> Dict[str, float]:
    """
    Generates normalized 0-100 metrics for scientific radar chart comparison.
    """
    if material.otr <= 0.1:
        otr_radar = 98.0
    elif material.otr <= 2.0:
        otr_radar = 92.0
    elif material.otr <= 50.0:
        otr_radar = 75.0
    elif material.otr <= 1000.0:
        otr_radar = 50.0
    else:
        otr_radar = 30.0

    if material.wvtr <= 0.05:
        wvtr_radar = 98.0
    elif material.wvtr <= 1.0:
        wvtr_radar = 92.0
    elif material.wvtr <= 5.0:
        wvtr_radar = 70.0
    elif material.wvtr <= 20.0:
        wvtr_radar = 45.0
    else:
        wvtr_radar = 20.0

    mech = (material.mechanical_strength or "").lower()
    if "maximum" in mech or "burst" in mech or "extreme" in mech:
        mech_radar = 98.0
    elif "high" in mech:
        mech_radar = 85.0
    elif "medium" in mech or "moderate" in mech:
        mech_radar = 65.0
    else:
        mech_radar = 45.0

    thermal_span = material.temperature_max - material.temperature_min
    thermal_radar = min(98.0, max(30.0, (thermal_span / 165.0) * 100.0))
    sust_radar = calculate_sustainability_score(material)
    cost_radar = calculate_cost_score(material, "Medium")

    return {
        "Oxygen Barrier": round(otr_radar, 1),
        "Moisture Barrier": round(wvtr_radar, 1),
        "Mechanical Strength": round(mech_radar, 1),
        "Thermal Tolerance": round(thermal_radar, 1),
        "Circularity & Eco": round(sust_radar, 1),
        "Cost Efficiency": round(cost_radar, 1)
    }
