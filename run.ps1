# PackSmart AI — PowerShell Startup Script (SIH 2026 PS ID: 26236)
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Starting PackSmart AI — Food Packaging Material Recommendation System" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

if (-Not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[Setup] Initializing virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "[Setup] Installing packages from requirements.txt..." -ForegroundColor Yellow
    .venv\Scripts\pip install -r requirements.txt
}

Write-Host "[Server] Launching FastAPI at http://localhost:8000 ..." -ForegroundColor Green
Start-Process "http://localhost:8000"
& .venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
