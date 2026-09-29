"""
PackSmart AI — Core Recommendation Engine
Smart India Hackathon 2026 | PS: SIH26236

Coordinates candidate retrieval, scientific rule evaluation, Pareto optimization,
kinetics decay curves, and transparent explainability generation.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from backend.models.commodity import CommodityBase, Commodity
from backend.models.packaging import PackagingMaterial
from backend.models.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    CandidateMaterialScore,
    StorageConditions,
    TargetRequirements,
    AdvancedRequirements
)
from backend.services.supabase_service import SupabaseService
from backend.services.optimization_engine import optimize_and_rank_materials
from backend.services.shelf_life import calculate_shelf_life, DISCLAIMER

class RecommendationEngine:
    @staticmethod
    def analyze(request: AnalysisRequest) -> AnalysisResponse:
        # 1. Resolve Commodity Information
        commodity: Optional[CommodityBase] = None
        commodity_id: Optional[str] = request.commodity_id

        if request.food_properties is not None:
            commodity = request.food_properties
        elif request.commodity_id:
            db_comm = SupabaseService.get_commodity_by_id(request.commodity_id)
            if db_comm:
                commodity = db_comm
                commodity_id = db_comm.id
        elif request.commodity_name:
            # Search by name
            for c in SupabaseService.get_commodities():
                if c.name.lower() == request.commodity_name.lower():
                    commodity = c
                    commodity_id = c.id
                    break

        if not commodity:
            raise HTTPException(
                status_code=422,
                detail="Insufficient data for reliable recommendation: Commodity profile or properties must be specified."
            )

        # 2. Retrieve Candidate Materials
        materials: List[PackagingMaterial] = SupabaseService.get_materials()
        if not materials:
            raise HTTPException(
                status_code=500,
                detail="Packaging material database is empty. Cannot perform candidate evaluation."
            )

        # 3. Optimize and Rank Candidates
        top_recommended, alternatives = optimize_and_rank_materials(
            commodity=commodity,
            candidates=materials,
            conditions=request.storage_conditions,
            requirements=request.requirements,
            advanced=request.advanced_requirements
        )

        # 4. Generate Shelf-Life Kinetics Decay Curve for the Recommended Material
        _, _, decay_curve = calculate_shelf_life(
            commodity=commodity,
            material=top_recommended.material,
            conditions=request.storage_conditions
        )

        # 5. Compile Analysis ID and Datetime
        analysis_id = str(uuid.uuid4())
        created_at_str = datetime.now(timezone.utc).isoformat()

        # 6. Formulate Overall Response
        response = AnalysisResponse(
            id=analysis_id,
            commodity_name=commodity.name,
            commodity_category=commodity.category,
            recommended_material=top_recommended,
            compatibility_score=top_recommended.compatibility_score,
            performance_score=top_recommended.performance_score,
            cost_score=top_recommended.cost_score,
            sustainability_score=top_recommended.sustainability_score,
            shelf_life_estimate_days=top_recommended.shelf_life_estimate_days,
            shelf_life_range=top_recommended.shelf_life_range,
            alternatives=alternatives,
            explanation=top_recommended.explanation,
            trade_offs=top_recommended.trade_offs,
            warnings=top_recommended.warnings,
            decay_curve=decay_curve,
            disclaimer=DISCLAIMER,
            created_at=created_at_str
        )

        # 7. Persist to Supabase / Local Storage
        try:
            SupabaseService.save_analysis(
                commodity_id=commodity_id,
                storage_conditions=request.storage_conditions.model_dump(),
                requirements=request.requirements.model_dump(),
                recommended_material_id=top_recommended.material.id,
                recommendation_results=response.model_dump(),
                user_id=request.user_id
            )
        except Exception as e:
            print(f"[RecommendationEngine] Warning saving analysis: {e}")

        return response
