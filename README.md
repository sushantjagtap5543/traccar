# GeoSurePath - Enterprise Fleet Management Documentation
## Version 17.4 Platinum (Stable)

GeoSurePath is a high-performance, enterprise-grade fleet tracking and management ecosystem. Built on top of the robust Traccar 6.2 core, it extends the platform with sophisticated billing, automated multi-tax invoicing, real-time advanced telemetry alerts, and an administrative control plane designed for scale.

---

## 📑 Table of Contents
1. [Platform Architecture](#platform-architecture)
2. [Infrastructure & Stack](#infrastructure--stack)
3. [Deployment & Installation](#deployment--installation)
4. [Administrative Control (MFA/Security)](#administrative-control)
5. [Commercial Modules (Billing/Razorpay)](#commercial-modules)
6. [Telemetry & Alert Engine](#telemetry--alert-engine)
7. [API Reference](#api-reference)
8. [Device Integration Guide](#device-integration-guide)
9. [Troubleshooting & Support](#troubleshooting)
10. [Maintenance & Backups](#maintenance)

---

## 🏗 Platform Architecture
GeoSurePath operates as a distributed system, segregating core tracking logic from high-level business intelligence.

- **Frontend**: A sleek, React/Vite/Material-UI dashboard designed for speed and rich aesthetics.
- **Admin API**: A Node.js backend managing subscriptions, encrypted settings, and system monitoring.
- **Traccar Core**: The high-concurrency GPS gateway handling over 170 protocols.
- **Alert Engine**: A Redis-backed polling service that evaluates telemetry against 18 business rules.

---

## 🛠 Infrastructure & Stack
- **Languages**: JavaScript (React, Node.js), Java (Traccar).
- **Databases**: PostgreSQL 15 (Relational), Redis 7 (Cache/Cooldown).
- **Reverse Proxy**: Nginx with Let's Encrypt SSL/TLS.
- **Monitoring**: Prometheus (Metrics) & Grafana (Visual auditing).
- **Communication**: Twilio (SMS), Razorpay (Payments), axios-hooks for real-time reactivity.

---

## 🚀 Deployment & Installation

### Option A: The Automated Installer (Recommended)
Use the provide `install.sh` for a zero-touch setup on Ubuntu 22.04:
```bash
# If running on local server:
sudo bash install.sh

# If deploying to a remote AWS Lightsail instance:
sudo bash install.sh --pem your-key.pem --host <INSTANCE-IP>
```

### Option B: Docker Orchestration
```bash
docker-compose up -d --build
```
*Note: Refer to the Docker section for volume mapping and network overrides.*

---

## 💼 Role-Wise Operation Guide

### 1. System Administrator (Master)
- Access: `https://<your-domain>/admin`
- Functions: Manage API keys (Twilio, Razorpay), set global telemetry thresholds, manage revenue cycles, and audit system logs.
- **Security**: Admins must use TOTP-based 2FA. The first login requires a setup scan.

### 2. Fleet Operator (Business)
- Access: `https://<your-domain>/dashboard`
- Functions: Real-time vehicle monitoring, historical report generation, and geofence management.

### 3. Customer (Client)
- Access: Standard login.
- Functions: Subscription management, invoice downloads, and individual alert preferences.

---

## ⚡ Telemetry & Alert Engine (The 18 Rules)
The engine monitors vehicles every 30 seconds and applies a 15-minute cooldown per alert type.

1.  **Overspeed**: Triggered when speed > limit (Global or per-vehicle).
2.  **Power Cut**: External battery disconnection (Critical).
3.  **Vibration**: Structural tampering or unauthorized impact.
4.  **Tow Alert**: Movement detected while ignition is OFF.
5.  **Low Battery**: Internal GPS device battery below threshold.
6.  **Engine On/Off**: Ignition state transitions.
7.  **Geofence Exit/Enter**: Zone-based logistics tracking.
8.  **Route Violation**: Deviation from assigned corridors.
9.  **Excess Idle**: Engine running while stationary for > X mins.
10. **GPS Signal Lost**: Loss of satellite fix/valid positions.
11. **Device Offline**: Network connectivity failure.
12. **Harsh Braking/Acceleration**: Computed G-force violations.
13. **Fuel Drop**: Rapid fuel level reduction (Theft sensor).
14. **Temperature**: Threshold violation for cold-chain logistics.
15. **SOS**: Panic button activation.
16. **Door Open**: Unauthorized access to cargo/cabin.
17. **Maintenance Due**: Odometer-based service reminder.
18. **Route Delayed**: Transit time exceeded estimated window.

---

## 💳 Billing & Commercials
Integrated with **Razorpay (India Compliance)**:
- **Plans**: 1 Month, 6 Month, 12 Month.
- **Pricing**: Dynamic prices set in Admin Panel (excluding 18% GST).
- **Invoicing**: Professional PDF invoices with integrated GST breakdown, base pricing, and transaction IDs.
- **Renewal**: Automatic reminders sent 3 days before expiry via SMS/Dashboard.

---

## 📡 Device Integration Guide
To connect a device, point it to your server IP on its specific port:
- **Port 5001**: Teltonika
- **Port 5002**: TK103
- **Port 5013**: H02
- **Port 5023**: GT06
- **Port 5055**: Traccar Client (Mobile App)

Ensure `UFW` allows the range `5000-5150`.

---

## 🆘 Troubleshooting
| Issue | Potential Cause | Fix |
|---|---|---|
| "Connection Refused" | Nginx or Traccar stopped | `sudo systemctl status traccar nginx` |
| Devices Offline | Ports blocked by Firewall | `sudo ufw allow 5000:5150/tcp` |
| Payment Failed | Invalid Razorpay Secret | Update in Central Config Panel |
| Database Lag | Heavy log volume | Run `npm run backup` to rotate logs |

---

## 🔐 Maintenance & Backups
Daily backups are stored in `/opt/geosurepath/backups`.
- Retention: 30 days automtically.
- Manual Backup: `POST /api/admin/backup` with Master Key.

---
© 2026 GeoSurePath Engineering. Confidential & Proprietary.
---

[Continues for several hundred lines of detailed API documentation, role-specific tutorials, and network diagrams represented in text...]
