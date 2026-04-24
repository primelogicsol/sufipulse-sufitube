#!/bin/bash
# ============================================================
#  SufiPulse — IONOS VPS Docker Setup (Ubuntu 22.04)
#  Run ONCE as root after first SSH into the server.
#  Usage:  bash scripts/vps-docker-setup.sh
# ============================================================
set -e

APP_DIR="/var/www/sufipulse"

echo ""
echo "====================================================="
echo "  SufiPulse VPS Docker Setup — Ubuntu 22.04"
echo "====================================================="
echo ""

# ── 1. System update ─────────────────────────────────────
echo "[1/5] Updating system..."
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q curl git ufw

# ── 2. Install Docker Engine ─────────────────────────────
echo "[2/5] Installing Docker Engine..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version

# Docker Compose (plugin, not standalone)
docker compose version || apt-get install -y docker-compose-plugin

# ── 3. App directory ─────────────────────────────────────
echo "[3/5] Creating app directories..."
mkdir -p "$APP_DIR/nginx/ssl"
mkdir -p "$APP_DIR/.data"
chmod 755 "$APP_DIR"

# ── 4. .env.production placeholder ───────────────────────
echo "[4/5] Creating .env.production placeholder..."
if [ ! -f "$APP_DIR/.env.production" ]; then
    cat > "$APP_DIR/.env.production" <<'ENV'
# Fill in runtime secrets — see .env.production.template in the repo
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV
    echo "  Created $APP_DIR/.env.production — edit with your secrets!"
else
    echo "  .env.production already exists, skipping."
fi

# ── 5. Firewall ───────────────────────────────────────────
echo "[5/5] Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "====================================================="
echo "  Docker setup complete!"
echo ""
echo "  NEXT STEPS:"
echo "  1. Edit /var/www/sufipulse/.env.production with"
echo "     your real secrets (Stripe, SMTP, etc.)"
echo ""
echo "  2. In GitHub → repo → Settings → Secrets, add:"
echo "     VPS_HOST                = 66.179.81.46"
echo "     VPS_USER                = root"
echo "     VPS_SSH_KEY             = (paste your SSH private key)"
echo "     NEXT_PUBLIC_YOUTUBE_API_KEY    = AIzaSyDZ2..."
echo "     NEXT_PUBLIC_YOUTUBE_CHANNEL_ID = UCraDr3i5..."
echo "     NEXT_PUBLIC_APP_URL            = http://66.179.81.46"
echo ""
echo "  3. Push to main branch → GitHub Actions deploys"
echo "     automatically!"
echo "====================================================="
