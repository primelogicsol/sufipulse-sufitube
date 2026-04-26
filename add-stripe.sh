#!/bin/bash
cat >> /var/www/sufipulse-new/.env.local << 'EOF'
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S0pp4Phu1L9ewnLOvkgaly0CSMrCiNsjjdcz4JvBFFgLPIGeWFvx5lAfQTUqUk0Dpv7774AXUUqQREzlVuEWP7l006MkJ5AQc
STRIPE_SECRET_KEY=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
EOF
echo "Stripe keys added:"
grep STRIPE /var/www/sufipulse-new/.env.local
cd /var/www/sufipulse-new
docker compose restart app
echo "Container restarted"
