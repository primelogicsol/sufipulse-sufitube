#!/bin/bash
set -e

mkdir -p /var/www/sufipulse-new

cat > /var/www/sufipulse-new/.env.local << 'ENVEOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://test.sufipulse.com
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_64_CHAR_STRING
ENVEOF

echo "Directory and .env.local created successfully"
ls -la /var/www/sufipulse-new/
