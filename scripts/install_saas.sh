#!/bin/bash

# GeoSurePath Installation Script
# This script sets up the environment for GeoSurePath on a fresh VPS.

echo "📦 GeoSurePath System Setup"

# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null
then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Create necessary directories
mkdir -p traccar/logs
mkdir -p traccar/data
mkdir -p database/data
mkdir -p deployment/ssl

# 4. Set permissions
chmod +x scripts/*.sh

echo "✨ System ready. Now run: ./scripts/deploy.sh build"
