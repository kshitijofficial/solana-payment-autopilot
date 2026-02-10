@echo off
echo ====================================
echo Starting Solana Payment Autopilot
echo ====================================
echo.

echo [1/5] Starting API Server (port 3000)...
start "API Server" cmd /k "npm run api"
timeout /t 2 /nobreak >nul

echo [2/5] Starting Admin Dashboard (port 3001)...
start "Admin Dashboard" cmd /k "cd dashboard && npm run dev"
timeout /t 2 /nobreak >nul

echo [3/5] Starting Merchant Dashboard (port 5000)...
start "Merchant Dashboard" cmd /k "cd merchant-dashboard && python -m http.server 5000"
timeout /t 2 /nobreak >nul

echo [4/5] Starting Signup Page (port 8888)...
start "Signup Page" cmd /k "cd signup && python -m http.server 8888"
timeout /t 2 /nobreak >nul

echo [5/5] Starting Demo Site (port 8080)...
start "Demo Site" cmd /k "cd demo && python -m http.server 8080"
timeout /t 2 /nobreak >nul

echo.
echo ====================================
echo All servers started!
echo ====================================
echo.
echo Open these URLs:
echo   API Server:         http://localhost:3000
echo   Admin Dashboard:    http://localhost:3001
echo   Merchant Dashboard: http://localhost:5000
echo   Signup Page:        http://localhost:8888
echo   Demo Site:          http://localhost:8080
echo.
echo Press any key to exit (servers will keep running)
pause >nul
