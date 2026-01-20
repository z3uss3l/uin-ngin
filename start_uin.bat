@echo off
echo ===================================================
echo   Starting UIN-NGIN Full Stack
echo ===================================================

:: 1. Start Backend
echo [1/3] Starting Advanced Backend Server...
start "UIN Backend" cmd /k "python api/advanced_server.py"

:: 2. Start Frontend
echo [2/3] Starting React Frontend...
start "UIN Frontend" cmd /k "cd packages/uin-ui && npm start"

:: 3. Open Browser
echo [3/3] Opening Browser...
echo Waiting 10 seconds for servers to spin up...
timeout /t 10 /nobreak >nul
start http://localhost:3000

echo.
echo Application launched!
echo Backend: Port 8001
echo Frontend: Port 3000
echo.
pause
