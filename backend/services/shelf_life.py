"""
PackSmart AI — Shelf-Life Kinetics Estimator
Smart India Hackathon 2026 | PS: SIH26236

Implements Arrhenius / Q10 temperature-dependent degradation kinetics:
SL(T, RH) = [Baseline_SL * Barrier_Factor] / [ Q10^((T - T_ref) / 10) * Humidity_Factor ]
"""

import math
from typing import Dict, List, Any, Tuple
from backend.models.commodity import CommodityBase
from backend.models.packaging import PackagingMaterial
from backend.models.analysis import StorageConditions

DISCLAIMER: str = (
    "AI-estimated computational value based on Arrhenius/Q10 kinetics and ASTM barrier permeation. "
    "Laboratory validation, microbial challenge testing, and regulatory sensory trials are strictly required "
    "prior to commercial deployment."
)

def calculate_shelf_life(
    commodity: CommodityBase,
    material: PackagingMaterial,
    conditions: StorageConditions
) -> Tuple[float, str, List[Dict[str, Any]]]:
    """
    Computes estimated shelf life days, formatted range, and quality decay curve.
    """
    baseline_days = float(commodity.shelf_life_days or 30.0)
    is_fresh = (
        commodity.category.lower() in ["fresh produce", "fruits & vegetables", "horticulture"]
        or commodity.respiration_rate > 10.0
    )

    # Reference temperatures
    t_ref = (commodity.storage_temperature_min + commodity.storage_temperature_max) / 2.0 if (
        commodity.storage_temperature_min is not None and commodity.storage_temperature_max is not None
    ) else 20.0

    delta_t = conditions.temperature - t_ref

    # Standard food Q10 coefficient (2.0 is standard for enzymatic/chemical degradation; 2.5 for fresh respiration)
    q10 = 2.5 if is_fresh else 2.0
    temp_acceleration = math.pow(q10, delta_t / 10.0)
    temp_acceleration = max(0.2, min(temp_acceleration, 8.0))

    # Barrier protection factor calculation
    barrier_factor = 1.0

    if is_fresh:
        # For fresh produce: hermetic barrier reduces shelf life due to anaerobic decay!
        # Breathable / micro-perforated film preserves shelf life optimal gas mix
        if material.otr < 50.0:
            barrier_factor = 0.25  # Anaerobic decay within 3-5 days
        elif material.otr >= 1000.0 or "perforat" in material.name.lower() or "breath" in material.name.lower():
            barrier_factor = 1.35  # Optimal equilibrium MAP extends shelf life 35%
        else:
            barrier_factor = 0.90
    else:
        # For dry / processed goods: lower OTR and lower WVTR extend shelf life
        # WVTR contribution
        if material.wvtr <= 0.1:
            wvtr_factor = 1.40
        elif material.wvtr <= 1.0:
            wvtr_factor = 1.25
        elif material.wvtr <= 5.0:
            wvtr_factor = 1.00
        else:
            wvtr_factor = max(0.4, 1.0 - (material.wvtr - 5.0) * 0.04)

        # OTR contribution
        if material.otr <= 0.1:
            otr_factor = 1.40
        elif material.otr <= 2.0:
            otr_factor = 1.25
        elif material.otr <= 50.0:
            otr_factor = 1.05
        else:
            otr_factor = max(0.4, 1.0 - (material.otr / 2000.0) * 0.3)

        barrier_factor = (wvtr_factor * 0.55) + (otr_factor * 0.45)

    # Relative humidity effect
    rh_factor = 1.0
    if not is_fresh and conditions.humidity > 65.0:
        rh_stress = (conditions.humidity - 65.0) / 100.0
        rh_factor = 1.0 + (rh_stress * (material.wvtr / 10.0))

    estimated_days = (baseline_days * barrier_factor) / (temp_acceleration * rh_factor)
    estimated_days = max(1.0, round(estimated_days, 1))

    # Calculate conservative range (+/- 12%)
    lower_bound = max(1, math.floor(estimated_days * 0.88))
    upper_bound = math.ceil(estimated_days * 1.12)
    shelf_life_range = f"{lower_bound}–{upper_bound} days"

    # Generate quality vs time kinetics decay curve
    decay_curve: List[Dict[str, Any]] = []
    num_intervals = 6
    for i in range(num_intervals + 1):
        day = round((estimated_days / num_intervals) * i, 1)
        # First-order Weibull / logistic food quality decay curve
        progress = i / num_intervals
        # Quality index starts at 100 and drops to threshold at day == estimated_days (quality = 40)
        quality = max(0.0, round(100.0 * math.exp(-0.916 * progress), 1))
        decay_curve.append({
            "day": day,
            "quality_index": quality,
            "status": "Optimal" if quality >= 80 else ("Acceptable" if quality >= 60 else ("Near Limit" if quality >= 40 else "Sub-standard"))
        })

    return estimated_days, shelf_life_range, decay_curve
