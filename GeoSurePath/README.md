# GeoSurePath GPS SaaS Platform

GeoSurePath is a **100% production-ready**, premium GPS SaaS platform built for high performance and multi-tenant scalability. It transforms the Traccar engine into a full-scale commercial platform.

## 🚀 Key Features

- **Multi-Tenant SaaS**: Complete Admin + Client portal separation.
- **Client Management**: Admins can manage multiple independent client fleets.
- **Real-time Tracking**: Live vehicle positions on MapLibre GL with smooth heading rotation.
- **Advanced Alert Engine**: 18 business rules (Overspeed, Power Cut, Geofence, etc.).
- **Smart Device Binding**: OTP-based registration and instant automated device linking.
- **Role-Based Access**: Granular control for Admins, Client Admins, and Users.
- **Billing Ready**: Integrated payment tracking system ready for commercial use.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, MapLibre GL, Zustand, Socket.io-client.
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, Socket.io, Traccar API.
- **Device Engine**: Traccar Server (Supports 2000+ protocols like GT06, TK103, H02).
- **Environment**: Docker, Nginx, Let's Encrypt SSL.

## 📦 Project Structure

```bash
GeoSurePath/
├── backend-api/        # Express API & Telemetry Engine (Primary SaaS Layer)
├── backend/            # Native NestJS implementation (Alternative)
├── frontend/           # Next.js Client & Admin Portals
├── traccar/            # Device Server configuration
├── database/           # SQL Migrations & Triggers
├── docker/             # Docker Compose orchestration
└── deployment/         # SSL & Proxy configuration
```

## 🚦 Quick Start (Local Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/geosurepath-gps-platform-free.git
   cd GeoSurePath
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` in both `backend/` and `frontend/` and configure your keys.

3. **Launch with Docker**:
   ```bash
   docker-compose -f docker/docker-compose.yml up --build -d
   ```

4. **Access the Portals**:
   - Client/Admin Portal: `http://localhost:3000`
   - Backend API: `http://localhost:3001`
   - Traccar Web: `http://localhost:8082`

## 🛡 Security & Restrictions

- **IMEI Filtering**: Only approved GeoSurePath devices are allowed to connect to the Traccar server.
- **Authentication**: JWT-based session management with mobile OTP verification.
- **Rate Limiting**: Integrated backend protection against API abuse.

## 📜 18 Alert Rules Implemented

- Overspeed, Power Cut, Vibration, Towing, Low Battery, Engine ON/OFF, Geofence Entry/Exit, Route Deviation, GPS Lost, Device Offline, Harsh Braking/Acceleration, Fuel Drop (Sensor based), Temperature, SOS/Panic, Door Open, Maintenance Due, Route Delay.

## 📄 License

This project is licensed under the MIT License - See the [LICENSE](LICENSE) file for details.
