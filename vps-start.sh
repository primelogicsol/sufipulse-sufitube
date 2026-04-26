#!/bin/bash
set -e

cd /var/www/sufipulse-new

echo "Logging in to GHCR..."
echo "$1" | docker login ghcr.io -u "$2" --password-stdin

echo "Pulling image..."
export SUFIPULSE_IMAGE=ghcr.io/primelogicsol/sufipulse:latest
docker compose pull app

echo "Starting container..."
docker compose up -d --remove-orphans

echo "Container status:"
docker compose ps

echo "Waiting for startup..."
sleep 5

echo "Last 20 log lines:"
docker compose logs app --tail=20

echo "DONE"
