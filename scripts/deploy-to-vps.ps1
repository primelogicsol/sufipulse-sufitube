# ============================================================
# SufiPulse - Deploy to IONOS VPS from Windows
# Usage: .\scripts\deploy-to-vps.ps1
# Requires: OpenSSH client
# ============================================================

param(
    [string]$VPS_IP   = "66.179.81.46",
    [string]$VPS_USER = "root",
    [string]$APP_DIR  = "/var/www/sufipulse",
    [int]   $APP_PORT = 3000
)

$ROOT = Split-Path $PSScriptRoot -Parent
$SSH  = "ssh"
$SCP  = "scp"

function Log-Info {
    param([string]$msg)
    Write-Host "[SufiPulse Deploy] $msg" -ForegroundColor Cyan
}

function OK {
    param([string]$msg)
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function ERR {
    param([string]$msg)
    Write-Host "  [ERROR] $msg" -ForegroundColor Red
    exit 1
}

Log-Info "Target: ${VPS_USER}@${VPS_IP}:${APP_DIR}"
Log-Info "Source: $ROOT"
Write-Host ""

# Step 1: Check SSH connection
Log-Info "Testing SSH connection..."
$test = & $SSH -o ConnectTimeout=10 "${VPS_USER}@${VPS_IP}" "echo ok" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH connection failed. Make sure SSH key auth is set up." -ForegroundColor Yellow
    Write-Host "To set up SSH key, run once:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t ed25519 -C 'sufipulse-deploy'" -ForegroundColor White
    Write-Host "  type `$env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@${VPS_IP} `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy with password by removing -o BatchMode=yes from this script." -ForegroundColor Yellow
    ERR "SSH not configured"
}

OK "SSH connection OK"

# Step 2: Build locally
Log-Info "Building app locally..."
Push-Location $ROOT

$env:NEXT_TELEMETRY_DISABLED = "1"

try {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
} catch {
}

Start-Sleep -Seconds 2

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

$build = npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Last 10 lines of output:" -ForegroundColor Yellow
    $build | Select-Object -Last 10 | ForEach-Object { Write-Host $_ }
    ERR "Build failed. Fix errors above before deploying."
}

OK "Build succeeded"

# Step 2.5: Prepare standalone assets (required for Next.js standalone output)
Log-Info "Preparing standalone assets..."
if (Test-Path "public") {
    $targetPublic = Join-Path $ROOT ".next\standalone\public"
    if (-not (Test-Path $targetPublic)) { New-Item -ItemType Directory -Path $targetPublic -Force | Out-Null }
    Copy-Item -Path "public\*" -Destination $targetPublic -Recurse -Force
}
if (Test-Path ".next\static") {
    $targetStatic = Join-Path $ROOT ".next\standalone\.next\static"
    if (-not (Test-Path $targetStatic)) { New-Item -ItemType Directory -Path $targetStatic -Force | Out-Null }
    Copy-Item -Path ".next\static\*" -Destination $targetStatic -Recurse -Force
}
OK "Standalone assets prepared"

Pop-Location

# Step 3: Create app directory on server
Log-Info "Preparing server directory..."
& $SSH "${VPS_USER}@${VPS_IP}" "mkdir -p ${APP_DIR}"

if ($LASTEXITCODE -ne 0) {
    ERR "Could not create app directory on server."
}

# Step 4: Upload files
Log-Info "Uploading files to server..."

# Only upload what's needed for a standalone production run
$uploadItems = @(
    "public",
    ".next",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "ecosystem.config.js"
)

foreach ($item in $uploadItems) {
    $src = Join-Path $ROOT $item

    if (Test-Path $src) {
        Log-Info "Uploading $item..."
        & $SCP -r "$src" "${VPS_USER}@${VPS_IP}:${APP_DIR}/"

        if ($LASTEXITCODE -ne 0) {
            ERR "Upload failed for $item"
        }
    }
}

OK "Files uploaded"

# Step 5: Upload production env
$envProd = Join-Path $ROOT ".env.production"

if (Test-Path $envProd) {
    Log-Info "Uploading .env.production as .env.local on server..."
    & $SCP "$envProd" "${VPS_USER}@${VPS_IP}:${APP_DIR}/.env.local"

    if ($LASTEXITCODE -ne 0) {
        ERR "Failed to upload .env.production"
    }

    OK ".env.local uploaded"
} else {
    Write-Host "  [WARN] No .env.production found" -ForegroundColor Yellow
}

# Step 6: Install dependencies and restart app
Log-Info "Installing dependencies and starting app on server..."

# Use ecosystem.config.js if it exists, otherwise use npm start
$cmd = "cd ${APP_DIR} && npm install --omit=dev --ignore-scripts && if [ -f ecosystem.config.js ]; then if pm2 describe sufipulse > /dev/null 2>&1; then pm2 restart sufipulse; else pm2 start ecosystem.config.js --env production; fi; else if pm2 describe sufipulse > /dev/null 2>&1; then pm2 restart sufipulse; else pm2 start npm --name sufipulse -- start; fi; fi && pm2 save"

$result = & $SSH "${VPS_USER}@${VPS_IP}" $cmd
$result | ForEach-Object { Write-Host "  $_" }

if ($LASTEXITCODE -ne 0) {
    ERR "Remote install/start failed."
}

OK "App running via PM2"

# Step 7: Verify deployment
Log-Info "Verifying deployment..."
Start-Sleep -Seconds 5

$check = & $SSH "${VPS_USER}@${VPS_IP}" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}"

if ($check -eq "200") {
    OK "HTTP 200 - app is responding"
} else {
    Write-Host "  [WARN] HTTP $check - app may still be starting" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "  URL: http://${VPS_IP}" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
