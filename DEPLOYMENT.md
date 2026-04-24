# SufiPulse VPS Deployment Guide

## Prerequisites
- Ubuntu 22.04+ VPS (minimum 2GB RAM, 2 vCPU)
- Domain name pointing to VPS IP
- SSH access to VPS
- YouTube OAuth credentials (for subtitle sync)

## Option 1: Docker Deployment (Recommended)

### 1. Setup Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone & Configure
```bash
git clone <your-repo-url> /var/www/sufipulse
cd /var/www/sufipulse

# Create .env.local with production values
cp .env.local.example .env.local
nano .env.local
```

### 3. Deploy
```bash
docker-compose up -d --build
```

### 4. Verify
```bash
curl http://localhost:3000/api/health
docker-compose logs -f
```

### 5. Setup Nginx + SSL
```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo cp nginx.conf /etc/nginx/sites-available/sufipulse
sudo nano /etc/nginx/sites-available/sufipulse
# Replace your-domain.com with actual domain

sudo ln -s /etc/nginx/sites-available/sufipulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Option 2: PM2 Deployment

### 1. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Deploy
```bash
git clone <your-repo-url> /var/www/sufipulse
cd /var/www/sufipulse
npm ci
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Auto-start on boot
```

### 3. Setup Systemd Service (Alternative to PM2)
```bash
sudo cp sufipulse.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sufipulse
sudo systemctl start sufipulse
sudo systemctl status sufipulse
```

---

## Environment Variables (.env.local)

```env
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Auth
JWT_SECRET=<generate with: openssl rand -base64 32>
BCRYPT_ROUNDS=12

# YouTube (for subtitle sync)
YOUTUBE_OAUTH_CLIENT_ID=your_client_id
YOUTUBE_OAUTH_CLIENT_SECRET=your_client_secret
YOUTUBE_OAUTH_REFRESH_TOKEN=your_refresh_token

# Optional Integrations
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Post-Deployment Checklist

- [ ] Health check: `curl https://your-domain.com/api/health`
- [ ] SSL working: `https://your-domain.com`
- [ ] Admin login works
- [ ] YouTube subtitle sync configured
- [ ] Backup directory exists: `ls -la .data/backups`
- [ ] Audit log working: `ls -la .data/audit`
- [ ] PM2 auto-starts on reboot: `pm2 startup`
- [ ] Logs rotating: `logrotate` configured

---

## Monitoring

### Check Health
```bash
curl https://your-domain.com/api/health | jq
```

### View Logs
```bash
# PM2
pm2 logs sufipulse

# Docker
docker-compose logs -f

# Systemd
journalctl -u sufipulse -f
```

### Backup
```bash
# Create backup via API
curl -X POST https://your-domain.com/api/backup \
  -H "Content-Type: application/json" \
  -d '{"label": "pre-deploy"}'

# List backups
curl https://your-domain.com/api/backup | jq
```

---

## Troubleshooting

### App Won't Start
```bash
# Check Node version
node --version  # Should be 20+

# Check dependencies
npm ci

# Check build
npm run build

# Check logs
pm2 logs sufipulse --lines 100
```

### YouTube Sync Fails
```bash
# Check env vars
echo $YOUTUBE_OAUTH_REFRESH_TOKEN

# Test token
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=$YOUTUBE_OAUTH_CLIENT_ID&client_secret=$YOUTUBE_OAUTH_CLIENT_SECRET&refresh_token=$YOUTUBE_OAUTH_REFRESH_TOKEN&grant_type=refresh_token"
```

### SSL Issues
```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```
