#!/bin/bash

# GeoSurePath Unified Installation & Cleanup Script
# This script performs a deep clean and fresh deployment.

set -e # Exit on error

echo "🧹 Starting Deep Clean of GeoSurePath..."

# 1. Stop and remove all containers, networks, and images related to the project
if command -v docker-compose >/dev/null 2>&1; then
    echo "🛑 Stopping and removing existing containers..."
    docker-compose down --volumes --remove-orphans || true
else
    echo "⚠️ docker-compose not found, skipping container cleanup."
fi

# 2. Hard clean (Docker prune)
echo "🧼 Pruning unused Docker resources..."
docker system prune -f

# 3. Dependency Check & Installation (for Linux/WSL)
echo "🔍 Checking System Requirements..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v docker &> /dev/null; then
        echo "📦 Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "ℹ️ Running on Windows/MSYS. Please ensure Docker Desktop is running."
fi

# 4. Ensure Environment & Directories
echo "📁 Preparing Directories..."
mkdir -p traccar/logs traccar/data database/data nginx/ssl

if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    if [ -f .env.template ]; then
        cp .env.template .env
    else
        cat <<EOT > .env
SERVER_PORT=8082
DB_HOST=postgres
DB_NAME=traccar
DB_USER=traccar
DB_PASSWORD=traccar
JWT_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "secret_jwt_placeholder")
EOT
    fi
fi

# 5. Execute Deployment
echo "🚀 Launching Deployment..."
chmod +x scripts/*.sh
./scripts/deploy.sh

echo "✨ Installation and Deployment Complete!"
echo "📡 Access: http://localhost"
