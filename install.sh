#!/bin/bash

# GeoSurePath Unified Installation, Push & Deployment Script
# This script performs a local push to GitHub and initiates remote deployment.

set -e # Exit on error

# Configuration
REMOTE_IP="3.108.114.12"
REMOTE_USER="ubuntu"
PEM_FILE="11111.pem"
REPO_URL="https://github.com/sushantjagtap5543/traccar.git"

echo "🚀 Starting GeoSurePath Unified Automation..."

# 1. Local Code Push
if [ -d .git ]; then
    echo "📤 Pushing code changes to GitHub..."
    git add .
    git commit -m "Automated deployment update: $(date)" || echo "No changes to commit"
    git push origin main || echo "Push failed, continuing with deployment..."
fi

# 2. Remote Deployment
echo "🌐 Initiating Remote Deployment on $REMOTE_IP..."

ssh -o StrictHostKeyChecking=no -i $PEM_FILE $REMOTE_USER@$REMOTE_IP << 'EOF'
    set -e
    echo "📡 Remote: Updating repository..."
    if [ ! -d "traccar" ]; then
        git clone https://github.com/sushantjagtap5543/traccar.git
    fi
    cd traccar
    git fetch origin
    git reset --hard origin/main

    echo "🧹 Remote: Cleaning up existing environment..."
    docker-compose down --volumes --remove-orphans || true
    docker system prune -f

    echo "🏗️ Remote: Building and launching services..."
    # Ensure deployment script is executable
    chmod +x scripts/*.sh
    ./scripts/deploy.sh
EOF

# 3. Final Verification (Local Test)
echo "🧪 Running Final Verification Tests..."
echo "------------------------------------------------"

# Wait for services to be reachable via public IP
echo "⏳ Waiting for remote services to settle (30s)..."
sleep 30

# Test Registration API
echo "📝 Testing Registration API..."
REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://$REMOTE_IP:8082/api/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Automation Test","email":"test_'"$(date +%s)"'@test.com","password":"password123"}')

if [ "$REGISTER_STATUS" == "200" ] || [ "$REGISTER_STATUS" == "204" ]; then
    echo "✅ Registration API: Success ($REGISTER_STATUS)"
else
    echo "❌ Registration API: Failed ($REGISTER_STATUS)"
    echo "   Note: If 404, the Traccar Core might need a custom build to include the new endpoint."
fi

# Test Login API
echo "🔑 Testing Login API..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://$REMOTE_IP:8082/api/session/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@admin.com","password":"admin"}')

if [ "$LOGIN_STATUS" == "200" ]; then
    echo "✅ Login API: Success ($LOGIN_STATUS)"
else
    echo "❌ Login API: Failed ($LOGIN_STATUS)"
fi

echo "------------------------------------------------"
echo "✨ All Processes Complete!"
echo "📡 Remote Access: http://$REMOTE_IP"
