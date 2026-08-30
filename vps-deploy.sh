#!/bin/bash
set -e

GHCR_TOKEN="$1"
GHCR_USER="$2"

if [ -z "$GHCR_TOKEN" ] || [ -z "$GHCR_USER" ]; then
  echo "Usage: bash vps-deploy.sh <ghcr_token> <github_username>"
  exit 1
fi

mkdir -p /var/www/sufipulse-new
cd /var/www/sufipulse-new

cat > /var/www/sufipulse-new/docker-compose.yml << 'COMPOSEEOF'
version: '3.8'

services:
  app:
    image: ${SUFIPULSE_IMAGE:-ghcr.io/primelogicsol/sufipulse:latest}
    container_name: sufipulse-app
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - sufipulse-data:/app/.data
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.local
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  sufipulse-data:
    driver: local
COMPOSEEOF

cat > /var/www/sufipulse-new/.env.local << 'ENVEOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://sufipulse.com
JWT_SECRET=281e3bbb2fb4cd24711db7967e5b57ced3ea8668eb49d9c4decc33cdbd23fdc7
JWT_REFRESH_SECRET=90010d9f00f85398164b394f972440ccb1d7144dd6dcbc55bea2df671afa058d
ENVEOF

echo "=== Logging in to GHCR ==="
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "=== Pulling image ==="
export SUFIPULSE_IMAGE=ghcr.io/primelogicsol/sufipulse:latest
docker compose pull app

echo "=== Starting container ==="
docker compose up -d --remove-orphans

echo "=== Container status ==="
docker compose ps

sleep 5
echo "=== App logs ==="
docker compose logs app --tail=30

echo "DEPLOY_DONE"
