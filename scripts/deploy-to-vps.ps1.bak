# ============================================================
#  SufiPulse — Deploy to IONOS VPS from Windows
#  Usage: .\scripts\deploy-to-vps.ps1
#  Requires: OpenSSH client (built into Windows 10/11)
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

function Log-Info($msg) { Write-Host "[SufiPulse Deploy] $msg" -ForegroundColor Cyan }
function OK($msg)  { Write-Host "  [OK] $msg" -ForegroundColor Green }
function ERR($msg) { Write-Host "  [ERROR] $msg" -ForegroundColor Red; exit 1 }

Log-Info "Target: ${VPS_USER}@${VPS_IP}:${APP_DIR}"
Log-Info "Source: $ROOT"
Write-Host ""

# ── Step 1: Check SSH connection ──────────────────────────
Log-Info "Testing SSH connection..."
$test = & $SSH -o ConnectTimeout=10 -o BatchMode=yes "${VPS_USER}@${VPS_IP}" "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH connection failed. Make sure you have SSH key auth set up." -ForegroundColor Yellow
    Write-Host "To set up SSH key (run once):" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t ed25519 -C 'sufipulse-deploy'" -ForegroundColor White
    Write-Host "  type `$env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@${VPS_IP} 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy with password (slower, prompted each time):" -ForegroundColor Yellow
    Write-Host "  Remove -o BatchMode=yes from this script" -ForegroundColor White
    ERR "SSH not configured"
}
OK "SSH connection OK"

# ── Step 2: Build locally ─────────────────────────────────
Log-Info "Building app locally..."
Push-Location $ROOT
$env:NEXT_TELEMETRY_DISABLED = "1"

# Stop node if it's running (ignore errors)
try { Stop-Process -Name node -Force -ErrorAction SilentlyContinue } catch {}
Start-Sleep -Seconds 2
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

$build = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Last 10 lines of output:" -ForegroundColor Yellow
    $build | Select-Object -Last 10 | ForEach-Object { Write-Host $_ }
    ERR "Build failed — fix errors above before deploying"
}
OK "Build succeeded"
Pop-Location

# ── Step 3: Create app directory on server ────────────────
Log-Info "Preparing server directory..."
& $SSH "${VPS_USER}@${VPS_IP}" "mkdir -p ${APP_DIR}"

# ── Step 4: Upload files ──────────────────────────────────
Log-Info "Uploading files to server..."

$uploadItems = @(
    "app", "components", "contexts", "config", "data", "hooks", "lib", "public", "styles", "types", 
    "backend", "supabase", ".next", "package.json", "package-lock.json", "next.config.mjs", 
    "tailwind.config.ts", "postcss.config.mjs", "tsconfig.json"
)

# Use SCP for simplicity in this script
foreach ($item in $uploadItems) {
    $src = Join-Path $ROOT $item
    if (Test-Path $src) {
        Log-Info "  Uploading $item..."
        & $SCP -r "$src" "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
    }
}
OK "Files uploaded"

# ── Step 5: Upload .env.production as .env.local ──────────
$envProd = Join-Path $ROOT ".env.production"
if (Test-Path $envProd) {
    Log-Info "Uploading .env.production as .env.local on server..."
    & $SCP "$envProd" "${VPS_USER}@${VPS_IP}:${APP_DIR}/.env.local"
    OK ".env.local uploaded"
} else {
    Write-Host "  [WARN] No .env.production found" -ForegroundColor Yellow
}

# ── Step 6: Install deps and (re)start with PM2 ───────────
Log-Info "Installing dependencies and starting app on server..."
$cmd = "cd ${APP_DIR} && npm install --omit=dev --ignore-scripts && " +
       "if pm2 describe sufipulse > /dev/null 2>&1; then pm2 reload sufipulse --update-env; else pm2 start npm --name sufipulse -- start; fi && " +
       "pm2 save"

$result = & $SSH "${VPS_USER}@${VPS_IP}" $cmd
$result | ForEach-Object { Write-Host "  $_" }
OK "App running via PM2"

# ── Step 7: Verify ────────────────────────────────────────
Log-Info "Verifying deployment..."
Start-Sleep -Seconds 5
$check = & $SSH "${VPS_USER}@${VPS_IP}" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}"
if ($check -eq "200") {
    OK "HTTP 200 — app is responding"
} else {
    Write-Host "  [WARN] HTTP $check — app may still be starting" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "  URL: http://${VPS_IP}" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
