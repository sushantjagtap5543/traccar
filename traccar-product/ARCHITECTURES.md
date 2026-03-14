# Traccar-Product System Architecture

## 1. Top-Level Workflow
[Device] -> [Traccar Core (Port 5000+)] -> [PostgreSQL]
[User/Admin] -> [Nginx (Port 80)] -> [Next.js Frontend] -> [NestJS Backend] -> [PostgreSQL]

## 2. Component Breakdown

### Backend (NestJS)
- **tracking-server**: Handles device heartbeat, position polling, and system monitoring.
- **auth**: Implements JWT Strategy. All routes protected via AuthGuards.
- **billing**: Managed state machine for plan activation and renewal.

### Frontend (Next.js)
- **admin**: Uses Server Components for SEO and Client Components for real-time charts.
- **client**: MapLibre integration with real-time WebSocket pulses.

### Infrastructure (Docker)
- **Nginx**: Reverse proxies requests to appropriate upstreams based on path (/api, /traccar, /).
- **PostgreSQL**: Stores unified data for both Traccar core and business modules.
