from typing import Optional
from pydantic import BaseModel, Field

class PackagingMaterialBase(BaseModel):
    name: str = Field(..., description="Commercial/Generic material name")
    category: str = Field(..., description="Category (Polymer, Foil, Laminate, Paper, Biodegradable, etc.)")
    otr: float = Field(..., description="Oxygen Transmission Rate in cc/(m²·24h·atm) at 23°C (ASTM D3985)")
    wvtr: float = Field(..., description="Water Vapor Transmission Rate in g/(m²·24h) at 38°C, 90% RH (ASTM F1249)")
    thickness: float = Field(..., description="Nominal material thickness in microns (μm)")
    gas_permeability: Optional[str] = Field(default="Moderate", description="Gas exchange descriptor")
    mechanical_strength: Optional[str] = Field(default="Medium", description="Tensile & puncture resistance")
    sealability: Optional[str] = Field(default="Good", description="Heat sealing capability")
    temperature_min: float = Field(default=-20.0, description="Minimum safe thermal operating limit in °C")
    temperature_max: float = Field(default=80.0, description="Maximum safe thermal operating limit in °C")
    map_compatible: bool = Field(default=False, description="Suitability for Modified Atmosphere Packaging gas flush")
    recyclability: Optional[str] = Field(default="Moderate", description="Circularity / Recyclability code classification")
    biodegradability: Optional[str] = Field(default="Non-biodegradable", description="Biodegradation standard compliance")
    estimated_cost: float = Field(..., description="Estimated cost per square meter or unit packaging in USD")

class PackagingMaterialCreate(PackagingMaterialBase):
    pass

class PackagingMaterial(PackagingMaterialBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
