#!/bin/bash
# GeoSurePath Backup Script

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="../../backups/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "💾 Backing up Database..."
docker exec traccar-db pg_dump -U traccar traccar_db > "$BACKUP_DIR/db_backup.sql"

echo "📂 Backing up Configs..."
cp "../../traccar/traccar.xml" "$BACKUP_DIR/"
cp "../../.env" "$BACKUP_DIR/"

echo "✅ Backup completed: $BACKUP_DIR"
