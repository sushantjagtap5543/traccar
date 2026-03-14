# GeoSurePath - Enterprise GPS Tracking Platform
## Production Edition (Self-Hosted)

GeoSurePath is a high-performance, self-hosted GPS tracking platform. Built on the robust Traccar 6.2 engine, it provides a centralized solution for enterprises to monitor fleets, manage hardware lifecycles, and automate billing for internal or client-based vehicle operations.

---

## 📑 Core Modules
1. **Infrastructure**: Dockerized environment with PostgreSQL and Nginx.
2. **Authentication**: JWT-based secure access for Admins and Clients.
3. **Dashboards**: Dedicated portals for fleet oversight and individual vehicle tracking.
4. **Billing**: Complete plan management, subscription tracking, and automated invoicing.
5. **GPS Gateway**: 100% Traccar compatibility supporting 170+ protocols.

---

## 🏗 Platform Architecture
- **Backend**: Modular NestJS architecture for scalable business logic.
- **Frontend**: High-speed Next.js dashboards with MapLibre-GL clustering.
- **Tracking Core**: Traccar GPS engine running in a dedicated isolated container.
- **Reverse Proxy**: Nginx handling SSL termination and API routing.

---

## 🚀 Deployment

### Standard Production Setup
```bash
./scripts/start.sh
```
This script initializes the Docker stack, runs database migrations, and binds Nginx to Port 80.

---

## 👥 Role-Based Access
- **Admin**: Full system control, user management, billing configuration, and device approvals.
- **Client**: Live map tracking, historical playback, and subscription management.

---

## 💳 Billing & Subscriptions
The integrated billing module handles the entire customer lifecycle:
- **Plans**: Configurable duration and device limits.
- **Subscriptions**: Real-time enforcement of device quotas.
- **Invoices**: Automated generation of tax-compliant PDF invoices.
- **Payments**: Unified transaction logging for all gateway interactions.

---

## 🔐 Security & Optimization
- **Encryption**: 256-bit JWT sessions.
- **Performance**: High-density marker clustering for large fleets.
- **Uptime**: Built-in health checks and automated backup scripts.

---
© 2026 GeoSurePath | All Rights Reserved.
