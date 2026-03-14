#!/bin/bash

# GeoSurePath SaaS Platform Deployment Script
echo "🚀 Initializing GeoSurePath Deployment..."

# 1. Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
else
    echo "❌ .env file not found! Please create it from template."
    exit 1
fi

# 2. Check Dependencies
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required. Aborting." >&2; exit 1; }

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
docker-compose -f docker/docker-compose.yml up --build -d

echo "✅ Deployment Successful!"
echo "📡 Platform access: https://localhost (SSL)"
echo "📡 API Documentation: https://localhost/api/docs"
