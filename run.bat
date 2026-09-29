@echo off
echo ====================================================================
echo Starting PackSmart AI - SIH 2026 (PS ID: 26236)
echo AI-Based Intelligent Food Packaging Recommendation System
echo ====================================================================

cd /d "%~dp0"

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [Setup] Creating Python virtual environment...
    python -m venv .venv
    echo [Setup] Installing dependencies from requirements.txt...
    .venv\Scripts\pip install -r requirements.txt
)

echo [Server] Starting FastAPI backend on http://localhost:8000 ...
start "" http://localhost:8000
.venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
