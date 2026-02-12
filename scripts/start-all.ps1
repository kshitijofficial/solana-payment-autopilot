# PowerShell script to start all servers

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Starting Solana Payment Autopilot" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Starting API Server (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run api"
Start-Sleep -Seconds 2

Write-Host "[2/5] Starting Admin Dashboard (port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd dashboard; npm run dev"
Start-Sleep -Seconds 2

Write-Host "[3/5] Starting Merchant Dashboard (port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd merchant-dashboard; python -m http.server 5000"
Start-Sleep -Seconds 2

Write-Host "[4/5] Starting Signup Page (port 8888)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd signup; python -m http.server 8888"
Start-Sleep -Seconds 2

Write-Host "[5/5] Starting Demo Site (port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd demo; python -m http.server 8080"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "All servers started!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open these URLs:" -ForegroundColor Yellow
Write-Host "  API Server:         http://localhost:3000"
Write-Host "  Admin Dashboard:    http://localhost:3001"
Write-Host "  Merchant Dashboard: http://localhost:5000"
Write-Host "  Signup Page:        http://localhost:8888"
Write-Host "  Demo Site:          http://localhost:8080"
Write-Host ""
Write-Host "Press any key to exit (servers will keep running)"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
