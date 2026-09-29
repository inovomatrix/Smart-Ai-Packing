"""
PackSmart AI — Commodity Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import List
from fastapi import APIRouter, HTTPException
from backend.models.commodity import Commodity, CommodityCreate
from backend.services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/commodities", tags=["Commodities"])

@router.get("", response_model=List[Commodity])
async def list_commodities():
    """Retrieve full catalog of food commodities."""
    return SupabaseService.get_commodities()

@router.get("/{commodity_id}", response_model=Commodity)
async def get_commodity(commodity_id: str):
    """Retrieve a single commodity by UUID or name."""
    c = SupabaseService.get_commodity_by_id(commodity_id)
    if not c:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return c

@router.post("", response_model=Commodity)
async def create_commodity(data: CommodityCreate):
    """Register custom food commodity with scientific parameters."""
    return SupabaseService.create_commodity(data)
