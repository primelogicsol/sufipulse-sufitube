@echo off
echo ========================================
echo SufiPulse Development Server Monitor
echo ========================================
echo.
echo This script will:
echo 1. Monitor the development server health
echo 2. Automatically restart if it crashes
echo 3. Log all events to dev-server.log
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak

node scripts/monitor-dev-server.js