@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

echo === UIN-NGIN API START ===

REM --- Safety check ---
if not exist pyproject.toml (
    echo ERROR: Run from uin-ngin repository root.
    exit /b 1
)

REM --- Ensure api entry exists ---
set API_FILE=uin\api\app.py

if not exist %API_FILE% (
    echo Creating minimal FastAPI app ...

    mkdir uin\api >nul 2>&1

    (
    echo from fastapi import FastAPI
    echo.
    echo app = FastAPI(title="UIN API")
    echo.
    echo @app.get("/health")
    echo def health():
    echo     return {"status": "ok"}
    ) > %API_FILE%
)

REM --- Reinstall package ---
echo Reinstalling uin-core ...
pip uninstall uin-core -y >nul 2>&1
pip install . --no-cache-dir
if errorlevel 1 (
    echo ERROR: install failed.
    exit /b 2
)

REM --- Start API (blocking) ---
echo Starting FastAPI on http://127.0.0.1:8000
echo Press CTRL+C to stop.

python -m uvicorn uin.api.app:app --host 127.0.0.1 --port 8000
