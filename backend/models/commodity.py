from typing import Optional
from pydantic import BaseModel, Field

class CommodityBase(BaseModel):
    name: str = Field(..., description="Name of the food commodity")
    category: str = Field(..., description="Category (Fresh Produce, Dairy, Bakery, etc.)")
    moisture: float = Field(default=10.0, description="Moisture content percentage (%)")
    ph: float = Field(default=6.0, description="Acidity / pH value")
    fat_content: float = Field(default=1.0, description="Fat content percentage (%)")
    water_activity: float = Field(default=0.6, description="Water activity (aw) from 0.0 to 1.0")
    oxygen_sensitivity: str = Field(default="Medium", description="Oxygen sensitivity: Low, Medium, High")
    moisture_sensitivity: str = Field(default="Medium", description="Moisture sensitivity: Low, Medium, High")
    light_sensitivity: str = Field(default="Low", description="Light sensitivity: Low, Medium, High")
    aroma_sensitivity: str = Field(default="Low", description="Aroma sensitivity: Low, Medium, High")
    respiration_rate: float = Field(default=0.0, description="Respiration rate in mg CO2/kg·h at reference temperature")
    storage_temperature_min: float = Field(default=15.0, description="Minimum recommended storage temperature in °C")
    storage_temperature_max: float = Field(default=25.0, description="Maximum recommended storage temperature in °C")
    shelf_life_days: float = Field(default=30.0, description="Baseline baseline shelf life in days under ambient conditions")
    packaging_considerations: Optional[str] = Field(default="", description="Scientific packaging considerations")

class CommodityCreate(CommodityBase):
    pass

class Commodity(CommodityBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
