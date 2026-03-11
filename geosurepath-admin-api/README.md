# GeoSurePath Admin API v3.5

High-performance, secure DevOps API for monitoring and managing GeoSurePath GPS infrastructure.

## Features
- **Real-time Metrics**: CPU, RAM, Disk, and Network monitoring.
- **Database Resilience**: PostgreSQL connection with auto-retry.
- **Cache Health**: Redis connectivity monitoring and stats.
- **Service Recovery**: One-click restart capabilities (Traccar, Postgres, etc).
- **Enterprise Logging**: Structured JSON logging + Morgan request auditing.
- **Security**: 
  - API Key Auth (Min 32 chars enforced).
  - Rate Limiting (Redis-backed for horizontal scaling).
  - Joi schema validation.

## API Endpoints (Auth Required)

### 📊 Monitoring
- **`GET /api/admin/health`**: Combined system & service health.
- **`GET /api/admin/logs`**: Last 100 lines of system logs.
- **`GET /api/admin/db/tables`**: Live row counts & DB statistics.
- **`GET /api/admin/redis/info`**: Detailed Redis engine metrics.
- **`GET /api/admin/traccar/status`**: Core Traccar service reachability.
- **`GET /api/admin/uptime`**: Process & System uptime.

### ⚙️ Management
- **`POST /api/admin/restart/:service`**: Restart `traccar`, `database`, `backend`, or `cache`.
- **`POST /api/admin/alerts/config`**: Set emergency webhook URL.
- **`POST /api/admin/backup`**: (Coming soon) Trigger DB backup.

## Setup
1. `npm install`
2. Create `.env` based on `.env.example`
3. Run with `npm start`
4. Test with `npm test`

## Environment Variables
- `ADMIN_API_KEY`: Minimum 32 characters.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `TRACCAR_URL`: URL to the Traccar instance.
- `ALERT_WEBHOOK`: Optional Slack/Discord webhook for alerts.
