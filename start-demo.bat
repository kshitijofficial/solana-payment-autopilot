@echo off
echo ====================================
echo Starting DEMO Mode
echo ====================================
echo.

echo [1/3] Starting API Server (port 3000)...
start "API Server" cmd /k "npm run api"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Merchant Dashboard (port 5000)...
start "Merchant Dashboard" cmd /k "cd merchant-dashboard && python -m http.server 5000"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Demo Site (port 8080)...
start "Demo Site" cmd /k "cd demo && python -m http.server 8080"
timeout /t 2 /nobreak >nul

echo.
echo ====================================
echo Demo servers started!
echo ====================================
echo.
echo Ready for demo:
echo   1. Customer demo:  http://localhost:8080
echo   2. Pay with crypto
echo   3. View in dashboard: http://localhost:5000
echo.
echo Press any key to exit (servers will keep running)
pause >nul
