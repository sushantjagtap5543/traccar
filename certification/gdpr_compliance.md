# GDPR Compliance Guide for GeoSurePath SaaS

This document outlines the data protection measures and privacy standards implemented in the GeoSurePath platform to ensure compliance with the General Data Protection Regulation (GDPR).

## 1. Data Controller and Processor Roles
- **GeoSurePath Platform**: Acts as a Data Processor for the GPS telemetry and user data provided by the SaaS tenants (Admin).
- **Tenant (Admin)**: Acts as the Data Controller for their end-users (drivers/fleet managers).

## 2. Right to Access and Erasure
- **Implementation**: The [tenantIsolation.js](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/middleware/tenant.js) ensures that users can only see their own data.
- **Erasure**: Deleting a user in the Admin Panel triggers a cascading delete of all associated devices, positions, and alerts via PostgreSQL foreign key constraints.

## 3. Data Minimization
- **Retention Policy**: The [maintenance.js](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/services/maintenance.js) service automatically purges GPS positions and events older than 30 days (configurable), ensuring no unnecessary personal data is retained long-term.

## 4. Technical Security (Art. 32 GDPR)
- **Encryption**: All sensitive credentials in `geosurepath_settings` are AES-256 encrypted using the system-wide [ENCRYPTION_KEY](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/.env).
- **Access Control**: Strict JWT-based RBAC prevents unauthorized access to personal identifiers.

## 5. Audit Logging
- **Compliance**: The [auditService.js](file:///c:/Users/HP/Desktop/github/traccar/geosurepath-admin-api/services/auditService.js) records every administrative action, including logins and configuration changes, providing a clear transparency trail for regulatory audits.
