#!/bin/sh
set -e

# Substitute environment variables in the nginx configuration template
envsubst '${DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx
logger -s "Nginx: Starting with DOMAIN=${DOMAIN}"
exec nginx -g 'daemon off;'
