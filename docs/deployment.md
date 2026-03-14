# GeoSurePath Production Deployment Guide

## Prerequisites
- Ubuntu 22.04+ Recommended
- Docker & Docker Compose installed
- Domain name with A-record pointing to server IP
- Ports 80, 443, and 5000-5150 open in firewall

## Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd traccar-product
   ```

2. **Configure Environment**
   Edit the `.env` file with your production credentials:
   ```bash
   cp .env .env.prod
   nano .env
   ```

3. **Deploy with Docker**
   Run the startup script:
   ```bash
   chmod +x scripts/start/start.sh
   ./scripts/start/start.sh
   ```

4. **SSL Configuration**
   By default, Nginx is configured for HTTP. To enable HTTPS:
   - Place your SSL certificates in `infrastructure/ssl/`
   - Uncomment the SSL section in `infrastructure/nginx/nginx.conf`
   - Restart Nginx: `docker restart traccar-nginx`

5. **Firewall Setup**
   Ensure tracking ports are open:
   ```bash
   sudo ufw allow 80,443/tcp
   sudo ufw allow 5000:5150/tcp
   sudo ufw allow 5150:5150/udp
   ```

## Maintenance
- **Backups**: Run `./scripts/backup/backup.sh` regularly.
- **Health**: Check system status with `./scripts/healthcheck/healthcheck.sh`.
