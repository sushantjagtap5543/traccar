#!/bin/bash

DATE=$(date +%Y%m%d)

# Ensure the backup directory exists
mkdir -p database/backups

docker exec traccar-db pg_dump -U traccar traccar > database/backups/backup-$DATE.sql
