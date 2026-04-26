#!/bin/bash
# Add your real values below before running this script
cat >> /var/www/sufipulse-new/.env.local << 'ENVEOF'
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
YOUTUBE_CHANNEL_ID=YOUR_CHANNEL_ID
ENVEOF

cd /var/www/sufipulse-new
docker compose restart app
echo "RESTARTED"
