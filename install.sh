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

# 1. Prerequisites Installation
echo "🛠️ Remote: Checking and installing prerequisites..."
if [[ -f /usr/bin/apt-get ]]; then
    sudo apt-get update -y
    sudo apt-get install -y git curl openssl || true
    
    # Check if docker is already installed
    if ! command -v docker &> /dev/null; then
        echo "Installing docker..."
        sudo apt-get install -y docker.io || echo "⚠️ Docker installation failed"
    else
        echo "✅ Docker already installed: $(docker --version)"
    fi

    # Check if docker-compose is already installed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing docker-compose..."
        sudo apt-get install -y docker-compose || echo "⚠️ Docker Compose installation failed"
    else
        echo "✅ Docker Compose already installed: $(docker-compose --version)"
    fi
    
    sudo usermod -aG docker $USER || true

    # Firewall Configuration (UFW)
    echo "🛡️ Remote: Configuring firewall (UFW)..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 3000/tcp
    sudo ufw allow 3001/tcp
    sudo ufw allow 8082/tcp
    sudo ufw allow 5000:5150/tcp
    sudo ufw allow 5000:5150/udp
    echo "y" | sudo ufw enable
else
    echo "⚠️ Non-Debian system detected. Please ensure git, curl, openssl, docker, and docker-compose are installed."
fi

# 2. Update Repository
echo "📡 Remote: Updating repository from $REPO_URL..."
# Ensure we are in the right directory
cd /home/ubuntu/traccar || exit
git fetch origin
git reset --hard origin/main
git pull $REPO_URL main

# 3. Incremental Deployment Update
echo "🧹 Remote: Preparing for incremental update..."
# We skip the full prune and volume removal to save time.
# docker-compose up --build -d will only rebuild changed services.

# 4. Directories & Env
echo "📁 Remote: Preparing directories..."
mkdir -p traccar/logs traccar/data database/data nginx/ssl
chmod -R 777 traccar/logs traccar/data database/data || true

# 5. Deployment
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

if [ "$REGISTER_STATUS" == "200" ] || [ "$REGISTER_STATUS" == "204" ] || [ "$REGISTER_STATUS" == "201" ]; then
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
