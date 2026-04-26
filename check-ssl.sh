#!/bin/bash
echo "=== Nginx config for test.sufipulse.com ==="
cat /etc/nginx/sites-enabled/test.sufipulse.com
echo ""
echo "=== SSL cert status ==="
certbot certificates -d test.sufipulse.com 2>/dev/null
echo ""
echo "=== Nginx test ==="
nginx -t
