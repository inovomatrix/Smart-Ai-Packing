from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .commodity import CommodityBase
from .packaging import PackagingMaterial

class StorageConditions(BaseModel):
    temperature: float = Field(default=22.0, description="Storage temperature in °C")
    humidity: float = Field(default=60.0, description="Relative humidity in %")
    storage_type: str = Field(default="Ambient", description="Ambient, Refrigerated, Frozen, Controlled Atmosphere")
    transportation_duration: float = Field(default=2.0, description="Transportation duration in days")
    transportation_distance: float = Field(default=300.0, description="Transportation distance in km")
    handling_conditions: str = Field(default="Normal", description="Normal, Rough handling, High mechanical stress")

class TargetRequirements(BaseModel):
    desired_shelf_life_days: float = Field(default=90.0, description="Target shelf-life duration in days")
    performance_priority: float = Field(default=70.0, ge=0, le=100, description="Performance priority weighting 0-100")
    cost_priority: float = Field(default=50.0, ge=0, le=100, description="Cost priority weighting 0-100")
    sustainability_priority: float = Field(default=60.0, ge=0, le=100, description="Sustainability priority weighting 0-100")
    budget: str = Field(default="Medium", description="Budget tier: Low, Medium, Premium")

class AdvancedRequirements(BaseModel):
    high_oxygen_barrier: bool = False
    high_moisture_barrier: bool = False
    light_barrier: bool = False
    breathability_required: bool = False
    map_required: bool = False
    high_mechanical_strength: bool = False
    heat_sealability: bool = True
    flexible_packaging: bool = True
    rigid_packaging: bool = False

class AnalysisRequest(BaseModel):
    commodity_id: Optional[str] = None
    commodity_name: Optional[str] = None
    food_properties: Optional[CommodityBase] = None
    storage_conditions: StorageConditions = Field(default_factory=StorageConditions)
    requirements: TargetRequirements = Field(default_factory=TargetRequirements)
    advanced_requirements: AdvancedRequirements = Field(default_factory=AdvancedRequirements)
    user_id: Optional[str] = None

class CandidateMaterialScore(BaseModel):
    material: PackagingMaterial
    compatibility_score: float
    performance_score: float
    cost_score: float
    sustainability_score: float
    shelf_life_estimate_days: float
    shelf_life_range: str
    map_suitability: str
    explanation: List[str]
    trade_offs: List[str]
    warnings: List[str]
    radar_metrics: Dict[str, float]

class AnalysisResponse(BaseModel):
    id: str
    commodity_name: str
    commodity_category: str
    recommended_material: CandidateMaterialScore
    compatibility_score: float
    performance_score: float
    cost_score: float
    sustainability_score: float
    shelf_life_estimate_days: float
    shelf_life_range: str
    alternatives: List[CandidateMaterialScore]
    explanation: List[str]
    trade_offs: List[str]
    warnings: List[str]
    decay_curve: List[Dict[str, Any]]
    disclaimer: str
    created_at: str

class WhatIfRequest(BaseModel):
    commodity_id: Optional[str] = None
    commodity_name: Optional[str] = None
    food_properties: Optional[CommodityBase] = None
    base_conditions: StorageConditions
    simulated_conditions: StorageConditions
    requirements: TargetRequirements
    advanced_requirements: AdvancedRequirements

class CostOptimizationRequest(BaseModel):
    material_id: Optional[str] = None
    production_volume: int = Field(default=50000, description="Units to package")
    package_surface_area_sqm: float = Field(default=0.08, description="Packaging area per unit in square meters")
    desired_shelf_life_days: float = Field(default=90.0)
    performance_weight: float = Field(default=70.0)
    budget_limit_usd: Optional[float] = None
