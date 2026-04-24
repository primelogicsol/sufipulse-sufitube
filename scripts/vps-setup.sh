#!/bin/bash
# ============================================================
#  SufiPulse — IONOS VPS One-Time Setup Script
#  OS: Ubuntu 22.04  |  Run as root
#  Usage: bash vps-setup.sh
# ============================================================
set -e

APP_DIR="/var/www/sufipulse"
APP_PORT=3000
SERVER_IP="66.179.81.46"

echo ""
echo "====================================================="
echo "  SufiPulse VPS Setup — Ubuntu 22.04"
echo "====================================================="
echo ""

# ── 1. System update ─────────────────────────────────────
echo "[1/7] Updating system packages..."
apt-get update -q && apt-get upgrade -y -q

# ── 2. Node.js 20.x ──────────────────────────────────────
echo "[2/7] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v

# ── 3. PM2 process manager ────────────────────────────────
echo "[3/7] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 4. Nginx ─────────────────────────────────────────────
echo "[4/7] Installing Nginx..."
apt-get install -y nginx

# ── 5. App directory ──────────────────────────────────────
echo "[5/7] Creating app directory..."
mkdir -p "$APP_DIR"
chown -R root:root "$APP_DIR"

# ── 6. Nginx config ──────────────────────────────────────
echo "[6/7] Configuring Nginx..."

# Remove old default and any existing sufipulse config
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/sufipulse
rm -f /etc/nginx/sites-enabled/sufipulse

cat > /etc/nginx/sites-available/sufipulse <<NGINX
server {
    listen 80;
    server_name $SERVER_IP _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Static Next.js assets — long cache
    location /_next/static/ {
        alias $APP_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Public folder assets
    location /public/ {
        alias $APP_DIR/public/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sufipulse /etc/nginx/sites-enabled/sufipulse
nginx -t
systemctl restart nginx
systemctl enable nginx

# ── 7. Firewall ───────────────────────────────────────────
echo "[7/7] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "====================================================="
echo "  Setup complete!"
echo "  App directory : $APP_DIR"
echo "  Next step     : Run deploy-to-vps.ps1 from Windows"
echo "====================================================="
