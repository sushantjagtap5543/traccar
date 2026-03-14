#!/bin/bash
# GeoSurePath Healthcheck Script
# This script verifies the status of all essential platform services.

echo "🔍 Checking System Health..."

# Check Docker containers
services=("traccar-core" "nginx" "postgres" "redis" "backend" "frontend")

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
if curl -s --max-time 5 http://localhost:8083/api/health | grep -q "status"; then
    echo "✅ API is RESPONSIVE"
else
    echo "❌ API is NOT RESPONDING"
fi
