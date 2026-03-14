#!/bin/bash

# GeoSurePath Production Deployment Script
# Usage: ./deploy.sh [up|down|restart|build]

COMMAND=${1:-up}

echo "🚀 GeoSurePath Deployment: $COMMAND"

case $COMMAND in
  up)
    docker-compose -f docker/docker-compose.yml up -d
    ;;
  down)
    docker-compose -f docker/docker-compose.yml down
    ;;
  restart)
    docker-compose -f docker/docker-compose.yml restart
    ;;
  build)
    docker-compose -f docker/docker-compose.yml up --build -d
    ;;
  *)
    echo "Usage: $0 {up|down|restart|build}"
    exit 1
    ;;
esac

echo "✅ Operation completed."
