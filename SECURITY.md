# Security Policy

## Supported Versions

We currently provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 17.4.x  | ✅ Yes     |
| 17.3.x  | ❌ No      |
| < 17.2  | ❌ No      |

## Reporting a Vulnerability

We take the security of GeoSurePath seriously. If you believe you have found a security vulnerability, please report it to us by following these steps:

1.  **Do not disclose the vulnerability publicly** until we have had a chance to fix it.
2.  Send an email to `security@geosurepath.com` with a detailed description of the vulnerability.
3.  Include steps to reproduce the issue and any potential impact.

### Our Commitment
- We will acknowledge receipt of your report within 24 hours.
- We will provide an estimated timeline for a fix.
- We will notify you once the vulnerability is resolved.

## Security Baseline
As of Version 17.4 Platinum, the following security measures are enforced:
- **JWT-Only API**: Sessions are stateless and secured via HS512 signed tokens.
- **MFA Required**: Administrative access requires TOTP (Time-based One-Time Password).
- **Rate Limiting**: All authentication endpoints are protected by Redis-backed hardware-aware rate limiters.
- **Transport Security**: HSTS, CSP, and TLS 1.3 are mandatory for production deployments.
- **Data Isolation**: Multi-tenant data is isolated at the application layer via strictly enforced middleware.
