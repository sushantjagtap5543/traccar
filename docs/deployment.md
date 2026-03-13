# GeoSurePath Deployment Guide

## Prerequisites
- Ubuntu 22.04 LTS
- Docker & Docker Compose
- AWS Lightsail instance (Recommended: 4GB RAM, 2vCPU)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sushantjagtap5543/traccar
   cd traccar
   ```
2. Start the services:
   ```bash
   bash scripts/start.sh
   ```

## Configuration
- **Traccar Config**: `traccar/conf/traccar.xml`
- **Nginx Config**: `nginx/nginx.conf`
- **Database**: Port 5432 (Internal to Docker)

## Backup
The backup script runs via cron:
```bash
0 2 * * * /scripts/backup.sh
```

## Security
Ports to open in firewall:
- 80 (HTTP)
- 443 (HTTPS)
- 8082 (Traccar Web)
- 5000-5150 (GPS Protocols)
