"""
PackSmart AI — Report Generation Routes
Smart India Hackathon 2026 | PS: SIH26236
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Response
from backend.services.pdf_report import generate_pdf_report
from backend.services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/generate")
async def generate_report_from_data(analysis_data: Dict[str, Any]):
    """
    Generate and stream a publication-grade PDF recommendation dossier from analysis results.
    """
    try:
        pdf_buffer = generate_pdf_report(analysis_data)
        pdf_bytes = pdf_buffer.getvalue()

        analysis_id = analysis_data.get("id", "analysis")[:8]
        filename = f"PackSmart_AI_Dossier_{analysis_id}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_bytes))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF report generation error: {str(e)}")

@router.get("/{analysis_id}/pdf")
async def get_report_by_id(analysis_id: str):
    """
    Generate and download PDF report for a previously saved analysis record.
    """
    analysis = SupabaseService.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    res_data = analysis.get("recommendation_results", {})
    if not res_data:
        raise HTTPException(status_code=400, detail="Analysis record has no recommendation payload.")

    # Ensure ID matches
    res_data["id"] = analysis_id
    pdf_buffer = generate_pdf_report(res_data)
    pdf_bytes = pdf_buffer.getvalue()

    filename = f"PackSmart_AI_Dossier_{analysis_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(len(pdf_bytes))
        }
    )
