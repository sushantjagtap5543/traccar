# WhatsApp OTP Auth System

A production-ready registration and authentication system featuring WhatsApp OTP verification, built with Node.js, Express, React, and MongoDB.

## Features
- **WhatsApp OTP Verification**: Secure first-time registration via WhatsApp Cloud API.
- **Password-based Login**: Fast access for returning users.
- **JWT Authentication**: Secure session management.
- **Mobile-First Design**: Premium UI built with Tailwind CSS.
- **Dockerized**: Easy setup and deployment.

## Prerequisites
- Docker & Docker Compose
- WhatsApp Cloud API Credentials (from Meta for Developers)

## Setup Instructions

1.  **Clone the project** (if not already done).
2.  **Configure Environment Variables**:
    - Navigate to `whatsapp-auth-system/backend/.env.example`.
    - Rename it to `.env` or fill in the values in `docker-compose.yml`.
    - Essential fields: `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `JWT_SECRET`.
3.  **Run with Docker**:
    ```bash
    cd whatsapp-auth-system
    docker-compose up --build
    ```
4.  **Access the Application**:
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend: [http://localhost:5000](http://localhost:5000)

## API Endpoints

### Auth
- `POST /auth/send-otp`: Request a 6-digit OTP.
- `POST /auth/verify-otp`: Verify the OTP received on WhatsApp.
- `POST /auth/register`: Complete registration with name, email, and password.
- `POST /auth/login`: Login with WhatsApp number and password.
- `GET /auth/me`: Get current user details (Protected).

## WhatsApp Integration Note
During development, if `WHATSAPP_TOKEN` is not provided, the system will log the OTP to the backend console. For production, ensure you have an approved template named `otp_verification` (or as configured in `.env`).

## License
MIT
