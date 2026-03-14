#!/bin/bash
# GeoSurePath Startup Script
# This script starts the platform services using Docker Compose.

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting GeoSurePath Platform..."

# Build and start containers
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d
else
    docker compose up -d
fi

echo "✅ Platform is booting up. Access Nginx at http://localhost"
echo "Monitor logs with: docker-compose logs -f"
