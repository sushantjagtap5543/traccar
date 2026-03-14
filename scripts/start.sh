#!/bin/bash
# GeoSurePath Startup Script

echo "🚀 Starting GeoSurePath Platform..."

# Ensure we are in the root directory
cd "$(dirname "$0")/../.."

# Build and start containers
docker-compose up -d --build

echo "✅ Platform is booting up. Access Nginx at http://localhost"
echo "Monitor logs with: docker-compose logs -f"
