# GeoSurePath API Documentation

## Authentication
- `POST /api/auth/register`: Register/Request OTP (Mobile Number)
- `POST /api/auth/verify`: Verify OTP & Get JWT
- `POST /api/auth/login`: Login with Mobile/Password
- `PATCH /api/auth/profile`: Complete Profile (Name, Email, Password)

## Devices
- `GET /api/devices`: List all devices for the current user
- `POST /api/devices`: Register a new device (IMEI validation required)
- `GET /api/devices/:id`: Get device details
- `DELETE /api/devices/:id`: Unregister device

## Tracking
- `GET /api/positions/latest`: Get latest positions for all devices
- `GET /api/positions/history/:imei`: Get historical positions for a device
- `POST /api/commands/send`: Send a command to a device (e.g., stop engine)

## Billing
- `POST /api/billing/order`: Create a Razorpay order for a subscription plan
- `POST /api/billing/verify`: Verify payment and extend subscription
- `GET /api/billing/history`: Get payment history

## Admin
- `GET /api/admin/stats`: Get system-wide stats (total users, devices, active connections)
- `GET /api/admin/clients`: List all clients (tenants)
- `GET /api/admin/logs`: View system logs
