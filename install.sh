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
    ssh -o StrictHostKeyChecking=no -i $PEM_FILE $REMOTE_USER@$REMOTE_IP "
        if [ ! -d traccar ]; then
            git clone $REPO_URL traccar
        fi
        cd traccar && ./install.sh
    "
    
    echo "✨ Local Process Complete!"
    exit 0
fi

# -- REMOTE EXECUTION START --
if [ -z "$REMOTE_IP" ]; then
    REMOTE_IP=$(hostname -I | awk '{print $1}')
fi
echo "☁️ Node: Remote Server ($REMOTE_IP)"

# 1. Prerequisites Installation
echo "🛠️ Remote: Checking and installing prerequisites..."
if [[ -f /usr/bin/apt-get ]]; then
    # Skip update if done in the last 24 hours
    LAST_UPDATE=$(stat -c %Y /var/lib/apt/periodic/update-success-stamp 2>/dev/null || echo 0)
    NOW=$(date +%s)
    if [ $((NOW - LAST_UPDATE)) -gt 86400 ]; then
        sudo apt-get update -y
    else
        echo "✅ Apt cache is fresh, skipping update."
    fi

    # Check for core tools
    for tool in git curl openssl; do
        if ! command -v $tool &> /dev/null; then
            echo "Installing $tool..."
            sudo apt-get install -y $tool || true
        fi
    done
    
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
    if ! sudo ufw status | grep -q "Status: active"; then
        echo "🛡️ Remote: Configuring firewall (UFW)..."
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp  # Client Dashboard
        sudo ufw allow 3001/tcp  # API Server
        sudo ufw allow 3002/tcp  # Admin Dashboard
        sudo ufw allow 8082/tcp  # Traccar Core
        sudo ufw allow 5000:5150/tcp
        sudo ufw allow 5000:5150/udp
        echo "y" | sudo ufw enable
    else
        echo "✅ Firewall already active, skipping re-config."
    fi
else
    echo "⚠️ Non-Debian system detected. Please ensure git, curl, openssl, docker, and docker-compose are installed."
fi

# 2. Update Repository
echo "📡 Remote: Syncing repository..."
cd /home/ubuntu/traccar || exit
git fetch origin main

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "🔄 Updates found, pulling changes..."
    git reset --hard origin/main
    git pull origin main
else
    echo "✅ Already up-to-date."
fi

# 2.5 Fix Line Endings (CRLF to LF)
echo "🔧 Remote: Fixing line endings for shell scripts..."
find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} +
find . -type f -name "entrypoint.sh" -exec sed -i 's/\r$//' {} +

# 3. Dependency Optimization
if command -v npm &> /dev/null; then
    echo "📦 Remote: Synchronizing dependencies..."
    (cd services/api-server && npm install --quiet)
    (cd frontend/client-dashboard && npm install --quiet)
    (cd frontend/admin-dashboard && npm install --quiet)
else
    echo "⚠️ npm not found on host, skipping host-side dependency sync (Docker will handle it)."
fi

# 4. Directories & Env
echo "📁 Remote: Preparing directories..."
mkdir -p traccar/logs traccar/data database/data nginx/ssl
chmod -R 777 traccar/logs traccar/data database/data || true

# 5. Deployment
echo "🏗️ Remote: Building and launching services..."
chmod +x scripts/*.sh
./scripts/deploy.sh

# 6. Cleanup
echo "🧹 Remote: Cleaning up unused Docker resources..."
docker system prune -f

# 7. Verification
echo "🧪 Remote: Running Verification Tests..."
echo "------------------------------------------------"

check_endpoint() {
    local name=$1
    local url=$2
    local retries=12
    local count=0
    echo "⏳ Waiting for $name ($url)..."
    until $(curl -sSf "$url" > /dev/null 2>&1); do
        if [ $count -eq $retries ]; then
            echo "❌ $name: Timeout"
            return 1
        fi
        sleep 5
        count=$((count+1))
    done
    echo "✅ $name: Healthy"
    return 0
}

check_endpoint "Internal Traccar" "http://localhost:8082"
check_endpoint "Internal API" "http://localhost:3001/api/docs"

echo "🌍 Testing via Nginx (Port 80)..."
check_endpoint "Public Core (/traccar/)" "http://localhost/traccar/api/server"
check_endpoint "Public API (/api/)" "http://localhost/api/docs"
check_endpoint "Client Dashboard" "http://localhost"
check_endpoint "Admin Dashboard" "http://localhost/admin/"

echo "------------------------------------------------"
echo "✅ Unified Deployment & Verification Complete!"
