#!/bin/bash
# GeoSurePath Backup Verification Script
# This script ensures that daily database backups are being created and are valid.

BACKUP_DIR="./backups"
MIN_SIZE_KB=100
RETENTION_DAYS=7

echo "🔍 Verifying Database Backups..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory '$BACKUP_DIR' does not exist!"
    exit 1
fi

# Find the latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/db_backup_*.sql.gz 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No database backups found in $BACKUP_DIR!"
    exit 1
fi

# Check age of the latest backup
FILE_TIME=$(stat -c %Y "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_SECONDS=$((CURRENT_TIME - FILE_TIME))
AGE_HOURS=$((AGE_SECONDS / 3600))

if [ $AGE_HOURS -gt 24 ]; then
    echo "⚠️ WARNING: Latest backup ($LATEST_BACKUP) is $AGE_HOURS hours old!"
else
    echo "✅ Latest backup is fresh ($AGE_HOURS hours old)."
fi

# Check file size
FILE_SIZE=$(du -k "$LATEST_BACKUP" | cut -f1)

if [ $FILE_SIZE -lt $MIN_SIZE_KB ]; then
    echo "❌ Backup file '$LATEST_BACKUP' is suspiciously small ($FILE_SIZE KB)!"
    exit 1
else
    echo "✅ Backup file size is healthy ($FILE_SIZE KB)."
fi

echo "✅ Backup verification successful."
