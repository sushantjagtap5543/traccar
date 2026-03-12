# GeoSurePath - Enterprise Fleet Management Platform

GeoSurePath is a professional-grade fleet tracking and management system built on top of the Traccar core. It features advanced billing, real-time telemetry alerts, administrative oversight, and enterprise security.

## 🚀 Key Features
- **Real-time Tracking**: Live GPS positioning via Traccar.
- **Advanced Billing**: Razorpay integration with GST compliance and dynamic plan pricing.
- **Automated Invoicing**: Client-side PDF generation for receipts and reports.
- **Alert Engine**: 18 pre-defined rules (Overspeed, Power Cut, Route Deviation, etc.) with Redis-backed cooldown.
- **Security**: JWT + TOTP (2FA), encrypted configuration secrets, and database-level masking.
- **Observability**: Prometheus & Grafana dashboard (Restricted to localhost for security).

## 🛠️ Infrastructure Overview
The platform is fully containerized using Docker:
- `db`: PostgreSQL 15 for primary storage.
- `redis`: High-speed cache for alert deduplication and rate limiting.
- `traccar`: Core GPS processing engine.
- `admin-api`: Node.js backend for business logic and administrative control.
- `frontend`: React-based dashboard with premium aesthetics.
- `nginx`: Secure proxy with Let's Encrypt / Certbot integration.
- `prometheus`/`grafana`: Performance monitoring stack.

## 📦 Deployment Guide

### 1. Prerequisites
- Docker & Docker Compose
- Domain name (e.g., tracking.geosurepath.com) pointed to your server IP.
- Razorpay Account (for payments).
- Twilio Account (for SMS alerts).

### 2. Configuration
Copy `.env.example` to `.env` and fill in your secrets:
```bash
cp .env.example .env
```
Key variables:
- `DOMAIN`: Your public domain (e.g., apps.geosurepath.com)
- `RAZORPAY_KEY_ID` / `SECRET`
- `ADMIN_API_KEY`: Long random string for master overrides.

### 3. Launch
```bash
docker-compose up -d --build
```

### 4. SSL Initialization
The first time you deploy, run the following to obtain your Let's Encrypt certificates:
```bash
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ -d yourdomain.com
```
Then restart Nginx:
```bash
docker-compose restart nginx
```

## 🔒 Security & Access
- **Grafana**: For security, Port 3001 is bound to `127.0.0.1`. To access the dashboard remotely, use an SSH tunnel:
  `ssh -L 3001:localhost:3001 your-server-ip`
  Then open `http://localhost:3001` in your browser.
- **Admin Panel**: Accessible at `https://yourdomain.com/admin`. Default credentials are in `.env`.

## 🧪 Testing
The project includes a Playwright E2E suite covering business logic:
- `npm test` inside the `GeoSurePath` directory.
- Test scenarios include: 2FA flows, Payment simulation, Device limit enforcement, and PDF generation.

---
© 2026 GeoSurePath Engineering Team.
