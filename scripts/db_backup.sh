#!/bin/bash
DATE=$(date +%F_%H-%M)
BACKUP_DIR=/backups
mkdir -p $BACKUP_DIR
docker exec -t traccar_db pg_dumpall -c -U traccar > $BACKUP_DIR/traccar_backup_$DATE.sql
find $BACKUP_DIR -type f -mtime +7 -exec rm -f {} \;
