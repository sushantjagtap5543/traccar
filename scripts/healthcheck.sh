#!/bin/bash
# GeoSurePath Healthcheck Script
# This script verifies the status of all essential platform services.

echo "🔍 Checking System Health..."

# Check Docker containers
services=("traccar-postgres" "traccar-backend" "traccar-api" "traccar-redis" "traccar-frontend" "traccar-admin-frontend" "traccar-nginx")

for service in "${services[@]}"; do
    STATUS=$(docker inspect -f '{{.State.Status}}' "$service" 2>/dev/null || echo "not found")
    if [ "$STATUS" == "running" ]; then
        echo "✅ $service is RUNNING"
    else
        echo "❌ $service is $STATUS"
    fi
done

# Check API responsiveness
echo "🌐 Checking API responsiveness..."
if curl -s --max-time 5 http://localhost:3001/api/health | grep -q "UP"; then
    echo "✅ API is RESPONSIVE"
else
    echo "❌ API is NOT RESPONDING"
fi
