#!/bin/bash

# GeoSurePath Unified Automation Script
# Detects environment and performs either local-to-remote deployment or direct server installation.

set -e

# Configuration
REMOTE_IP="${1:-$REMOTE_IP}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
PEM_FILE="${PEM_FILE:-11111.pem}"

if [ -z "$REMOTE_IP" ] && [[ "$(hostname)" != *"ip-"* ]]; then
    read -p "Enter Remote IP for deployment: " REMOTE_IP
fi
REPO_URL="https://github.com/sushantjagtap5543/traccar.git"

# Detection
IS_REMOTE=false
if [[ "$(hostname)" == *"ip-"* ]] || [[ -f "/home/ubuntu/traccar/install.sh" ]]; then
    IS_REMOTE=true
fi

if [ "$IS_REMOTE" = false ]; then
    echo "🏠 Node: Local Development Machine"
    
    # 1. Local Code Push
    if [ -d .git ]; then
        echo "📤 Pushing code changes to GitHub..."
        git add .
        git commit -m "Automated deployment update: $(date)" || echo "No changes to commit"
        git push origin main || echo "Push failed, continuing with deployment..."
    fi

    # 2. Trigger Remote Deployment
    echo "🌐 Initiating Remote Deployment on $REMOTE_IP..."
    ssh -o StrictHostKeyChecking=no -i $PEM_FILE $REMOTE_USER@$REMOTE_IP "cd traccar && ./install.sh"
    
    echo "✨ Local Process Complete!"
    exit 0
fi

# -- REMOTE EXECUTION START --
echo "☁️ Node: Remote Server ($REMOTE_IP)"

# 1. Update Repository
echo "📡 Remote: Updating repository..."
git fetch origin
git reset --hard origin/main

# 2. Environment Clean
echo "🧹 Remote: Cleaning up existing environment..."
docker-compose down --volumes --remove-orphans || true
docker system prune -f

# 3. Directories & Env
echo "📁 Remote: Preparing directories..."
mkdir -p traccar/logs traccar/data database/data nginx/ssl

# 4. Deployment
echo "🏗️ Remote: Building and launching services..."
chmod +x scripts/*.sh
./scripts/deploy.sh

# 5. Verification
echo "🧪 Remote: Running Verification Tests..."
echo "------------------------------------------------"
echo "⏳ Waiting for stability (15s)..."
sleep 15

echo "📝 Testing Registration API..."
REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8082/api/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Automation Test","email":"test_'"$(date +%s)"'@test.com","password":"password123"}')

if [ "$REGISTER_STATUS" == "200" ] || [ "$REGISTER_STATUS" == "204" ]; then
    echo "✅ Registration API: Success ($REGISTER_STATUS)"
else
    echo "❌ Registration API: Failed ($REGISTER_STATUS)"
fi

echo "🔑 Testing Login API..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8082/api/session/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@admin.com","password":"admin"}')

if [ "$LOGIN_STATUS" == "200" ]; then
    echo "✅ Login API: Success ($LOGIN_STATUS)"
else
    echo "❌ Login API: Failed ($LOGIN_STATUS)"
fi

echo "------------------------------------------------"
echo "✅ Remote Deployment & Verification Complete!"
