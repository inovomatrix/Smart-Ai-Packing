"""
PackSmart AI — FastAPI Application Entrypoint
Smart India Hackathon 2026 | Problem Statement: SIH26236

AI-Based Intelligent Food Packaging Material Recommendation System for Food Commodities
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import IS_SUPABASE_CONFIGURED, PORT, HOST
from backend.routes import (
    analysis_router,
    commodities_router,
    materials_router,
    reports_router,
    dashboard_router,
    history_router,
    sources_router
)

app = FastAPI(
    title="PackSmart AI",
    description="Intelligent Food Packaging Material Recommendation System — SIH 2026 (PS ID: SIH26236)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for flexible integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(analysis_router)
app.include_router(commodities_router)
app.include_router(materials_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(history_router)
app.include_router(sources_router)

# Health Check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "PackSmart AI",
        "hackathon": "Smart India Hackathon 2026",
        "problem_statement": "SIH26236",
        "supabase_connected": IS_SUPABASE_CONFIGURED
    }

# Mount Frontend Static Assets
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

css_dir = FRONTEND_DIR / "css"
js_dir = FRONTEND_DIR / "js"
assets_dir = FRONTEND_DIR / "assets"

if css_dir.exists():
    app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
if js_dir.exists():
    app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# Root Endpoint: Serves SPA index.html
@app.get("/")
async def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "PackSmart AI Backend is running. Please open frontend/index.html."}

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("PackSmart AI — Starting Local Server")
    print(f"Server URL: http://{HOST}:{PORT}")
    print(f"API Docs:   http://{HOST}:{PORT}/api/docs")
    print(f"Database:   {'Live Supabase Cloud' if IS_SUPABASE_CONFIGURED else 'Local In-Memory Cache (Offline SIH Ready)'}")
    print("=" * 70)
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
