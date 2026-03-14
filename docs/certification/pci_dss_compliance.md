# PCI DSS Compliance Guide for GeoSurePath

This document outlines the security controls implemented in GeoSurePath to protect payment card data and ensure adherence to Payment Card Industry Data Security Standards (PCI DSS) for SaaS operations.

## 1. Data Minimization (Requirement 3)
- **Zero Card Data Storage**: GeoSurePath **never** stores actual Credit Card numbers, CVVs, or PII related to banking on its own servers.
- **Razorpay Integration**: All payment processing is offloaded to [Razorpay](https://razorpay.com). Payment identifiers (e.g., `razorpay_payment_id`) are stored in [geosurepath_subscriptions](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/migrations/202403120001_add_subscriptions.js) solely for transaction reconciliation.

## 2. Secure Transmission (Requirement 4)
- **HTTPS Enforcement**: The [nginx.conf](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/nginx/nginx.conf) is configured to enforce TLS 1.2+ for all API and Webhook traffic.
- **Webhook Verification**: The [payments.js](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/routes/payments.js) route uses HMAC SHA-256 to verify the authenticity of Razorpay webhooks, preventing man-in-the-middle attacks on the billing engine.

## 3. Vulnerability Management (Requirement 6)
- **Global Error Handling**: The [errorHandler.js](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/middleware/errorHandler.js) prevents "Leaky Over-sharing" of stack traces, which could be used by attackers to fingerprint the system.
- **Universal Input Validation**: [Joi schemas](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/validators/schemas.js) sanitize all incoming payloads, mitigating SQLi, XSS, and broken object-level authorization (BOLA) risks.

## 4. Access Control (Requirement 7 & 8)
- **Auth Hardening**: Implementation of dual Access/Refresh token flows with strict expiration and 2FA for all administrative accounts ensures robust session management.
- **Audit Logging**: Every access attempt and payment reconciliation is logged in the system-wide audit trail.
