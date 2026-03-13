# --- SSL Hardening (A-010): Handle missing certificates on first run ---
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
    echo "SSL: Certificates not found for ${DOMAIN}. Creating temporary placeholder..."
    mkdir -p "${CERT_DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "${CERT_DIR}/privkey.pem" \
        -out "${CERT_DIR}/fullchain.pem" \
        -subj "/CN=localhost"
fi

# Substitute environment variables
envsubst '${DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Nginx: Starting ingress with DOMAIN=${DOMAIN}"
exec nginx -g 'daemon off;'
