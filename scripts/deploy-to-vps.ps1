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

function Log($msg) { Write-Host "[SufiPulse Deploy] $msg" -ForegroundColor Cyan }
function OK($msg)  { Write-Host "  ✓ $msg" -ForegroundColor Green }
function ERR($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

Log "Target: $VPS_USER@$VPS_IP:$APP_DIR"
Log "Source: $ROOT"
echo ""

# ── Step 1: Check SSH connection ──────────────────────────
Log "Testing SSH connection..."
$test = & $SSH -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_IP" "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH connection failed. Make sure you have SSH key auth set up." -ForegroundColor Yellow
    Write-Host "To set up SSH key (run once):" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t ed25519 -C 'sufipulse-deploy'" -ForegroundColor White
    Write-Host "  type `$env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@$VPS_IP 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy with password (slower, prompted each time):" -ForegroundColor Yellow
    Write-Host "  Remove -o BatchMode=yes from this script" -ForegroundColor White
    ERR "SSH not configured"
}
OK "SSH connection OK"

# ── Step 2: Build locally ─────────────────────────────────
Log "Building app locally..."
Push-Location $ROOT
$env:NEXT_TELEMETRY_DISABLED = "1"
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

$build = & npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    $build | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
    ERR "Build failed — fix errors above before deploying"
}
OK "Build succeeded"
Pop-Location

# ── Step 3: Create app directory on server ────────────────
Log "Preparing server directory..."
& $SSH "$VPS_USER@$VPS_IP" "mkdir -p $APP_DIR"

# ── Step 4: Upload files via rsync (or scp fallback) ──────
Log "Uploading files to server..."

# Files and folders to upload
$uploadItems = @(
    "app",
    "components",
    "contexts",
    "config",
    "data",
    "hooks",
    "lib",
    "public",
    "styles",
    "types",
    "backend",
    "supabase",
    ".next",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "tsconfig.json"
)

# Check if rsync is available (Git Bash / WSL)
$rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
if ($rsyncAvailable) {
    Log "Using rsync..."
    $excludes = "--exclude=node_modules --exclude=.git --exclude=*.log --exclude=build-*.txt"
    & rsync -avz --delete $excludes "$ROOT/" "$VPS_USER@${VPS_IP}:${APP_DIR}/"
} else {
    Log "rsync not found — using scp (slower for large transfers)..."
    foreach ($item in $uploadItems) {
        $src = Join-Path $ROOT $item
        if (Test-Path $src) {
            Log "  Uploading $item..."
            & $SCP -r "$src" "$VPS_USER@${VPS_IP}:${APP_DIR}/"
        }
    }
}
OK "Files uploaded"

# ── Step 5: Upload .env.production as .env.local ──────────
$envProd = Join-Path $ROOT ".env.production"
if (Test-Path $envProd) {
    Log "Uploading .env.production as .env.local on server..."
    & $SCP "$envProd" "$VPS_USER@${VPS_IP}:${APP_DIR}/.env.local"
    OK ".env.local uploaded"
} else {
    Write-Host "  ⚠ No .env.production found — make sure .env.local exists on the server!" -ForegroundColor Yellow
    Write-Host "    Create it by following the instructions in .env.production.template" -ForegroundColor Yellow
}

# ── Step 6: Install deps and (re)start with PM2 ───────────
Log "Installing dependencies and starting app on server..."
$serverCmd = @"
cd $APP_DIR

# Install production deps only
npm install --omit=dev --ignore-scripts 2>&1 | tail -5

# Start or restart PM2
if pm2 describe sufipulse > /dev/null 2>&1; then
    pm2 reload sufipulse --update-env
    echo "PM2: reloaded"
else
    pm2 start npm --name sufipulse -- start
    echo "PM2: started"
fi

pm2 save
echo "DONE"
"@

$result = & $SSH "$VPS_USER@$VPS_IP" $serverCmd
$result | ForEach-Object { Write-Host "  $_" }
OK "App running via PM2"

# ── Step 7: Verify ────────────────────────────────────────
Log "Verifying deployment..."
Start-Sleep -Seconds 3
$check = & $SSH "$VPS_USER@$VPS_IP" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$APP_PORT"
if ($check -eq "200") {
    OK "HTTP 200 — app is responding"
} else {
    Write-Host "  HTTP $check — app may still be starting, check: ssh root@$VPS_IP 'pm2 logs sufipulse --lines 20'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "  URL: http://$VPS_IP" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs  : ssh root@$VPS_IP 'pm2 logs sufipulse'" -ForegroundColor White
Write-Host "  Restart    : ssh root@$VPS_IP 'pm2 restart sufipulse'" -ForegroundColor White
Write-Host "  Status     : ssh root@$VPS_IP 'pm2 status'" -ForegroundColor White
