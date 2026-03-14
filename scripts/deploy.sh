#!/bin/bash
# GeoSurePath SaaS Platform Deployment Script
# This script builds and deploys the GeoSurePath platform using Docker Compose.

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Initializing GeoSurePath Deployment..."

# 1. Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found! Please create it from template."
    exit 1
fi

# 2. Check Dependencies
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is required. Aborting." >&2
    exit 1
fi

# 3. Create SSL directories if they don't exist
mkdir -p nginx/ssl

# 4. Generate Self-Signed SSL if none exists (for dev/testing)
if [ ! -f nginx/ssl/server.crt ]; then
    echo "🛡️ Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/server.key -out nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=GeoSurePath/CN=localhost"
fi

# 5. Build and Start Containers
echo "🏗️ Building Infrastructure..."
$DOCKER_COMPOSE_CMD up --build -d

# 6. Verify Health
echo "⏳ Waiting for services to stabilize..."
sleep 15

echo "🏥 Running Health Checks..."
./scripts/healthcheck.sh

echo "✅ Deployment Successful!"
echo "📡 Platform access: http://localhost"
echo "📡 API Documentation: http://localhost/api/docs"
