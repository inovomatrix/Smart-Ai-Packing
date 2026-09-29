"""
PackSmart AI — Scientific Rule Engine
Smart India Hackathon 2026 | PS: SIH26236

Implements modular, peer-reviewed food packaging compatibility rules based on:
- ASTM D3985: Standard Test Method for Oxygen Gas Transmission Rate (OTR)
- ASTM F1249: Standard Test Method for Water Vapor Transmission Rate (WVTR)
- USDA Agricultural Handbook 66 (Fresh Produce Respiration & Storage Physiology)
- Robertson (2013) Food Packaging: Principles and Practice
"""

from typing import Dict, List, Any
from backend.models.commodity import CommodityBase
from backend.models.packaging import PackagingMaterial
from backend.models.analysis import StorageConditions, TargetRequirements, AdvancedRequirements

class RuleEvaluationResult:
    def __init__(self):
        self.passed: bool = True
        self.penalties: float = 0.0
        self.bonuses: float = 0.0
        self.explanations: List[str] = []
        self.trade_offs: List[str] = []
        self.warnings: List[str] = []
        self.is_fatally_incompatible: bool = False
        self.rejection_reason: str = ""

def evaluate_scientific_rules(
    commodity: CommodityBase,
    material: PackagingMaterial,
    conditions: StorageConditions,
    requirements: TargetRequirements,
    advanced: AdvancedRequirements
) -> RuleEvaluationResult:
    result = RuleEvaluationResult()

    is_fresh_produce = (
        commodity.category.lower() in ["fresh produce", "fruits & vegetables", "horticulture"]
        or commodity.respiration_rate > 10.0
    )

    # -------------------------------------------------------------
    # RULE 1: Respiration vs. Barrier Impermeability (Fresh Produce)
    # -------------------------------------------------------------
    if is_fresh_produce or advanced.breathability_required:
        is_hermetic_barrier = (
            material.otr < 100.0 and 
            "perforat" not in material.name.lower() and 
            "breath" not in material.category.lower() and
            "breath" not in material.name.lower()
        )
        
        is_breathable = (
            "perforat" in material.name.lower() 
            or "breath" in material.name.lower() 
            or material.otr >= 3000.0
        )

        if is_hermetic_barrier:
            result.warnings.append(
                f"Respiration Hazard: {material.name} has ultra-low OTR ({material.otr} cc/m²·24h). "
                f"Living {commodity.name} (respiration: {commodity.respiration_rate} mg CO2/kg·h) will deplete internal O2 "
                f"below 1%, triggering anaerobic fermentation, ethanol off-odors, and rapid decay."
            )
            result.penalties += 50.0
            result.trade_offs.append("Incompatible with fresh living produce unless laser micro-perforated or gas-permeable valves are integrated.")
        elif is_breathable:
            result.bonuses += 15.0
            result.explanations.append(
                f"Permits vital gas exchange: Tailored OTR ({material.otr} cc/m²·24h) accommodates {commodity.name}'s "
                f"aerobic respiration ({commodity.respiration_rate} mg CO2/kg·h) to prevent anaerobic breakdown."
            )
            if material.map_compatible:
                result.explanations.append(
                    "Equilibrium MAP Certified: Preserves optimal 3–5% O2 and 5–8% CO2 headspace balance."
                )
        else:
            result.trade_offs.append(
                f"Moderate gas exchange ({material.otr} cc/m²·24h): equilibrium MAP validation required to verify internal O2 stays above 2%."
            )

    # -------------------------------------------------------------
    # RULE 2: Moisture Sensitivity & Water Vapor Transmission (WVTR)
    # -------------------------------------------------------------
    if not is_fresh_produce:
        high_moisture_risk = (
            commodity.moisture_sensitivity.lower() == "high" 
            or commodity.water_activity < 0.35 
            or advanced.high_moisture_barrier
        )

        if high_moisture_risk:
            # ASTM F1249 WVTR check
            if material.wvtr <= 0.05:
                result.bonuses += 10.0
                result.explanations.append(
                    f"Impermeable moisture barrier: WVTR of {material.wvtr} g/(m²·24h) provides total hygroscopic isolation (critical aw = {commodity.water_activity}), preventing caking and insolubility."
                )
            elif material.wvtr <= 1.0:
                result.bonuses += 5.0
                result.explanations.append(
                    f"Superior moisture barrier: WVTR of {material.wvtr} g/(m²·24h) prevents moisture uptake (critical aw = {commodity.water_activity}), protecting texture and preventing crispness loss."
                )
            elif material.wvtr <= 3.0:
                result.explanations.append(
                    f"Acceptable moisture barrier: WVTR of {material.wvtr} g/(m²·24h) provides standard protection against ambient humidity ({conditions.humidity}% RH)."
                )
            else:
                penalty = min(35.0, (material.wvtr - 3.0) * 2.5)
                result.penalties += penalty
                result.warnings.append(
                    f"Elevated WVTR ({material.wvtr} g/m²·24h): Under {conditions.humidity}% ambient RH, moisture sorption may exceed the critical threshold for {commodity.name} before {requirements.desired_shelf_life_days} days."
                )
                result.trade_offs.append("High moisture permeation rate may shorten crispness or accelerate hygroscopic agglomeration.")

            # Extended Shelf-Life (>= 300 days) dry food protection:
            if requirements.desired_shelf_life_days >= 300.0 and material.wvtr > 0.1:
                result.penalties += 18.0
                result.warnings.append(
                    f"Extended Storage Inadequacy: Over {requirements.desired_shelf_life_days} days, a WVTR of {material.wvtr} g/m²·24h allows cumulative moisture transmission that triggers caking and protein insolubility in {commodity.name}."
                )
    else:
        # Fresh produce transpires moisture; condensation control is critical
        if "perforat" in material.name.lower() or material.wvtr >= 20.0:
            result.explanations.append(
                "Anti-fog transpiration control: Dissipates respiratory water vapor to prevent liquid condensation droplets that foster Botrytis mold."
            )

    # -------------------------------------------------------------
    # RULE 3: Oxygen Sensitivity & Lipid Auto-Oxidation (OTR)
    # -------------------------------------------------------------
    high_oxygen_risk = (
        commodity.oxygen_sensitivity.lower() == "high"
        or commodity.fat_content > 10.0
        or advanced.high_oxygen_barrier
    )

    if high_oxygen_risk and not is_fresh_produce:
        if material.otr <= 0.1:
            result.bonuses += 12.0
            result.explanations.append(
                f"Absolute gas barrier: OTR of {material.otr} cc/(m²·24h·atm) completely eliminates atmospheric oxygen ingress, preventing lipid rancidity in high-fat matrix ({commodity.fat_content}%)."
            )
        elif material.otr <= 2.0:
            result.bonuses += 6.0
            result.explanations.append(
                f"Ultra-low oxygen barrier: OTR of {material.otr} cc/(m²·24h·atm) effectively suppresses free-radical lipid peroxidation of fat content ({commodity.fat_content}%)."
            )
        elif material.otr <= 50.0:
            result.explanations.append(
                f"Moderate gas barrier: OTR of {material.otr} cc/(m²·24h·atm) provides adequate oxygen impediment with appropriate nitrogen gas flushing."
            )
        else:
            penalty = min(40.0, (material.otr / 100.0) * 2.0)
            result.penalties += penalty
            result.warnings.append(
                f"High oxygen permeability (OTR: {material.otr} cc/m²·24h·atm): Fat content ({commodity.fat_content}%) in {commodity.name} risks oxidative rancidity and off-flavor synthesis."
            )
            result.trade_offs.append("Permeable to atmospheric oxygen; requires secondary antioxidant scavengers or shorter turnover cycle.")

    # -------------------------------------------------------------
    # RULE 4: Thermal Storage Envelope Compatibility
    # -------------------------------------------------------------
    storage_temp = conditions.temperature
    if storage_temp < material.temperature_min:
        result.is_fatally_incompatible = True
        result.rejection_reason = (
            f"Thermal limit violation: Storage temperature ({storage_temp}°C) is below safe operating limit ({material.temperature_min}°C). "
            f"Risk of polymer glass transition embrittlement and pinhole cracking."
        )
        result.penalties += 60.0
        result.warnings.append(result.rejection_reason)
    elif storage_temp > material.temperature_max:
        result.is_fatally_incompatible = True
        result.rejection_reason = (
            f"Thermal softening violation: Storage temperature ({storage_temp}°C) exceeds thermal stability limit ({material.temperature_max}°C)."
        )
        result.penalties += 60.0
        result.warnings.append(result.rejection_reason)
    else:
        result.explanations.append(
            f"Thermal envelope verified: Material operating window ({material.temperature_min}°C to {material.temperature_max}°C) safely encloses target storage at {storage_temp}°C."
        )

    # -------------------------------------------------------------
    # RULE 5: Modified Atmosphere Packaging (MAP) Compatibility
    # -------------------------------------------------------------
    if advanced.map_required or conditions.storage_type.lower() == "controlled atmosphere":
        if material.map_compatible:
            result.bonuses += 6.0
            result.explanations.append(
                "MAP Compliant: Certified for hermetic gas flushing (N2 / CO2) with strong seam sealability."
            )
        else:
            result.penalties += 30.0
            result.warnings.append(
                f"MAP Sub-optimal: {material.name} does not maintain headspace gas equilibrium due to seam micro-channel leakage or high polymer permeability."
            )
            result.trade_offs.append("Not natively recommended for modified atmosphere gas flushing.")

    # -------------------------------------------------------------
    # RULE 6: Mechanical Stress & Shelf-Life Duration
    # -------------------------------------------------------------
    is_long_shelf_life = requirements.desired_shelf_life_days >= 270.0
    if is_long_shelf_life and not is_fresh_produce:
        if material.thickness >= 75.0 or "foil" in material.category.lower():
            result.bonuses += 8.0
            result.explanations.append(
                f"Long-term integrity: Robust gauge ({material.thickness} μm) withstands extended storage up to {requirements.desired_shelf_life_days} days without pinholing or flex-fatigue."
            )

    is_high_stress = (
        conditions.handling_conditions.lower() in ["rough handling", "high mechanical stress"]
        or conditions.transportation_distance > 500.0
        or advanced.high_mechanical_strength
    )

    if is_high_stress:
        mech = (material.mechanical_strength or "").lower()
        if "maximum" in mech or "extreme" in mech or "burst" in mech:
            result.bonuses += 8.0
            result.explanations.append(
                f"Logistics resilience: Maximum mechanical strength rating protects packaging integrity over {conditions.transportation_distance} km transit under {conditions.handling_conditions} conditions."
            )
        elif "high" in mech:
            result.bonuses += 4.0
            result.explanations.append(
                f"Logistics resilience: High tensile resistance protects packaging over {conditions.transportation_distance} km transit."
            )
        else:
            result.penalties += 15.0
            result.trade_offs.append("May require corrugated secondary packaging to resist flex-cracking during rough transit.")

    # -------------------------------------------------------------
    # RULE 7: Light Sensitivity & Photo-Oxidation
    # -------------------------------------------------------------
    if commodity.light_sensitivity.lower() == "high" or advanced.light_barrier:
        mat_cat = material.category.lower()
        mat_name = material.name.lower()
        if "foil" in mat_cat:
            result.bonuses += 10.0
            result.explanations.append(
                "Complete light block: Aluminium foil layer provides 100% optical opacity against photo-sensitized riboflavin breakdown and auto-oxidation."
            )
        elif "metallized" in mat_name or "paper" in mat_cat:
            result.bonuses += 6.0
            result.explanations.append(
                "Opaque barrier blocks photosensitized riboflavin degradation and photo-catalytic lipid oxidation."
            )
        elif "transparent" in mat_name or ("polymer" in mat_cat and "metallized" not in mat_name):
            result.penalties += 18.0
            result.trade_offs.append("Transparent film offers no UV-visible light barrier; outer carton or UV masterbatch required.")

    # -------------------------------------------------------------
    # RULE 8: Aroma & Volatile Retention
    # -------------------------------------------------------------
    if commodity.aroma_sensitivity.lower() == "high":
        mat_name = material.name.lower()
        if "ldpe standard" in mat_name:
            result.penalties += 20.0
            result.warnings.append(
                f"Aroma loss susceptibility: Non-polar polyethylene has high scalping affinity for lipophilic terpene aroma compounds."
            )
            result.trade_offs.append("Requires barrier liner (PET/Al/EVOH) to preserve distinct varietal bouquet over prolonged storage.")
        elif "evoh" in mat_name or "foil" in mat_name or "metallized" in mat_name or "bopp" in mat_name:
            result.explanations.append(
                "Dense crystalline polymer structure restricts aroma scalping and volatile organic compound (VOC) transmission."
            )

    # -------------------------------------------------------------
    # RULE 9: Sustainability & Circularity Considerations
    # -------------------------------------------------------------
    recyc = (material.recyclability or "").lower()
    biodeg = (material.biodegradability or "").lower()
    
    if "compostable" in biodeg or "biodegradable" in biodeg or "paper" in material.category.lower():
        result.explanations.append(
            f"Eco-profile: {material.biodegradability} reduces end-of-life landfill accumulation."
        )
    elif "high" in recyc or "code 2" in recyc or "code 4" in recyc or "code 5" in recyc:
        result.explanations.append(
            f"Closed-loop circularity: High recyclability stream ({material.recyclability})."
        )
    else:
        result.trade_offs.append(
            f"Complex multi-material structure ({material.category}) limits curbside mechanical recyclability."
        )

    # -------------------------------------------------------------
    # RULE 10: Over-Packaging & Unit Economics Balance
    # -------------------------------------------------------------
    if "foil" in material.category.lower() and requirements.desired_shelf_life_days <= 180.0 and requirements.cost_priority >= 60.0:
        result.penalties += 16.0
        result.trade_offs.append("Over-packaging warning: Heavy aluminium foil laminate is economically sub-optimal for <= 180-day target shelf life compared to metallized barrier film.")

    # Cap rule penalties and bonuses
    result.penalties = min(result.penalties, 85.0)
    result.bonuses = min(result.bonuses, 8.0)
    return result
