"""
PackSmart AI — Multi-Objective Optimization & Ranking Engine
Smart India Hackathon 2026 | PS: SIH26236

Ranks candidates using Pareto multi-objective weighting and penalty deduction:
S_overall = (W_p * S_perf + W_c * S_cost + W_s * S_sust) / (W_p + W_c + W_s) - Penalties
"""

from typing import List, Tuple
from backend.models.commodity import CommodityBase
from backend.models.packaging import PackagingMaterial
from backend.models.analysis import (
    StorageConditions,
    TargetRequirements,
    AdvancedRequirements,
    CandidateMaterialScore
)
from backend.rules.packaging_rules import evaluate_scientific_rules, RuleEvaluationResult
from backend.services.scoring_engine import (
    calculate_performance_score,
    calculate_cost_score,
    calculate_sustainability_score,
    calculate_radar_metrics
)
from backend.services.shelf_life import calculate_shelf_life

def optimize_and_rank_materials(
    commodity: CommodityBase,
    candidates: List[PackagingMaterial],
    conditions: StorageConditions,
    requirements: TargetRequirements,
    advanced: AdvancedRequirements
) -> Tuple[CandidateMaterialScore, List[CandidateMaterialScore]]:
    scored_candidates: List[CandidateMaterialScore] = []

    # Weights
    w_p = max(1.0, float(requirements.performance_priority))
    w_c = max(1.0, float(requirements.cost_priority))
    w_s = max(1.0, float(requirements.sustainability_priority))
    total_weight = w_p + w_c + w_s

    is_fresh = (
        commodity.category.lower() in ["fresh produce", "fruits & vegetables", "horticulture"]
        or commodity.respiration_rate > 10.0
    )

    for mat in candidates:
        # 1. Rule evaluation
        rule_res: RuleEvaluationResult = evaluate_scientific_rules(
            commodity=commodity,
            material=mat,
            conditions=conditions,
            requirements=requirements,
            advanced=advanced
        )

        # 2. Sub-score computations
        perf_score = calculate_performance_score(mat, commodity, conditions, advanced)
        cost_score = calculate_cost_score(mat, requirements.budget)
        sust_score = calculate_sustainability_score(mat)

        # 3. Multi-objective weighted score
        weighted_score = (
            (w_p * perf_score) + (w_c * cost_score) + (w_s * sust_score)
        ) / total_weight

        # Deduct rule penalties and add verified scientific bonuses
        final_compat_score = max(5.0, min(99.0, weighted_score - rule_res.penalties + getattr(rule_res, 'bonuses', 0.0)))

        # 4. Shelf-life estimation
        est_days, sl_range, _ = calculate_shelf_life(commodity, mat, conditions)

        # 5. MAP suitability descriptor
        if is_fresh:
            if "perforat" in mat.name.lower() or mat.otr >= 1000.0:
                map_status = "MAP Compatible (Equilibrium Respiration)"
            elif mat.map_compatible:
                map_status = "Requires Gas Flush Calibration"
            else:
                map_status = "Not Suitable for MAP"
        else:
            if mat.map_compatible and mat.otr <= 5.0:
                map_status = "Certified for MAP (Nitrogen/CO₂ Flush)"
            elif mat.map_compatible:
                map_status = "MAP Compatible"
            else:
                map_status = "Standard Atmosphere Only"

        # 6. Radar metrics
        radar = calculate_radar_metrics(mat, commodity)

        # 7. Assemble candidate score
        candidate_obj = CandidateMaterialScore(
            material=mat,
            compatibility_score=round(final_compat_score, 1),
            performance_score=round(perf_score, 1),
            cost_score=round(cost_score, 1),
            sustainability_score=round(sust_score, 1),
            shelf_life_estimate_days=est_days,
            shelf_life_range=sl_range,
            map_suitability=map_status,
            explanation=rule_res.explanations,
            trade_offs=rule_res.trade_offs,
            warnings=rule_res.warnings,
            radar_metrics=radar
        )
        scored_candidates.append(candidate_obj)

    # Sort descending by compatibility score, using performance score as secondary tie-breaker
    scored_candidates.sort(key=lambda c: (c.compatibility_score, c.performance_score), reverse=True)

    if not scored_candidates:
        raise ValueError("No packaging materials available for evaluation.")

    top_recommended = scored_candidates[0]
    alternatives = scored_candidates[1:5]  # Top 3-4 alternatives

    return top_recommended, alternatives
