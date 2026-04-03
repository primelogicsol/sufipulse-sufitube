# SufiPulse Development Startup Script
Write-Host "Cleaning up previous processes..." -ForegroundColor Yellow

# Kill any existing Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process next -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Clean build cache
Write-Host "Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
}

# Check if port 3000 is free
$portInUse = netstat -ano | findstr :3000
if ($portInUse) {
    Write-Host "Port 3000 is still in use. Attempting to free it..." -ForegroundColor Red
    $pid = ($portInUse -split '\s+')[-1]
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Starting development server..." -ForegroundColor Green
npm run dev