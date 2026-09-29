"""
PackSmart AI — Analysis History Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_history(limit: int = 50):
    """Retrieve history of saved packaging recommendations."""
    return SupabaseService.get_analyses(limit=limit)

@router.get("/{analysis_id}")
async def get_history_item(analysis_id: str):
    """Retrieve full results of a specific saved analysis."""
    item = SupabaseService.get_analysis_by_id(analysis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return item

@router.delete("/{analysis_id}")
async def delete_history_item(analysis_id: str):
    """Delete a saved analysis record."""
    success = SupabaseService.delete_analysis(analysis_id)
    return {"success": success, "deleted_id": analysis_id}
