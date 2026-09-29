"""
PackSmart AI — Packaging Material Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from backend.models.packaging import PackagingMaterial, PackagingMaterialCreate
from backend.services.supabase_service import SupabaseService
from backend.services.scoring_engine import calculate_radar_metrics
from backend.models.commodity import CommodityBase

router = APIRouter(prefix="/api/materials", tags=["Packaging Materials"])

class CompareRequest(BaseModel):
    material_ids: List[str]

@router.get("", response_model=List[PackagingMaterial])
async def list_materials():
    """Retrieve full catalog of packaging materials."""
    return SupabaseService.get_materials()

@router.get("/{material_id}", response_model=PackagingMaterial)
async def get_material(material_id: str):
    """Retrieve single packaging material by ID."""
    m = SupabaseService.get_material_by_id(material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Packaging material not found")
    return m

@router.post("", response_model=PackagingMaterial)
async def create_material(data: PackagingMaterialCreate):
    """Register custom packaging material with ASTM barrier specifications."""
    return SupabaseService.create_material(data)

@router.post("/compare")
async def compare_materials(request: CompareRequest):
    """
    Side-by-side technical comparison of multiple selected packaging materials.
    """
    if not request.material_ids:
        raise HTTPException(status_code=400, detail="At least one material ID required for comparison.")

    materials = []
    dummy_comm = CommodityBase(name="Generic Food", category="Processed", moisture=10.0, ph=6.0, fat_content=5.0)

    for mid in request.material_ids:
        m = SupabaseService.get_material_by_id(mid)
        if m:
            radar = calculate_radar_metrics(m, dummy_comm)
            materials.append({
                "material": m,
                "radar_metrics": radar
            })

    if not materials:
        raise HTTPException(status_code=404, detail="No matching materials found for the given IDs.")

    return {
        "count": len(materials),
        "comparison": materials
    }
