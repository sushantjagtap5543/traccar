# GeoSurePath Admin API v7.0

High-performance, secure DevOps API for monitoring and managing GeoSurePath GPS infrastructure. This is the enterprise-grade backend powering the GeoSurePath admin terminal.

## Core Features
- **Security First**: 
  - Dual-layer Auth: API Key and JWT/TOTP 2FA (Real TOTP).
  - Rate Limiting: Distributed Redis-backed protection.
  - Bcrypt: Secure password hashing for admin credentials.
- **Observability Stack**:
  - Native Prometheus `/metrics` aggregation.
  - Provisioned Grafana dashboards for real-time visualization.
  - Periodic background infrastructure health checks with automated alerting.
- **Resilience**:
  - PostgreSQL connection auto-retry & real-time `pg_dump` backups.
  - Redis integration for horizontal scalability and session management.
  - One-click service orchestration (orchestrated restarts via container signals).
- **Communication**:
  - Secure OTP Delivery: Built-in Redis-backed verification code engine for client registration.
  - Emergency Webhooks: Instant Slack/Discord incident notifications.

## 🛠 API Documentation

### 🔐 Authentication
- **`POST /api/admin/auth/login`**: Initial credential exchange (Bcrypt check).
- **`GET /api/admin/auth/totp-setup`**: Generate 2FA secret and QR code (Requires API Key).
- **`POST /api/admin/auth/verify-totp`**: Final 2FA verification to issue 1h session JWT.
- **`POST /api/auth/send-otp`**: Generate and deliver 6-digit verification code to mobile.
- **`POST /api/auth/verify-otp`**: Verify client ownership of mobile number.

### 📊 Monitoring & Telemetry
- **`GET /api/admin/health`**: Real-time CPU, RAM, Disk, Network, DB, and Redis health.
- **`GET /api/admin/logs`**: Audit trail of system events.
- **`GET /api/admin/db/tables`**: Live database statistics and row counts.
- **`GET /api/admin/redis/info`**: Cache performance metrics.
- **`GET /api/admin/uptime`**: Granular process and OS uptime trackers.
- **`GET /metrics`**: Prometheus-formatted data for external scrapers.

### ⚙️ Infrastructure Management
- **`POST /api/admin/restart/:service`**: Secure command to signal service restarts.
- **`POST /api/admin/alerts/config`**: Dynamic configuration of incident webhooks.
- **`POST /api/admin/backup`**: Instant database snapshotting to persistent volumes.

## 🚀 Quick Start
1. **Repository Setup**: `npm install`
2. **Environment**: Copy `.env.example` to `.env` and fill in secrets (Admin key must be 32+ chars).
3. **Password Generation**: `node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword',12))"` for `ADMIN_PASSWORD_HASH`.
4. **Execution**: `npm start` or use the root `docker-compose.yml`.

## 🧪 Quality Assurance
- Total Unit/Integration Tests: Fully covered with Jest.
- Run tests: `npm test`
- Build verification: `docker build -t gs-api .`
