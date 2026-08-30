
param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    [string]$VpsHost = "66.179.81.46",
    [string]$VpsUser = "root",
    [string]$GitHubUser = "Fayazkhan7861",
    [string]$GitHubRepo = "Sufipulseupdate"
)

# --- SufiPulse Full Auto-Deploy Setup (CLEAN VERSION) ---
$ErrorActionPreference = "Stop"
$ROOT     = Split-Path $PSScriptRoot -Parent
$KEY_PATH = "$env:USERPROFILE\.ssh\sufipulse_deploy"

function Log($msg)  { Write-Host "`n[>>] $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function WARN($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function ERR($msg)  { Write-Host "  [XX] $msg" -ForegroundColor Red; exit 1 }
function SSH($cmd)  { & ssh -i $KEY_PATH -o StrictHostKeyChecking=no "$VpsUser@$VpsHost" $cmd }

# 1. SSH Key
Log "Step 1 — SSH Key"
if (-not (Test-Path $KEY_PATH)) {
    ERR "SSH key not found at $KEY_PATH — run keygen first"
}
$pubKey     = Get-Content "$KEY_PATH.pub"
$privateKey = Get-Content $KEY_PATH -Raw
OK "Key found: $KEY_PATH"

# 2. Copy SSH key to VPS
Log "Step 2 — Copying SSH public key to VPS"
Write-Host "  Enter your IONOS root password when prompted:" -ForegroundColor Yellow
& ssh-copy-id -i "$KEY_PATH.pub" "$VpsUser@$VpsHost"
if ($LASTEXITCODE -ne 0) {
    ERR "Failed to copy SSH key to VPS"
}
OK "Public key installed on VPS"

# 3. Set up Docker
Log "Step 3 — Installing Docker on VPS"
$setupCmd = @'
set -e
apt-get update -qq
apt-get install -y -qq curl
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
apt-get install -y docker-compose-plugin
mkdir -p /var/www/sufipulse/nginx/ssl /var/www/sufipulse/.data
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
echo "Docker $(docker --version)"
echo "VPS_SETUP_DONE"
'@
$result = SSH $setupCmd
if ($result -notmatch "VPS_SETUP_DONE") {
    WARN "Docker setup may have issues — check manually"
} else {
    OK "Docker installed and firewall configured"
}

# 4. Create .env.production
Log "Step 4 — Creating .env.production on VPS"
$envContent = @'
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
'@
SSH "echo '$envContent' > /var/www/sufipulse/.env.production"
OK ".env.production created on VPS (edit later to add Stripe/SMTP)"

# 5. Copy nginx config
Log "Step 5 — Copying nginx config to VPS"
& scp -i $KEY_PATH -o StrictHostKeyChecking=no "$ROOT\nginx\nginx.conf" "$VpsUser@${VpsHost}:/var/www/sufipulse/nginx/nginx.conf"
OK "nginx.conf uploaded"

# 6. Set GitHub Actions Secrets
Log "Step 6 — Setting GitHub Actions Secrets"
$secrets = @{
    "VPS_HOST"                        = $VpsHost
    "VPS_USER"                        = $VpsUser
    "VPS_SSH_KEY"                     = $privateKey
    "NEXT_PUBLIC_YOUTUBE_API_KEY"     = "AIzaSyDZ2OHykSuPqDh7MxYN24l8uYJ9qCpkjLg"
    "NEXT_PUBLIC_YOUTUBE_CHANNEL_ID"  = "UCraDr3i5A3k0j7typ6tOOsQ"
    "NEXT_PUBLIC_APP_URL"             = "https://sufipulse.com"
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    WARN "GitHub CLI not found — installing it now..."
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
}
$env:GH_TOKEN = $GitHubToken
foreach ($kv in $secrets.GetEnumerator()) {
    $kv.Value | & gh secret set $kv.Key --repo "$GitHubUser/$GitHubRepo"
    OK "Secret: $($kv.Key)"
}

# 7. Copy docker-compose.yml
Log "Step 7 — Copying docker-compose.yml to VPS"
& scp -i $KEY_PATH -o StrictHostKeyChecking=no "$ROOT\docker-compose.yml" "$VpsUser@${VpsHost}:/var/www/sufipulse/docker-compose.yml"
SSH "echo 'GITHUB_REPO_OWNER=$GitHubUser' > /var/www/sufipulse/.compose.env"
OK "docker-compose.yml uploaded"

# 8. Push code to GitHub
Log "Step 8 — Pushing code to GitHub"
Push-Location $ROOT
git add -A
git commit -m "deploy: full CI/CD setup with Docker, GitHub Actions, Nginx" --allow-empty
git push origin main
OK "Code pushed to GitHub — pipeline starting!"
Pop-Location

Write-Host ""; Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ALL DONE! Deployment pipeline is running." -ForegroundColor Green
Write-Host "  Watch it live:" -ForegroundColor Cyan
Write-Host "  https://github.com/$GitHubUser/$GitHubRepo/actions" -ForegroundColor White
Write-Host "  Site will be live at: http://$VpsHost" -ForegroundColor White
Write-Host "  (in about 3-5 minutes)" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
