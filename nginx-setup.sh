#!/bin/bash
set -e

cat > /etc/nginx/sites-available/test.sufipulse.com << 'NGINXEOF'
server {
    listen 80;
    server_name test.sufipulse.com;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/test.sufipulse.com /etc/nginx/sites-enabled/test.sufipulse.com
nginx -t
systemctl reload nginx
echo "NGINX_OK — test.sufipulse.com configured"
