# Traccar Platform Architecture

This document describes the production-grade architecture for the GPS tracking platform.

## System Components

### 1. Frontend (frontend/client-dashboard)
- **Technology**: React + Vite + Leaflet.
- **Role**: Primary client interface for live tracking and history.
- **Pages**:
    - Dashboard: Real-time map tracking with marker clustering.
    - Reports: Historical summaries.

### 2. Admin Dashboard (frontend/admin-dashboard)
- **Technology**: React + Material UI + OpenLayers.
- **Role**: Fleet control, user management, and revenue analytics.

### 3. Backend (backend/tracking-server)
- **Technology**: Java (Traccar Core).
- **Role**: High-performance protocol handling and data ingestion.

### 4. API Server (services/api-server)
- **Technology**: NestJS.
- **Role**: Main REST API for advanced features, authentication (JWT/RBAC), and billing.

### 3. Database
- **Primary**: PostgreSQL (Selected for its reliability and spatial support with PostGIS).
- **Cache**: Redis (Recommended for real-time device updates and session management).

### 4. Reverse Proxy (Nginx)
- **Role**: Handles SSL/TLS termination, request routing, and load balancing.
- **Setup**: Redirects `/api` and `/session` requests to the Java backend and serves web files for other routes.

## Deployment Strategy

### Containerization
The entire stack is containerized using Docker, allowing for consistent environments across development and production.

### Scalability
- **Horizontal Scaling**: The API layer can be scaled horizontally.
- **Database Partitioning**: Large installations should consider partitioning the `positions` table by time.

## Migration Steps from Legacy Structure

1. **Service Separation**: Move backend and frontend codebases into isolated directories (Completed).
2. **Unified Configuration**: Standardize on environment variables for all secrets and service connections.
3. **Container Consolidation**: Use `docker-compose.prod.yml` to orchestrate all services.
4. **Data Migration**: Migrate from H2 (if used) to PostgreSQL.
