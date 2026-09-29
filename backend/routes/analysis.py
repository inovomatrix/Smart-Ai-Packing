"""
PackSmart AI — Analysis & Simulation Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Header, Depends
from backend.models.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    WhatIfRequest,
    CostOptimizationRequest
)
from backend.models.commodity import CommodityBase
from backend.services.recommendation_engine import RecommendationEngine
from backend.services.supabase_service import SupabaseService
from backend.services.shelf_life import calculate_shelf_life
from backend.services.scoring_engine import calculate_cost_score, calculate_sustainability_score

router = APIRouter(prefix="/api", tags=["Analysis"])

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_packaging(
    request: AnalysisRequest,
    authorization: str = Header(None)
):
    """
    Main computational decision-support endpoint.
    Applies empirical food science, ASTM barrier rules, multi-objective Pareto optimization,
    and returns explainable recommendations.
    """
    try:
        # Note: If Supabase JWT token is supplied in authorization header,
        # it can be validated or passed down to SupabaseService.
        response = RecommendationEngine.analyze(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")

@router.post("/what-if")
async def what_if_simulation(request: WhatIfRequest):
    """
    Interactive sensitivity simulator: compares baseline vs simulated storage conditions.
    """
    try:
        # Resolve commodity
        commodity = request.food_properties
        if not commodity and request.commodity_id:
            commodity = SupabaseService.get_commodity_by_id(request.commodity_id)
        if not commodity and request.commodity_name:
            for c in SupabaseService.get_commodities():
                if c.name.lower() == request.commodity_name.lower():
                    commodity = c
                    break

        if not commodity:
            raise HTTPException(status_code=422, detail="Commodity data required for simulation.")

        # Run analysis 1: Baseline
        base_req = AnalysisRequest(
            food_properties=commodity,
            storage_conditions=request.base_conditions,
            requirements=request.requirements,
            advanced_requirements=request.advanced_requirements
        )
        base_res = RecommendationEngine.analyze(base_req)

        # Run analysis 2: Simulated
        sim_req = AnalysisRequest(
            food_properties=commodity,
            storage_conditions=request.simulated_conditions,
            requirements=request.requirements,
            advanced_requirements=request.advanced_requirements
        )
        sim_res = RecommendationEngine.analyze(sim_req)

        # Compute deltas
        score_delta = round(sim_res.compatibility_score - base_res.compatibility_score, 1)
        shelf_life_delta = round(sim_res.shelf_life_estimate_days - base_res.shelf_life_estimate_days, 1)
        material_changed = base_res.recommended_material.material.id != sim_res.recommended_material.material.id

        return {
            "baseline": base_res,
            "simulated": sim_res,
            "deltas": {
                "score_delta": score_delta,
                "shelf_life_delta_days": shelf_life_delta,
                "material_changed": material_changed,
                "temp_delta": round(request.simulated_conditions.temperature - request.base_conditions.temperature, 1),
                "humidity_delta": round(request.simulated_conditions.humidity - request.base_conditions.humidity, 1)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/optimize-cost")
async def optimize_packaging_cost(request: CostOptimizationRequest):
    """
    Volume economics & Pareto cost-benefit frontier analysis.
    """
    try:
        materials = SupabaseService.get_materials()
        volume = max(100, request.production_volume)
        area = max(0.01, request.package_surface_area_sqm)

        # Volume tier discounts
        if volume >= 500000:
            discount = 0.25
        elif volume >= 100000:
            discount = 0.18
        elif volume >= 25000:
            discount = 0.10
        else:
            discount = 0.0

        material_comparisons = []
        for m in materials:
            base_unit_cost = m.estimated_cost * (area / 0.1) # normalized around standard pouch
            effective_unit_cost = base_unit_cost * (1.0 - discount)
            total_batch_cost = effective_unit_cost * volume
            cost_per_thousand = effective_unit_cost * 1000.0

            material_comparisons.append({
                "material_id": m.id,
                "material_name": m.name,
                "category": m.category,
                "base_cost_per_sqm": m.estimated_cost,
                "effective_unit_cost_usd": round(effective_unit_cost, 4),
                "cost_per_1000_units_usd": round(cost_per_thousand, 2),
                "total_production_cost_usd": round(total_batch_cost, 2),
                "recyclability": m.recyclability,
                "otr": m.otr,
                "wvtr": m.wvtr
            })

        # Sort by unit cost
        material_comparisons.sort(key=lambda x: x["effective_unit_cost_usd"])

        return {
            "production_volume": volume,
            "volume_discount_percent": int(discount * 100),
            "surface_area_sqm": area,
            "materials_ranked_by_cost": material_comparisons,
            "lowest_cost_option": material_comparisons[0] if material_comparisons else None,
            "premium_barrier_option": next((m for m in material_comparisons if "foil" in m["category"].lower() or "laminate" in m["category"].lower()), None)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cost optimization failed: {str(e)}")
