# GeoSurePath Admin API

High-performance, secure DevOps API for monitoring and managing GeoSurePath GPS infrastructure.

## Features
- **Real-time Metrics**: CPU, RAM, Disk, and Network monitoring via `systeminformation`.
- **Database Health**: Active connectivity checks for PostgreSQL.
- **Service Recovery**: One-click restart capabilities for Traccar, Postgres, and Node services.
- **Security First**: 
  - API Key Authentication (`x-api-key`)
  - Rate Limiting (100 req / 15 min)
  - Helmet.js security headers
  - Sanitized command execution (No injection risks)
  - Restricted CORS origin policy

## Tech Stack
- Node.js & Express
- PostgreSQL (via `pg`)
- PM2 for process management
- Winston for structured logging

## Setup
1. `npm install`
2. Create `.env` based on `.env.example`
3. Run with `node server.js` or `pm2 start server.js`

## API Endpoints
- `GET /api/admin/health` - Get system metrics (Auth required)
- `POST /api/admin/restart/:service` - Restart a service (Auth required, service must be in whitelist)

## Deployment
Docker ready. Use the included `Dockerfile` to containerize the service.
