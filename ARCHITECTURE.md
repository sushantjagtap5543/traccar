# Traccar Platform Architecture

This document describes the production-grade architecture for the GPS tracking platform.

## System Components

### 1. Frontend (apps/web-dashboard)
- **Technology**: React + Material UI + OpenLayers.
- **Role**: Primary interface for tracking, reports, alerts, and administration.
- **Pages**:
    - Dashboard: Real-time map tracking.
    - Alerts: Recent device events.
    - Reports: Historical summaries.
    - User Management: Administrative user control.

### 2. Backend (services/tracking-engine)
- **Technology**: Java (Traccar Core).
- **Role**: High-performance protocol handling.

### 3. API Server (services/api-server)
- **Technology**: NestJS.
- **Role**: Main REST API for advanced features.

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
