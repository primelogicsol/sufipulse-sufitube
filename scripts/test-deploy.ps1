# SufiPulse Deploy (Standalone Mode)
$VPS_IP   = "66.179.81.46"
$VPS_USER = "root"
$APP_DIR  = "/var/www/sufipulse"

Write-Host "Target: ${VPS_USER}@${VPS_IP}:${APP_DIR}" -ForegroundColor Cyan

# Step 1: Upload Standalone files
Write-Host "Uploading Standalone files..." -ForegroundColor Cyan

# Upload core standalone server
Write-Host "  .next/standalone"
scp -r .next/standalone/* "${VPS_USER}@${VPS_IP}:${APP_DIR}/"

# Upload static assets (needed by standalone server)
Write-Host "  .next/static"
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${APP_DIR}/.next/static"
scp -r .next/static/* "${VPS_USER}@${VPS_IP}:${APP_DIR}/.next/static/"

# Upload public assets
Write-Host "  public"
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${APP_DIR}/public"
scp -r public/* "${VPS_USER}@${VPS_IP}:${APP_DIR}/public/"

# Upload .env.production as .env.local
if (Test-Path ".env.production") {
    Write-Host "  .env.production"
    scp .env.production "${VPS_USER}@${VPS_IP}:${APP_DIR}/.env.local"
}

# Step 2: Restart with PM2 using node directly
Write-Host "Restarting on server..." -ForegroundColor Cyan
# Standalone mode doesn't need npm install on server (mostly)
# but we might need it for some external packages if they weren't traced
$cmd = "cd ${APP_DIR} && (pm2 delete sufipulse || true) && pm2 start server.js --name sufipulse --node-args='--max-old-space-size=1024' && pm2 save"
ssh "${VPS_USER}@${VPS_IP}" $cmd

Write-Host "Done" -ForegroundColor Green
