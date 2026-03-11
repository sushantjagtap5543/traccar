# GeoSurePath Admin API v3.0

High-performance, secure DevOps API for monitoring and managing GeoSurePath GPS infrastructure.

## Features
- **Real-time Metrics**: CPU, RAM, Disk, and Network monitoring via `systeminformation`.
- **Database Resilience**: PostgreSQL connection with auto-retry on startup.
- **Cache Health**: Integrated Redis connectivity monitoring.
- **Service Recovery**: One-click restart capabilities for Traccar, Postgres, and Node services.
- **Enterprise Logging**: 
  - Structured JSON logging with **Winston**.
  - Request logging with **Morgan**.
  - Persistent log volumes for Docker deployments.
- **Security First**: 
  - API Key Authentication (`x-api-key`) with strength verification.
  - **Joi** schema validation for all endpoints.
  - Rate Limiting (100 req / 15 min).
  - Helmet.js security headers.
  - Sanitized command execution (No injection risks).
  - Restricted CORS origin policy.
- **Resilient Infrastructure**: 
  - Proper Signal handling (`SIGTERM`/`SIGINT`) for graceful shutdowns.
  - Comprehensive unit test suite with 100% mocked dependencies.

## Tech Stack
- Node.js & Express
- PostgreSQL (via `pg`)
- Redis (for caching & health state)
- Jest & Supertest (for testing)
- Winston & Morgan (for logging)

## Setup
1. `npm install`
2. Create `.env` based on `.env.example`
3. Run with `npm start`
4. Test with `npm test`

## API Endpoints
- `GET /api/admin/health` - Get system metrics (Auth required)
- `POST /api/admin/restart/:service` - Restart a service (Auth required, service must be in whitelist)

## Deployment
Fully containerized. Use the root `docker-compose.yml` to launch alongside Traccar, Redis, and PostgreSQL.
