#!/bin/bash
# GeoSurePath Healthcheck Script

echo "🔍 Checking System Health..."

# Check Docker containers
services=("traccar-db" "traccar-redis" "traccar-core" "traccar-backend" "traccar-frontend" "traccar-nginx")

for service in "${services[@]}"; do
    if [ "$(docker inspect -f '{{.State.Running}}' $service)" == "true" ]; then
        echo "✅ $service is RUNNING"
    else
        echo "❌ $service is DOWN"
    fi
done

# Check API responsiveness
if curl -s http://localhost/api/health | grep -q "status"; then
    echo "✅ API is RESPONSIVE"
else
    echo "❌ API is NOT RESPONDING"
fi
