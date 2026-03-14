#!/bin/bash
# GeoSurePath Backup Script
# This script creates a timestamped backup of the database and critical configuration files.

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "💾 Starting backup process ($TIMESTAMP)..."

# 1. Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 2. Backup Database
if docker ps -q -f name=postgres > /dev/null; then
    echo "🗄️ Backing up Database..."
    docker exec postgres pg_dump -U ${DB_USER:-traccar} ${DB_NAME:-traccar} > "$BACKUP_DIR/db_backup.sql"
else
    echo "⚠️ Postgres container not found! Skipping DB backup."
fi

# 3. Backup Configs
echo "📂 Backing up Configs..."
[ -f "./traccar/traccar.xml" ] && cp "./traccar/traccar.xml" "$BACKUP_DIR/"
[ -f "./.env" ] && cp "./.env" "$BACKUP_DIR/"

echo "✅ Backup completed successfully: $BACKUP_DIR"
