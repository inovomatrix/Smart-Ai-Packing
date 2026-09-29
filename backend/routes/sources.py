"""
PackSmart AI — Research Sources Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import List
from fastapi import APIRouter
from backend.models.source import ResearchSource
from backend.services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/sources", tags=["Research Sources"])

@router.get("", response_model=List[ResearchSource])
async def list_sources():
    """Retrieve peer-reviewed literature and scientific standards."""
    return SupabaseService.get_sources()
