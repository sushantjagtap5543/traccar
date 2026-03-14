require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const promClient = require('prom-client');
const si = require('systeminformation');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { RedisStore } = require('rate-limit-redis');
const uuid = require('uuid');

// --- LOAD MODULAR COMPONENTS ---
const { pool, redisClient, ioRedisClient, logger } = require('./services/db');
const { startMonitor } = require('./services/monitor');
const { startMaintenanceTasks } = require('./services/maintenance');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientManagementRoutes = require('./routes/clientManagement');
const alertsRouter = require('./routes/alerts');
const backupRoutes = require('./routes/backup');
const migrationRoutes = require('./routes/migration');
const reportRoutes = require('./routes/reports');
const { adminAuth } = require('./middleware/auth');
const backupService = require('./services/backupService');

const app = express();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
        ],
        tracesSampleRate: 1.0,
    });
}
const PORT = process.env.PORT || 8083;

// --- ENV VALIDATION ---
const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'ENCRYPTION_KEY',
    'ADMIN_API_KEY',
    'NODE_ENV'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// --- RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  store: new RedisStore({
    sendCommand: (...args) => ioRedisClient.call(...args),
  }),
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Inject Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuid.v4();
  res.setHeader('x-request-id', req.id);
  next();
});

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
app.use('/api/admin/clients', clientManagementRoutes);
app.use('/api', migrationRoutes);
app.use('/api', reportRoutes);
app.use('/api', require('./routes/devices'));
app.use('/api', require('./routes/commands'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/alerts', alertsRouter);

// Health Check
app.get('/health', async (req, res) => {
    const health = { status: 'UP', timestamp: new Date(), services: { api: 'UP' } };
    try { await pool.query('SELECT 1'); health.services.database = 'UP'; } catch (err) { health.services.database = 'DOWN'; health.status = 'DEGRADED'; }
    res.json(health);
});

// Global Error Handler
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// --- STARTUP ---
const startServer = async () => {
  // 1. Run migrations
  try {
    const knexConfig = require('./knexfile');
    const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
    await knex.migrate.latest();
    logger.info('Database migrations completed.');
    await knex.destroy();
  } catch (err) {
    logger.error('FATAL: Database migrations failed:', err);
    process.exit(1);
  }

  const { init } = require('./services/db');
  await init();

  if (process.env.NODE_ENV !== 'test') {
    const { startAlertEngine } = require('./services/alertEngine');
    startAlertEngine();
    startMonitor();
    startMaintenanceTasks();
    backupService.startCron();
  }

  const { createServer } = require('http');
  const httpServer = createServer(app);
  const { initWebSocket } = require('./services/websocket');
  initWebSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`GeoSurePath Admin API running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
