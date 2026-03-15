# Migration Guide: Transitioning to Production Architecture

This guide outlines the steps to migrate your current Traccar setup to the new production-grade architecture.

## Phase 1: Environment Preparation

1. **Install Docker & Docker Compose**: Ensure your production server has the latest versions installed.
2. **Setup Domain & SSL**: Configure your domain DNS and prepare SSL certificates (e.g., using Let's Encrypt).
3. **Environment Variables**: Create a `.env` file in the root based on the following template:
   ```env
   DB_PASSWORD=your_secure_password
   API_URL=https://yourdomain.com/api
   ```

## Phase 2: Database Migration

1. **Backup Current Data**: If using H2, export the data. If using an existing PostgreSQL, perform a `pg_dump`.
2. **Initialize New DB**: Run `docker-compose up -d db` to start the new PostgreSQL container.
3. **Restore Data**: Import your backup into the new database container.

## Phase 3: Service Deployment

1. **Configure Traccar**: Ensure `conf/traccar.xml` is updated to use the PostgreSQL database and Redis if applicable.
2. **Build Frontend**: Navigate to `traccar-web` and build the production assets:
   ```bash
   npm install
   npm run build
   ```
3. **Start Platform**: Run the complete stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Phase 4: Final Verification

1. **Access Dashboard**: Visit your domain in a browser and check if the login page appears.
2. **Test Device Connection**: Point a test device to your server IP/Domain on the configured protocol port and verify it appears on the dashboard.
3. **Check Logs**: Monitor container logs for any errors:
   ```bash
   docker-compose logs -f backend
   ```
