"""
PackSmart AI — Supabase Data Layer & Local Fallback
Smart India Hackathon 2026 | PS: SIH26236

Handles all database operations for Supabase PostgreSQL with seamless
offline/evaluation fallback if cloud keys are unconfigured.
"""

import uuid
import json
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from backend.config import supabase, IS_SUPABASE_CONFIGURED, SUPABASE_JWT_SECRET
from backend.models.commodity import Commodity, CommodityCreate
from backend.models.packaging import PackagingMaterial, PackagingMaterialCreate
from backend.models.source import ResearchSource

# Pre-seeded validated scientific dataset (aligned with supabase_schema.sql)
SEED_COMMODITIES: List[Dict[str, Any]] = [
    {
        "id": "c1a11111-1111-1111-1111-111111111101",
        "name": "Mango (Fresh Alphonso/Kesar)",
        "category": "Fresh Produce",
        "moisture": 83.5,
        "ph": 4.5,
        "fat_content": 0.4,
        "water_activity": 0.98,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Medium",
        "aroma_sensitivity": "High",
        "respiration_rate": 45.0,
        "storage_temperature_min": 10.0,
        "storage_temperature_max": 13.0,
        "shelf_life_days": 18.0,
        "packaging_considerations": "Climacteric fruit susceptible to chilling injury below 10°C. Requires controlled gas transmission (equilibrium MAP) to avoid anaerobic fermentation and internal breakdown."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111102",
        "name": "Potato Chips (Fried)",
        "category": "Snacks & Fried Foods",
        "moisture": 1.8,
        "ph": 5.8,
        "fat_content": 34.5,
        "water_activity": 0.22,
        "oxygen_sensitivity": "High",
        "moisture_sensitivity": "High",
        "light_sensitivity": "High",
        "aroma_sensitivity": "Medium",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 180.0,
        "packaging_considerations": "Extremely vulnerable to moisture absorption (loss of crispness at aw > 0.35) and lipid photo-oxidation. Requires nitrogen flushing with metallized film or aluminium laminate (OTR < 2, WVTR < 1)."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111103",
        "name": "Whole Milk Powder (Spray Dried)",
        "category": "Dairy Products",
        "moisture": 3.2,
        "ph": 6.6,
        "fat_content": 26.5,
        "water_activity": 0.20,
        "oxygen_sensitivity": "High",
        "moisture_sensitivity": "High",
        "light_sensitivity": "High",
        "aroma_sensitivity": "High",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 24.0,
        "shelf_life_days": 365.0,
        "packaging_considerations": "Extremely hygroscopic; moisture pickup leads to lactose crystallization, insolubility, and caking. High fat content prone to oxidative rancidity; needs hermetic foil barrier."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111104",
        "name": "Apple (Fresh Royal Gala)",
        "category": "Fresh Produce",
        "moisture": 85.0,
        "ph": 3.8,
        "fat_content": 0.2,
        "water_activity": 0.98,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "Medium",
        "light_sensitivity": "Low",
        "aroma_sensitivity": "Medium",
        "respiration_rate": 20.0,
        "storage_temperature_min": 0.0,
        "storage_temperature_max": 4.0,
        "shelf_life_days": 90.0,
        "packaging_considerations": "Moderate respiration rate. Ethylene production accelerates senescence. MAP with micro-perforated film maintains 2-3% O2 and prevents moisture desiccation."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111105",
        "name": "Banana (Fresh Cavendish)",
        "category": "Fresh Produce",
        "moisture": 75.0,
        "ph": 4.8,
        "fat_content": 0.3,
        "water_activity": 0.98,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Low",
        "aroma_sensitivity": "Low",
        "respiration_rate": 60.0,
        "storage_temperature_min": 13.0,
        "storage_temperature_max": 15.0,
        "shelf_life_days": 14.0,
        "packaging_considerations": "High chilling susceptibility below 13°C. Active MAP or micro-perforated modified atmosphere liner preserves green life and delays ripening."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111106",
        "name": "Tomato (Fresh Vine-Ripe)",
        "category": "Fresh Produce",
        "moisture": 94.5,
        "ph": 4.4,
        "fat_content": 0.2,
        "water_activity": 0.99,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Medium",
        "aroma_sensitivity": "Low",
        "respiration_rate": 35.0,
        "storage_temperature_min": 10.0,
        "storage_temperature_max": 14.0,
        "shelf_life_days": 15.0,
        "packaging_considerations": "Condensation control is paramount; macro- or micro-perforated films prevent liquid water droplets that foster Botrytis cinerea fungal mold."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111107",
        "name": "Basmati Rice (Milled White)",
        "category": "Grains & Cereals",
        "moisture": 12.5,
        "ph": 6.5,
        "fat_content": 0.6,
        "water_activity": 0.60,
        "oxygen_sensitivity": "Low",
        "moisture_sensitivity": "Medium",
        "light_sensitivity": "Low",
        "aroma_sensitivity": "High",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 365.0,
        "packaging_considerations": "Aroma (2-acetyl-1-pyrroline) retention is paramount. Multi-layer woven PP/BOPP or airtight barrier bags prevent insect infestation and aroma loss."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111108",
        "name": "Crispy Biscuits / Cookies",
        "category": "Bakery & Confectionery",
        "moisture": 2.5,
        "ph": 6.8,
        "fat_content": 18.0,
        "water_activity": 0.25,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Medium",
        "aroma_sensitivity": "Medium",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 180.0,
        "packaging_considerations": "Requires high moisture barrier (BOPP/metallized film flow-wrap) to preserve crispness; light barrier prevents rancidity in vegetable shortening."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111109",
        "name": "Ground Spices (Garam Masala / Turmeric)",
        "category": "Spices & Condiments",
        "moisture": 8.0,
        "ph": 5.5,
        "fat_content": 12.0,
        "water_activity": 0.45,
        "oxygen_sensitivity": "High",
        "moisture_sensitivity": "High",
        "light_sensitivity": "High",
        "aroma_sensitivity": "High",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 365.0,
        "packaging_considerations": "Volatile essential oil loss and photo-bleaching of curcumin. Metallized PET/poly or aluminium pouches provide comprehensive gas, aroma, and light barriers."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111110",
        "name": "Fresh Meat (Poultry/Beef Cut)",
        "category": "Meat & Poultry",
        "moisture": 74.0,
        "ph": 5.6,
        "fat_content": 8.5,
        "water_activity": 0.99,
        "oxygen_sensitivity": "High",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Medium",
        "aroma_sensitivity": "Low",
        "respiration_rate": 0.0,
        "storage_temperature_min": -1.0,
        "storage_temperature_max": 4.0,
        "shelf_life_days": 7.0,
        "packaging_considerations": "Requires either high-oxygen MAP (70-80% O2 to maintain oxymyoglobin red bloom) or high-barrier vacuum skin packaging with EVOH/PA."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111111",
        "name": "Wheat Flour (Atta)",
        "category": "Grains & Cereals",
        "moisture": 13.0,
        "ph": 6.2,
        "fat_content": 1.8,
        "water_activity": 0.62,
        "oxygen_sensitivity": "Low",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Low",
        "aroma_sensitivity": "Low",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 180.0,
        "packaging_considerations": "Moisture ingress triggers mold growth and flour mite infestation. Woven polypropylene with HDPE liner or multiwall paper bags."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111112",
        "name": "Pulses & Lentils (Dry Dal)",
        "category": "Grains & Cereals",
        "moisture": 10.5,
        "ph": 6.4,
        "fat_content": 1.2,
        "water_activity": 0.50,
        "oxygen_sensitivity": "Low",
        "moisture_sensitivity": "Medium",
        "light_sensitivity": "Low",
        "aroma_sensitivity": "Low",
        "respiration_rate": 0.0,
        "storage_temperature_min": 15.0,
        "storage_temperature_max": 25.0,
        "shelf_life_days": 365.0,
        "packaging_considerations": "Requires good puncture resistance against sharp grain edges. Medium-gauge LDPE or BOPP pouches prevent weevil infestation."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111113",
        "name": "Roasted Almonds / Dry Fruits",
        "category": "Snacks & Fried Foods",
        "moisture": 3.8,
        "ph": 6.1,
        "fat_content": 50.5,
        "water_activity": 0.30,
        "oxygen_sensitivity": "High",
        "moisture_sensitivity": "High",
        "light_sensitivity": "High",
        "aroma_sensitivity": "Medium",
        "respiration_rate": 0.0,
        "storage_temperature_min": 10.0,
        "storage_temperature_max": 20.0,
        "shelf_life_days": 270.0,
        "packaging_considerations": "High mono- and poly-unsaturated fat content highly vulnerable to oxidation. Metallized barrier pouches with oxygen scavenger or nitrogen flushing."
    },
    {
        "id": "c1a11111-1111-1111-1111-111111111114",
        "name": "Fresh Strawberries",
        "category": "Fresh Produce",
        "moisture": 91.0,
        "ph": 3.4,
        "fat_content": 0.3,
        "water_activity": 0.99,
        "oxygen_sensitivity": "Medium",
        "moisture_sensitivity": "High",
        "light_sensitivity": "Medium",
        "aroma_sensitivity": "High",
        "respiration_rate": 70.0,
        "storage_temperature_min": 0.0,
        "storage_temperature_max": 2.0,
        "shelf_life_days": 7.0,
        "packaging_considerations": "High respiration rate. Rigid thermoformed ventilated clamshell with micro-perforated film lid allows humidity dissipation to prevent gray mold (Botrytis)."
    }
]

SEED_MATERIALS: List[Dict[str, Any]] = [
    {
        "id": "m1a11111-1111-1111-1111-111111111101",
        "name": "LDPE Standard Flexible Film",
        "category": "Polymer",
        "otr": 3200.0,
        "wvtr": 14.5,
        "thickness": 45.0,
        "gas_permeability": "High",
        "mechanical_strength": "Medium",
        "sealability": "Excellent",
        "temperature_min": -40.0,
        "temperature_max": 75.0,
        "map_compatible": False,
        "recyclability": "High (Code 4 LDPE)",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.038
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111102",
        "name": "HDPE High-Density Film",
        "category": "Polymer",
        "otr": 1450.0,
        "wvtr": 4.8,
        "thickness": 35.0,
        "gas_permeability": "Moderate",
        "mechanical_strength": "High Tensile",
        "sealability": "Good",
        "temperature_min": -50.0,
        "temperature_max": 105.0,
        "map_compatible": False,
        "recyclability": "High (Code 2 HDPE)",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.045
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111103",
        "name": "BOPP Crisp Transparent Film",
        "category": "Polymer",
        "otr": 1350.0,
        "wvtr": 5.2,
        "thickness": 30.0,
        "gas_permeability": "Moderate",
        "mechanical_strength": "High Clarity & Stiffness",
        "sealability": "Good",
        "temperature_min": -20.0,
        "temperature_max": 120.0,
        "map_compatible": False,
        "recyclability": "High (Code 5 PP)",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.048
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111104",
        "name": "Metallized BOPP / LDPE Laminate",
        "category": "Laminate",
        "otr": 1.8,
        "wvtr": 0.85,
        "thickness": 55.0,
        "gas_permeability": "Ultra-Low",
        "mechanical_strength": "High Puncture Resistance",
        "sealability": "Excellent",
        "temperature_min": -15.0,
        "temperature_max": 90.0,
        "map_compatible": True,
        "recyclability": "Moderate",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.115
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111105",
        "name": "Aluminium Foil Tri-Laminate (PET/Al/PE)",
        "category": "Foil",
        "otr": 0.05,
        "wvtr": 0.02,
        "thickness": 85.0,
        "gas_permeability": "Impermeable",
        "mechanical_strength": "Maximum Burst Strength",
        "sealability": "Hermetic Heat-Seal",
        "temperature_min": -40.0,
        "temperature_max": 125.0,
        "map_compatible": True,
        "recyclability": "Low",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.265
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111106",
        "name": "Micro-Perforated Breathable Polyolefin",
        "category": "Micro-perforated",
        "otr": 4800.0,
        "wvtr": 32.0,
        "thickness": 30.0,
        "gas_permeability": "Tailored Gas Exchange",
        "mechanical_strength": "High Tear Resistance",
        "sealability": "Good",
        "temperature_min": 2.0,
        "temperature_max": 45.0,
        "map_compatible": True,
        "recyclability": "High",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.082
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111107",
        "name": "Bio-Based Compostable Film (PLA / PBAT)",
        "category": "Biodegradable",
        "otr": 420.0,
        "wvtr": 110.0,
        "thickness": 35.0,
        "gas_permeability": "Moderate Breathability",
        "mechanical_strength": "Moderate Tensile",
        "sealability": "Good",
        "temperature_min": 0.0,
        "temperature_max": 50.0,
        "map_compatible": False,
        "recyclability": "Compostable",
        "biodegradability": "100% Industrially Compostable",
        "estimated_cost": 0.185
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111108",
        "name": "EVOH Coextruded High-Barrier Film (PE/EVOH/PE)",
        "category": "Laminate",
        "otr": 0.8,
        "wvtr": 2.2,
        "thickness": 65.0,
        "gas_permeability": "Very Low",
        "mechanical_strength": "High Toughness",
        "sealability": "Excellent",
        "temperature_min": -30.0,
        "temperature_max": 95.0,
        "map_compatible": True,
        "recyclability": "High (PE stream)",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.175
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111109",
        "name": "High-Barrier Paper/Dispersion Pouch",
        "category": "Paper",
        "otr": 4.5,
        "wvtr": 2.8,
        "thickness": 75.0,
        "gas_permeability": "Low Gas Permeation",
        "mechanical_strength": "High Stiffness",
        "sealability": "Good",
        "temperature_min": -10.0,
        "temperature_max": 80.0,
        "map_compatible": True,
        "recyclability": "Very High (>85% Paper)",
        "biodegradability": "Biodegradable Core",
        "estimated_cost": 0.198
    },
    {
        "id": "m1a11111-1111-1111-1111-111111111110",
        "name": "Vacuum Barrier Skin Thermoform Film (PA/PE)",
        "category": "Flexible",
        "otr": 18.0,
        "wvtr": 2.6,
        "thickness": 90.0,
        "gas_permeability": "Low",
        "mechanical_strength": "Extreme Puncture Resistance",
        "sealability": "Hermetic Vacuum",
        "temperature_min": -35.0,
        "temperature_max": 100.0,
        "map_compatible": True,
        "recyclability": "Low",
        "biodegradability": "Non-biodegradable",
        "estimated_cost": 0.220
    }
]

SEED_SOURCES: List[Dict[str, Any]] = [
    {
        "id": "s1a11111-1111-1111-1111-111111111101",
        "title": "The Commercial Storage of Fruits, Vegetables, and Florist and Nursery Stocks (Handbook 66)",
        "source_type": "Government Source",
        "authors": "Gross, K. C., Wang, C. Y., & Saltveit, M.",
        "publication_year": 2016,
        "url": "https://www.ars.usda.gov/is/np/commercialstorage/commercialstorage.pdf",
        "parameter": "Optimum Storage Temperature & Respiration Rates",
        "value": "Mango: 10-13°C, 85-90% RH, Respiration 40-50 mg CO2/kg-h",
        "confidence": "High"
    },
    {
        "id": "s1a11111-1111-1111-1111-111111111102",
        "title": "Food Packaging: Principles and Practice, 3rd Edition",
        "source_type": "Standard",
        "authors": "Robertson, Gordon L.",
        "publication_year": 2013,
        "url": "https://doi.org/10.1201/b13038",
        "parameter": "Water Activity Critical Thresholds",
        "value": "Critical aw: Potato chips 0.35; Whole milk powder 0.25",
        "confidence": "High"
    },
    {
        "id": "s1a11111-1111-1111-1111-111111111103",
        "title": "Standard Test Method for Oxygen Gas Transmission Rate (ASTM D3985)",
        "source_type": "Standard",
        "authors": "ASTM Committee D20",
        "publication_year": 2017,
        "url": "https://www.astm.org/d3985-17.html",
        "parameter": "OTR Testing Methodology",
        "value": "Coulometric sensor at 23°C, 0% RH, cc/(m²·24h·atm)",
        "confidence": "High"
    },
    {
        "id": "s1a11111-1111-1111-1111-111111111104",
        "title": "Standard Test Method for Water Vapor Transmission Rate (ASTM F1249)",
        "source_type": "Standard",
        "authors": "ASTM Committee F02",
        "publication_year": 2020,
        "url": "https://www.astm.org/f1249-20.html",
        "parameter": "WVTR Testing Methodology",
        "value": "Modulated infrared sensor at 37.8°C, 90% RH, g/(m²·24h)",
        "confidence": "High"
    }
]

# Local in-memory caches
_local_commodities: List[Commodity] = [Commodity(**c) for c in SEED_COMMODITIES]
_local_materials: List[PackagingMaterial] = [PackagingMaterial(**m) for m in SEED_MATERIALS]
_local_sources: List[ResearchSource] = [ResearchSource(**s) for s in SEED_SOURCES]
_local_analyses: List[Dict[str, Any]] = []

class SupabaseService:
    @staticmethod
    def get_commodities() -> List[Commodity]:
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                res = supabase.table("commodities").select("*").execute()
                if res.data and len(res.data) > 0:
                    return [Commodity(**item) for item in res.data]
            except Exception as e:
                print(f"[SupabaseService] Query commodities error: {e}. Using local cache.")
        return _local_commodities

    @staticmethod
    def get_commodity_by_id(comm_id: str) -> Optional[Commodity]:
        commodities = SupabaseService.get_commodities()
        for c in commodities:
            if c.id == comm_id or c.name.lower() == comm_id.lower():
                return c
        return None

    @staticmethod
    def create_commodity(data: CommodityCreate) -> Commodity:
        new_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        commodity_dict = data.model_dump()
        commodity_dict["id"] = new_id
        commodity_dict["created_at"] = created_at

        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                supabase.table("commodities").insert(commodity_dict).execute()
            except Exception as e:
                print(f"[SupabaseService] Insert commodity error: {e}. Fallback to local store.")

        new_obj = Commodity(**commodity_dict)
        _local_commodities.append(new_obj)
        return new_obj

    @staticmethod
    def get_materials() -> List[PackagingMaterial]:
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                res = supabase.table("packaging_materials").select("*").execute()
                if res.data and len(res.data) > 0:
                    return [PackagingMaterial(**item) for item in res.data]
            except Exception as e:
                print(f"[SupabaseService] Query materials error: {e}. Using local cache.")
        return _local_materials

    @staticmethod
    def get_material_by_id(mat_id: str) -> Optional[PackagingMaterial]:
        materials = SupabaseService.get_materials()
        for m in materials:
            if m.id == mat_id or m.name.lower() == mat_id.lower():
                return m
        return None

    @staticmethod
    def create_material(data: PackagingMaterialCreate) -> PackagingMaterial:
        new_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        mat_dict = data.model_dump()
        mat_dict["id"] = new_id
        mat_dict["created_at"] = created_at

        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                supabase.table("packaging_materials").insert(mat_dict).execute()
            except Exception as e:
                print(f"[SupabaseService] Insert material error: {e}. Fallback to local store.")

        new_obj = PackagingMaterial(**mat_dict)
        _local_materials.append(new_obj)
        return new_obj

    @staticmethod
    def get_sources() -> List[ResearchSource]:
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                res = supabase.table("sources").select("*").execute()
                if res.data and len(res.data) > 0:
                    return [ResearchSource(**item) for item in res.data]
            except Exception as e:
                print(f"[SupabaseService] Query sources error: {e}.")
        return _local_sources

    @staticmethod
    def save_analysis(
        commodity_id: Optional[str],
        storage_conditions: Dict[str, Any],
        requirements: Dict[str, Any],
        recommended_material_id: Optional[str],
        recommendation_results: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        analysis_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        record = {
            "id": analysis_id,
            "user_id": user_id,
            "commodity_id": commodity_id,
            "storage_conditions": storage_conditions,
            "requirements": requirements,
            "recommended_material_id": recommended_material_id,
            "recommendation_results": recommendation_results,
            "created_at": created_at
        }

        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                supabase.table("analyses").insert(record).execute()
            except Exception as e:
                print(f"[SupabaseService] Persist analysis error: {e}. Fallback to memory.")

        _local_analyses.insert(0, record)
        return record

    @staticmethod
    def get_analyses(limit: int = 25) -> List[Dict[str, Any]]:
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                res = supabase.table("analyses").select("*").order("created_at", desc=True).limit(limit).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[SupabaseService] Fetch analyses error: {e}.")
        return _local_analyses[:limit]

    @staticmethod
    def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
        for a in _local_analyses:
            if a["id"] == analysis_id:
                return a
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                res = supabase.table("analyses").select("*").eq("id", analysis_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[SupabaseService] Get analysis by id error: {e}.")
        return None

    @staticmethod
    def delete_analysis(analysis_id: str) -> bool:
        global _local_analyses
        _local_analyses = [a for a in _local_analyses if a["id"] != analysis_id]
        if IS_SUPABASE_CONFIGURED and supabase is not None:
            try:
                supabase.table("analyses").delete().eq("id", analysis_id).execute()
            except Exception as e:
                print(f"[SupabaseService] Delete analysis error: {e}.")
        return True
